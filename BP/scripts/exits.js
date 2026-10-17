import { BlockVolume, system, world } from "@minecraft/server";
import { emitEvent } from "./characters/registry.js";
import { ESCAPE_STAGE, EXIT_GOAL, SPOOP_NOTEBOOKS, escapeStage, isExitPhase } from "./core/game_state.js";
import { isPaused } from "./core/pause.js";
import { getObjective, highestScore } from "./core/scoreboard.js";
import { soundVolume } from "./core/settings.js";
import { MAP_BOUNDS, isMapLoading } from "./map.js";
import { isPlayingRun, isRunActive } from "./run.js";

// The original's EntranceScript + NearExitTriggerScript + ExitTriggerScript.
// An exit is a connected volume of brr:exit_wall blocks set into a wall. It is open (invisible and
// collisionless) at the start, turns into plain Wall01 at CLOSE_AT_NOTEBOOKS, and opens again once
// Raldi's all-notebooks transformation hands over to the exit phase. Coming within REACH_DISTANCE
// of an open exit reaches it: it shuts again for good with the exit map centred on its front face.
// After three exits the last one stays open; walking out through it into a brr:exit_trigger
// volume is the fourth exit and wins the run (escape.js -> win_screen.js).
export const EXIT_WALL = "brr:exit_wall";
export const EXIT_TRIGGER = "brr:exit_trigger";
// brr:exit_mode values, see BP/blocks/exit_wall.json
const MODE = { idle: 0, open: 1, closed: 2, reached: 3 };
// brr:sign_piece values for the four quarters of the exit map (RP/textures/blocks/signs/exit_wall_*)
const PIECE = { none: 0, bottomLeft: 1, bottomRight: 2, topLeft: 3, topRight: 4 };
const CLOSE_AT_NOTEBOOKS = SPOOP_NOTEBOOKS;
const REACH_DISTANCE = 1;
const FINAL_EXIT = EXIT_GOAL - 1;
const EXIT_OBJECTIVE = "exits";
const NOTEBOOK_OBJECTIVE = "notebooks";
const EXIT_SOUND = "exit.reached";
const REACHED_PROPERTY = "brr:exits_reached";
// a runaway flood fill (someone filling a room with exit blocks) stops here
const MAX_GROUP_BLOCKS = 4096;
const PLAYER_HALF_WIDTH = 0.3;
const PLAYER_HEIGHT = 1.8;
const NEIGHBORS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

// The map goes on the world face named by cardinal_direction (BP/blocks/exit_wall.json paints that
// face directly, no rotation). It's set when the exit is reached, toward whoever reached it, so how
// the blocks were placed doesn't matter. `along` is the horizontal axis the wall runs on and
// `right` the sign of the viewer's right along it.
const FACINGS = {
    north: { depth: "z", front: -1, along: "x", right: -1 },
    south: { depth: "z", front: 1, along: "x", right: 1 },
    east: { depth: "x", front: 1, along: "z", right: -1 },
    west: { depth: "x", front: -1, along: "z", right: 1 }
};

const groups = new Map(); // group id -> group
const groupAt = new Map(); // "dimension|x,y,z" -> group
let reached;

const keyOf = (dimensionId, x, y, z) => `${dimensionId}|${x},${y},${z}`;

function reachedIds() {
    if (reached) return reached;
    try { reached = new Set(JSON.parse(world.getDynamicProperty(REACHED_PROPERTY) ?? "[]")); }
    catch { reached = new Set(); }
    return reached;
}

function markReached(group) {
    reachedIds().add(group.id);
    world.setDynamicProperty(REACHED_PROPERTY, JSON.stringify([...reached]));
}

// a fresh map: every exit is unreached again
export function resetExits() {
    reached = new Set();
    world.setDynamicProperty(REACHED_PROPERTY, undefined);
    // reached exits shut for good, so they need syncing even when the shared mode stays the same
    syncedMode = undefined;
}

// ------------------------------------------------------------- volumes ----

function forgetGroup(group) {
    groups.delete(group.id);
    for (const key of group.keys) {
        if (groupAt.get(key) === group) groupAt.delete(key);
    }
}

// the sign is two blocks wide and two tall, centred on the front layer; an odd width leans to the
// viewer's left and an odd height leans up, toward eye level
function assignPieces(blocks, facing) {
    const info = FACINGS[facing];
    const frontDepth = info.front > 0
        ? Math.max(...blocks.map((block) => block[info.depth]))
        : Math.min(...blocks.map((block) => block[info.depth]));
    const front = blocks.filter((block) => block[info.depth] === frontDepth);
    const alongs = front.map((block) => block[info.along]);
    const ys = front.map((block) => block.y);
    const minAlong = Math.min(...alongs);
    const width = Math.max(...alongs) - minAlong + 1;
    const minY = Math.min(...ys);
    const height = Math.max(...ys) - minY + 1;

    // walking toward the viewer's right, column by column
    const firstColumn = info.right > 0
        ? minAlong + Math.floor((width - 2) / 2)
        : minAlong + width - 1 - Math.floor((width - 2) / 2);
    const bottomRow = minY + Math.max(0, Math.ceil((height - 2) / 2));
    const spots = [
        [firstColumn, bottomRow, PIECE.bottomLeft],
        [firstColumn + info.right, bottomRow, PIECE.bottomRight],
        [firstColumn, bottomRow + 1, PIECE.topLeft],
        [firstColumn + info.right, bottomRow + 1, PIECE.topRight]
    ];
    const pieces = new Map();
    for (const [along, y, piece] of spots) {
        if (front.some((block) => block[info.along] === along && block.y === y)) {
            const x = info.along === "x" ? along : frontDepth;
            const z = info.along === "z" ? along : frontDepth;
            pieces.set(`${x},${y},${z}`, piece);
        }
    }
    return pieces;
}

// which face gets the map, where its quarters go, and the floor just in front of the exit
// (where Raldi goes when he hears it)
function aimGroup(group, facing) {
    const info = FACINGS[facing];
    const { min, max } = group;
    const inFront = { y: min.y };
    inFront[info.along] = (min[info.along] + max[info.along] + 1) / 2;
    inFront[info.depth] = info.front > 0 ? max[info.depth] + 1.5 : min[info.depth] - 0.5;
    group.facing = facing;
    group.inFront = inFront;
    group.pieces = assignPieces(group.blocks, facing);
}

// The side the player reached it from. The wall runs along its longer horizontal side; a square
// footprint falls back to the way its blocks were placed.
function facingToward(group, player) {
    const spanX = group.max.x - group.min.x;
    const spanZ = group.max.z - group.min.z;
    const depth = spanX < spanZ ? "x" : spanZ < spanX ? "z" : FACINGS[group.facing].depth;
    const ahead = player.location[depth] >= (group.min[depth] + group.max[depth] + 1) / 2;
    if (depth === "z") return ahead ? "south" : "north";
    return ahead ? "east" : "west";
}

// flood fills the volume the block belongs to and works out where its map goes
function buildGroup(start) {
    const dimension = start.dimension;
    const blocks = [];
    const keys = new Set();
    const facingVotes = new Map();
    const queue = [start.location];
    const seen = new Set([`${start.x},${start.y},${start.z}`]);
    while (queue.length > 0 && blocks.length < MAX_GROUP_BLOCKS) {
        const location = queue.pop();
        let block;
        try { block = dimension.getBlock(location); } catch { }
        if (block?.typeId !== EXIT_WALL) continue;
        blocks.push({ x: location.x, y: location.y, z: location.z });
        const key = keyOf(dimension.id, location.x, location.y, location.z);
        keys.add(key);
        spots.set(key, { dimensionId: dimension.id, x: location.x, y: location.y, z: location.z });
        const facing = block.permutation.getState("minecraft:cardinal_direction") ?? "north";
        facingVotes.set(facing, (facingVotes.get(facing) ?? 0) + 1);
        for (const [dx, dy, dz] of NEIGHBORS) {
            const next = { x: location.x + dx, y: location.y + dy, z: location.z + dz };
            const nextKey = `${next.x},${next.y},${next.z}`;
            if (seen.has(nextKey)) continue;
            seen.add(nextKey);
            queue.push(next);
        }
    }
    if (blocks.length === 0) return undefined;

    // the way most of its blocks were placed facing
    let facing = "north";
    let votes = -1;
    for (const [direction, count] of facingVotes) {
        if (count > votes) {
            facing = direction;
            votes = count;
        }
    }
    const min = { x: Infinity, y: Infinity, z: Infinity };
    const max = { x: -Infinity, y: -Infinity, z: -Infinity };
    for (const block of blocks) {
        for (const axis of ["x", "y", "z"]) {
            min[axis] = Math.min(min[axis], block[axis]);
            max[axis] = Math.max(max[axis], block[axis]);
        }
    }
    const group = {
        id: keyOf(dimension.id, min.x, min.y, min.z),
        dimensionId: dimension.id,
        blocks,
        keys,
        min,
        max
    };
    aimGroup(group, facing);
    // a volume that grew or merged replaces the groups it swallowed
    for (const key of keys) {
        const old = groupAt.get(key);
        if (old) forgetGroup(old);
    }
    groups.set(group.id, group);
    for (const key of keys) groupAt.set(key, group);
    return group;
}

function groupFor(block) {
    return groupAt.get(keyOf(block.dimension.id, block.x, block.y, block.z)) ?? buildGroup(block);
}

// editing a volume rebuilds it, and syncs it, on the next tick
function forgetAround(dimensionId, location) {
    for (const [dx, dy, dz] of [[0, 0, 0], ...NEIGHBORS]) {
        const key = keyOf(dimensionId, location.x + dx, location.y + dy, location.z + dz);
        const group = groupAt.get(key);
        if (group) forgetGroup(group);
        if (spots.has(key)) edited.add(key);
    }
}

// ---------------------------------------------------------------- state ----

// shared by every exit this tick
let phaseTick = -1;
let phase;

function phaseMode() {
    if (phaseTick === system.currentTick) return phase;
    phaseTick = system.currentTick;
    if (!isRunActive()) phase = MODE.idle;
    else if (isExitPhase()) phase = MODE.open;
    else if (escapeStage() >= ESCAPE_STAGE.intro
        || highestScore(world.getAllPlayers(), NOTEBOOK_OBJECTIVE) >= CLOSE_AT_NOTEBOOKS) phase = MODE.closed;
    else phase = MODE.open;
    return phase;
}

function modeFor(group) {
    const mode = phaseMode();
    return mode === MODE.open && isExitPhase() && reachedIds().has(group.id) ? MODE.reached : mode;
}

function syncBlock(block, group, mode) {
    const piece = group.pieces.get(`${block.x},${block.y},${block.z}`) ?? PIECE.none;
    // a reached exit's blocks all face the side the map is on
    const permutation = block.permutation;
    const turn = mode === MODE.reached && permutation.getState("minecraft:cardinal_direction") !== group.facing;
    if (!turn && permutation.getState("brr:exit_mode") === mode && permutation.getState("brr:sign_piece") === piece) return;
    let next = permutation.withState("brr:exit_mode", mode).withState("brr:sign_piece", piece);
    if (turn) next = next.withState("minecraft:cardinal_direction", group.facing);
    block.setPermutation(next);
}

function syncGroup(group) {
    const dimension = world.getDimension(group.dimensionId);
    const mode = modeFor(group);
    for (const location of group.blocks) {
        let block;
        try { block = dimension.getBlock(location); } catch { }
        if (block?.typeId === EXIT_WALL) syncBlock(block, group, mode);
    }
}

// ---------------------------------------------------------------- walls ----

// Exit walls have no block tick. Every wall in the map is found with one search (again after each
// map reload) and they are all synced together whenever the exits' shared state changes; walls
// built, broken or edited around are synced on the next tick.
const SCAN_RETRY_TICKS = 20;
const spots = new Map(); // key -> { dimensionId, x, y, z } of every exit wall block known
const edited = new Set(); // keys of known walls placed, broken or next to an edit since the last sync
let scanned = false;
let scanRetryAt = 0;
let scanWarned = false;
let mapLoading = false;
let syncedMode; // the shared state the walls were last synced to

const inMap = (spot) => spot.dimensionId === "minecraft:overworld"
    && spot.x >= MAP_BOUNDS.min.x && spot.x <= MAP_BOUNDS.max.x
    && spot.y >= MAP_BOUNDS.min.y && spot.y <= MAP_BOUNDS.max.y
    && spot.z >= MAP_BOUNDS.min.z && spot.z <= MAP_BOUNDS.max.z;

// the structures put the map's walls back as they were saved; walls built elsewhere stay known
function forgetMapWalls() {
    groups.clear();
    groupAt.clear();
    for (const [key, spot] of spots) if (inMap(spot)) spots.delete(key);
    edited.clear();
    scanned = false;
    syncedMode = undefined;
}

// throws while any part of the map isn't loaded
function scanMap() {
    const dimension = world.getDimension("overworld");
    const found = dimension.getBlocks(new BlockVolume(MAP_BOUNDS.min, MAP_BOUNDS.max), { includeTypes: [EXIT_WALL] });
    for (const { x, y, z } of found.getBlockLocationIterator()) {
        spots.set(keyOf(dimension.id, x, y, z), { dimensionId: dimension.id, x, y, z });
    }
}

// undefined when the spot isn't loaded; a block that is no longer a wall says so
function blockAt(spot) {
    try { return world.getDimension(spot.dimensionId).getBlock(spot); } catch { return undefined; }
}

function noteWall(block) {
    const key = keyOf(block.dimension.id, block.x, block.y, block.z);
    if (spots.has(key)) return;
    spots.set(key, { dimensionId: block.dimension.id, x: block.x, y: block.y, z: block.z });
    forgetAround(block.dimension.id, block.location);
}

// every known wall, grouped into exits, brought to the current state
function syncAll() {
    for (const [key, spot] of [...spots]) {
        if (groupAt.has(key)) continue;
        const block = blockAt(spot);
        if (block?.typeId === EXIT_WALL) buildGroup(block);
        else if (block) spots.delete(key);
    }
    for (const group of groups.values()) syncGroup(group);
}

function syncEdited() {
    const synced = new Set();
    for (const key of edited) {
        const spot = spots.get(key);
        const block = spot && blockAt(spot);
        if (block && block.typeId !== EXIT_WALL) spots.delete(key);
        if (block?.typeId !== EXIT_WALL) continue;
        const group = groupFor(block);
        if (!group || synced.has(group)) continue;
        synced.add(group);
        syncGroup(group);
    }
    edited.clear();
}

function syncWalls() {
    if (isMapLoading()) {
        mapLoading = true;
        return;
    }
    if (mapLoading) {
        mapLoading = false;
        forgetMapWalls();
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
                console.warn(`[exits] Exit wall search failed: ${error}`);
            }
            return;
        }
    }
    const mode = phaseMode() * 2 + (isExitPhase() ? 1 : 0);
    if (mode !== syncedMode) {
        syncedMode = mode;
        edited.clear();
        syncAll();
    } else if (edited.size > 0) syncEdited();
}

// ------------------------------------------------------------- reaching ----

// gap between the player's hitbox and the volume, in blocks
function distanceTo(player, group) {
    const { x, y, z } = player.location;
    const gap = (low, high, from, to) => Math.max(0, low - to, from - high);
    const dx = gap(group.min.x, group.max.x + 1, x - PLAYER_HALF_WIDTH, x + PLAYER_HALF_WIDTH);
    const dy = gap(group.min.y, group.max.y + 1, y, y + PLAYER_HEIGHT);
    const dz = gap(group.min.z, group.max.z + 1, z - PLAYER_HALF_WIDTH, z + PLAYER_HALF_WIDTH);
    return Math.hypot(dx, dy, dz);
}

// the exit count is shared by the whole run, so every player's HUD shows it
function setExits(count) {
    const objective = getObjective(EXIT_OBJECTIVE, "Exits");
    for (const player of world.getAllPlayers()) {
        try { objective.setScore(player, count); } catch { }
    }
}

function reachExit(group, player) {
    aimGroup(group, facingToward(group, player));
    markReached(group);
    syncGroup(group);
    setExits(highestScore(world.getAllPlayers(), EXIT_OBJECTIVE) + 1);
    for (const player of world.getAllPlayers()) {
        if (!isPlayingRun(player)) continue;
        try { player.playSound(EXIT_SOUND, { volume: soundVolume(player) }); } catch { }
    }
    // Raldi hears the exit slam shut and heads for it
    try { emitEvent(world.getDimension(group.dimensionId), "exit", { location: group.inFront }); } catch { }
}

function inTrigger(player) {
    const { x, y, z } = player.location;
    for (const feetOffset of [0, 1]) {
        let block;
        try { block = player.dimension.getBlock({ x: Math.floor(x), y: Math.floor(y) + feetOffset, z: Math.floor(z) }); } catch { }
        if (block?.typeId === EXIT_TRIGGER) return true;
    }
    return false;
}

export function registerExitComponents(blockComponentRegistry) {
    // a wall put down by a builder or a command joins its exit on the next tick
    blockComponentRegistry.registerCustomComponent("brr:exit_wall", {
        onPlace({ block }) { noteWall(block); }
    });
}

export function startExits() {
    world.afterEvents.playerPlaceBlock.subscribe(({ block, dimension }) => forgetAround(dimension.id, block.location));
    world.afterEvents.playerBreakBlock.subscribe(({ block, dimension }) => forgetAround(dimension.id, block.location));

    system.runInterval(() => {
        syncWalls();
        if (isPaused() || !isRunActive() || !isExitPhase() || escapeStage() === ESCAPE_STAGE.won) return;
        const players = world.getAllPlayers().filter(isPlayingRun);
        if (players.length === 0) return;
        if (highestScore(world.getAllPlayers(), EXIT_OBJECTIVE) >= FINAL_EXIT) {
            // the last exit stays open; leaving through it is the fourth exit
            if (players.some(inTrigger)) setExits(EXIT_GOAL);
            return;
        }
        for (const group of groups.values()) {
            if (reachedIds().has(group.id)) continue;
            const reacher = players.find((player) => player.dimension.id === group.dimensionId
                && distanceTo(player, group) <= REACH_DISTANCE);
            if (reacher) {
                reachExit(group, reacher);
                break;
            }
        }
    }, 1);
}
