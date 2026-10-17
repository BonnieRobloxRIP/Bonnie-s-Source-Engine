import { BlockVolume, system, world } from "@minecraft/server";
import { clearBlockCache } from "./core/block_cache.js";

// The Story map: six 64x64 structures (BP/structures/MapStory01-06), loaded back where they were
// saved from, so a reset restores the map in place. The positions are each file's saved world
// origin; a 3x2 grid, 01-03 west to east along the north row, 04-06 below them.
const MAP_ORIGIN = { x: -59, y: 1, z: -115 };
const PART_SIZE = 64;
const MAP_PARTS = ["MapStory01", "MapStory02", "MapStory03", "MapStory04", "MapStory05", "MapStory06"].map((name, index) => ({
    id: `mystructure:${name}`,
    location: {
        x: MAP_ORIGIN.x + (index % 3) * PART_SIZE,
        y: MAP_ORIGIN.y,
        z: MAP_ORIGIN.z + Math.floor(index / 3) * PART_SIZE
    }
}));
// the whole map, for anything that needs to search it (character_spawns.js)
export const MAP_BOUNDS = {
    min: { x: MAP_ORIGIN.x, y: MAP_ORIGIN.y, z: MAP_ORIGIN.z },
    max: { x: MAP_ORIGIN.x + 3 * PART_SIZE - 1, y: MAP_ORIGIN.y + 15, z: MAP_ORIGIN.z + 2 * PART_SIZE - 1 }
};
// the two tall pillars above the school (MapStory01/02, up to y 318), cleared along with the map
const PILLAR_BOUNDS = { min: { x: -32, y: MAP_BOUNDS.max.y + 1, z: -103 }, max: { x: 6, y: 318, z: -74 } };
// unloading clears 16-block cubes, a few per tick, skipping air
const CLEAR_CUBE = 16;
const CLEARS_PER_TICK = 6;
const CLEAR_RETRY_TICKS = 20;
const CLEAR_MAX_RETRIES = 30;
// A ticking area keeps the map loaded once it has been, so the far end of the school keeps running.
// One area holds at most 100 chunks, so each row gets its own.
const TICKING_AREAS = [0, 1].map((row) => ({
    name: `raldi_map_row${row + 1}`,
    from: { x: MAP_ORIGIN.x, z: MAP_ORIGIN.z + row * PART_SIZE },
    to: { x: MAP_ORIGIN.x + 3 * PART_SIZE - 1, z: MAP_ORIGIN.z + (row + 1) * PART_SIZE - 1 }
}));

// Structures can't be placed into chunks that aren't loaded, and the north row is too far from the
// spawn to be. So a player is taken on a trip behind the loading screen: hovering above each missing
// part (above the tallest walls, slow falling) until its chunks load and it places, then put back
// exactly where they stood, facing the same way.
const TRIP_STEP_TICKS = 2;
const TRIP_PART_TIMEOUT_TICKS = 100;
const TRIP_HOVER_Y = 322;
// without anyone to take on the trip, keep retrying in place for a while
const RETRY_TICKS = 5;
const MAX_ATTEMPTS = 18;
// one part at a time, a few ticks apart: placing all six in one tick stalls (or crashes) the server
const PLACE_STEP_TICKS = 3;
// set once the whole map is down and nobody has played on it since; a run start then skips the
// reload the run end just did (BP/structures parts are big, so it's worth not doing twice)
const FRESH_PROPERTY = "brr:map_fresh";

let job; // the running load, if any

function overworld() {
    return world.getDimension("overworld");
}

function ensureTickingAreas() {
    for (const area of TICKING_AREAS) {
        try {
            overworld().runCommand(`tickingarea add ${area.from.x} 0 ${area.from.z} ${area.to.x} 0 ${area.to.z} ${area.name} true`);
        } catch {
            // already there (the command refuses a duplicate name)
        }
    }
}

// every chunk the part covers is loaded: one sample per 16 blocks plus the far edge, since the parts
// aren't chunk aligned. getBlock is undefined for an unloaded chunk.
function partLoaded(part) {
    const steps = [0, 16, 32, 48, PART_SIZE - 1];
    const dimension = overworld();
    for (const dx of steps) {
        for (const dz of steps) {
            let block;
            try { block = dimension.getBlock({ x: part.location.x + dx, y: part.location.y, z: part.location.z + dz }); } catch { }
            if (!block) return false;
        }
    }
    return true;
}

// true once placed (or impossible: missing from the pack); false while its chunks aren't loaded.
// place() doesn't refuse unloaded chunks: it defers the placement until they load, so the
// structure would pop in later, mid-run. Hence the explicit check first.
function placePart(part) {
    if (!world.structureManager.get(part.id)) {
        console.warn(`[map] Structure ${part.id} is missing from the behavior pack`);
        return true;
    }
    if (!partLoaded(part)) {
        part.error = "its chunks aren't loaded";
        return false;
    }
    try {
        world.structureManager.place(part.id, overworld(), part.location, { includeEntities: false });
        // the characters' cached view of the map is out of date now
        clearBlockCache();
        return true;
    } catch (error) {
        part.error = error;
        return false;
    }
}

function giveUp(part) {
    console.warn(`[map] Could not place ${part.id} at ${part.location.x} ${part.location.y} ${part.location.z}: ${part.error}`);
}

function finish(current) {
    system.clearRun(current.interval);
    if (job !== current) return;
    job = undefined;
    if (!current.failed) world.setDynamicProperty(FRESH_PROPERTY, true);
}

function pickLoader() {
    return world.getAllPlayers().find((player) => {
        try { return player.isValid && player.dimension.id === "minecraft:overworld"; } catch { return false; }
    });
}

function hover(player, part) {
    try {
        player.addEffect("slow_falling", 40, { showParticles: false });
        player.teleport({ x: part.location.x + PART_SIZE / 2, y: TRIP_HOVER_Y, z: part.location.z + PART_SIZE / 2 },
            { dimension: overworld() });
    } catch { }
}

function goHome(current) {
    const { player, home } = current;
    if (!player.isValid) return;
    try {
        player.teleport(home.location, { dimension: home.dimension, rotation: home.rotation });
        player.removeEffect("slow_falling");
    } catch { }
}

function startTrip(parts, player) {
    const current = {
        player,
        home: { location: player.location, rotation: player.getRotation(), dimension: player.dimension },
        parts,
        index: 0,
        startedAt: undefined
    };
    current.interval = system.runInterval(() => {
        if (!current.player.isValid) {
            // they left mid-trip: whatever is left falls back to plain retries
            finish(current);
            retryInPlace(current.parts.slice(current.index));
            return;
        }
        const part = current.parts[current.index];
        if (current.startedAt === undefined) {
            current.startedAt = system.currentTick;
            hover(current.player, part);
            return;
        }
        const placed = placePart(part);
        if (!placed && system.currentTick - current.startedAt < TRIP_PART_TIMEOUT_TICKS) return;
        if (!placed) {
            giveUp(part);
            current.failed = true;
        }
        current.index++;
        current.startedAt = undefined;
        if (current.index < current.parts.length) return;
        goHome(current);
        finish(current);
    }, TRIP_STEP_TICKS);
    job = current;
}

function retryInPlace(parts) {
    const current = { parts, attempts: 0 };
    current.interval = system.runInterval(() => {
        // one part per attempt, so a retry never places several at once either
        const [next, ...rest] = current.parts;
        current.parts = placePart(next) ? rest : [...rest, next];
        current.attempts++;
        if (current.parts.length > 0 && current.attempts < MAX_ATTEMPTS * MAP_PARTS.length) return;
        current.parts.forEach(giveUp);
        current.failed = current.parts.length > 0;
        finish(current);
    }, RETRY_TICKS);
    job = current;
}

// Puts the whole map back, one part every few ticks; parts whose chunks aren't loaded are fetched
// afterwards with a loader trip (or retried in place when nobody is online). With onlyIfUsed, a map
// that is already fresh (nobody has played on it since its last reload) is left as it is.
export function loadMap({ onlyIfUsed = false } = {}) {
    if (onlyIfUsed && world.getDynamicProperty(FRESH_PROPERTY) === true && !job) return;
    if (job) {
        if (job.player) goHome(job);
        job.failed = true;
        finish(job);
    }
    world.setDynamicProperty(FRESH_PROPERTY, undefined);
    ensureTickingAreas();
    const current = { parts: MAP_PARTS.map((part) => ({ ...part })), index: 0, missing: [] };
    current.interval = system.runInterval(() => {
        const part = current.parts[current.index++];
        if (part && !placePart(part)) current.missing.push(part);
        if (current.index < current.parts.length) return;
        system.clearRun(current.interval);
        if (job !== current) return;
        job = undefined;
        if (current.missing.length === 0) {
            world.setDynamicProperty(FRESH_PROPERTY, true);
            return;
        }
        const loader = pickLoader();
        if (loader) startTrip(current.missing, loader);
        else retryInPlace(current.missing);
    }, PLACE_STEP_TICKS);
    job = current;
}

// every 16-block cube of a box
function cubesOf({ min, max }) {
    const cubes = [];
    for (let x = min.x; x <= max.x; x += CLEAR_CUBE) {
        for (let y = min.y; y <= max.y; y += CLEAR_CUBE) {
            for (let z = min.z; z <= max.z; z += CLEAR_CUBE) {
                cubes.push(new BlockVolume({ x, y, z }, {
                    x: Math.min(max.x, x + CLEAR_CUBE - 1),
                    y: Math.min(max.y, y + CLEAR_CUBE - 1),
                    z: Math.min(max.z, z + CLEAR_CUBE - 1)
                }));
            }
        }
    }
    return cubes;
}

function clearCube(volume) {
    // only the blocks that aren't air already; a plain fill if that filter isn't understood
    for (const options of [{ blockFilter: { excludeTypes: ["minecraft:air"] } }, undefined]) {
        try {
            overworld().fillBlocks(volume, "minecraft:air", options);
            return true;
        } catch { }
    }
    // unloaded: try again a little later
    return false;
}

// Takes the whole map away once a game is over (the menu sits in its own yard, menu_room.js), a few
// cubes a tick; the next run start places it again. isMapLoading() is true until it's done.
export function unloadMap() {
    if (job) {
        if (job.player) goHome(job);
        job.failed = true;
        finish(job);
    }
    world.setDynamicProperty(FRESH_PROPERTY, undefined);
    const current = { queue: [...cubesOf(MAP_BOUNDS), ...cubesOf(PILLAR_BOUNDS)], deferred: [], retries: 0, retryAt: 0 };
    current.interval = system.runInterval(() => {
        if (current.queue.length === 0 && system.currentTick >= current.retryAt && current.deferred.length > 0) {
            current.queue = current.deferred;
            current.deferred = [];
            current.retries++;
        }
        for (let i = 0; i < CLEARS_PER_TICK && current.queue.length > 0; i++) {
            const volume = current.queue.shift();
            if (clearCube(volume)) continue;
            if (current.deferred.length === 0) current.retryAt = system.currentTick + CLEAR_RETRY_TICKS;
            current.deferred.push(volume);
        }
        if (current.queue.length > 0) return;
        if (current.deferred.length > 0 && current.retries < CLEAR_MAX_RETRIES) return;
        if (current.deferred.length > 0) console.warn(`[map] ${current.deferred.length} parts of the map couldn't be cleared (not loaded)`);
        system.clearRun(current.interval);
        if (job === current) job = undefined;
        clearBlockCache();
    }, 1);
    job = current;
}

// a run has started on the map: the next run start reloads it again
export function markMapUsed() {
    world.setDynamicProperty(FRESH_PROPERTY, undefined);
}

// The run starts without waiting any longer: a loader still on its trip is let go where they are (the
// run puts them at its spawn), and whatever wasn't placed yet keeps retrying in place
export function stopLoaderTrip() {
    if (!job?.player) return;
    const current = job;
    finish(current);
    try { current.player.removeEffect("slow_falling"); } catch { }
    const left = current.parts.slice(current.index);
    if (left.length > 0) retryInPlace(left);
}

// true while parts of the map are still being placed; the run's loading screen waits for this
export function isMapLoading() {
    return job !== undefined;
}

// keep the map loaded from the start, so the menu camera and the first run find it there
system.run(ensureTickingAreas);
