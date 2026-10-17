import { system, world } from "@minecraft/server";
import { getEntitiesOfClass, getEntityAt, getRegistryRevision } from "../registry.js";
import { entityOrigin, getPlayerGameModeName, selectorMatchesEntity } from "../selectors.js";
import {
    forEachCellNear,
    getEngineSettings,
    getProbeOffsets,
    isNearCell,
    isPlayerOperator,
    safeGetDimension
} from "../runtime.js";

// SECTION: Clip Brushes
// Bedrock has no per-entity collision, so playerclip and npcclip brushes are invisible and
// passable, and push back whoever they should block: back to the last position where that
// entity was not touching a clip, or away from the clip if there is none.

const PLAYERCLIP = "brr:tool_playerclip";
const NPCCLIP = "brr:tool_npcclip";
const PASS_INTERVAL_TICKS = 2;
const CLIP_EXPAND = 0.45;
const PLAYERCLIP_COOLDOWN_TICKS = 2;
const NPCCLIP_COOLDOWN_TICKS = 3;
const NPCCLIP_TRACK_RADIUS = 4;
const NPCCLIP_CELL_SIZE = 16;

// SECTION: Playerclip
const playerSafePositions = new Map();
const playerPushTicks = new Map();

function isExcludedFromPlayerclip(player, clip) {
    const data = clip.data ?? {};
    if (data.excludeOperators !== false && isPlayerOperator(player)) return true;

    const excludedMode = `${data.excludeGamemode ?? ""}`.trim().toLowerCase();
    if (excludedMode && excludedMode !== "none" && getPlayerGameModeName(player) === excludedMode) return true;

    const selector = `${data.excludeSelector ?? ""}`.trim();
    return Boolean(selector) && selectorMatchesEntity(selector, player, entityOrigin(clip));
}

function findBlockingClip(entity, location, dimensionId, clipType, isExcluded) {
    const offsets = getProbeOffsets(entity);
    const exclusionByClip = new Map();
    let blocking = null;

    forEachCellNear(location, offsets, CLIP_EXPAND, (x, y, z) => {
        const clip = getEntityAt(dimensionId, x, y, z);
        if (!clip || clip.typeId !== clipType || clip.disabled) return false;
        if (!isNearCell(location, offsets, { x, y, z }, CLIP_EXPAND)) return false;

        if (!exclusionByClip.has(clip)) exclusionByClip.set(clip, isExcluded(entity, clip));
        if (exclusionByClip.get(clip)) return false;

        blocking = { clip, cell: { x, y, z } };
        return true;
    });

    return blocking;
}

function pushBack(entity, location, dimension, safePosition, cell) {
    if (safePosition && safePosition.dimension === dimension.id) {
        try {
            entity.teleport({ x: safePosition.x, y: safePosition.y, z: safePosition.z }, { dimension });
            return;
        } catch { }
    }

    let dirX = location.x - (cell.x + 0.5);
    let dirZ = location.z - (cell.z + 0.5);
    const magnitude = Math.sqrt(dirX * dirX + dirZ * dirZ);
    if (magnitude > 0.001) {
        dirX /= magnitude;
        dirZ /= magnitude;
    } else {
        dirX = 0;
        dirZ = -1;
    }

    try {
        entity.applyKnockback({ x: dirX * 1.15, z: dirZ * 1.15 }, 0.1);
    } catch {
        try {
            entity.teleport({ x: location.x + dirX * 0.6, y: location.y, z: location.z + dirZ * 0.6 }, { dimension });
        } catch { }
    }
}

function runPlayerclipPass(players) {
    const now = system.currentTick;
    const onlineIds = new Set();

    for (const player of players) {
        onlineIds.add(player.id);
        let location;
        let dimension;
        try {
            location = player.location;
            dimension = player.dimension;
        } catch {
            continue;
        }

        const blocking = findBlockingClip(player, location, dimension.id, PLAYERCLIP, isExcludedFromPlayerclip);
        if (!blocking) {
            playerSafePositions.set(player.id, { x: location.x, y: location.y, z: location.z, dimension: dimension.id });
            continue;
        }

        if (now - (playerPushTicks.get(player.id) ?? -Infinity) < PLAYERCLIP_COOLDOWN_TICKS) continue;
        playerPushTicks.set(player.id, now);
        pushBack(player, location, dimension, playerSafePositions.get(player.id), blocking.cell);
    }

    for (const id of playerSafePositions.keys()) if (!onlineIds.has(id)) playerSafePositions.delete(id);
    for (const id of playerPushTicks.keys()) if (!onlineIds.has(id)) playerPushTicks.delete(id);
}

// SECTION: Npcclip
// Active npcclip cells are grouped into 16-block query regions per dimension, rebuilt only when
// the registry changes. Each region is queried once, so cost scales with nearby mobs, not clips.
const mobSafePositions = new Map();
const mobPushTicks = new Map();
let npcclipRegions = [];
let npcclipRegionsRevision = -1;

function getNpcclipRegions() {
    const revision = getRegistryRevision();
    if (revision === npcclipRegionsRevision) return npcclipRegions;

    const regions = new Map();
    for (const clip of getEntitiesOfClass(NPCCLIP)) {
        for (const cell of clip.cells) {
            const key = `${clip.dimension}|${Math.floor(cell.x / NPCCLIP_CELL_SIZE)}|${Math.floor(cell.y / NPCCLIP_CELL_SIZE)}|${Math.floor(cell.z / NPCCLIP_CELL_SIZE)}`;
            const region = regions.get(key);
            if (!region) {
                regions.set(key, {
                    dimension: clip.dimension,
                    minX: cell.x, minY: cell.y, minZ: cell.z,
                    maxX: cell.x, maxY: cell.y, maxZ: cell.z
                });
                continue;
            }
            region.minX = Math.min(region.minX, cell.x);
            region.minY = Math.min(region.minY, cell.y);
            region.minZ = Math.min(region.minZ, cell.z);
            region.maxX = Math.max(region.maxX, cell.x);
            region.maxY = Math.max(region.maxY, cell.y);
            region.maxZ = Math.max(region.maxZ, cell.z);
        }
    }

    npcclipRegions = [...regions.values()];
    npcclipRegionsRevision = revision;
    return npcclipRegions;
}

function isExcludedFromNpcclip(mob, clip) {
    const selector = `${clip.data?.excludeSelector ?? ""}`.trim();
    return Boolean(selector) && selectorMatchesEntity(selector, mob, entityOrigin(clip));
}

function runNpcclipPass() {
    const regions = getNpcclipRegions();
    if (regions.length === 0) {
        mobSafePositions.clear();
        mobPushTicks.clear();
        return;
    }

    const now = system.currentTick;
    const seen = new Set();

    for (const region of regions) {
        const dimension = safeGetDimension(region.dimension);
        if (!dimension) continue;

        let mobs;
        try {
            mobs = dimension.getEntities({
                location: {
                    x: region.minX - NPCCLIP_TRACK_RADIUS,
                    y: region.minY - NPCCLIP_TRACK_RADIUS,
                    z: region.minZ - NPCCLIP_TRACK_RADIUS
                },
                volume: {
                    x: region.maxX - region.minX + 1 + NPCCLIP_TRACK_RADIUS * 2,
                    y: region.maxY - region.minY + 1 + NPCCLIP_TRACK_RADIUS * 2,
                    z: region.maxZ - region.minZ + 1 + NPCCLIP_TRACK_RADIUS * 2
                },
                excludeTypes: ["minecraft:player"]
            });
        } catch {
            continue;
        }

        for (const mob of mobs) {
            if (seen.has(mob.id)) continue;
            seen.add(mob.id);

            let location;
            try {
                location = mob.location;
            } catch {
                continue;
            }

            const blocking = findBlockingClip(mob, location, region.dimension, NPCCLIP, isExcludedFromNpcclip);
            if (!blocking) {
                mobSafePositions.set(mob.id, { x: location.x, y: location.y, z: location.z, dimension: region.dimension });
                continue;
            }

            if (now - (mobPushTicks.get(mob.id) ?? -Infinity) < NPCCLIP_COOLDOWN_TICKS) continue;
            mobPushTicks.set(mob.id, now);
            const safe = mobSafePositions.get(mob.id);
            if (safe && safe.dimension === region.dimension) {
                try {
                    mob.teleport({ x: safe.x, y: safe.y, z: safe.z }, { dimension });
                } catch { }
            }
        }
    }

    for (const id of mobSafePositions.keys()) if (!seen.has(id)) mobSafePositions.delete(id);
    for (const id of mobPushTicks.keys()) if (!seen.has(id)) mobPushTicks.delete(id);
}

// SECTION: Clip Pass
function runClipPass() {
    if (!getEngineSettings().toolsEnabled) {
        playerSafePositions.clear();
        mobSafePositions.clear();
        return;
    }

    if (getEntitiesOfClass(PLAYERCLIP).size > 0) runPlayerclipPass(world.getPlayers());
    runNpcclipPass();
}

export function startClipSystem() {
    system.runInterval(runClipPass, PASS_INTERVAL_TICKS);
}
