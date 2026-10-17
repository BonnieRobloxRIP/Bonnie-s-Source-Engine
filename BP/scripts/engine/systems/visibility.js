import { system, world, BlockVolume } from "@minecraft/server";
import { PLACEHOLDER_BLOCK_TYPES, getClassParticle, getEntityClassIds } from "../classes.js";
import {
    getAllEntities,
    getEntitiesOfClass,
    getEntityById,
    getRegistryRevision,
    posKey,
    removeCellAt
} from "../registry.js";
import { cellsToBoxes } from "../storage.js";
import { selectorMatchesEntity, entityOrigin } from "../selectors.js";
import { syncEntityBlockState } from "./logic.js";
import {
    getEngineSettings,
    getHeldEntityClass,
    getProbeOffsets,
    isNearCell,
    safeGetDimension
} from "../runtime.js";

// SECTION: Editor Visibility
// Engine blocks are only visible while a player holds that tool (or "always visible" is on).
// Otherwise each block is swapped for an invisible placeholder that keeps the behaviour it needs:
// collision for tool_invisible, light for tool_blocklight, nothing for everything else.
//
// Swaps are decided per entity: a brush is re-applied (box by box with fillBlocks) only when its
// desired look changes, instead of checking every block of the map on a timer. A small budgeted
// sweep walks all cells in the background to repair blocks changed by commands or structures and
// to drop cells whose block was replaced ("ghosts").

const HIDDEN = "brr:data";
const COLLISION = "brr:data_collision";
const LIGHT = "brr:data_blocklight";
const NPCCLIP = "brr:tool_npcclip";

const PASS_INTERVAL_TICKS = 10;
const SWEEP_CELLS_PER_PASS = 96;
const MAX_FILL_VOLUME = 32768;
const NPCCLIP_PLAYER_CLEARANCE = 0.6;
const NPCCLIP_MOB_EXPAND = 0.45;
// Entities in unloaded chunks are retried after this many ticks instead of every pass.
const UNLOADED_RETRY_TICKS = 40;

const PARTICLE_INTERVAL_TICKS = 4;
const PARTICLE_RADIUS = 48;
const MAX_PARTICLES_PER_PLAYER = 160;

// entity id -> { type, count }: the block type last applied to all of its cells, and its cell count then.
// Compared field by field so the pass allocates nothing for entities that did not change.
const appliedById = new Map();
// Applied "type" of a hidden npcclip whose cells are all known to be non-solid.
const NPC_ALL_HIDDEN = "npc:hidden";

function isApplied(entity, type) {
    const applied = appliedById.get(entity.id);
    return applied !== undefined && applied.type === type && applied.count === entity.cells.length;
}

function markApplied(entity, type) {
    appliedById.set(entity.id, { type, count: entity.cells.length });
}
// npcclip cell posKey -> placeholder currently applied.
const npcclipCellTypes = new Map();
// entity id -> tick before which an entity that hit unloaded chunks is not retried.
const retryAtById = new Map();

// SECTION: Desired Appearance
function getActiveClasses(players) {
    const active = new Set();
    for (const player of players) {
        const held = getHeldEntityClass(player);
        if (held) active.add(held);
    }
    return active;
}

function isShown(entity, settings, activeClasses) {
    return settings.alwaysVisible || activeClasses.has(entity.typeId);
}

// The placeholder used for every cell of a hidden entity; npcclips decide per cell instead.
function getHiddenType(entity, settings) {
    switch (entity.typeId) {
        case "brr:tool_invisible":
            return settings.toolsEnabled && !entity.disabled ? COLLISION : HIDDEN;
        case "brr:tool_blocklight":
            return LIGHT;
        default:
            return HIDDEN;
    }
}

function usesPerCellNpcclip(entity, settings, activeClasses) {
    return entity.typeId === NPCCLIP
        && !isShown(entity, settings, activeClasses)
        && settings.toolsEnabled
        && !entity.disabled;
}

// SECTION: Block Writes
// Returns false when the cell could not be read (unloaded chunk), so the caller retries later.
function setCellType(dimension, cell, ownerType, desired) {
    let block;
    try {
        block = dimension.getBlock(cell);
    } catch {
        return false;
    }
    if (!block) return false;

    const current = block.typeId;
    if (current === desired) return true;
    // Replaced by something else: leave it alone; the sweep removes the ghost cell.
    if (current !== ownerType && !PLACEHOLDER_BLOCK_TYPES.has(current)) return true;

    try {
        dimension.setBlockType(cell, desired);
    } catch {
        try {
            dimension.setBlockType(cell, HIDDEN);
        } catch { }
    }
    return true;
}

function isLoaded(dimension, location) {
    try {
        return Boolean(dimension.getBlock(location));
    } catch {
        return false;
    }
}

function applyUniformType(entity, desired) {
    const dimension = safeGetDimension(entity.dimension);
    if (!dimension) return false;

    const shown = desired === entity.typeId;
    // Never overwrite something built over a cell. When showing, only placeholders are replaced:
    // rewriting the real block over itself would reset its block states.
    const allowedTypes = shown ? [HIDDEN, COLLISION, LIGHT] : [entity.typeId, HIDDEN, COLLISION, LIGHT];
    let complete = true;

    for (const [x1, y1, z1, x2, y2, z2] of cellsToBoxes(entity.cells)) {
        const volume = (x2 - x1 + 1) * (y2 - y1 + 1) * (z2 - z1 + 1);
        if (volume <= MAX_FILL_VOLUME) {
            try {
                dimension.fillBlocks(
                    new BlockVolume({ x: x1, y: y1, z: z1 }, { x: x2, y: y2, z: z2 }),
                    desired,
                    { blockFilter: { includeTypes: allowedTypes } }
                );
                continue;
            } catch {
                // Unloaded chunk or unsupported filter: fall back to per-cell writes below.
            }
        }

        // Nothing in an unloaded box can be written; the caller retries the entity later.
        if (!isLoaded(dimension, { x: x1, y: y1, z: z1 })) {
            complete = false;
            continue;
        }

        boxLoop: for (let y = y1; y <= y2; y++) {
            for (let z = z1; z <= z2; z++) {
                for (let x = x1; x <= x2; x++) {
                    if (!setCellType(dimension, { x, y, z }, entity.typeId, desired)) {
                        complete = false;
                        break boxLoop;
                    }
                }
            }
        }
    }

    if (complete && shown) syncEntityBlockState(entity);
    return complete;
}

// SECTION: Npcclip Collision
// A hidden npcclip cell turns solid while a walking mob is next to it and no player is, so it
// blocks mobs without blocking players. One query per npcclip brush covers all of its cells.
function canEntityWalk(entity) {
    try {
        return Boolean(entity.getComponent("minecraft:movement"));
    } catch {
        return false;
    }
}

// Location and probe offsets are read once per mob / player, not once per cell.
function readProbes(entities) {
    const probes = [];
    for (const entity of entities) {
        try {
            probes.push({ location: entity.location, offsets: getProbeOffsets(entity) });
        } catch { }
    }
    return probes;
}

function nearAnyProbe(probes, cell, expand) {
    for (const probe of probes) {
        if (isNearCell(probe.location, probe.offsets, cell, expand)) return true;
    }
    return false;
}

// Returns false when some cell could not be written (unloaded chunk).
function updateNpcclipCells(entity) {
    const dimension = safeGetDimension(entity.dimension);
    if (!dimension) return false;

    const { minX, minY, minZ, maxX, maxY, maxZ } = entity.bounds;
    const query = {
        location: { x: minX - 2, y: minY - 2, z: minZ - 2 },
        volume: { x: maxX - minX + 5, y: maxY - minY + 5, z: maxZ - minZ + 5 }
    };

    let mobs = [];
    let players = [];
    try {
        const excludeSelector = `${entity.data?.excludeSelector ?? ""}`.trim();
        const origin = entityOrigin(entity);
        mobs = dimension.getEntities({ ...query, excludeTypes: ["minecraft:player"] })
            .filter(mob => canEntityWalk(mob)
                && !(excludeSelector && selectorMatchesEntity(excludeSelector, mob, origin)));
        if (mobs.length > 0) players = dimension.getPlayers(query);
    } catch {
        return false;
    }

    if (mobs.length === 0 && isApplied(entity, NPC_ALL_HIDDEN)) return true;

    const mobProbes = readProbes(mobs);
    const playerProbes = readProbes(players);
    let anySolid = false;
    let complete = true;
    for (const cell of entity.cells) {
        const solid = nearAnyProbe(mobProbes, cell, NPCCLIP_MOB_EXPAND)
            && !nearAnyProbe(playerProbes, cell, NPCCLIP_PLAYER_CLEARANCE);
        const desired = solid ? COLLISION : HIDDEN;
        if (solid) anySolid = true;

        const key = posKey(entity.dimension, cell.x, cell.y, cell.z);
        if (npcclipCellTypes.get(key) === desired) continue;
        if (!setCellType(dimension, cell, entity.typeId, desired)) {
            complete = false;
            break;
        }
        npcclipCellTypes.set(key, desired);
    }

    if (!anySolid && complete) markApplied(entity, NPC_ALL_HIDDEN);
    else appliedById.delete(entity.id);
    return complete;
}

// SECTION: Background Sweep
let sweepList = [];
let sweepRevision = -1;
let sweepCursor = 0;

function getSweepList() {
    const revision = getRegistryRevision();
    if (revision !== sweepRevision) {
        sweepList = [];
        for (const entity of getAllEntities()) {
            for (const cell of entity.cells) sweepList.push({ entityId: entity.id, cell });
        }
        sweepRevision = revision;
        if (sweepCursor >= sweepList.length) sweepCursor = 0;
    }
    return sweepList;
}

function desiredCellType(entity, cell, settings, activeClasses) {
    if (isShown(entity, settings, activeClasses)) return entity.typeId;
    if (usesPerCellNpcclip(entity, settings, activeClasses)) {
        return npcclipCellTypes.get(posKey(entity.dimension, cell.x, cell.y, cell.z)) ?? HIDDEN;
    }
    return getHiddenType(entity, settings);
}

function sweepCells(settings, activeClasses) {
    const list = getSweepList();
    const budget = Math.min(SWEEP_CELLS_PER_PASS, list.length);
    const ghosts = [];

    for (let i = 0; i < budget; i++) {
        if (sweepCursor >= list.length) sweepCursor = 0;
        const { entityId, cell } = list[sweepCursor++];
        const entity = getEntityById(entityId);
        if (!entity) continue;

        const dimension = safeGetDimension(entity.dimension);
        let block;
        try {
            block = dimension?.getBlock(cell);
        } catch {
            continue;
        }
        if (!block) continue;

        const current = block.typeId;
        if (current !== entity.typeId && !PLACEHOLDER_BLOCK_TYPES.has(current)) {
            ghosts.push(entity, cell);
            continue;
        }

        const desired = desiredCellType(entity, cell, settings, activeClasses);
        if (current !== desired) {
            try {
                dimension.setBlockType(cell, desired);
                if (desired === entity.typeId) syncEntityBlockState(entity);
            } catch { }
        }
    }

    for (let i = 0; i < ghosts.length; i += 2) {
        const entity = ghosts[i];
        const cell = ghosts[i + 1];
        removeCellAt(entity.dimension, cell.x, cell.y, cell.z);
        npcclipCellTypes.delete(posKey(entity.dimension, cell.x, cell.y, cell.z));
    }
}

// SECTION: Visibility Pass
let prunedAtRevision = -1;

function pruneAppliedState() {
    const revision = getRegistryRevision();
    if (revision === prunedAtRevision) return;
    prunedAtRevision = revision;
    for (const id of appliedById.keys()) {
        if (!getEntityById(id)) appliedById.delete(id);
    }
    for (const id of retryAtById.keys()) {
        if (!getEntityById(id)) retryAtById.delete(id);
    }
}

function noteApplyResult(entity, complete, now) {
    if (complete) retryAtById.delete(entity.id);
    else retryAtById.set(entity.id, now + UNLOADED_RETRY_TICKS);
}

function runVisibilityPass() {
    const players = world.getPlayers();
    if (players.length === 0) return;

    const settings = getEngineSettings();
    const activeClasses = getActiveClasses(players);
    pruneAppliedState();
    const now = system.currentTick;

    for (const entity of getAllEntities()) {
        if ((retryAtById.get(entity.id) ?? -Infinity) > now) continue;

        if (usesPerCellNpcclip(entity, settings, activeClasses)) {
            const wasUniform = appliedById.get(entity.id);
            if (wasUniform && wasUniform.type !== NPC_ALL_HIDDEN) {
                // Switching back from shown/disabled: per-cell state is unknown, so rewrite it.
                for (const cell of entity.cells) npcclipCellTypes.delete(posKey(entity.dimension, cell.x, cell.y, cell.z));
                appliedById.delete(entity.id);
            }
            noteApplyResult(entity, updateNpcclipCells(entity), now);
            continue;
        }

        const desired = isShown(entity, settings, activeClasses) ? entity.typeId : getHiddenType(entity, settings);
        if (isApplied(entity, desired)) continue;

        if (entity.typeId === NPCCLIP) {
            for (const cell of entity.cells) npcclipCellTypes.delete(posKey(entity.dimension, cell.x, cell.y, cell.z));
        }

        const complete = applyUniformType(entity, desired);
        if (complete) markApplied(entity, desired);
        else appliedById.delete(entity.id);
        noteApplyResult(entity, complete, now);
    }

    sweepCells(settings, activeClasses);
}

// SECTION: Editor Particles
// Point entities show their icon particle to players holding that entity's item, like Hammer's
// editor-only sprites. Only entities near the player are drawn.
const POINT_PARTICLE_CLASSES = getEntityClassIds().filter(typeId => getClassParticle(typeId));

function runParticlePass() {
    const settings = getEngineSettings();
    const radiusSquared = PARTICLE_RADIUS * PARTICLE_RADIUS;

    for (const player of world.getPlayers()) {
        const held = getHeldEntityClass(player);
        const classes = settings.alwaysVisible
            ? POINT_PARTICLE_CLASSES
            : (getClassParticle(held) ? [held] : []);
        if (classes.length === 0) continue;

        let location;
        let dimensionId;
        try {
            location = player.location;
            dimensionId = player.dimension.id;
        } catch {
            continue;
        }

        let spawned = 0;
        classLoop: for (const typeId of classes) {
            const particle = getClassParticle(typeId);
            for (const entity of getEntitiesOfClass(typeId)) {
                if (spawned >= MAX_PARTICLES_PER_PLAYER) break classLoop;
                if (entity.dimension !== dimensionId) continue;
                const dx = entity.center.x - location.x;
                const dy = entity.center.y - location.y;
                const dz = entity.center.z - location.z;
                if (dx * dx + dy * dy + dz * dz > radiusSquared) continue;
                try {
                    player.spawnParticle(particle, entity.center);
                    spawned++;
                } catch { }
            }
        }
    }
}

export function startVisibilitySystem() {
    system.runInterval(runVisibilityPass, PASS_INTERVAL_TICKS);
    system.runInterval(runParticlePass, PARTICLE_INTERVAL_TICKS);
}

// Forces the next pass to re-apply every entity (after settings change).
export function invalidateVisibility() {
    appliedById.clear();
    npcclipCellTypes.clear();
    retryAtById.clear();
}

// Called when a cell is placed or broken, so no cached npcclip state outlives its block.
export function forgetCellAppearance(dimension, x, y, z) {
    npcclipCellTypes.delete(posKey(dimension, x, y, z));
}
