import * as mc from "@minecraft/server";
import { getMainhandTypeId as getCachedMainhandTypeId } from "../handler/core/held_item.js";

// SECTION: Engine Settings
// Toggled by /brr commands; main.js loads and persists them.
const settings = { alwaysVisible: false, toolsEnabled: true };

export function getEngineSettings() {
    return settings;
}

export function setAlwaysVisible(value) {
    settings.alwaysVisible = Boolean(value);
}

export function setToolsEnabled(value) {
    settings.toolsEnabled = Boolean(value);
}

// SECTION: Held Items
// Logic/info entities are placed from an item whose id differs from the block's.
export const ITEM_TO_ENTITY_CLASS = {
    "brr:info_playerspawn": "brr:info_playerspawn_block",
    "brr:info_target_areaportal": "brr:info_target_areaportal_block",
    "brr:game_nametag": "brr:game_nametag_block",
    "brr:ambient_generic": "brr:ambient_generic_block",
    "brr:filter_class": "brr:filter_class_block",
    "brr:filter_name": "brr:filter_name_block",
    "brr:filter_multiple": "brr:filter_multiple_block",
    "brr:math_counter": "brr:math_counter_block",
    "brr:logic_auto": "brr:logic_auto_block",
    "brr:logic_branch": "brr:logic_branch_block",
    "brr:logic_case": "brr:logic_case_block",
    "brr:logic_compare": "brr:logic_compare_block",
    "brr:logic_coop_manager": "brr:logic_coop_manager_block",
    "brr:logic_random_outputs": "brr:logic_random_outputs_block",
    "brr:logic_relay": "brr:logic_relay_block",
    "brr:logic_timer": "brr:logic_timer_block"
};

export const ENTITY_CLASS_TO_ITEM = Object.fromEntries(
    Object.entries(ITEM_TO_ENTITY_CLASS).map(([itemTypeId, classId]) => [classId, itemTypeId])
);

export function getMainhandTypeId(player) {
    return getCachedMainhandTypeId(player);
}

// The entity class a held item shows (tool block items are the block itself).
export function getHeldEntityClass(player) {
    const held = getMainhandTypeId(player);
    return ITEM_TO_ENTITY_CLASS[held] ?? held;
}

// SECTION: Player Helpers
export function isPlayerOperator(player) {
    try {
        if (mc.PlayerPermissionLevel && player.playerPermissionLevel !== undefined) {
            return player.playerPermissionLevel === mc.PlayerPermissionLevel.Operator;
        }
    } catch { }
    try {
        return Number(player.commandPermissionLevel) >= Number(mc.CommandPermissionLevel.GameDirectors);
    } catch {
        return false;
    }
}

export function isPlayerCreative(player) {
    try {
        return `${player.getGameMode()}`.toLowerCase() === "creative";
    } catch {
        return false;
    }
}

// SECTION: Hitbox Geometry
// Players are probed at feet, waist and head height; other entities at their feet.
const PLAYER_PROBE_OFFSETS = [0, 0.9, 1.5];
const ENTITY_PROBE_OFFSETS = [0];

export function getProbeOffsets(entity) {
    return entity?.typeId === "minecraft:player" ? PLAYER_PROBE_OFFSETS : ENTITY_PROBE_OFFSETS;
}

export function isNearCell(location, offsets, cell, expand) {
    if (location.x < cell.x - expand || location.x > cell.x + 1 + expand) return false;
    if (location.z < cell.z - expand || location.z > cell.z + 1 + expand) return false;
    for (const offset of offsets) {
        const y = location.y + offset;
        if (y >= cell.y - expand && y <= cell.y + 1 + expand) return true;
    }
    return false;
}

// Calls visit(x, y, z) for every block cell that could be within `expand` of the entity's probes.
export function forEachCellNear(location, offsets, expand, visit) {
    const minX = Math.floor(location.x - 1 - expand);
    const maxX = Math.floor(location.x + expand);
    const minZ = Math.floor(location.z - 1 - expand);
    const maxZ = Math.floor(location.z + expand);
    const minY = Math.floor(location.y + offsets[0] - 1 - expand);
    const maxY = Math.floor(location.y + offsets[offsets.length - 1] + expand);

    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            for (let z = minZ; z <= maxZ; z++) {
                if (visit(x, y, z) === true) return;
            }
        }
    }
}

// Dimension objects stay valid for the whole session, so each one is looked up once.
const dimensionCache = new Map();

export function safeGetDimension(dimensionId) {
    let dimension = dimensionCache.get(dimensionId);
    if (dimension) return dimension;
    try {
        dimension = mc.world.getDimension(dimensionId);
    } catch {
        return undefined;
    }
    if (dimension) dimensionCache.set(dimensionId, dimension);
    return dimension;
}

// Engine passes ask for a dimension's players once per entity they check; the list is fetched once
// per dimension per tick and shared. Callers must treat the returned array as read-only.
let playersTick = -1;
const playersByDimension = new Map();

export function getDimensionPlayers(dimensionId) {
    const tick = mc.system.currentTick;
    if (tick !== playersTick) {
        playersTick = tick;
        playersByDimension.clear();
    }

    let players = playersByDimension.get(dimensionId);
    if (players) return players;
    try {
        players = safeGetDimension(dimensionId)?.getPlayers() ?? [];
    } catch {
        players = [];
    }
    playersByDimension.set(dimensionId, players);
    return players;
}
