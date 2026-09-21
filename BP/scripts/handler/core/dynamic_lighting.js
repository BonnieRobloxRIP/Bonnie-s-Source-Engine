import { BlockPermutation, system, world } from "@minecraft/server";

const DYNAMIC_LIGHTS_ENABLED_PROPERTY = "brr_dynamic_lights_enabled";
const DYNAMIC_LIGHT_TICK_INTERVAL = 1;

const lightStateByPlayerId = new Map();
const pendingCleanupByAnchorKey = new Map();

let dynamicLightsEnabled = true;
let initialized = false;
let wasEnabledLastTick = true;

const ITEM_LIGHT_LEVELS = new Map([
    ["minecraft:torch", 14],
    ["minecraft:lantern", 15],
    ["minecraft:soul_torch", 10],
    ["minecraft:soul_lantern", 10],
    ["minecraft:redstone_torch", 7],
    ["minecraft:sea_lantern", 15],
    ["minecraft:glowstone", 15],
    ["minecraft:ochre_froglight", 15],
    ["minecraft:verdant_froglight", 15],
    ["minecraft:pearlescent_froglight", 15],
    ["minecraft:shroomlight", 15],
    ["minecraft:end_rod", 14],
    ["minecraft:respawn_anchor", 15],
    ["minecraft:magma", 3],
    ["minecraft:campfire", 15],
    ["minecraft:soul_campfire", 10],
    ["minecraft:jack_o_lantern", 15],
    ["minecraft:glow_lichen", 7],
    ["minecraft:light_block", 15],
    ["minecraft:light", 15],
    ["minecraft:redstone_lamp", 15],
    ["minecraft:copper_lantern", 15],
    ["minecraft:copper_torch", 14],
    ["minecraft:blue_torch", 14],
    ["minecraft:red_torch", 14],
    ["minecraft:green_torch", 14],
    ["minecraft:purple_torch", 14],
    ["minecraft:underwater_torch", 14]
]);

function parseBooleanLike(value, fallback) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "yes", "on", "enabled"].includes(normalized)) return true;
        if (["false", "0", "no", "off", "disabled"].includes(normalized)) return false;
    }
    return fallback;
}

function floorVector(vector) {
    return {
        x: Math.floor(Number(vector?.x) || 0),
        y: Math.floor(Number(vector?.y) || 0),
        z: Math.floor(Number(vector?.z) || 0)
    };
}

function normalizeDimensionId(rawDimensionId) {
    const normalized = `${rawDimensionId ?? "overworld"}`.trim().toLowerCase();
    if (normalized.startsWith("minecraft:")) {
        return normalized.split(":")[1] || "overworld";
    }
    return normalized || "overworld";
}

function getDimensionById(rawDimensionId) {
    const normalized = normalizeDimensionId(rawDimensionId);
    try {
        return world.getDimension(normalized);
    } catch {
        try {
            return world.getDimension(`minecraft:${normalized}`);
        } catch {
            return null;
        }
    }
}

function getItemLightLevel(itemTypeId) {
    const normalized = `${itemTypeId ?? ""}`.trim().toLowerCase();
    if (!normalized) return 0;

    const direct = ITEM_LIGHT_LEVELS.get(normalized);
    if (Number.isFinite(direct)) return direct;

    if (normalized === "minecraft:candle" || normalized.endsWith("_candle") || normalized.endsWith("_candle_cake")) {
        return 6;
    }

    if (normalized.endsWith("_froglight")) {
        return 15;
    }

    if (normalized.endsWith("_torch")) {
        if (normalized.includes("soul")) return 10;
        if (normalized.includes("redstone")) return 7;
        return 14;
    }

    if (normalized.endsWith("_lantern")) {
        if (normalized.includes("soul")) return 10;
        return 15;
    }

    return 0;
}

function getEquippedTypeId(player, slot) {
    const equippable = player?.getComponent("minecraft:equippable");
    return `${equippable?.getEquipment(slot)?.typeId ?? ""}`.trim().toLowerCase();
}

function getHeldLightItem(player) {
    const mainhandTypeId = getEquippedTypeId(player, "Mainhand");

    return {
        itemTypeId: mainhandTypeId,
        lightLevel: getItemLightLevel(mainhandTypeId)
    };
}

function ensurePlayerState(playerId) {
    let state = lightStateByPlayerId.get(playerId);
    if (state) return state;

    state = {
        active: false,
        lastDimensionId: "",
        lastAnchor: null,
        lastItemTypeId: "",
        lastLightLevel: 0
    };

    lightStateByPlayerId.set(playerId, state);
    return state;
}

function isLightBlockType(typeId) {
    const normalized = `${typeId ?? ""}`.trim().toLowerCase();
    return normalized === "minecraft:light_block"
        || normalized.startsWith("minecraft:light_block_")
        || normalized === "light_block"
        || normalized.startsWith("light_block_");
}

function anchorsEqual(a, b) {
    if (!a || !b) return false;
    return a.x === b.x && a.y === b.y && a.z === b.z;
}

function normalizeAnchor(anchor) {
    if (!anchor) return null;
    return {
        x: Math.floor(Number(anchor?.x) || 0),
        y: Math.floor(Number(anchor?.y) || 0),
        z: Math.floor(Number(anchor?.z) || 0)
    };
}

function getAnchorCleanupKey(dimensionId, anchor) {
    const normalizedAnchor = normalizeAnchor(anchor);
    if (!dimensionId || !normalizedAnchor) return "";

    return `${normalizeDimensionId(dimensionId)}|${normalizedAnchor.x}|${normalizedAnchor.y}|${normalizedAnchor.z}`;
}

function queuePendingLightCleanup(dimensionId, anchor) {
    const normalizedAnchor = normalizeAnchor(anchor);
    if (!dimensionId || !normalizedAnchor) return;

    const key = getAnchorCleanupKey(dimensionId, normalizedAnchor);
    if (!key) return;

    const existing = pendingCleanupByAnchorKey.get(key);
    pendingCleanupByAnchorKey.set(key, {
        dimensionId: normalizeDimensionId(dimensionId),
        anchor: normalizedAnchor,
        attempts: Number(existing?.attempts ?? 0)
    });
}

function clearPendingLightCleanup(dimensionId, anchor) {
    const key = getAnchorCleanupKey(dimensionId, anchor);
    if (!key) return;
    pendingCleanupByAnchorKey.delete(key);
}

function clearPlacedLightAt(dimensionId, anchor) {
    if (!dimensionId || !anchor) return true;

    const dimension = getDimensionById(dimensionId);
    if (!dimension) return false;

    const normalizedAnchor = normalizeAnchor(anchor);
    if (!normalizedAnchor) return true;

    let block;
    try {
        block = dimension.getBlock(normalizedAnchor);
    } catch {
        block = null;
    }

    if (!block) return false;

    if (!isLightBlockType(block.typeId)) {
        return true;
    }

    try {
        block.setPermutation(BlockPermutation.resolve("minecraft:air"));
        return true;
    } catch { }

    try {
        block.setType("minecraft:air");
        return true;
    } catch { }

    return false;
}

function processPendingLightCleanup() {
    if (pendingCleanupByAnchorKey.size <= 0) return;

    for (const [key, entry] of pendingCleanupByAnchorKey.entries()) {
        if (clearPlacedLightAt(entry?.dimensionId, entry?.anchor)) {
            pendingCleanupByAnchorKey.delete(key);
            continue;
        }

        entry.attempts = Number(entry?.attempts ?? 0) + 1;
    }
}

function placeLightAt(dimensionId, anchor, level) {
    if (!dimensionId || !anchor || level <= 0) return false;

    const dimension = getDimensionById(dimensionId);
    if (!dimension) return false;

    const normalizedAnchor = normalizeAnchor(anchor);
    if (!normalizedAnchor) return false;

    const pos = { x: normalizedAnchor.x, y: normalizedAnchor.y, z: normalizedAnchor.z };

    let block;
    try {
        block = dimension.getBlock(pos);
    } catch {
        block = null;
    }

    const currentTypeId = `${block?.typeId ?? ""}`.trim().toLowerCase();
    const canReplace = !currentTypeId
        || currentTypeId === "minecraft:air"
        || currentTypeId === "minecraft:cave_air"
        || currentTypeId === "minecraft:void_air"
        || isLightBlockType(currentTypeId);
    if (!canReplace || !block) return false;

    const clampedLevel = Math.max(0, Math.min(15, Math.floor(level)));

    try {
        const permutation = BlockPermutation.resolve("minecraft:light_block", { block_light_level: clampedLevel });
        block.setPermutation(permutation);
        return true;
    } catch { }

    try {
        block.setType("minecraft:light_block");
        return true;
    } catch { }

    try {
        block.setType("minecraft:light");
        return true;
    } catch { }

    return false;
}

function buildAnchor(basePosition) {
    return {
        x: basePosition.x,
        y: basePosition.y + 1,
        z: basePosition.z
    };
}

function clearStateLight(state) {
    if (!state?.active || !state?.lastDimensionId || !state?.lastAnchor) return;
    if (clearPlacedLightAt(state.lastDimensionId, state.lastAnchor)) {
        clearPendingLightCleanup(state.lastDimensionId, state.lastAnchor);
        return;
    }

    queuePendingLightCleanup(state.lastDimensionId, state.lastAnchor);
}

function clearAllPlayerLights(playerId) {
    const state = lightStateByPlayerId.get(playerId);
    if (!state) return;

    clearStateLight(state);

    state.active = false;
    state.lastDimensionId = "";
    state.lastAnchor = null;
    state.lastItemTypeId = "";
    state.lastLightLevel = 0;
}

function cleanupAndForgetPlayer(playerId) {
    clearAllPlayerLights(playerId);
    lightStateByPlayerId.delete(playerId);
}

function cleanupAllDynamicLights() {
    for (const playerId of lightStateByPlayerId.keys()) {
        clearAllPlayerLights(playerId);
    }

    processPendingLightCleanup();
}

function updatePlayerDynamicLights(player) {
    const playerId = `${player?.id ?? ""}`.trim();
    if (!playerId) return;

    const state = ensurePlayerState(playerId);
    const held = getHeldLightItem(player);

    if (held.lightLevel <= 0) {
        clearAllPlayerLights(playerId);
        return;
    }

    const currentDimensionId = `${player?.dimension?.id ?? ""}`.trim();
    if (!currentDimensionId) {
        clearAllPlayerLights(playerId);
        return;
    }

    const normalizedDimensionId = normalizeDimensionId(currentDimensionId);

    const flooredPosition = floorVector(player.location);
    const anchor = buildAnchor(flooredPosition);
    const sameAnchor = anchorsEqual(state.lastAnchor, anchor);
    const sameLevel = state.lastLightLevel === held.lightLevel;
    const sameDimension = state.lastDimensionId === normalizedDimensionId;

    if (state.active && state.lastDimensionId && state.lastAnchor && !sameDimension) {
        if (clearPlacedLightAt(state.lastDimensionId, state.lastAnchor)) {
            clearPendingLightCleanup(state.lastDimensionId, state.lastAnchor);
        } else {
            queuePendingLightCleanup(state.lastDimensionId, state.lastAnchor);
        }
    }

    if (state.active && sameDimension && sameAnchor && sameLevel) {
        return;
    }

    if (state.active && sameDimension && !sameAnchor) {
        if (clearPlacedLightAt(state.lastDimensionId, state.lastAnchor)) {
            clearPendingLightCleanup(state.lastDimensionId, state.lastAnchor);
        } else {
            queuePendingLightCleanup(state.lastDimensionId, state.lastAnchor);
        }
    }

    const placed = placeLightAt(normalizedDimensionId, anchor, held.lightLevel);
    if (!placed) {
        state.active = false;
        state.lastDimensionId = "";
        state.lastAnchor = null;
        state.lastItemTypeId = held.itemTypeId;
        state.lastLightLevel = 0;
        return;
    }

    clearPendingLightCleanup(normalizedDimensionId, anchor);

    state.active = true;
    state.lastDimensionId = normalizedDimensionId;
    state.lastAnchor = anchor;
    state.lastItemTypeId = held.itemTypeId;
    state.lastLightLevel = held.lightLevel;
}

function runDynamicLightingTick() {
    processPendingLightCleanup();

    if (!dynamicLightsEnabled) {
        if (wasEnabledLastTick) {
            cleanupAllDynamicLights();
        }
        wasEnabledLastTick = false;
        return;
    }

    wasEnabledLastTick = true;

    const activePlayerIds = new Set();
    for (const player of world.getPlayers()) {
        const playerId = `${player?.id ?? ""}`.trim();
        if (!playerId) continue;

        activePlayerIds.add(playerId);
        updatePlayerDynamicLights(player);
    }

    for (const playerId of Array.from(lightStateByPlayerId.keys())) {
        if (!activePlayerIds.has(playerId)) {
            cleanupAndForgetPlayer(playerId);
        }
    }

    processPendingLightCleanup();
}

function subscribePlayerLeaveCleanup(playerLeaveSignal) {
    if (!playerLeaveSignal) return;

    try {
        playerLeaveSignal.subscribe((eventData) => {
            const playerId = `${eventData?.playerId ?? eventData?.player?.id ?? ""}`.trim();
            if (!playerId) return;
            cleanupAndForgetPlayer(playerId);
        });
    } catch { }
}

function subscribeCleanupEvents() {
    subscribePlayerLeaveCleanup(world.beforeEvents?.playerLeave);
    subscribePlayerLeaveCleanup(world.afterEvents?.playerLeave);

    const entityDieSignal = world.afterEvents?.entityDie;
    if (entityDieSignal) {
        try {
            entityDieSignal.subscribe((eventData) => {
                const dead = eventData?.deadEntity;
                if (!dead || `${dead?.typeId ?? ""}` !== "minecraft:player") return;

                const playerId = `${dead?.id ?? ""}`.trim();
                if (!playerId) return;
                cleanupAndForgetPlayer(playerId);
            });
        } catch { }
    }

    const playerSpawnSignal = world.afterEvents?.playerSpawn;
    if (playerSpawnSignal) {
        try {
            playerSpawnSignal.subscribe((eventData) => {
                const playerId = `${eventData?.player?.id ?? ""}`.trim();
                if (!playerId) return;

                const state = lightStateByPlayerId.get(playerId);
                if (!state) return;

                clearAllPlayerLights(playerId);
            });
        } catch { }
    }
}

function loadPersistedState() {
    try {
        dynamicLightsEnabled = parseBooleanLike(world.getDynamicProperty(DYNAMIC_LIGHTS_ENABLED_PROPERTY), true);
    } catch {
        dynamicLightsEnabled = true;
    }

    wasEnabledLastTick = dynamicLightsEnabled;
}

export function initializeDynamicLightingSystem() {
    if (initialized) return;
    initialized = true;

    loadPersistedState();
    subscribeCleanupEvents();

    system.runInterval(() => {
        runDynamicLightingTick();
    }, DYNAMIC_LIGHT_TICK_INTERVAL);
}

export function setDynamicLightsEnabled(nextValue) {
    dynamicLightsEnabled = !!nextValue;

    try {
        world.setDynamicProperty(DYNAMIC_LIGHTS_ENABLED_PROPERTY, dynamicLightsEnabled);
    } catch { }

    if (!dynamicLightsEnabled) {
        cleanupAllDynamicLights();
    }

    wasEnabledLastTick = dynamicLightsEnabled;
    return dynamicLightsEnabled;
}

export function getDynamicLightsEnabled() {
    return dynamicLightsEnabled;
}

export function getDynamicLightsStatus() {
    let placementCount = 0;
    for (const state of lightStateByPlayerId.values()) {
        if (state.active) {
            placementCount += 1;
        }
    }

    return {
        enabled: dynamicLightsEnabled,
        trackedPlayers: lightStateByPlayerId.size,
        ownedPlacements: placementCount
    };
}