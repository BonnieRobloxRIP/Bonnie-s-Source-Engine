import * as mc from "@minecraft/server";
import { ADVENTURE_COMMAND_TO_KEY, adventureInteractionPermissions, setAdventurePermission } from "../permissions.js";
import {
    getChatCooldownSeconds,
    getChatSpamBlockedMessage,
    setChatCooldownSeconds,
    setChatSpamBlockedMessage
} from "./chat_system.js";
import { getDynamicLightsEnabled, setDynamicLightsEnabled } from "./dynamic_lighting.js";
import { getAllInputNames, getEntityClassIds, isBrushClass } from "../../engine/classes.js";
import { findEntitiesByName, getAllEntities, getEntityCount, setEntityDisabled, updateEntityData } from "../../engine/registry.js";
import { fireInputAt } from "../../engine/io.js";
import { getEngineSettings, safeGetDimension } from "../../engine/runtime.js";
import { MAX_FILL_BRUSH_CELLS, MAX_FILL_POINT_CELLS, fillEngineBlocks } from "../../engine/systems/editor.js";
import { BLOCK_FORMS } from "../../tool_ui/block_forms.js";

// SECTION: Commands
// Every command is registered as brr:<name>; Bedrock lets players leave the namespace out when no
// other pack uses the same name, so /status and /brr:status both work.
//
// Callbacks run in restricted execution: they may read the world but not change it, so every
// change is deferred with system.run and the callback returns its message right away. Returning
// the message (instead of only messaging a player) also gives command blocks and the server
// console feedback.

const { system, CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus } = mc;

const ok = message => ({ status: CustomCommandStatus.Success, message });
const fail = message => ({ status: CustomCommandStatus.Failure, message });
const later = change => system.run(change);
const onOff = value => (value ? "§aon§r" : "§coff§r");

function registerEnum(registry, name, values) {
    try {
        registry.registerEnum(name, values);
    } catch (error) {
        console.warn(`[BSE] Could not register enum ${name}: ${error?.message ?? error}`);
    }
}

// A player gets the reply as a chat message: returned command results are hidden while the
// sendcommandfeedback gamerule is off, and setup.mcfunction turns it off. Command blocks and the
// console still get the returned result.
function replyToPlayer(origin, result) {
    const player = origin?.sourceEntity;
    if (!result?.message || player?.typeId !== "minecraft:player") return result;
    try {
        player.sendMessage(result.status === CustomCommandStatus.Failure ? `§c${result.message}` : result.message);
    } catch {
        return result;
    }
    return { status: result.status };
}

// cheatsRequired defaults to false here: settings and moderation are gated by permission level.
function register(registry, definition, callback) {
    const name = `brr:${definition.name}`;
    try {
        registry.registerCommand(
            { cheatsRequired: false, ...definition, name },
            (origin, ...args) => {
                let result;
                try {
                    result = callback(origin, ...args);
                } catch (error) {
                    // Reported like any other failure, so it isn't hidden with the command feedback.
                    console.warn(`[BSE] /${name} failed: ${error?.stack ?? error}`);
                    result = fail(`/${name} failed: ${error?.message ?? error}`);
                }
                return replyToPlayer(origin, result);
            }
        );
    } catch (error) {
        console.warn(`[BSE] Could not register /${name}: ${error?.message ?? error}`);
    }
}

function parseBoolean(raw) {
    if (typeof raw === "boolean") return raw;
    const text = `${raw ?? ""}`.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(text)) return true;
    if (["false", "0", "no", "off"].includes(text)) return false;
    return undefined;
}

function getPlayerSource(origin) {
    const entity = origin?.sourceEntity;
    return entity?.typeId === "minecraft:player" ? entity : undefined;
}

function getSourceDimensionId(origin) {
    return origin?.sourceEntity?.dimension?.id ?? origin?.sourceBlock?.dimension?.id ?? "minecraft:overworld";
}

// Messages the player or console that ran a command once a deferred change has happened.
function reportLater(origin, message) {
    try {
        if (origin?.sourceEntity?.sendMessage) {
            origin.sourceEntity.sendMessage(message);
            return;
        }
    } catch { }
    console.warn(`[BSE] ${message}`);
}

// SECTION: Engine Block Helpers
// Short names for engine classes: "brr:logic_relay_block" -> "logic_relay", "brr:tool_trigger" -> "tool_trigger".
const shortClassName = typeId => typeId.replace(/^brr:/, "").replace(/_block$/, "");
const CLASS_BY_SHORT_NAME = new Map(getEntityClassIds().map(typeId => [shortClassName(typeId), typeId]));

// Keyvalues each class's form edits: key -> field kind ("toggle" values are booleans).
const FIELDS_BY_CLASS = new Map();
for (const [typeId, descriptor] of Object.entries(BLOCK_FORMS)) {
    const fields = new Map();
    for (const field of [...descriptor.classFields, ...(descriptor.extraTab?.fields ?? [])]) {
        if (!field.key.startsWith("__")) fields.set(field.key, field.kind);
    }
    FIELDS_BY_CLASS.set(typeId, fields);
}
const ALL_FIELD_KEYS = [...new Set([...FIELDS_BY_CLASS.values()].flatMap(fields => [...fields.keys()]))].sort();

// Returns { value } typed for the field, or { error }.
function parseFieldValue(typeId, key, raw) {
    const kind = FIELDS_BY_CLASS.get(typeId)?.get(key);
    if (!kind) {
        const valid = [...(FIELDS_BY_CLASS.get(typeId)?.keys() ?? [])].join(", ");
        return { error: `${shortClassName(typeId)} has no setting "${key}". Its settings: ${valid}` };
    }
    if (kind !== "toggle") return { value: `${raw ?? ""}` };

    const value = parseBoolean(raw);
    return value === undefined ? { error: `"${key}" is on/off: use true or false.` } : { value };
}

function formatPosition(entity) {
    const dimension = `${entity.dimension}`.replace(/^minecraft:/, "");
    const { x, y, z } = entity.cells.length === 1 ? entity.cells[0] : entity.center;
    return `${dimension} ${Math.floor(x)} ${Math.floor(y)} ${Math.floor(z)}`;
}

function describeEntity(entity) {
    const name = `${entity.data?.name ?? ""}`.trim() || "§7(unnamed)§r";
    const size = entity.cells.length > 1 ? ` §7(${entity.cells.length} blocks)§r` : "";
    return `${name} §8-§r ${shortClassName(entity.typeId)} §8@§r ${formatPosition(entity)}${size}`;
}

// SECTION: Public API
// api (from main.js, which owns persistence of these): emojiCommand, setEngineBlocksAlwaysVisible,
// setToolsEnabled, getUsernameMode, setUsernameMode, versionText.
export function registerBrrCommands(data, api = {}) {
    const registry = data?.customCommandRegistry;
    if (!registry || !CommandPermissionLevel || !CustomCommandParamType || !CustomCommandStatus) return;

    if (typeof api.emojiCommand === "function") api.emojiCommand(data);

    const GameDirectors = CommandPermissionLevel.GameDirectors;
    const { Boolean: BooleanParam, Enum, Float, Integer, Location, String: StringParam } = CustomCommandParamType;

    // SECTION: Engine Settings (/brr <setting> <true|false>)
    const SETTINGS = {
        engine_blocks_always_visible: {
            label: "Engine blocks always visible",
            get: () => getEngineSettings().alwaysVisible,
            set: api.setEngineBlocksAlwaysVisible
        },
        tool_blocks_enabled: {
            label: "Tool blocks enabled",
            get: () => getEngineSettings().toolsEnabled,
            set: api.setToolsEnabled
        },
        dynamic_lights: {
            label: "Dynamic lights",
            get: getDynamicLightsEnabled,
            set: setDynamicLightsEnabled
        }
    };
    registerEnum(registry, "brr:setting", Object.keys(SETTINGS));

    register(registry, {
        name: "brr",
        description: "Change a Bonnie's Source Engine setting",
        permissionLevel: GameDirectors,
        mandatoryParameters: [
            { name: "brr:setting", type: Enum },
            { name: "value", type: BooleanParam }
        ]
    }, (origin, settingName, value) => {
        const setting = SETTINGS[settingName];
        if (!setting || typeof setting.set !== "function") return fail(`Unknown setting: ${settingName}`);
        later(() => setting.set(Boolean(value)));
        return ok(`${setting.label}: ${onOff(value)}`);
    });

    // SECTION: Adventure Permissions (/brr:adventure <permission> <true|false>)
    registerEnum(registry, "brr:adventure_permission", Object.keys(ADVENTURE_COMMAND_TO_KEY).sort());

    register(registry, {
        name: "adventure",
        description: "Allow or block an Adventure mode interaction",
        permissionLevel: GameDirectors,
        mandatoryParameters: [
            { name: "brr:adventure_permission", type: Enum },
            { name: "value", type: BooleanParam }
        ]
    }, (origin, permissionName, value) => {
        const key = ADVENTURE_COMMAND_TO_KEY[permissionName];
        if (!key) return fail(`Unknown permission: ${permissionName}`);
        later(() => setAdventurePermission(key, Boolean(value)));
        return ok(key === "canUseAll"
            ? `All Adventure interactions: ${onOff(value)}`
            : `${permissionName}: ${onOff(value)}`);
    });

    // SECTION: Usernames (/brr:username_mode <normal|hidden|randomized>)
    const USERNAME_MODES = ["normal", "hidden", "randomized"];
    registerEnum(registry, "brr:username_mode", USERNAME_MODES);

    register(registry, {
        name: "username_mode",
        description: "Show, hide or randomize player names",
        permissionLevel: GameDirectors,
        mandatoryParameters: [{ name: "brr:username_mode", type: Enum }]
    }, (origin, mode) => {
        if (!USERNAME_MODES.includes(mode) || typeof api.setUsernameMode !== "function") return fail(`Unknown mode: ${mode}`);
        later(() => api.setUsernameMode(mode));
        return ok(`Username mode: §b${mode}`);
    });

    // SECTION: Chat (/brr:set_chat_cooldown, /brr:set_spam_message)
    register(registry, {
        name: "set_chat_cooldown",
        description: "Set the chat cooldown in seconds (0 = off)",
        permissionLevel: GameDirectors,
        mandatoryParameters: [{ name: "seconds", type: Float }]
    }, (origin, seconds) => {
        if (!Number.isFinite(seconds) || seconds < 0) return fail("Use a number of seconds >= 0 (e.g. 0, 0.5, 2).");
        later(() => setChatCooldownSeconds(seconds));
        return ok(`Chat cooldown: §b${seconds}s`);
    });

    register(registry, {
        name: "set_spam_message",
        description: "Set the chat spam warning (in quotes), or \"reset\"",
        permissionLevel: GameDirectors,
        mandatoryParameters: [{ name: "message", type: StringParam }]
    }, (origin, message) => {
        const text = `${message ?? ""}`.trim();
        if (!text) return fail("Usage: /brr:set_spam_message \"your message\" (or reset)");
        const reset = text.toLowerCase() === "reset";
        later(() => {
            const applied = setChatSpamBlockedMessage(reset ? undefined : text);
            if (reset) reportLater(origin, `§aSpam message reset to: ${applied}`);
        });
        return ok(reset ? "Resetting the spam message..." : `Spam message: ${text}`);
    });

    // SECTION: Status (/brr:status)
    register(registry, {
        name: "status",
        description: "Show every Bonnie's Source Engine setting",
        permissionLevel: GameDirectors
    }, () => {
        const allowed = [];
        const blocked = [];
        for (const [commandName, key] of Object.entries(ADVENTURE_COMMAND_TO_KEY)) {
            if (key === "canUseAll") continue;
            (adventureInteractionPermissions[key] ? allowed : blocked).push(commandName);
        }

        const lines = [
            "§e--- Bonnie's Source Engine ---",
            ...Object.values(SETTINGS).map(setting => `${setting.label}: ${onOff(setting.get())}`),
            `Username mode: §b${api.getUsernameMode?.() ?? "normal"}`,
            `Chat cooldown: §b${getChatCooldownSeconds()}s`,
            `Spam message: §7${getChatSpamBlockedMessage()}`,
            `Engine blocks placed: §b${getEntityCount()}`,
            `Adventure allowed: §a${allowed.join(", ") || "none"}`,
            `Adventure blocked: §c${blocked.join(", ") || "none"}`
        ];
        return ok(lines.join("\n§r"));
    });

    // SECTION: I/O (/brr:fire <target> <input> [parameter] [delay])
    // Source's ent_fire: sends an input to named engine blocks straight from chat.
    registerEnum(registry, "brr:input", getAllInputNames());

    register(registry, {
        name: "fire",
        description: "Fire an input at named engine blocks (like ent_fire)",
        permissionLevel: GameDirectors,
        cheatsRequired: true,
        mandatoryParameters: [
            { name: "target", type: StringParam },
            { name: "brr:input", type: Enum }
        ],
        optionalParameters: [
            { name: "parameter", type: StringParam },
            { name: "delay_seconds", type: Float }
        ]
    }, (origin, target, input, parameter, delay) => {
        const targetText = `${target ?? ""}`.trim();
        const activator = getPlayerSource(origin);
        const special = targetText.startsWith("!");
        if (special && !["!activator", "!player"].includes(targetText.toLowerCase())) {
            return fail("From a command only !activator and !player work as special targets.");
        }

        const count = special ? 1 : findEntitiesByName(targetText).length;
        if (count === 0) return fail(`No engine block is named "${targetText}". Try /brr:find.`);

        fireInputAt(targetText, input, parameter ?? "", delay ?? 0, activator);
        const when = delay > 0 ? ` in ${delay}s` : "";
        return ok(`Fired ${input} at ${special ? targetText : `${count} block(s) named "${targetText}"`}${when}.`);
    });

    // SECTION: Remote Editing (/brr:tool_block_edit <name> <key> <value>)
    registerEnum(registry, "brr:block_setting", ALL_FIELD_KEYS);

    register(registry, {
        name: "tool_block_edit",
        description: "Change a setting of named engine blocks remotely",
        permissionLevel: GameDirectors,
        cheatsRequired: true,
        mandatoryParameters: [
            { name: "name", type: StringParam },
            { name: "brr:block_setting", type: Enum },
            { name: "value", type: StringParam }
        ]
    }, (origin, name, key, rawValue) => {
        const entities = findEntitiesByName(name);
        if (entities.length === 0) return fail(`No engine block is named "${name}". Try /brr:find.`);

        const edits = [];
        let firstError;
        for (const entity of entities) {
            const parsed = parseFieldValue(entity.typeId, key, rawValue);
            if (parsed.error) firstError ??= parsed.error;
            else edits.push({ entity, value: parsed.value });
        }
        if (edits.length === 0) return fail(firstError);

        later(() => {
            for (const { entity, value } of edits) {
                updateEntityData(entity, { ...entity.data, [key]: value });
                if (key === "startDisabled") setEntityDisabled(entity, value);
            }
        });
        const skipped = entities.length - edits.length;
        return ok(`Set ${key} = ${edits[0].value} on ${edits.length} block(s)${skipped ? ` (${skipped} skipped: no such setting)` : ""}.`);
    });

    // SECTION: Finding Blocks (/brr:find [name], /brr:goto <name> [index])
    const MAX_FIND_LINES = 15;

    register(registry, {
        name: "find",
        description: "List named engine blocks (or a count per type)",
        permissionLevel: GameDirectors,
        optionalParameters: [{ name: "name", type: StringParam }]
    }, (origin, name) => {
        const text = `${name ?? ""}`.trim();
        if (!text) {
            const counts = new Map();
            for (const entity of getAllEntities()) {
                const label = shortClassName(entity.typeId);
                counts.set(label, (counts.get(label) ?? 0) + 1);
            }
            if (counts.size === 0) return ok("No engine blocks placed yet.");
            const lines = [...counts].sort((a, b) => b[1] - a[1]).map(([label, count]) => `${label}: §b${count}`);
            return ok(["§eEngine blocks (use /brr:find <name>, * matches the start of names):", ...lines].join("\n§r"));
        }

        const matches = findEntitiesByName(text);
        if (matches.length === 0) return fail(`No engine block is named "${text}".`);
        const lines = matches.slice(0, MAX_FIND_LINES).map((entity, index) => `§7${index + 1}.§r ${describeEntity(entity)}`);
        if (matches.length > MAX_FIND_LINES) lines.push(`§7...and ${matches.length - MAX_FIND_LINES} more`);
        return ok([`§e${matches.length} block(s) named "${text}":`, ...lines].join("\n§r"));
    });

    register(registry, {
        name: "goto",
        description: "Teleport to a named engine block",
        permissionLevel: GameDirectors,
        cheatsRequired: true,
        mandatoryParameters: [{ name: "name", type: StringParam }],
        optionalParameters: [{ name: "index", type: Integer }]
    }, (origin, name, index) => {
        const player = getPlayerSource(origin);
        if (!player) return fail("Only a player can use /brr:goto.");

        const matches = findEntitiesByName(name);
        if (matches.length === 0) return fail(`No engine block is named "${name}".`);
        const position = index ?? 1;
        const entity = matches[position - 1];
        if (!entity) return fail(`There are ${matches.length} block(s) named "${name}"; pick 1-${matches.length}.`);

        const dimension = safeGetDimension(entity.dimension);
        const location = entity.cells.length === 1
            ? { x: entity.cells[0].x + 0.5, y: entity.cells[0].y, z: entity.cells[0].z + 0.5 }
            : entity.center;
        later(() => {
            try {
                player.teleport(location, { dimension });
            } catch (error) {
                reportLater(origin, `§cCould not teleport: ${error?.message ?? error}`);
            }
        });
        return ok(`Going to ${describeEntity(entity)}${matches.length > 1 ? ` §7(${position}/${matches.length})` : ""}`);
    });

    // SECTION: Filling (/brr:block_fill <block> <from> <to> [name] [start_disabled] [setting] [value])
    registerEnum(registry, "brr:engine_block", [...CLASS_BY_SHORT_NAME.keys()].sort());

    register(registry, {
        name: "block_fill",
        description: "Fill an area with an engine block and set it up",
        permissionLevel: GameDirectors,
        cheatsRequired: true,
        mandatoryParameters: [
            { name: "brr:engine_block", type: Enum },
            { name: "from", type: Location },
            { name: "to", type: Location }
        ],
        optionalParameters: [
            { name: "name", type: StringParam },
            { name: "start_disabled", type: BooleanParam },
            { name: "brr:block_setting", type: Enum },
            { name: "value", type: StringParam }
        ]
    }, (origin, blockName, from, to, name, startDisabled, key, rawValue) => {
        const typeId = CLASS_BY_SHORT_NAME.get(blockName);
        if (!typeId) return fail(`Unknown engine block: ${blockName}`);

        const count = (Math.abs(Math.floor(to.x) - Math.floor(from.x)) + 1)
            * (Math.abs(Math.floor(to.y) - Math.floor(from.y)) + 1)
            * (Math.abs(Math.floor(to.z) - Math.floor(from.z)) + 1);
        const limit = isBrushClass(typeId) ? MAX_FILL_BRUSH_CELLS : MAX_FILL_POINT_CELLS;
        if (count > limit) return fail(`That is ${count} blocks; the limit for ${blockName} is ${limit}.`);

        const fillData = {};
        if (name) fillData.name = `${name}`.trim();
        if (startDisabled !== undefined) fillData.startDisabled = Boolean(startDisabled);
        if (key) {
            if (rawValue === undefined) return fail(`Give a value for ${key}.`);
            const parsed = parseFieldValue(typeId, key, rawValue);
            if (parsed.error) return fail(parsed.error);
            fillData[key] = parsed.value;
        }

        const dimensionId = getSourceDimensionId(origin);
        later(() => {
            const result = fillEngineBlocks(typeId, dimensionId, from, to, fillData);
            if (result.error) reportLater(origin, `§c${result.error}`);
        });
        return ok(`Filling ${count} ${blockName} block(s)${fillData.name ? ` named "${fillData.name}"` : ""}.`);
    });

    // SECTION: Version (/brr:version)
    register(registry, {
        name: "version",
        description: "Show the Bonnie's Source Engine version",
        permissionLevel: CommandPermissionLevel.Any
    }, () => ok(api.versionText ?? "§aBonnie's Source Engine"));
}
