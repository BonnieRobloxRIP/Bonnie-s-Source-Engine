import { world, system, CommandPermissionLevel, GameMode, PlayerPermissionLevel } from "@minecraft/server";

// SECTION: Anti-Cheat
// Blocks things only a modified client (Nyx and other injected clients) can do. Every check is
// for something vanilla Bedrock can't do at all, so no normal player trips one however laggy they
// are: hitting yourself, punching dropped items, reaching through walls or far past vanilla reach,
// placing a block against nothing, shulker boxes inside shulker boxes, editing a sign nobody opened,
// tools worn below zero (unbreakable).
// Checks that lag can imitate (attack reach, kill aura, fast break, fly, speed) are left out on purpose.
//
// The blocked action is cancelled or undone, and operators get a chat alert. Alerts are rate
// limited, so a cheat that fires every tick doesn't flood chat.

const ALERT_TAG = "§8[Anti-Cheat]§r";
const ALERT_COOLDOWN_TICKS = 100;

// Alert key -> { tick, suppressed } for the last alert sent under that key.
const alertState = new Map();

function isOperator(player) {
    try {
        if (player.playerPermissionLevel === PlayerPermissionLevel.Operator) return true;
        return Number(player.commandPermissionLevel) >= Number(CommandPermissionLevel.GameDirectors);
    } catch {
        return false;
    }
}

function sendAlert(message) {
    console.warn(`[BSE Anti-Cheat] ${message.replace(/§./g, "")}`);
    for (const player of world.getPlayers()) {
        if (!isOperator(player)) continue;
        try {
            player.sendMessage(`${ALERT_TAG} ${message}`);
        } catch { }
    }
}

/**
 * Alerts operators, at most once per ALERT_COOLDOWN_TICKS for the same key; repeats in between
 * are counted and mentioned in the next alert. Safe to call from before-events (sent next tick).
 */
export function alertOperators(key, message) {
    system.run(() => {
        const now = system.currentTick;
        const state = alertState.get(key);
        if (state && now - state.tick < ALERT_COOLDOWN_TICKS) {
            state.suppressed++;
            return;
        }
        const repeats = state?.suppressed ? ` §8(+${state.suppressed} since last alert)` : "";
        alertState.set(key, { tick: now, suppressed: 0 });
        sendAlert(`${message}${repeats}`);
    });
}

/** Reports an action a player was stopped from doing. */
export function reportBlocked(player, check, detail) {
    alertOperators(`${player.id}|${check}`, `§e${player.name}§r §7was stopped:§r ${check} §7(${detail})`);
}

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    for (const key of alertState.keys()) {
        if (key.startsWith(`${playerId}|`)) alertState.delete(key);
    }
});

// SECTION: Reach
// Comfortably past vanilla survival reach, so only an extended-reach client goes over it.
const MAX_BLOCK_REACH = 8;

export function getGameMode(player) {
    try {
        return player.getGameMode();
    } catch {
        return undefined;
    }
}

export function describeBlock(block) {
    return `${block.typeId.replace(/^minecraft:/, "")} at ${block.x} ${block.y} ${block.z}`;
}

function distanceToBlock(point, block) {
    const dx = Math.max(block.x - point.x, 0, point.x - (block.x + 1));
    const dy = Math.max(block.y - point.y, 0, point.y - (block.y + 1));
    const dz = Math.max(block.z - point.z, 0, point.z - (block.z + 1));
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** Survival/adventure only: creative reach is longer, and creative players can /fill anyway. */
export function isOutOfReach(player, block) {
    const mode = getGameMode(player);
    if (mode !== GameMode.Survival && mode !== GameMode.Adventure) return false;
    return distanceToBlock(player.getHeadLocation(), block) > MAX_BLOCK_REACH;
}

// SECTION: Line of Sight
// A vanilla client can only break or open a block its crosshair (or tap) reaches, so some part of
// the block has to be visible from the player's eyes. Rays go to the block's centre and to a 5x5
// grid on each face turned toward the player; one clear ray is enough. Only when none gets through
// (a cheat, or a block barely peeking out) does a finer 12x12 grid run, to catch small slivers.

// Blocks players see or click through, or that maps hide from players: never walls.
const SEE_THROUGH_BLOCKS = new Set(["minecraft:barrier", "minecraft:invisible_bedrock", "minecraft:structure_void"]);
const MAX_RAY_HOPS = 8;
// Grid points sit a hair inside the face. Any deeper and a face seen at a shallow angle breaks:
// the ray would cross into the block's row up to a block early and stop on the neighbour.
const FACE_DEPTH = 0.002;
const FACE_SPREAD = 0.48;
const makeGrid = steps => steps.flatMap(du => steps.map(dv => [du, dv]));
const COARSE_GRID = makeGrid([-1, -0.5, 0, 0.5, 1]);
const FINE_GRID = makeGrid(Array.from({ length: 12 }, (_, i) => -1 + (2 * i + 1) / 12));

function hidesWhatsBehind(block) {
    const typeId = block.typeId;
    // Of the addon's own blocks only the dev blocks are walls: the engine's tool, data, logic and
    // light blocks are invisible outside edit mode, and the props and grates have gaps.
    if (typeId.startsWith("brr:")) return typeId.startsWith("brr:dev_");
    if (SEE_THROUGH_BLOCKS.has(typeId) || typeId.startsWith("minecraft:light_block")) return false;
    // Only full solid blocks: a ray past a fence, slab, pane or door carries on.
    return block.isSolid;
}

const sameCell = (a, b) => a.x === b.x && a.y === b.y && a.z === b.z;

// Distance along the ray (from its origin) at which it leaves the block's cell.
function exitDistance(origin, direction, cell) {
    let exit = Infinity;
    for (const axis of ["x", "y", "z"]) {
        const step = direction[axis];
        if (Math.abs(step) < 1e-9) continue;
        const plane = step > 0 ? cell[axis] + 1 : cell[axis];
        exit = Math.min(exit, (plane - origin[axis]) / step);
    }
    return exit;
}

function canSeePoint(dimension, eye, point, target) {
    const offset = { x: point.x - eye.x, y: point.y - eye.y, z: point.z - eye.z };
    const length = Math.sqrt(offset.x * offset.x + offset.y * offset.y + offset.z * offset.z);
    if (length < 0.01) return true;
    const direction = { x: offset.x / length, y: offset.y / length, z: offset.z / length };

    let travelled = 0;
    for (let hop = 0; hop < MAX_RAY_HOPS && travelled < length; hop++) {
        const origin = {
            x: eye.x + direction.x * travelled,
            y: eye.y + direction.y * travelled,
            z: eye.z + direction.z * travelled
        };
        const hit = dimension.getBlockFromRay(origin, direction, {
            maxDistance: length - travelled + 0.01,
            includeLiquidBlocks: false,
            includePassableBlocks: false
        });
        if (!hit || sameCell(hit.block, target)) return true;
        if (hidesWhatsBehind(hit.block)) return false;

        // Something see-through: carry on from where the ray leaves its cell.
        const next = exitDistance(eye, direction, hit.block) + 0.001;
        if (!(next > travelled)) return true;
        travelled = next;
    }
    return true;
}

function facePoints(eye, block, grid) {
    const center = { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 };
    const points = [];
    for (const [axis, u, v] of [["x", "y", "z"], ["y", "x", "z"], ["z", "x", "y"]]) {
        const side = eye[axis] > block[axis] + 1 ? 1 : eye[axis] < block[axis] ? -1 : 0;
        if (side === 0) continue;
        for (const [du, dv] of grid) {
            points.push({
                ...center,
                [axis]: center[axis] + side * (0.5 - FACE_DEPTH),
                [u]: center[u] + du * FACE_SPREAD,
                [v]: center[v] + dv * FACE_SPREAD
            });
        }
    }
    return points;
}

/** False only when every ray from the player's eyes to the block is stopped by a solid block. */
export function canSeeBlock(player, block) {
    try {
        const eye = player.getHeadLocation();
        const dimension = player.dimension;
        const eyeCell = { x: Math.floor(eye.x), y: Math.floor(eye.y), z: Math.floor(eye.z) };
        if (sameCell(eyeCell, block)) return true;

        // Head inside a solid block (suffocating, squeezed under a trapdoor): rays from there prove nothing.
        const eyeBlock = dimension.getBlock(eyeCell);
        if (eyeBlock && hidesWhatsBehind(eyeBlock)) return true;

        const canSee = point => canSeePoint(dimension, eye, point, block);
        return canSee({ x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 })
            || facePoints(eye, block, COARSE_GRID).some(canSee)
            || facePoints(eye, block, FINE_GRID).some(canSee);
    } catch {
        // Unloaded chunk or the edge of the world: give the player the benefit of the doubt.
        return true;
    }
}
