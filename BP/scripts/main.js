import * as mc from "@minecraft/server";
import { emojiCommand, isNativeDevPlayer } from "./handler/core/chat_system.js";
import "./handler/core/dev_privileges.js";
import "./handler/small.js";
import "./handler/weapons/gluon_gun.js";
import "./handler/weapons/tau_cannon.js";
import "./handler/weapons/crowbar.js";
import "./handler/weapons/glock17.js";
import "./handler/weapons/magnum357.js";
import "./handler/weapons/spas12.js";
import "./handler/interactables/hev_charger.js";
import "./handler/interactables/health_charger.js";
import "./handler/interactables/plushies.js";
import "./handler/npc/scientist.js";
import {
    adventureInteractionPermissions,
    loadPersistedPermissions,
    enforcePressurePlateRestrictionForPlayer,
    shouldBlockAdventureInteraction,
    getAdventurePermissionForBlock,
    getIncompatibleRespawnPermissionForBlock,
    notifyAdventureInteractionBlocked,
    isPlayerInAdventure
} from "./handler/permissions.js";
import { initializeDynamicLightingSystem } from "./handler/core/dynamic_lighting.js";
import { registerBrrCommands } from "./handler/core/brr_commands.js";
import { processBlackMesaMenuRequests } from "./handler/ui/black_mesa_menu.js";
import {
    startEngine,
    setEngineBlocksAlwaysVisible,
    setEngineToolsEnabled,
    handleEngineBlockInteract,
    handlePlayerSpawn
} from "./engine/index.js";
import { setUsernameModeOwnsNametags } from "./handler/core/username_mode.js";
import "./antiexploit.js";

const { world, system } = mc;
const CommandPermissionLevel = mc.CommandPermissionLevel;
const PlayerPermissionLevel = mc.PlayerPermissionLevel;

// SECTION: Global State & Constants
const USERNAME_MODE_PROPERTY = "brr_username_mode";
const USERNAME_ALIAS_MAP_PROPERTY = "brr_username_alias_map";
const CHAT_DISPLAY_NAME_OVERRIDE_PROPERTY = "brr_display_name_override";
const OP_TELEMETRY_TAG = "§8[Moderation]§r";
const USERNAME_MODE_NORMAL = "normal";
const USERNAME_MODE_HIDDEN = "hidden";
const HIDDEN_USERNAME_PLACEHOLDER = "§";
const USERNAME_MODE_RANDOMIZED = "randomized";
const GENERIC_PLAYER_ALIASES = [
    "Emily",
    "Max",
    "Oliver",
    "Fiona",
    "Liam",
    "Ava",
    "Noah",
    "Mia",
    "Lucas",
    "Zoe",
    "Ethan",
    "Ruby",
    "Logan",
    "Chloe",
    "Mason",
    "Nora",
    "Henry",
    "Ivy",
    "Felix",
    "Nina",
    "Leo",
    "Aria",
    "Elijah",
    "Nova"
];
const INVISIBLE_USERNAME_PATTERN = /[\u00A7\u00AD\u034F\u061C\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/u;
const CONTROL_USERNAME_PATTERN = /[\u0000-\u001F\u007F-\u009F]/u;
let usernameMode = USERNAME_MODE_NORMAL;
const assignedAliasByPlayerId = new Map();
const kickedInvalidNamePlayers = new Set();

function normalizeUsernameMode(rawMode) {
    const normalized = `${rawMode ?? ""}`.trim().toLowerCase();
    if (normalized === USERNAME_MODE_HIDDEN || normalized === USERNAME_MODE_RANDOMIZED) {
        return normalized;
    }
    return USERNAME_MODE_NORMAL;
}

function sanitizeAlias(aliasRaw) {
    const normalized = `${aliasRaw ?? ""}`
        .replace(/\s+/g, " ")
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
        .trim();
    if (!normalized) return "Player";
    return normalized.slice(0, 32);
}

function loadPersistedUsernameAliases(rawAliases) {
    assignedAliasByPlayerId.clear();
    if (typeof rawAliases !== "string" || rawAliases.trim().length === 0) {
        return;
    }

    try {
        const parsed = JSON.parse(rawAliases);
        if (!Array.isArray(parsed)) {
            return;
        }

        for (const pair of parsed) {
            if (!Array.isArray(pair) || pair.length < 2) continue;
            const playerId = `${pair[0] ?? ""}`.trim();
            if (!playerId) continue;
            const alias = sanitizeAlias(pair[1]);
            assignedAliasByPlayerId.set(playerId, alias);
        }
    } catch { }
}

function persistUsernameModerationState() {
    try {
        world.setDynamicProperty(USERNAME_MODE_PROPERTY, usernameMode);
    } catch { }

    try {
        world.setDynamicProperty(
            USERNAME_ALIAS_MAP_PROPERTY,
            JSON.stringify(Array.from(assignedAliasByPlayerId.entries()))
        );
    } catch { }
}

function loadUsernameModerationState() {
    try {
        usernameMode = normalizeUsernameMode(world.getDynamicProperty(USERNAME_MODE_PROPERTY));
    } catch {
        usernameMode = USERNAME_MODE_NORMAL;
    }

    try {
        loadPersistedUsernameAliases(world.getDynamicProperty(USERNAME_ALIAS_MAP_PROPERTY));
    } catch {
        assignedAliasByPlayerId.clear();
    }
}

function getShuffledAliases() {
    const aliases = [...GENERIC_PLAYER_ALIASES];
    for (let index = aliases.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        const temp = aliases[index];
        aliases[index] = aliases[swapIndex];
        aliases[swapIndex] = temp;
    }
    return aliases;
}

function createUniqueAlias(usedAliases) {
    const shuffledAliases = getShuffledAliases();
    for (const alias of shuffledAliases) {
        if (!usedAliases.has(alias)) {
            return alias;
        }
    }

    let suffix = 2;
    while (suffix < 10000) {
        for (const alias of shuffledAliases) {
            const fallbackAlias = `${alias}${suffix}`;
            if (!usedAliases.has(fallbackAlias)) {
                return fallbackAlias;
            }
        }
        suffix++;
    }

    return `Player${Date.now()}`;
}

function refreshAliasAssignments(players, forceReassign = false) {
    let changed = false;

    if (forceReassign) {
        assignedAliasByPlayerId.clear();
        changed = true;
    }

    const usedAliases = new Set();
    for (const alias of assignedAliasByPlayerId.values()) {
        if (`${alias ?? ""}`.trim()) {
            usedAliases.add(`${alias}`);
        }
    }

    for (const player of players) {
        const playerId = `${player?.id ?? ""}`.trim();
        if (!playerId) continue;
        if (assignedAliasByPlayerId.has(playerId)) continue;

        const alias = sanitizeAlias(createUniqueAlias(usedAliases));
        usedAliases.add(alias);
        assignedAliasByPlayerId.set(playerId, alias);
        changed = true;
    }

    if (changed) {
        persistUsernameModerationState();
    }
}

// Last chat-name override written per player, so the dynamic property is only written when it changes.
const chatNameOverrideByPlayerId = new Map();

function applyUsernameModeToPlayers() {
    const players = world.getPlayers();
    setUsernameModeOwnsNametags(usernameMode !== USERNAME_MODE_NORMAL);
    if (usernameMode === USERNAME_MODE_RANDOMIZED) {
        refreshAliasAssignments(players);
    }

    const onlineIds = new Set();

    for (const player of players) {
        let nextNameTag = "";
        let shouldOverrideNameTag = false;
        let shouldOverrideChatName = false;

        if (usernameMode === USERNAME_MODE_HIDDEN) {
            nextNameTag = HIDDEN_USERNAME_PLACEHOLDER;
            shouldOverrideNameTag = true;
            shouldOverrideChatName = true;
        } else if (usernameMode === USERNAME_MODE_RANDOMIZED) {
            const playerId = `${player?.id ?? ""}`.trim();
            const alias = sanitizeAlias(assignedAliasByPlayerId.get(playerId));
            nextNameTag = alias;
            shouldOverrideNameTag = true;
            shouldOverrideChatName = true;
        }

        try {
            // In normal mode, let chat_system.js own player nametag formatting.
            if (shouldOverrideNameTag && `${player.nameTag ?? ""}` !== nextNameTag) {
                player.nameTag = nextNameTag;
            }
        } catch { }

        const chatOverride = shouldOverrideChatName ? nextNameTag : undefined;
        onlineIds.add(player.id);
        if (chatNameOverrideByPlayerId.has(player.id) && chatNameOverrideByPlayerId.get(player.id) === chatOverride) continue;
        try {
            if (player.getDynamicProperty(CHAT_DISPLAY_NAME_OVERRIDE_PROPERTY) !== chatOverride) {
                player.setDynamicProperty(CHAT_DISPLAY_NAME_OVERRIDE_PROPERTY, chatOverride);
            }
            chatNameOverrideByPlayerId.set(player.id, chatOverride);
        } catch { }
    }

    for (const id of chatNameOverrideByPlayerId.keys()) {
        if (!onlineIds.has(id)) chatNameOverrideByPlayerId.delete(id);
    }
}

function hasInvalidNameCharacters(rawPlayerName) {
    const playerName = `${rawPlayerName ?? ""}`;
    if (!playerName.trim()) return true;
    return INVISIBLE_USERNAME_PATTERN.test(playerName) || CONTROL_USERNAME_PATTERN.test(playerName);
}

function sanitizeKickReason(reason) {
    return `${reason ?? "Kicked"}`
        .replace(/[\r\n]/g, " ")
        .replace(/\s+/g, " ")
        .trim() || "Kicked";
}

function escapeForKickCommand(rawName) {
    return `${rawName ?? ""}`.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function isOperatorPlayer(player) {
    if (!player) return false;

    try {
        if (PlayerPermissionLevel) {
            return player.playerPermissionLevel === PlayerPermissionLevel.Operator;
        }
    } catch { }

    try {
        if (CommandPermissionLevel) {
            return Number(player.commandPermissionLevel) >= Number(CommandPermissionLevel.GameDirectors);
        }
    } catch { }

    return false;
}

function sendOperatorTelemetry(message, excludePlayerId = "") {
    const text = `${message ?? ""}`.trim();
    if (!text) return;

    const excluded = `${excludePlayerId ?? ""}`.trim();
    for (const onlinePlayer of world.getPlayers()) {
        if (`${onlinePlayer?.id ?? ""}` === excluded) continue;
        if (!isOperatorPlayer(onlinePlayer)) continue;

        try {
            onlinePlayer.sendMessage(`${OP_TELEMETRY_TAG} ${text}`);
        } catch { }
    }
}

function createKickTag() {
    const rand = Math.floor(Math.random() * 1679616).toString(36);
    return `brrkick_${Date.now().toString(36)}_${rand}`;
}

function kickPlayerSafely(player, reason) {
    if (!player || isNativeDevPlayer(player)) return false;

    const playerName = `${player?.name ?? ""}`;
    const escapedName = escapeForKickCommand(playerName);
    const tag = createKickTag();
    const kickReason = sanitizeKickReason(reason);

    try {
        world.getDimension("overworld").runCommandAsync(`kick "${escapedName}" ${kickReason}`);
        return true;
    } catch { }

    try {
        player.addTag(tag);
    } catch {
        return false;
    }

    try {
        world.getDimension("overworld").runCommandAsync(`kick @a[tag=${tag}] ${kickReason}`);
    } catch {
        try {
            player.removeTag(tag);
        } catch { }
        return false;
    }

    system.runTimeout(() => {
        try {
            if (player.isValid) {
                player.removeTag(tag);
            }
        } catch { }
    }, 20);

    return true;
}

function kickPlayersWithInvalidNames() {
    let kickedCount = 0;
    const activePlayerIds = new Set();

    for (const player of world.getPlayers()) {
        const playerId = `${player?.id ?? ""}`.trim();
        if (!playerId) continue;

        activePlayerIds.add(playerId);

        const playerName = `${player?.name ?? ""}`;
        if (!hasInvalidNameCharacters(playerName)) {
            kickedInvalidNamePlayers.delete(playerId);
            continue;
        }

        if (kickedInvalidNamePlayers.has(playerId)) {
            continue;
        }

        kickedInvalidNamePlayers.add(playerId);
        kickedCount++;

        try {
            const kicked = kickPlayerSafely(player, "Invalid or invisible characters in username are not allowed.");
            sendOperatorTelemetry(`Invalid username moderation on ${player.name}. kick=${kicked}.`, `${player?.id ?? ""}`);
        } catch { }
    }

    for (const playerId of kickedInvalidNamePlayers) {
        if (!activePlayerIds.has(playerId)) {
            kickedInvalidNamePlayers.delete(playerId);
        }
    }

    return kickedCount;
}

// SECTION: Block Break Permissions
world.beforeEvents.playerBreakBlock.subscribe((data) => {
    const player = data.player;
    const block = data.block;
    if (!player || !isPlayerInAdventure(player)) return;

    const isItemFrameBreak = `${block?.typeId ?? ""}`.trim().toLowerCase().includes("item_frame")
        || block?.typeId === "minecraft:frame"
        || block?.typeId === "minecraft:glow_frame";

    if (isItemFrameBreak && !adventureInteractionPermissions.canUseItemframes) {
        data.cancel = true;
        notifyAdventureInteractionBlocked(player, "canUseItemframes");
    }
});

// SECTION: Startup Commands & Persisted Toggles
try {
    if (system?.beforeEvents?.startup) {
        system.beforeEvents.startup.subscribe((data) => {
            registerBrrCommands(data, {
                emojiCommand,
                setEngineBlocksAlwaysVisible: (nextValue) => {
                    setEngineBlocksAlwaysVisible(nextValue);
                    world.setDynamicProperty("engine_blocks_always_visible", nextValue);
                    return nextValue;
                },
                setToolsEnabled: (nextValue) => {
                    setEngineToolsEnabled(nextValue);
                    world.setDynamicProperty("tools_enabled", nextValue);
                    return nextValue;
                },
                getUsernameMode: () => usernameMode,
                // mode: "normal" | "hidden" | "randomized" (validated by the command).
                setUsernameMode: (mode) => {
                    usernameMode = normalizeUsernameMode(mode);
                    if (usernameMode === USERNAME_MODE_RANDOMIZED) refreshAliasAssignments(world.getPlayers(), true);
                    persistUsernameModerationState();
                    applyUsernameModeToPlayers();
                },
                versionText: "§aBonnie's Source Engine Demo v0.5.0. Property of: BonnieRobloxRIP"
            });
        });
    }
} catch { }

system.run(() => {
    setEngineBlocksAlwaysVisible(parseBooleanLike(world.getDynamicProperty("engine_blocks_always_visible"), false));
    setEngineToolsEnabled(parseBooleanLike(world.getDynamicProperty("tools_enabled"), true));
    loadUsernameModerationState();
    loadPersistedPermissions(parseBooleanLike);
    initializeDynamicLightingSystem();
});

startEngine();

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        enforcePressurePlateRestrictionForPlayer(player);
    }
}, 2);

system.runInterval(() => {
    processBlackMesaMenuRequests();
}, 1);

// SECTION: Shared Parsing Helpers
function parseBooleanLike(value, defaultValue = false) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;

    const normalized = `${value ?? ""}`.trim().toLowerCase();
    if (normalized === "") return defaultValue;
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
    return defaultValue;
}

// SECTION: Username Moderation Runtime Loop
system.runInterval(() => {
    applyUsernameModeToPlayers();
}, 10);

// SECTION: Invalid Username Kick Loop
system.runInterval(() => {
    kickPlayersWithInvalidNames();
}, 10);

// SECTION: Player Spawn Handling
world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    if (!player) return;

    system.run(() => {
        if (event.initialSpawn) {
            try {
                console.warn(`Player ${player.name} Successfully connected`);
            } catch { }
        }

        handlePlayerSpawn(player, event.initialSpawn);
    });
});

// SECTION: Block Interaction
world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
    if (data.cancel) return;

    const block = data.block;
    const incompatibleRespawnPermission = getIncompatibleRespawnPermissionForBlock(data.player, block?.typeId, block?.dimension?.id);
    if (incompatibleRespawnPermission && !adventureInteractionPermissions[incompatibleRespawnPermission]) {
        data.cancel = true;
        notifyAdventureInteractionBlocked(data.player, incompatibleRespawnPermission);
        return;
    }

    const blockedPermission = getAdventurePermissionForBlock(block?.typeId);
    if (blockedPermission && shouldBlockAdventureInteraction(data.player, block.typeId)) {
        data.cancel = true;
        notifyAdventureInteractionBlocked(data.player, blockedPermission);
        return;
    }

    handleEngineBlockInteract(data);
});
