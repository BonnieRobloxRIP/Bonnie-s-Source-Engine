import * as mc from "@minecraft/server";
import {
    applyEmojiReplacements,
    emojiCommand,
    setChatCooldownSeconds,
    setChatSpamBlockedMessage,
    executeMuteCommand,
    executeUnmuteCommand
} from "./handler/core/chat_system.js";
import { evaluateCondition } from "./handler/core/condition_executer.js";
import { conditionTools } from "./tool_ui/conditions_tools.js";
import { handleAreaPortalBlock } from "./tool_ui/tool/tool_areaportal.js";
import { getPlayerspawnSpawnConfig, getActivePlayerspawnBlocks, applySpawnPointForPlayer, applyWorldSpawnPoint, getPlayerspawnTargets } from "./tool_ui/info/info_playerspawn.js";
import { getGameNametagTargets } from "./tool_ui/game/game_nametag.js";
import { getHiddenPlaceholderType } from "./tool_ui/tool/tool_invisible.js";
import { applyPlayerclipRepel } from "./tool_ui/tool/tool_playerclip.js";
import { shouldEnableNpcclipCollision, applyNpcclipRepel } from "./tool_ui/tool/tool_npcclip.js";
import { fireOutputsForEvent, getNormalizedTriggerData, isBlockedTriggerCommand } from "./tool_ui/tool/tool_trigger.js";
import { blockParticles } from "./handler/core/block_particles.js";
import "./handler/small.js";
import "./handler/weapons/gluon_gun.js";
import "./handler/weapons/tau_cannon.js";
import "./handler/weapons/crowbar.js";
import "./handler/weapons/glock17.js";
import "./handler/weapons/magnum357.js";
import "./handler/build_tools/index.js";
import { openToolUIForBlock } from "./tool_ui/tool_ui_dispatch.js";
import { tickLogicBlocks } from "./handler/logic_blocks.js";
import { parseSelectorFilters, applyEntityFilters } from "./handler/core/selector_filters.js";
import { outputClassInfoTargets } from "./tool_ui/output_ci_targets.js";
import {
    ADVENTURE_COMMAND_TO_KEY,
    adventureInteractionPermissions,
    setAdventurePermission,
    loadPersistedPermissions,
    enforcePressurePlateRestrictionForPlayer,
    shouldBlockAdventureInteraction,
    getAdventurePermissionForBlock,
    getIncompatibleRespawnPermissionForBlock,
    notifyAdventureInteractionBlocked,
    isPlayerInAdventure
} from "./handler/permissions.js";
import {
    initializeDynamicLightingSystem,
    setDynamicLightsEnabled
} from "./handler/core/dynamic_lighting.js";
import { registerBrrCommands } from "./handler/core/brr_commands.js";
import { processBlackMesaMenuRequests } from "./handler/ui/black_mesa_menu.js";
import "./antiexploit.js";

const { world, system } = mc;
const GameMode = mc.GameMode;
const CommandPermissionLevel = mc.CommandPermissionLevel;
const PlayerPermissionLevel = mc.PlayerPermissionLevel;

// SECTION: Global State & Constants
let visible = false;
let toolsEnabled = true;
const PLAYERCLIP_PUSH_COOLDOWN_MS = 100;
const NPCCLIP_REPEL_COOLDOWN_MS = 140;
const TRIGGER_INTERACT_COOLDOWN_MS = 500;
const playerclipPushCooldowns = new Map();
const playerclipLastSafePositions = new Map();
const npcclipRepelCooldowns = new Map();
const npcclipLastSafePositions = new Map();
const TOOL_BLOCK_TYPES = ["brr:tool_areaportal", "brr:info_playerspawn_block", "brr:tool_invisible", "brr:tool_trigger", "brr:info_target_areaportal_block", "brr:tool_blocklight", "brr:tool_playerclip", "brr:tool_npcclip", "brr:game_nametag_block", "brr:logic_auto_block", "brr:logic_branch_block", "brr:logic_case_block", "brr:logic_compare_block", "brr:logic_coop_manager_block", "brr:logic_random_outputs_block", "brr:logic_timer_block"];
const COLLISION_BLOCK_TYPES = ["brr:tool_invisible", "brr:tool_playerclip", "brr:tool_npcclip"];
const LIGHT_BLOCK_TYPES = ["brr:tool_blocklight"];
const PLACEHOLDER_BLOCK_TYPES = [
    "brr:data",
    "brr:data_collision",
    "brr:data_blocklight",
    "minecraft:client_request_placeholder_block"
];
const ITEM_TO_BLOCK_MAP = {
    "brr:info_playerspawn": "brr:info_playerspawn_block",
    "brr:info_target_areaportal": "brr:info_target_areaportal_block",
    "brr:game_nametag": "brr:game_nametag_block",
    "brr:logic_auto": "brr:logic_auto_block",
    "brr:logic_branch": "brr:logic_branch_block",
    "brr:logic_case": "brr:logic_case_block",
    "brr:logic_compare": "brr:logic_compare_block",
    "brr:logic_coop_manager": "brr:logic_coop_manager_block",
    "brr:logic_random_outputs": "brr:logic_random_outputs_block",
    "brr:logic_timer": "brr:logic_timer_block"
};
const BLOCK_TO_ITEM_MAP = Object.fromEntries(
    Object.entries(ITEM_TO_BLOCK_MAP).map(([itemTypeId, blockTypeId]) => [blockTypeId, itemTypeId])
);
const TRIGGER_OUTPUT_TYPES = ["onTrue", "onFalse"];
const TRIGGER_INPUTS = [...new Set([
    ...outputClassInfoTargets,
    "selector",
    "destination",
    "destinationBlock",
    "worldSpawnAtBlock",
    "worldSpawn",
    "executeOnCondition",
    "executeOnConditon",
    "conditionValue1",
    "conditionValue2",
    "conditionValue3",
    "runCommand",
    "excludeOperators",
    "excludeGamemode",
    "excludeSelector",
    "worksInUsernames",
    "worksInChat",
    "suffix",
    "prefix",
    "nametag",
    "nametagOrder",
    "selectors"
])];
const ADJACENT_DIRECTIONS = [
    { x: 0, y: 1, z: 0 },
    { x: 0, y: -1, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: -1 },
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 }
];
const USERNAME_MODE_PROPERTY = "brr_username_mode";
const USERNAME_ALIAS_MAP_PROPERTY = "brr_username_alias_map";
const CHAT_DISPLAY_NAME_OVERRIDE_PROPERTY = "brr_display_name_override";
const SUSPECT_BOT_CLIENT_TAG = "brr_suspect_client";
const CONFIRMED_BOT_FLAG_PROPERTY = "brr_confirmed_bot";
const ANTI_BOT_EXEMPT_PROPERTY = "brr_antibot_exempt";
const OP_TELEMETRY_TAG = "§8[AntiBot]§r";
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

function applyUsernameModeToPlayers() {
    const players = world.getPlayers();
    if (usernameMode === USERNAME_MODE_RANDOMIZED) {
        refreshAliasAssignments(players);
    }

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

        try {
            if (shouldOverrideChatName) {
                player.setDynamicProperty(CHAT_DISPLAY_NAME_OVERRIDE_PROPERTY, nextNameTag);
            } else {
                player.setDynamicProperty(CHAT_DISPLAY_NAME_OVERRIDE_PROPERTY, undefined);
            }
        } catch { }
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

function markPlayerAsConfirmedBot(player, reason) {
    if (!player || isAntiBotExempt(player)) return;

    const payload = {
        reason: `${reason ?? "bot-like activity"}`.slice(0, 80),
        at: Date.now()
    };

    try {
        player.setDynamicProperty(CONFIRMED_BOT_FLAG_PROPERTY, JSON.stringify(payload));
    } catch { }
}

function isAntiBotExempt(player) {
    if (!player) return false;

    try {
        const raw = player.getDynamicProperty(ANTI_BOT_EXEMPT_PROPERTY);
        if (typeof raw === "boolean") return raw;
        if (typeof raw === "number") return raw !== 0;
        if (typeof raw === "string") {
            const normalized = raw.trim().toLowerCase();
            return normalized === "1" || normalized === "true" || normalized === "yes";
        }
    } catch { }

    return false;
}

function getConfirmedBotReason(player) {
    if (!player) return "bot-like activity";

    try {
        const raw = player.getDynamicProperty(CONFIRMED_BOT_FLAG_PROPERTY);
        if (typeof raw !== "string" || raw.trim().length === 0) {
            return "bot-like activity";
        }

        try {
            const parsed = JSON.parse(raw);
            const reason = `${parsed?.reason ?? ""}`.trim();
            return reason || "bot-like activity";
        } catch {
            return raw.trim() || "bot-like activity";
        }
    } catch {
        return "bot-like activity";
    }
}

function isConfirmedBotFlagged(player) {
    if (!player || isAntiBotExempt(player)) return false;

    try {
        const raw = player.getDynamicProperty(CONFIRMED_BOT_FLAG_PROPERTY);
        return typeof raw === "string" && raw.trim().length > 0;
    } catch {
        return false;
    }
}

function createKickTag() {
    const rand = Math.floor(Math.random() * 1679616).toString(36);
    return `brrkick_${Date.now().toString(36)}_${rand}`;
}

function kickPlayerSafely(player, reason) {
    if (!player) return false;

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

        if (isAntiBotExempt(player)) {
            kickedInvalidNamePlayers.delete(playerId);
            continue;
        }

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
            markPlayerAsConfirmedBot(player, "invalid_or_invisible_username");
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

function shouldMarkClientAsSuspectBot(player) {
    if (!player) return false;

    try {
        const info = player.clientSystemInfo;
        const maxRender = Number(info?.maxRenderDistance ?? -1);
        return Number.isFinite(maxRender) && maxRender === 0;
    } catch {
        return false;
    }
}

function kickConfirmedBotOnJoin(player) {
    if (!player || isAntiBotExempt(player) || !isConfirmedBotFlagged(player)) return false;

    const reason = getConfirmedBotReason(player);
    const kicked = kickPlayerSafely(player, `Confirmed bot flag: ${reason}`);
    sendOperatorTelemetry(`Join enforcement for ${player.name}. flaggedReason=${reason}. kick=${kicked}.`, `${player?.id ?? ""}`);
    return kicked;
}

function updateSuspectClientTag(player) {
    if (!player) return;

    if (isAntiBotExempt(player)) {
        try {
            const tags = player.getTags();
            if (tags.includes(SUSPECT_BOT_CLIENT_TAG)) {
                player.removeTag(SUSPECT_BOT_CLIENT_TAG);
            }
        } catch { }
        return;
    }

    const shouldTag = shouldMarkClientAsSuspectBot(player);
    try {
        const tags = player.getTags();
        const hasTag = tags.includes(SUSPECT_BOT_CLIENT_TAG);

        if (shouldTag && !hasTag) {
            player.addTag(SUSPECT_BOT_CLIENT_TAG);
        } else if (!shouldTag && hasTag) {
            player.removeTag(SUSPECT_BOT_CLIENT_TAG);
        }
    } catch { }
}

function resolveOnlinePlayerByName(rawName) {
    const normalizedTarget = normalizePlayerNameForSet(rawName);
    if (!normalizedTarget) return undefined;

    return world.getPlayers().find((player) => normalizePlayerNameForSet(player?.name) === normalizedTarget);
}

function clearAntiBotMarkers(player) {
    if (!player) return false;

    let changed = false;

    try {
        if (player.getDynamicProperty(CONFIRMED_BOT_FLAG_PROPERTY) !== undefined) {
            changed = true;
        }
        player.setDynamicProperty(CONFIRMED_BOT_FLAG_PROPERTY, undefined);
    } catch { }

    try {
        const tags = player.getTags();
        if (tags.includes(SUSPECT_BOT_CLIENT_TAG)) {
            player.removeTag(SUSPECT_BOT_CLIENT_TAG);
            changed = true;
        }
    } catch { }

    return changed;
}

function executeAntiBotClearCommand(actor, targetInput) {
    const targetName = `${targetInput ?? ""}`.trim();

    if (!targetName) {
        let affectedPlayers = 0;
        for (const player of world.getPlayers()) {
            if (clearAntiBotMarkers(player)) {
                affectedPlayers++;
            }
        }

        actor?.sendMessage?.(`§aCleared anti-bot flags for ${affectedPlayers} player(s).`);
        sendOperatorTelemetry(
            `Manual anti-bot clear by ${actor?.name ?? "unknown"}. affected=${affectedPlayers}.`,
            `${actor?.id ?? ""}`
        );
        return;
    }

    const targetPlayer = resolveOnlinePlayerByName(targetName);
    if (!targetPlayer) {
        actor?.sendMessage?.(`§cPlayer not found online: ${targetName}`);
        return;
    }

    const changed = clearAntiBotMarkers(targetPlayer);
    if (changed) {
        actor?.sendMessage?.(`§aCleared anti-bot flags for ${targetPlayer.name}.`);
    } else {
        actor?.sendMessage?.(`§eNo anti-bot flags were set for ${targetPlayer.name}.`);
    }

    sendOperatorTelemetry(
        `Manual anti-bot clear by ${actor?.name ?? "unknown"} target=${targetPlayer.name} changed=${changed}.`,
        `${actor?.id ?? ""}`
    );
}

function executeAntiBotRearmCommand(actor, targetInput) {
    const targetName = `${targetInput ?? ""}`.trim();

    if (!targetName) {
        let suspectCount = 0;

        for (const player of world.getPlayers()) {
            updateSuspectClientTag(player);
            try {
                if (player.getTags().includes(SUSPECT_BOT_CLIENT_TAG)) {
                    suspectCount++;
                }
            } catch { }
        }

        actor?.sendMessage?.(`§aRe-armed anti-bot detection for all online players. Suspect-tagged: ${suspectCount}.`);
        sendOperatorTelemetry(
            `Manual anti-bot rearm by ${actor?.name ?? "unknown"}. suspectTagged=${suspectCount}.`,
            `${actor?.id ?? ""}`
        );
        return;
    }

    const targetPlayer = resolveOnlinePlayerByName(targetName);
    if (!targetPlayer) {
        actor?.sendMessage?.(`§cPlayer not found online: ${targetName}`);
        return;
    }

    updateSuspectClientTag(targetPlayer);

    let hasSuspectTag = false;
    try {
        hasSuspectTag = targetPlayer.getTags().includes(SUSPECT_BOT_CLIENT_TAG);
    } catch { }

    actor?.sendMessage?.(`§aRe-armed anti-bot detection for ${targetPlayer.name}. suspectTag=${hasSuspectTag}.`);
    sendOperatorTelemetry(
        `Manual anti-bot rearm by ${actor?.name ?? "unknown"} target=${targetPlayer.name} suspectTag=${hasSuspectTag}.`,
        `${actor?.id ?? ""}`
    );
}

function normalizePlayerNameForSet(rawName) {
    return `${rawName ?? ""}`.trim().toLowerCase();
}
// SECTION: Large JSON Storage
const MAX_CHUNK_SIZE = 28000;
const BLOCK_CACHE_REFRESH_TICKS = 10;
let cachedBlocks = [];
let blocksCacheDirty = true;
let blocksCacheTickCounter = 0;
let blockVisibilityStateDirty = true;

function saveLargeJSON(keyBase, value) {
    const json = JSON.stringify(value);
    let index = 0;
    let pos = 0;

    while (world.getDynamicProperty(`${keyBase}_${index}`) !== undefined) {
        world.setDynamicProperty(`${keyBase}_${index}`, undefined);
        index++;
    }

    index = 0;
    while (pos < json.length) {
        const chunk = json.slice(pos, pos + MAX_CHUNK_SIZE);
        world.setDynamicProperty(`${keyBase}_${index}`, chunk);
        pos += MAX_CHUNK_SIZE;
        index++;
    }

    world.setDynamicProperty(`${keyBase}_count`, index);

    if (keyBase === "blocks") {
        cachedBlocks = Array.isArray(value) ? JSON.parse(JSON.stringify(value)) : [];
        blocksCacheDirty = false;
        blocksCacheTickCounter = 0;
    }
}

function loadLargeJSON(keyBase) {
    const count = world.getDynamicProperty(`${keyBase}_count`);
    if (typeof count !== "number") return [];

    let result = "";
    for (let i = 0; i < count; i++) {
        const chunk = world.getDynamicProperty(`${keyBase}_${i}`);
        if (chunk) result += chunk;
    }

    try {
        return JSON.parse(result);
    } catch {
        return [];
    }
}

function getBlocksSnapshot(forceRefresh = false) {
    blocksCacheTickCounter++;
    const shouldRefresh = forceRefresh
        || blocksCacheDirty
        || blocksCacheTickCounter >= BLOCK_CACHE_REFRESH_TICKS;

    if (shouldRefresh) {
        cachedBlocks = loadLargeJSON("blocks");
        blocksCacheDirty = false;
        blocksCacheTickCounter = 0;
    }

    return cachedBlocks;
}

// SECTION: Block Grouping & Placement Helpers
function getAdjacentPositions(x, y, z) {
    return ADJACENT_DIRECTIONS.map(dir => ({ x: x + dir.x, y: y + dir.y, z: z + dir.z }));
}

function generateGroupId() {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function isToolNamespaceBlock(typeId) {
    return typeof typeId === "string" && typeId.startsWith("brr:tool_");
}

function getAdjacentGroupIds(blocks, x, y, z, dimension, blockType) {
    const adjPositions = getAdjacentPositions(x, y, z);
    const adjBlocks = blocks.filter(b =>
        b.dimension === dimension &&
        adjPositions.some(pos => pos.x === b.x && pos.y === b.y && pos.z === b.z) &&
        b.typeId === blockType
    );

    return [...new Set(adjBlocks.map(b => b.groupId).filter(id => id))];
}

function mergeToolGroups(blocks, blockType, groupIds, newGroupId) {
    if (!Array.isArray(groupIds) || groupIds.length <= 1) return;

    const sourceBlock = blocks.find(b => b.groupId === newGroupId && b.typeId === blockType && b.data);
    const sharedData = sourceBlock?.data ? JSON.parse(JSON.stringify(sourceBlock.data)) : null;

    blocks.forEach(block => {
        if (groupIds.includes(block.groupId) && block.typeId === blockType) {
            block.groupId = newGroupId;
            if (sharedData) {
                block.data = JSON.parse(JSON.stringify(sharedData));
            }
        }
    });
}

function getActiveVisibleBlockTypes() {
    const activeTypes = new Set();

    for (const player of world.getPlayers()) {
        const equip = player.getComponent("minecraft:equippable");
        const mainhand = equip?.getEquipment("Mainhand");
        const heldType = mainhand?.typeId ?? "minecraft:air";

        if (TOOL_BLOCK_TYPES.includes(heldType)) {
            activeTypes.add(heldType);
        }

        if (ITEM_TO_BLOCK_MAP[heldType]) {
            activeTypes.add(ITEM_TO_BLOCK_MAP[heldType]);
        }
    }

    return activeTypes;
}

function getBlockPositionKey(dimensionId, x, y, z) {
    return `${dimensionId}|${x}|${y}|${z}`;
}

function shouldHideActiveSourceSurfaceBlock(block, dimension, blocksByPosition) {
    return false;
}

// SECTION: Player & Proximity Helpers
function isPlayerInCreative(player) {
    if (!player) return false;

    if (typeof player.getGameMode === "function") {
        try {
            return `${player.getGameMode()}`.toLowerCase() === "creative";
        } catch { }
    }

    try {
        return (player.runCommand("testfor @s[m=creative]")?.successCount ?? 0) > 0;
    } catch { }

    try {
        return (player.runCommand("testfor @s[m=1]")?.successCount ?? 0) > 0;
    } catch { }

    return false;
}

function isPlayerOperator(player) {
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

function getPlayerGameMode(player) {
    if (!player) return "";

    if (typeof player.getGameMode === "function") {
        try {
            const rawMode = `${player.getGameMode()}`.trim().toLowerCase();
            if (rawMode === "0" || rawMode === "survival") return "survival";
            if (rawMode === "1" || rawMode === "creative") return "creative";
            if (rawMode === "2" || rawMode === "adventure") return "adventure";
            if (rawMode === "6" || rawMode === "spectator") return "spectator";
            if (rawMode.includes("adventure")) return "adventure";
            if (rawMode.includes("creative")) return "creative";
            if (rawMode.includes("survival")) return "survival";
            if (rawMode.includes("spectator")) return "spectator";
        } catch { }
    }

    const modeChecks = [
        ["survival", "testfor @s[m=survival]", "testfor @s[m=0]"],
        ["creative", "testfor @s[m=creative]", "testfor @s[m=1]"],
        ["adventure", "testfor @s[m=adventure]", "testfor @s[m=2]"],
        ["spectator", "testfor @s[m=spectator]", "testfor @s[m=6]"]
    ];
    for (const [modeName, ...tests] of modeChecks) {
        for (const test of tests) {
            try {
                if ((player.runCommand(test)?.successCount ?? 0) > 0) {
                    return modeName;
                }
            } catch { }
        }
    }

    return "";
}

function isPositionNearBlock(pos, block, expand = 0.35) {
    if (!pos || !block) return false;

    return pos.x >= block.x - expand && pos.x <= block.x + 1 + expand
        && pos.y >= block.y - expand && pos.y <= block.y + 1 + expand
        && pos.z >= block.z - expand && pos.z <= block.z + 1 + expand;
}

function isEntityNearBlock(entity, block, expand = 0.35) {
    const probes = getEntityProbeLocations(entity);
    for (const probe of probes) {
        if (isPositionNearBlock(probe, block, expand)) return true;
    }
    return false;
}

function setHiddenPlaceholderBlockSafe(dimension, pos, desiredTypeId, fallbackTypeId = "brr:data") {
    try {
        dimension.setBlockType(pos, desiredTypeId);
        return;
    } catch { }

    if (desiredTypeId === fallbackTypeId) return;
    try {
        dimension.setBlockType(pos, fallbackTypeId);
    } catch { }
}

// SECTION: Block Visibility & Placeholder Updates
system.runInterval(() => {
    const players = world.getPlayers();
    if (players.length === 0) return;

    const blocks = getBlocksSnapshot();
    if (blocks.length === 0) return;

    const activeTypes = getActiveVisibleBlockTypes();
    if (!visible && activeTypes.size === 0 && !blocksCacheDirty && !blockVisibilityStateDirty) {
        let hasVisibleActiveBlock = false;

        for (const block of blocks) {
            const dim = world.getDimension(block.dimension);
            const current = dim.getBlock({ x: block.x, y: block.y, z: block.z });
            if (current?.typeId === block.typeId) {
                hasVisibleActiveBlock = true;
                break;
            }
        }

        if (!hasVisibleActiveBlock) return;
    }

    const blocksByPosition = new Map(
        blocks.map(block => [getBlockPositionKey(block.dimension, block.x, block.y, block.z), block])
    );

    for (const block of blocks) {
        const dim = world.getDimension(block.dimension);
        const pos = { x: block.x, y: block.y, z: block.z };
        const current = dim.getBlock(pos);
        if (visible) {
            try { dim.setBlockType(pos, block.typeId); } catch { }
            continue;
        }
        if (activeTypes.has(block.typeId)) {
            try {
                if (shouldHideActiveSourceSurfaceBlock(block, dim, blocksByPosition)) {
                    const hiddenType = getHiddenPlaceholderType(block, {
                        toolsEnabled,
                        collisionBlockTypes: COLLISION_BLOCK_TYPES,
                        lightBlockTypes: LIGHT_BLOCK_TYPES,
                        parseBooleanLike,
                        shouldEnableNpcclipCollision,
                        npcclipOptions: getNpcclipRuntimeOptions()
                    });
                    if (current?.typeId !== hiddenType) {
                        setHiddenPlaceholderBlockSafe(dim, pos, hiddenType, "brr:data");
                    }
                } else {
                    dim.setBlockType(pos, block.typeId);
                }
            } catch { }
        }
        else {
            if (current && (current.typeId === block.typeId || PLACEHOLDER_BLOCK_TYPES.includes(current.typeId))) {
                try {
                    const hiddenType = getHiddenPlaceholderType(block, {
                        toolsEnabled,
                        collisionBlockTypes: COLLISION_BLOCK_TYPES,
                        lightBlockTypes: LIGHT_BLOCK_TYPES,
                        parseBooleanLike,
                        shouldEnableNpcclipCollision,
                        npcclipOptions: getNpcclipRuntimeOptions()
                    });
                    if (current.typeId !== hiddenType) {
                        setHiddenPlaceholderBlockSafe(dim, pos, hiddenType, "brr:data");
                    }
                } catch { }
            }
        }
    }

    blockVisibilityStateDirty = false;
}, 10);

// SECTION: Block Registry Sync Events
world.beforeEvents.playerBreakBlock.subscribe((data) => {
    const player = data.player;
    const block = data.block;

    if (player && isPlayerInAdventure(player)) {
        const isItemFrameBreak = `${block?.typeId ?? ""}`.trim().toLowerCase().includes("item_frame")
            || block?.typeId === "minecraft:frame"
            || block?.typeId === "minecraft:glow_frame";

        if (isItemFrameBreak && !adventureInteractionPermissions.canUseItemframes) {
            data.cancel = true;
            notifyAdventureInteractionBlocked(player, "canUseItemframes");
            return;
        }
    }

    let blocks = getBlocksSnapshot(true);
    if (TOOL_BLOCK_TYPES.includes(block.typeId)) {
        const beforeCount = blocks.length;
        blocks = blocks.filter((b) => !(b.x === block.x && b.y === block.y && b.z === block.z && b.dimension === block.dimension.id));
        if (blocks.length !== beforeCount) {
            saveLargeJSON("blocks", blocks);
        }
    }
})

world.afterEvents.playerPlaceBlock.subscribe((data) => {
    const block = data.block;
    if (TOOL_BLOCK_TYPES.includes(block.typeId)) {
        let blocks = getBlocksSnapshot(true);

        let newGroupId = null;
        let sharedData = {};

        if (isToolNamespaceBlock(block.typeId)) {
            const adjacentGroupIds = getAdjacentGroupIds(blocks, block.x, block.y, block.z, block.dimension.id, block.typeId);

            if (adjacentGroupIds.length > 0) {
                newGroupId = adjacentGroupIds[0];
                const adjacentBlock = blocks.find(b => b.groupId === newGroupId);
                if (adjacentBlock && adjacentBlock.data) {
                    sharedData = JSON.parse(JSON.stringify(adjacentBlock.data));
                }

                if (adjacentGroupIds.length > 1) {
                    mergeToolGroups(blocks, block.typeId, adjacentGroupIds, newGroupId);
                }
            } else {
                newGroupId = generateGroupId();
            }
        }

        const newEntry = {
            x: block.x,
            y: block.y,
            z: block.z,
            typeId: block.typeId,
            dimension: block.dimension.id,
            groupId: newGroupId,
            data: { startDisabled: false, ...sharedData }
        };

        applySupportedBlockStatesToEntry(block, newEntry);
        blocks.push(newEntry);

        if (block.typeId === "brr:tool_playerclip") {
            const newIndex = blocks.length - 1;
            if (blocks[newIndex]?.data?.excludeOperators === undefined) {
                blocks[newIndex].data.excludeOperators = true;
            }
        }

        if (block.typeId === "brr:logic_timer_block") {
            blocks[blocks.length - 1].data.startDisabled = true;
        }

        syncSupportedBlockStatesToWorld(blocks[blocks.length - 1]);
        saveLargeJSON("blocks", blocks);
    }
})

// SECTION: Startup Commands & Persisted Toggles
try {
    if (system?.beforeEvents?.startup) {
        system.beforeEvents.startup.subscribe((data) => {
            registerBrrCommands(data, {
                emojiCommand,
                parseBooleanLike,
                adventureCommandToKey: ADVENTURE_COMMAND_TO_KEY,
                setEngineBlocksAlwaysVisible: (nextValue) => {
                    visible = nextValue;
                    blockVisibilityStateDirty = true;
                    world.setDynamicProperty("engine_blocks_always_visible", visible);
                    return visible;
                },
                setToolsEnabled: (nextValue) => {
                    toolsEnabled = nextValue;
                    blockVisibilityStateDirty = true;
                    world.setDynamicProperty("tools_enabled", toolsEnabled);
                    return toolsEnabled;
                },
                setAdventurePermission,
                setHideUsernames: (nextValue) => {
                    if (nextValue) {
                        usernameMode = USERNAME_MODE_HIDDEN;
                    } else if (usernameMode === USERNAME_MODE_HIDDEN) {
                        usernameMode = USERNAME_MODE_NORMAL;
                    }

                    persistUsernameModerationState();
                    applyUsernameModeToPlayers();
                },
                setRandomizeUsernames: (nextValue) => {
                    if (nextValue) {
                        usernameMode = USERNAME_MODE_RANDOMIZED;
                        refreshAliasAssignments(world.getPlayers(), true);
                    } else if (usernameMode === USERNAME_MODE_RANDOMIZED) {
                        usernameMode = USERNAME_MODE_NORMAL;
                    }

                    persistUsernameModerationState();
                    applyUsernameModeToPlayers();
                },
                executeMuteCommand,
                executeUnmuteCommand,
                setChatCooldownSeconds,
                setDynamicLightsEnabled,
                setChatSpamBlockedMessage,
                executeAntiBotClearCommand,
                executeAntiBotRearmCommand,
                versionText: "§aBonnie's Source Engine Demo v1.4.2. Property of: BonnieRobloxRIP"
            });
        });
    }
} catch { }

system.run(() => {
    visible = parseBooleanLike(world.getDynamicProperty("engine_blocks_always_visible"), false);
    toolsEnabled = parseBooleanLike(world.getDynamicProperty("tools_enabled"), true);
    loadUsernameModerationState();
    blockVisibilityStateDirty = true;
    loadPersistedPermissions(parseBooleanLike);
    initializeDynamicLightingSystem();
});

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        enforcePressurePlateRestrictionForPlayer(player);
    }
}, 2);

system.runInterval(() => {
    processBlackMesaMenuRequests();
}, 1);

// SECTION: Pick-Block Variant Normalization
system.runInterval(() => {
    for (const player of world.getPlayers()) {
        try {
            const inventory = player.getComponent("minecraft:inventory")?.container;
            if (!inventory) continue;

            for (let slot = 0; slot < 9; slot++) {
                const slotItem = inventory.getItem(slot);
                const mappedTypeId = BLOCK_TO_ITEM_MAP[slotItem?.typeId ?? ""];
                if (!mappedTypeId) continue;
                const replacement = new mc.ItemStack(mappedTypeId, Math.max(1, slotItem?.amount ?? 1));
                inventory.setItem(slot, replacement);
            }
        } catch { }
    }
}, 2);

// SECTION: Named Target & Block Data Helpers
function getBlocksTargetingCurrent(currentBlockName) {
    const allBlocks = getBlocksSnapshot();
    const inputsList = [];
    if (!currentBlockName) return inputsList;

    allBlocks.forEach(block => {
        if (block.data && block.data.outputs) {
            block.data.outputs.forEach(output => {
                if (output.targetName === currentBlockName) {
                    inputsList.push({
                        sourceBlockName: block.data.name || `[Block at ${block.x},${block.y},${block.z}]`,
                        outputName: output.name,
                    });
                }
            });
        }
    });

    return inputsList;
}

function getNamedTargets() {
    const blocks = getBlocksSnapshot();
    const namedBlocks = blocks.filter(b => b.data && b.data.name).map(b => b.data.name);
    return [...new Set(namedBlocks)];
}

function getNamedTargetEntries() {
    const blocks = getBlocksSnapshot();
    const seen = new Set();
    const entries = [];

    for (const block of blocks) {
        const name = `${block?.data?.name ?? ""}`.trim();
        if (!name || seen.has(name)) continue;

        seen.add(name);
        entries.push({
            name,
            typeId: `${block?.typeId ?? ""}`
        });
    }

    return entries;
}

function readBooleanState(block, stateName, fallback = false) {
    try {
        const raw = block?.permutation?.getState?.(stateName);
        if (typeof raw === "boolean") return raw;
        if (typeof raw === "number") return raw !== 0;
    } catch { }
    return fallback;
}

function applySupportedBlockStatesToEntry(block, blockEntry) {
    if (!block || !blockEntry) return;

    if (blockEntry.typeId === "brr:logic_timer_block") {
        blockEntry.data.startDisabled = readBooleanState(block, "brr:start_disabled", !!blockEntry.data.startDisabled);
        return;
    }
}

function syncSupportedBlockStatesToWorld(blockEntry) {
    if (!blockEntry || !blockEntry.typeId) return;

    let dimension;
    try {
        dimension = world.getDimension(blockEntry.dimension);
    } catch {
        return;
    }

    let block;
    try {
        block = dimension.getBlock({ x: blockEntry.x, y: blockEntry.y, z: blockEntry.z });
    } catch {
        return;
    }
    if (!block) return;

    try {
        let permutation = block.permutation;

        if (blockEntry.typeId === "brr:logic_timer_block") {
            permutation = permutation.withState("brr:start_disabled", parseBooleanLike(blockEntry?.data?.startDisabled, false) ? 1 : 0);
            block.setPermutation(permutation);
            return;
        }
    } catch { }
}

function saveBlockEntry(blockEntry) {
    let blocks = getBlocksSnapshot(true);
    const index = blocks.findIndex(b =>
        b.x === blockEntry.x &&
        b.y === blockEntry.y &&
        b.z === blockEntry.z &&
        b.dimension === blockEntry.dimension
    );

    if (index !== -1) {
        blocks[index] = blockEntry;
        syncSupportedBlockStatesToWorld(blocks[index]);

        if (blocks[index].groupId && isToolNamespaceBlock(blocks[index].typeId)) {
            const groupId = blocks[index].groupId;
            blocks.forEach(block => {
                if (block.groupId === groupId && block.typeId === blocks[index].typeId) {
                    block.data = JSON.parse(JSON.stringify(blockEntry.data));
                    syncSupportedBlockStatesToWorld(block);
                }
            });
        }

        saveLargeJSON("blocks", blocks);
    }
}

// SECTION: Selector & Block Hitbox Helpers
function isPositionInsideBlock(pos, block) {
    if (!pos || !block) return false;
    return pos.x >= block.x && pos.x < block.x + 1
        && pos.y >= block.y && pos.y < block.y + 1
        && pos.z >= block.z && pos.z < block.z + 1;
}

function getEntityProbeLocations(entity) {
    const loc = entity?.location;
    if (!loc) return [];

    const probes = [{ x: loc.x, y: loc.y, z: loc.z }];

    if (entity?.typeId === "minecraft:player") {
        probes.push(
            { x: loc.x, y: loc.y + 0.9, z: loc.z },
            { x: loc.x, y: loc.y + 1.5, z: loc.z }
        );
    }

    return probes;
}

function isEntityInsideBlock(entity, block) {
    const probes = getEntityProbeLocations(entity);
    for (const probe of probes) {
        if (isPositionInsideBlock(probe, block)) return true;
    }
    return false;
}

// SECTION: Runtime Option Builders
function parseBooleanLike(value, defaultValue = false) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;

    const normalized = `${value ?? ""}`.trim().toLowerCase();
    if (normalized === "") return defaultValue;
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
    return defaultValue;
}

function getSelectorRuntimeOptions() {
    return {
        parseSelectorFilters,
        applyEntityFilters: (entities, filters) => applyEntityFilters(entities, filters, getPlayerGameMode)
    };
}

function getNpcclipRuntimeOptions() {
    return {
        toolsEnabled,
        parseBooleanLike,
        isEntityNearBlock,
        ...getSelectorRuntimeOptions()
    };
}

function getPlayerclipRuntimeOptions() {
    return {
        parseBooleanLike,
        isEntityNearBlock,
        isPlayerOperator,
        getPlayerGameMode,
        ...getSelectorRuntimeOptions(),
        playerclipPushCooldowns,
        playerclipLastSafePositions,
        cooldownMs: PLAYERCLIP_PUSH_COOLDOWN_MS
    };
}

function getNpcclipRepelRuntimeOptions() {
    return {
        parseBooleanLike,
        isEntityNearBlock,
        ...getSelectorRuntimeOptions(),
        npcclipRepelCooldowns,
        npcclipLastSafePositions,
        cooldownMs: NPCCLIP_REPEL_COOLDOWN_MS
    };
}

function getOutputRuntimeOptions() {
    return {
        loadBlocks: () => getBlocksSnapshot(true),
        saveBlocks: saveLargeJSON,
        parseBooleanLike
    };
}

// SECTION: Playerspawn Runtime State
let playerspawnWarningShown = false;
let lastAppliedWorldSpawnKey = "";

// SECTION: Trigger & AreaPortal Runtime Loop
system.runInterval(() => {
    if (!toolsEnabled) return;

    const blocks = getBlocksSnapshot();
    const players = world.getPlayers();
    const outputRuntimeOptions = getOutputRuntimeOptions();

    for (const block of blocks) {
        if (block.typeId === "brr:tool_trigger" && !block.data?.startDisabled) {
            const triggerData = getNormalizedTriggerData(block.data, conditionTools);

            for (const player of players) {
                if (!isEntityInsideBlock(player, block)) continue;

                if (evaluateCondition(triggerData, player, world)) {
                    if (triggerData.runCommand) {
                        if (!isBlockedTriggerCommand(triggerData.runCommand)) {
                            try {
                                player.runCommand(triggerData.runCommand);
                            } catch { }
                        }
                    }
                    fireOutputsForEvent(block, "onTrue", outputRuntimeOptions);
                } else {
                    fireOutputsForEvent(block, "onFalse", outputRuntimeOptions);
                }
            }
        }

        if (block.typeId === "brr:tool_areaportal" && !block.data?.startDisabled) {
            handleAreaPortalBlock(block, blocks, {
                isEntityInsideBlock,
                ...getSelectorRuntimeOptions()
            });
        }
    }
}, 2);

// SECTION: Logic Blocks Runtime Loop
system.runInterval(() => {
    if (!toolsEnabled) return;

    const blocks = getBlocksSnapshot();
    const logicBlocks = blocks.filter(b => b?.typeId?.startsWith("brr:logic_"));
    if (logicBlocks.length === 0) return;

    const outputRuntimeOptions = getOutputRuntimeOptions();
    tickLogicBlocks(logicBlocks, outputRuntimeOptions, saveBlockEntry);
}, 2);

// SECTION: Npcclip Runtime Loop
system.runInterval(() => {
    if (!toolsEnabled) return;

    const blocks = getBlocksSnapshot();
    const npcclipBlocks = blocks.filter(block =>
        block?.typeId === "brr:tool_npcclip" && !parseBooleanLike(block?.data?.startDisabled, false)
    );
    if (npcclipBlocks.length === 0) return;

    const npcclipRepelRuntimeOptions = getNpcclipRepelRuntimeOptions();
    for (const block of npcclipBlocks) {
        let dimension;
        try {
            dimension = world.getDimension(block.dimension);
        } catch {
            continue;
        }

        const entities = Array.from(dimension.getEntities()).filter(entity => `${entity?.typeId ?? ""}` !== "minecraft:player");
        for (const entity of entities) {
            applyNpcclipRepel(entity, block, npcclipRepelRuntimeOptions);
        }
    }
}, 2);

// SECTION: Playerclip Runtime Loop
system.runInterval(() => {
    if (!toolsEnabled) return;

    const blocks = getBlocksSnapshot();
    const playerclipBlocks = blocks.filter(block =>
        block?.typeId === "brr:tool_playerclip" && !parseBooleanLike(block?.data?.startDisabled, false)
    );
    if (playerclipBlocks.length === 0) return;

    const players = world.getPlayers();
    const playerclipRuntimeOptions = getPlayerclipRuntimeOptions();
    for (const block of playerclipBlocks) {
        for (const player of players) {
            applyPlayerclipRepel(player, block, playerclipRuntimeOptions);
        }
    }
}, 2);

// SECTION: Playerspawn Runtime Loop
system.runInterval(() => {
    if (!toolsEnabled) {
        playerspawnWarningShown = false;
        return;
    }

    const blocks = getBlocksSnapshot();
    const activePlayerspawnBlocks = getActivePlayerspawnBlocks(blocks);

    if (activePlayerspawnBlocks.length !== 1) {
        if (activePlayerspawnBlocks.length > 1 && !playerspawnWarningShown) {
            playerspawnWarningShown = true;
            try {
                world.sendMessage("§eYou can have only 1 info_playerspawn block active at a time bro.");
            } catch { }
        }
        if (activePlayerspawnBlocks.length <= 1) {
            playerspawnWarningShown = false;
        }
        return;
    }

    playerspawnWarningShown = false;

    const activeBlock = activePlayerspawnBlocks[0];
    const spawnConfig = getPlayerspawnSpawnConfig(activeBlock, parseBooleanLike);
    if (!spawnConfig) return;

    const { spawnDim, spawnCoords, setsPlayerSpawnPoint } = spawnConfig;

    if (setsPlayerSpawnPoint) {
        lastAppliedWorldSpawnKey = "";
        const selector = `${activeBlock?.data?.selectors ?? "@a"}`.trim() || "@a";
        const targetPlayers = getPlayerspawnTargets(activeBlock, selector, getSelectorRuntimeOptions());
        for (const player of targetPlayers) {
            applySpawnPointForPlayer(player, spawnCoords, spawnDim);
        }
        return;
    }

    const spawnKey = `${Math.floor(spawnCoords.x)}|${Math.floor(spawnCoords.y)}|${Math.floor(spawnCoords.z)}`;
    if (spawnKey === lastAppliedWorldSpawnKey) return;

    if (applyWorldSpawnPoint(spawnCoords)) {
        lastAppliedWorldSpawnKey = spawnKey;
    }
}, 100);

// SECTION: Game Nametag Runtime Loop
system.runInterval(() => {
    const blocks = getBlocksSnapshot();
    const activeNametagBlocks = blocks.filter(block =>
        block?.typeId === "brr:game_nametag_block" && !parseBooleanLike(block?.data?.startDisabled, false)
    );

    const allPlayers = world.getPlayers();
    const playerBuckets = new Map();

    function parseOrder(value) {
        const parsed = Number.parseInt(`${value ?? "0"}`, 10);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function formatNametag(rawNametag) {
        const trimmed = `${rawNametag ?? ""}`.trim();
        if (!trimmed) return "";
        const withEmoji = applyEmojiReplacements(trimmed);
        return `[§r${withEmoji}§r]`;
    }

    for (const block of activeNametagBlocks) {
        const tag = formatNametag(block?.data?.nametag);
        if (!tag) continue;

        const worksInUsernames = parseBooleanLike(block?.data?.worksInUsernames, true);
        const worksInChat = parseBooleanLike(block?.data?.worksInChat, true);
        const usesPrefix = parseBooleanLike(block?.data?.prefix, true);
        const usesSuffix = parseBooleanLike(block?.data?.suffix, false);
        const order = parseOrder(block?.data?.nametagOrder);
        const selector = `${block?.data?.selectors ?? "@a"}`.trim() || "@a";

        const targets = getGameNametagTargets(block, selector, {
            parseSelectorFilters,
            applyEntityFilters
        });

        for (const player of targets) {
            const playerId = `${player?.id ?? ""}`;
            if (!playerId) continue;

            if (!playerBuckets.has(playerId)) {
                playerBuckets.set(playerId, {
                    player,
                    entries: []
                });
            }

            playerBuckets.get(playerId).entries.push({
                order,
                worksInUsernames,
                worksInChat,
                usesPrefix,
                usesSuffix,
                tag
            });
        }
    }

    for (const player of allPlayers) {
        const playerId = `${player?.id ?? ""}`;
        const bucket = playerBuckets.get(playerId);

        if (!bucket || bucket.entries.length === 0) {
            try {
                player.setDynamicProperty("brr_nametag", undefined);
            } catch { }
            continue;
        }

        const entries = bucket.entries.sort((a, b) => a.order - b.order);
        const chatPrefix = entries
            .filter(entry => entry.worksInChat && entry.usesPrefix)
            .map(entry => `${entry.tag} `)
            .join("");
        const chatSuffix = entries
            .filter(entry => entry.worksInChat && entry.usesSuffix)
            .map(entry => ` ${entry.tag}`)
            .join("");
        const usernamePrefix = entries
            .filter(entry => entry.worksInUsernames && entry.usesPrefix)
            .map(entry => `${entry.tag} `)
            .join("");
        const usernameSuffix = entries
            .filter(entry => entry.worksInUsernames && entry.usesSuffix)
            .map(entry => ` ${entry.tag}`)
            .join("");

        const payload = {
            chatPrefix,
            chatSuffix,
            usernamePrefix,
            usernameSuffix
        };

        try {
            player.setDynamicProperty("brr_nametag", JSON.stringify(payload));
        } catch { }
    }
}, 10);

// SECTION: Username Moderation Runtime Loop
system.runInterval(() => {
    applyUsernameModeToPlayers();
}, 10);

// SECTION: Invalid Username Kick Loop
system.runInterval(() => {
    kickPlayersWithInvalidNames();
}, 10);

// SECTION: Tool Particle Rendering Loop
system.runInterval(() => {
    const blocks = getBlocksSnapshot();
    const activeTypes = visible ? null : getActiveVisibleBlockTypes();

    for (const block of blocks) {
        if (!visible && activeTypes && !activeTypes.has(block.typeId)) {
            continue;
        }

        const particleId = blockParticles[block.typeId];
        if (!particleId) continue;

        const dim = world.getDimension(block.dimension);
        const particlePos = {
            x: block.x + 0.5,
            y: block.y + 0.5,
            z: block.z + 0.5
        };

        try {
            dim.spawnParticle(particleId, particlePos);
        } catch { }
    }
}, 2);

// SECTION: Player Spawn Handling
world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    if (!player) return;

    system.run(() => {
        updateSuspectClientTag(player);

        if (event.initialSpawn) {
            try {
                console.warn(`Player ${player.name} Successfully connected`);
            } catch { }
        }

        if (!toolsEnabled) return;

        const blocks = getBlocksSnapshot();
        const activePlayerspawnBlocks = getActivePlayerspawnBlocks(blocks);

        if (activePlayerspawnBlocks.length !== 1) return;

        const activeBlock = activePlayerspawnBlocks[0];
        const spawnConfig = getPlayerspawnSpawnConfig(activeBlock, parseBooleanLike);
        if (!spawnConfig) return;

        if (spawnConfig.setsPlayerSpawnPoint) {
            const selector = `${activeBlock?.data?.selectors ?? "@a"}`.trim() || "@a";
            const targets = getPlayerspawnTargets(activeBlock, selector, getSelectorRuntimeOptions());
            if (targets.some(target => `${target?.id ?? ""}` === `${player?.id ?? ""}`)) {
                applySpawnPointForPlayer(player, spawnConfig.spawnCoords, spawnConfig.spawnDim);
            }
            return;
        }

        try {
            player.teleport(spawnConfig.spawnCoords, { dimension: spawnConfig.spawnDim });
        } catch { }
    });
});

// SECTION: Tool Interaction & UI Opening
const lastTrigger = new Map();

world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
    if (data.cancel) return;

    const heldTypeId = `${data?.itemStack?.typeId ?? ""}`.trim();
    if (
        heldTypeId === "brr:engine_locator"
        || heldTypeId === "brr:builder_destroy"
        || heldTypeId === "brr:builder_copy"
        || heldTypeId === "brr:builder_fill"
        || heldTypeId === "brr:builder_displace"
        || heldTypeId === "brr:builder_shape"
        || heldTypeId === "brr:builder_rotate"
    ) {
        return;
    }

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

    if (TOOL_BLOCK_TYPES.includes(block.typeId)) {
        if (!toolsEnabled) {
            return;
        }

        let blocks = getBlocksSnapshot();
        let blockEntry = blocks.find(b =>
            b.x === block.x && b.y === block.y && b.z === block.z && b.dimension === block.dimension.id
        );

        if (!blockEntry) {
            blockEntry = {
                x: block.x,
                y: block.y,
                z: block.z,
                typeId: block.typeId,
                dimension: block.dimension.id,
                data: { startDisabled: false }
            };
            blocks = getBlocksSnapshot(true);
            blocks.push(blockEntry);
            saveLargeJSON("blocks", blocks);
        }

        if (!isPlayerInCreative(data.player)) {
            data.player.sendMessage("§cOnly players in Creative mode can configure these blocks.");
            data.cancel = true;
            return;
        }

        const now = Date.now();
        const previous = lastTrigger.get(data.player.id) ?? 0;
        if (now - previous < TRIGGER_INTERACT_COOLDOWN_MS) return;
        lastTrigger.set(data.player.id, now);

        data.cancel = true;
        system.run(() => {
            openToolUIForBlock(data.player, blockEntry, {
                onSave: saveBlockEntry,
                getNamedTargets,
                getNamedTargetEntries,
                getBlocksTargetingCurrent,
                triggerOutputTypes: TRIGGER_OUTPUT_TYPES,
                triggerInputs: TRIGGER_INPUTS,
                allInputs: outputClassInfoTargets
            });
        });
    }
})