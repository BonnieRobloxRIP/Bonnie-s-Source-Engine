import { system, world } from "@minecraft/server";
import { CHARACTER_STARTS } from "../character_starts_data.js";

// typeId cache so pathfinding and sight checks don't hammer the native getBlock.
// Only typeIds are cached; block states (e.g. brr:open) must still be read from the real block.
export const AIR = "minecraft:air";
const BALLS_POSTERS = new Set(["balls", "balls_black", "balls_slight", "balls_double"].flatMap((type) =>
    ["left", "right"].map((side) => `brr:poster_${type}_${side}`)));

export function isBallsPosterType(typeId) {
    return BALLS_POSTERS.has(typeId);
}

// wall cutout blocks are collisionless decoration, so characters walk and see straight through them
export function isCutoutType(typeId) {
    return typeId !== undefined && typeId.includes("_cutout");
}

// invisible teleport destination markers; characters must never treat them as obstacles either
const MARKER_BLOCKS = new Set([
    "brr:chipfloke_player_tp",
    "brr:chipfloke_van_tp",
    "brr:arts_mexicano_crafters_player_tp",
    "brr:arts_mexicano_crafters_raldi_tp",
    "brr:beast_player_tp",
    "brr:beast_player_confinment_tp",
    "brr:mrbeast_card_spot",
    "brr:menu_camera",
    "brr:polish_cow_player_tp",
    "brr:polish_cow_marker",
    "brr:character_spawner",
    "brr:walter_pickup_spot",
    // the final exit trigger sits outside the school; the exit walls themselves stay obstacles
    "brr:exit_trigger",
    // where each character starts (character_spawns.js)
    ...Object.keys(CHARACTER_STARTS)
]);

// flat collisionless blinds hanging in front of windows
const BLINDS_BLOCKS = new Set(["brr:blinds_left", "brr:blinds_right"]);

// typeId -> boolean, so the string search in isCutoutType runs once per block type
const passableDecor = new Map();

// every block characters walk and see through: cutout decoration, teleport markers and blinds
export function isPassableDecorType(typeId) {
    let passable = passableDecor.get(typeId);
    if (passable === undefined) {
        passable = isCutoutType(typeId) || MARKER_BLOCKS.has(typeId) || BLINDS_BLOCKS.has(typeId);
        if (typeId !== undefined) passableDecor.set(typeId, passable);
    }
    return passable;
}

// Block types are interned to small numbers so the cache can be a flat typed array, and so callers
// (navigation.js, perception.js) can keep per-type facts in plain arrays. 0 means "not cached" /
// unloaded, and is never stored.
const typeIds = [undefined];
const typeIndexes = new Map();

function intern(typeId) {
    let index = typeIndexes.get(typeId);
    if (index === undefined) {
        index = typeIds.length;
        // a Uint16Array cell can't hold more; such a block simply isn't cached
        if (index > 0xffff) return 0;
        typeIds.push(typeId);
        typeIndexes.set(typeId, index);
    }
    return index;
}

// the typeId an index from blockIndexAt stands for (undefined for 0)
export function typeIdOfIndex(index) {
    return typeIds[index];
}

// The Story map (map.js MAP_BOUNDS: x -59..132, y 1..16, z -115..12) in the overworld, plus the layer
// under it for floor support and a few above for sight lines. Copied rather than imported: map.js has
// to be able to import this module. The map is static apart from blocks the scripts change, and
// those call invalidateBlock, so grid cells never expire on a timer.
const OVERWORLD = "minecraft:overworld";
const GRID_MIN_X = -59;
const GRID_MIN_Y = 0;
const GRID_MIN_Z = -115;
const GRID_SIZE_X = 192;
const GRID_SIZE_Y = 20;
const GRID_SIZE_Z = 128;
const GRID_PLANE = GRID_SIZE_Y * GRID_SIZE_Z;
const grid = new Uint16Array(GRID_SIZE_X * GRID_PLANE);
// Safety net for changes nobody reported (commands, a structure loaded by hand, a script that forgot
// invalidateBlock): one x-plane of the grid is forgotten every few ticks, so any cell is re-read at
// least every GRID_SIZE_X * REFRESH_STEP_TICKS ticks (~38 s). Cheap: only cells still in use refetch.
const REFRESH_STEP_TICKS = 4;
let refreshPlane = 0;

// Everywhere else (other dimensions, outside the map) keeps the old short-lived behaviour: two
// generations of numeric-keyed maps, the older dropped every TTL_TICKS, so an entry lives 1-2 TTLs.
const TTL_TICKS = 100;
const MAX_ENTRIES_PER_GENERATION = 100000;
const others = new Map();
let refreshSteps = 0;

// x/z within +-2^20 and y within +-512 pack losslessly into one safe integer
const PACK_LIMIT = 0x100000;
function packKey(x, y, z) {
    if (x <= -PACK_LIMIT || x >= PACK_LIMIT || z <= -PACK_LIMIT || z >= PACK_LIMIT || y < -512 || y >= 512) return undefined;
    return ((x + PACK_LIMIT) * 1024 + (y + 512)) * 0x200000 + (z + PACK_LIMIT);
}

function generationsFor(dimensionId) {
    let generations = others.get(dimensionId);
    if (!generations) {
        generations = { current: new Map(), previous: new Map() };
        others.set(dimensionId, generations);
    }
    return generations;
}

// the last dimension object seen, so the native id getter isn't read on every lookup
let lastDimension;
let lastIsOverworld = false;
let lastDimensionId;

function rememberDimension(dimension) {
    lastDimension = dimension;
    lastDimensionId = dimension.id;
    lastIsOverworld = lastDimensionId === OVERWORLD;
}

function fetchIndex(dimension, x, y, z) {
    let block;
    try { block = dimension.getBlock({ x, y, z }); } catch { }
    return block ? intern(block.typeId) : 0;
}

// the interned type of a block (see typeIdOfIndex); 0 means unloaded / out of world
export function blockIndexAt(dimension, x, y, z) {
    if (dimension !== lastDimension) rememberDimension(dimension);
    if (lastIsOverworld) {
        const gx = x - GRID_MIN_X;
        const gy = y - GRID_MIN_Y;
        const gz = z - GRID_MIN_Z;
        if (gx >= 0 && gx < GRID_SIZE_X && gy >= 0 && gy < GRID_SIZE_Y && gz >= 0 && gz < GRID_SIZE_Z) {
            const cell = (gx * GRID_SIZE_Y + gy) * GRID_SIZE_Z + gz;
            const cached = grid[cell];
            if (cached > 0) return cached;
            // a fractional coordinate lands between cells (undefined); floor it below
            if (cached === 0) {
                const index = fetchIndex(dimension, x, y, z);
                grid[cell] = index;
                return index;
            }
        }
    }
    if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(z)) {
        // NaN / Infinity: no such block
        if (!Number.isFinite(x + y + z)) return 0;
        return blockIndexAt(dimension, Math.floor(x), Math.floor(y), Math.floor(z));
    }
    const key = packKey(x, y, z);
    if (key === undefined) return fetchIndex(dimension, x, y, z);
    const generations = generationsFor(lastDimensionId);
    const hit = generations.current.get(key) ?? generations.previous.get(key);
    if (hit !== undefined) return hit;
    const index = fetchIndex(dimension, x, y, z);
    if (index !== 0) generations.current.set(key, index);
    return index;
}

// undefined means unloaded / out of world, and is never cached
export function blockTypeAt(dimension, x, y, z) {
    return typeIds[blockIndexAt(dimension, x, y, z)];
}

// The block an entity stands on. Looks a hair below the feet: a player resting on a floor can sit a
// float error under its top face, and flooring that exact height would land in the block beneath.
export function floorTypeUnder(entity) {
    const { x, y, z } = entity.location;
    return blockTypeAt(entity.dimension, Math.floor(x), Math.floor(y - 0.05), Math.floor(z));
}

export function invalidateBlock(dimension, location) {
    const x = Math.floor(location.x);
    const y = Math.floor(location.y);
    const z = Math.floor(location.z);
    if (dimension !== lastDimension) rememberDimension(dimension);
    if (lastIsOverworld) {
        const gx = x - GRID_MIN_X;
        const gy = y - GRID_MIN_Y;
        const gz = z - GRID_MIN_Z;
        if (gx >= 0 && gx < GRID_SIZE_X && gy >= 0 && gy < GRID_SIZE_Y && gz >= 0 && gz < GRID_SIZE_Z) {
            grid[(gx * GRID_SIZE_Y + gy) * GRID_SIZE_Z + gz] = 0;
            return;
        }
    }
    const key = packKey(x, y, z);
    const generations = key !== undefined && others.get(lastDimensionId);
    if (!generations) return;
    generations.current.delete(key);
    generations.previous.delete(key);
}

// forgets every cached block, e.g. after the whole map was placed again (map.js)
export function clearBlockCache() {
    grid.fill(0);
    others.clear();
}

world.afterEvents.playerBreakBlock.subscribe(({ block, dimension }) => invalidateBlock(dimension, block.location));
world.afterEvents.playerPlaceBlock.subscribe(({ block, dimension }) => invalidateBlock(dimension, block.location));

system.runInterval(() => {
    grid.fill(0, refreshPlane * GRID_PLANE, (refreshPlane + 1) * GRID_PLANE);
    refreshPlane = (refreshPlane + 1) % GRID_SIZE_X;
    refreshSteps++;
    const rotate = refreshSteps * REFRESH_STEP_TICKS >= TTL_TICKS;
    if (rotate) refreshSteps = 0;
    for (const generations of others.values()) {
        if (!rotate && generations.current.size <= MAX_ENTRIES_PER_GENERATION) continue;
        generations.previous = generations.current;
        generations.current = new Map();
    }
}, REFRESH_STEP_TICKS);
