import { BlockVolume, system, world } from "@minecraft/server";
import { ESCAPE_STAGE, escapeStage, isExitPhase, NOTEBOOK_GOAL } from "./core/game_state.js";
import { highestScore } from "./core/scoreboard.js";
import { isBallsPosterType } from "./core/block_cache.js";
import { isPaused } from "./core/pause.js";
import { explodeGameboy } from "./gameboy.js";
import { MAP_BOUNDS, isMapLoading } from "./map.js";

const POSTER_TYPES = ["balls", "balls_black", "balls_slight", "balls_double"].flatMap((type) =>
    ["left", "right"].map((side) => `brr:poster_${type}_${side}`));
const SCAN_RETRY_TICKS = 20;
// a crossing test only runs with a poster this close to the step (blocks, any axis)
const NEAR_POSTER = 2;
const previous = new Map();
let lockTick = -1;
let locked;

function postersLocked() {
    if (lockTick !== system.currentTick) {
        lockTick = system.currentTick;
        locked = isExitPhase() || escapeStage() >= ESCAPE_STAGE.intro
            || highestScore(world.getAllPlayers(), "notebooks") >= NOTEBOOK_GOAL;
    }
    return locked;
}

// Posters have no block tick: every poster block in the map is found with one search (again after
// each map reload) and the lock is set on all of them whenever it flips. Posters put down later
// join through brr:balls_poster's onPlace.
const spots = new Map(); // "dimension|x,y,z" -> { dimensionId, x, y, z }
let scanned = false;
let scanRetryAt = 0;
let scanWarned = false;
let mapLoading = false;
let appliedLock; // the lock the known posters were last set to

const keyOf = (dimensionId, x, y, z) => `${dimensionId}|${x},${y},${z}`;

function notePoster(dimensionId, x, y, z) {
    spots.set(keyOf(dimensionId, x, y, z), { dimensionId, x, y, z });
}

// throws while any part of the map isn't loaded
function scanMap() {
    const dimension = world.getDimension("overworld");
    const found = dimension.getBlocks(new BlockVolume(MAP_BOUNDS.min, MAP_BOUNDS.max), { includeTypes: POSTER_TYPES });
    for (const { x, y, z } of found.getBlockLocationIterator()) notePoster(dimension.id, x, y, z);
}

function applyLock(block, lock) {
    if (!block || !isBallsPosterType(block.typeId)) return false;
    if (block.permutation.getState("brr:locked") !== lock) block.setPermutation(block.permutation.withState("brr:locked", lock));
    return true;
}

function lockAll(lock) {
    for (const [key, spot] of spots) {
        let block;
        try { block = world.getDimension(spot.dimensionId).getBlock(spot); } catch { }
        // gone (broken, or the map reload took it); an unloaded one keeps its spot
        if (block && !applyLock(block, lock)) spots.delete(key);
    }
}

function syncPosters() {
    if (isMapLoading()) {
        mapLoading = true;
        return;
    }
    if (mapLoading) {
        // the structures put every poster back as it was saved
        mapLoading = false;
        scanned = false;
        appliedLock = undefined;
    }
    if (!scanned) {
        if (system.currentTick < scanRetryAt) return;
        try {
            scanMap();
            scanned = true;
        } catch (error) {
            scanRetryAt = system.currentTick + SCAN_RETRY_TICKS;
            // usually not loaded yet; anything else is worth one warning
            if (!scanWarned && !/unloaded/i.test(String(error))) {
                scanWarned = true;
                console.warn(`[balls_posters] Poster search failed: ${error}`);
            }
            return;
        }
    }
    const lock = postersLocked();
    if (lock === appliedLock) return;
    appliedLock = lock;
    lockAll(lock);
}

// only steps that pass close to a known poster need the block by block crossing test
function nearPoster(dimensionId, from, to) {
    const minX = Math.min(from.x, to.x) - NEAR_POSTER;
    const maxX = Math.max(from.x, to.x) + NEAR_POSTER;
    const minY = Math.min(from.y, to.y) - NEAR_POSTER;
    const maxY = Math.max(from.y, to.y) + 1.8 + NEAR_POSTER;
    const minZ = Math.min(from.z, to.z) - NEAR_POSTER;
    const maxZ = Math.max(from.z, to.z) + NEAR_POSTER;
    for (const spot of spots.values()) {
        if (spot.dimensionId === dimensionId && spot.x >= minX && spot.x <= maxX
            && spot.y >= minY && spot.y <= maxY && spot.z >= minZ && spot.z <= maxZ) return true;
    }
    return false;
}

// Test the poster plane, not merely proximity or entering its block volume.
export function crossedBallsPoster(dimension, from, to) {
    const distance = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z);
    if (distance === 0 || distance > 8) return false;
    const steps = Math.ceil(distance * 4);
    const visited = new Set();
    for (let step = 0; step <= steps; step++) {
        const t = step / steps;
        const x = Math.floor(from.x + (to.x - from.x) * t);
        const z = Math.floor(from.z + (to.z - from.z) * t);
        const feet = from.y + (to.y - from.y) * t;
        for (let y = Math.floor(feet); y <= Math.floor(feet + 1.8); y++) {
            const key = `${x},${y},${z}`;
            if (visited.has(key)) continue;
            visited.add(key);
            const block = dimension.getBlock({ x, y, z });
            if (!block || !isBallsPosterType(block.typeId)) continue;
            const direction = block.permutation.getState("minecraft:cardinal_direction");
            const axis = direction === "east" || direction === "west" ? "x" : "z";
            const plane = block.location[axis] + 0.5;
            const delta = to[axis] - from[axis];
            if (delta === 0) continue;
            const crossing = (plane - from[axis]) / delta;
            if (crossing <= 0 || crossing > 1) continue;
            const otherAxis = axis === "x" ? "z" : "x";
            const along = from[otherAxis] + (to[otherAxis] - from[otherAxis]) * crossing;
            const height = from.y + (to.y - from.y) * crossing;
            if (along >= block.location[otherAxis] && along < block.location[otherAxis] + 1
                && height < y + 1 && height + 1.8 > y) return true;
        }
    }
    return false;
}

export function registerBallsPosterComponents(registry) {
    registry.registerCustomComponent("brr:balls_poster", {
        // a poster put down by a builder or a command (all three parts of it) is locked like the rest
        onPlace({ block }) {
            const lock = postersLocked();
            for (let dy = 0; dy <= 2; dy++) {
                let part;
                try { part = dy === 0 ? block : block.offset({ x: 0, y: dy, z: 0 }); } catch { }
                if (!applyLock(part, lock)) continue;
                notePoster(block.dimension.id, block.x, block.y + dy, block.z);
            }
        }
    });
}

export function startBallsPosters() {
    world.afterEvents.playerLeave.subscribe(({ playerId }) => previous.delete(playerId));
    system.runInterval(() => {
        syncPosters();
        for (const player of world.getAllPlayers()) {
            const location = player.location;
            const last = previous.get(player.id);
            const dimensionId = player.dimension.id;
            previous.set(player.id, { dimensionId, location });
            if (isPaused() || postersLocked() || !last || last.dimensionId !== dimensionId) continue;
            if (!nearPoster(dimensionId, last.location, location)) continue;
            if (crossedBallsPoster(player.dimension, last.location, location)) explodeGameboy(player);
        }
    }, 1);
}
