import * as mc from "@minecraft/server";
import { PLACEHOLDER_BLOCK_TYPES, isEntityClass } from "../classes.js";
import { findEntitiesByName, flushRegistry, getEntitiesOfClass, getEntityById, markEntityDirty, updateEntityData } from "../registry.js";
import { fireOutput, registerInputHandlers } from "../io.js";
import { getEngineSettings, getHeldEntityClass, getMainhandTypeId, safeGetDimension } from "../runtime.js";
import { passNode, teleportedToNode } from "./tracks.js";
import { advanceTrain, aimTrain, findNode, nodeAfter, routeTo, trackYaw, trainPoint } from "./train_motion.js";
import { DISPLAY_PART_TYPES, colliderFor, displayParts, findTagged, moveCollider, moveDisplayGroup, removeDisplayGroup, removeEntity, spawnCollider, spawnDisplayGroup } from "./platform_display.js";

// SECTION: Platforms (func_tracktrain)
// A train is a controller block (brr:func_tracktrain_block) plus a platform: a box of real blocks
// chosen with the Platform Tool. The train follows path_track nodes from its first stop, and the
// platform moves the way the track goes, keeping its distance from it.
//
// Two ways to move, chosen per train:
// - Smooth: the blocks are saved (chest contents and all) and a moving copy glides along the track,
//   turning as the track turns: display entities draw the visible blocks (platform_display.js) with an
//   invisible collider under each, and blocks displays can't draw yet are stand-ins (invisible sulfur
//   cubes holding the block). The real blocks are put back wherever the train stops, on the nearest
//   quarter turn.
// - Stepped: the real blocks themselves jump a whole block at a time, carrying whatever stands on them.
//
// Nothing is ever lost or destroyed:
// - While a smooth platform's blocks are only in its saved copy (moving, or stopped somewhere that
//   wasn't loaded), that copy is never overwritten: the platform must land before it can start
//   again, and landing is retried until it works, after a reload too.
// - Engine blocks in the platform's way (path nodes, triggers...) always stay. A platform block that
//   ends up where one sits is remembered (platform.hidden) and comes back once the platform moves on.
//   Any other block the platform covers is remembered (platform.displaced, with its contents) and
//   put back when it moves on.
// - Every change to where the blocks are is written to the world straight away.

// Read through the namespace, so test mocks that leave some of these out still load.
const { system, world } = mc;
const SaveMode = () => mc.StructureSaveMode ?? { Memory: "Memory", World: "World" };

export const TRAIN = "brr:func_tracktrain_block";
export const PLATFORM_TOOL = "brr:platform_tool";
// Stand-ins are vanilla sulfur cubes (see SECTION: Stand-ins).
export const STANDIN = "minecraft:sulfur_cube";

export const MAX_PLATFORM_SIDE = 48;
export const MAX_PLATFORM_BLOCKS = 4096;
// The box is read block by block when the train starts, so its size is capped as well.
export const MAX_PLATFORM_VOLUME = 32768;
const MAX_STANDINS = 512;
const DEFAULT_SPEED = 4;
// Long enough for the stand-ins to take their blocks and draw before the real blocks go.
const CLEAR_DELAY_TICKS = 6;
const SAVE_EVERY_TICKS = 20;
const RETRY_EVERY_TICKS = 20;
const STANDIN_TAG = "brr_standin";
// Display entities, their carrier and colliders of a moving platform.
const PART_TAG = "brr_platform_part";
// How quickly a smooth platform turns to follow the track: degrees per block travelled (a right-angle
// corner takes 3 blocks), and at least this many degrees per second for slow trains.
const TURN_DEGREES_PER_BLOCK = 30;
const MIN_TURN_DEGREES_PER_SECOND = 30;

const isTrue = (value) => (typeof value === "boolean" ? value : /^(1|true|yes|on)$/i.test(`${value ?? ""}`.trim()));
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const rounded = (v) => ({ x: Math.round(v.x), y: Math.round(v.y), z: Math.round(v.z) });
const isZero = (v) => v.x === 0 && v.y === 0 && v.z === 0;
const ZERO = { x: 0, y: 0, z: 0 };

/** Writes the engine's records now, so the saved platform always matches the blocks in the world. */
function saveNow() {
    try {
        flushRegistry();
    } catch { }
}

// SECTION: Platform Data
// data.platform = { box: { min, max }, anchor, state, parked, structureId, mask, displaced, hidden, resume,
// heading, turn, landing }.
// - anchor: the track point the blocks are placed for: the platform's offset is (train position - anchor).
// - heading: the track's yaw the blocks were built along; turn: how far a smooth trip has turned from it
//   (degrees); landing: { min, turn, anchor }, where a platform that couldn't land yet will land.
// - parked: false while a smooth platform's blocks exist only in its saved structure (structureId).
// - mask: the box cells that are the platform's own (run-length encoded indices).
// - displaced: blocks it covers right now, "x,y,z" -> [type, states] or { s: structure id }.
// - hidden: its own blocks not in the world because an engine block holds the spot, index -> [type, states].
// - resume: a direction to start in once possible (a trip interrupted by closing the world).
function platformOf(train) {
    const platform = train.data.platform;
    return platform && typeof platform === "object" && platform.box ? platform : undefined;
}

function startSpeed(train) {
    const speed = Number(train.data.speed);
    return Number.isFinite(speed) && speed > 0 ? speed : DEFAULT_SPEED;
}

/** The train's track state, made at its first stop when it has none (or its node is gone). */
function stateOf(train) {
    const platform = platformOf(train);
    if (!platform) return undefined;
    // Mid-trip or waiting to land, the state is what the blocks are measured from: never replace it.
    if (platform.state && (runs.has(train.id) || platform.parked === false)) return platform.state;
    if (platform.state && getEntityById(platform.state.at)) return platform.state;
    const node = findNode(train.data.firstStop, train.dimension);
    if (!node?.center) return undefined;
    platform.state = { at: node.id, t: 0, dir: 1, speed: startSpeed(train), moving: false };
    // The platform moves from wherever it is now.
    platform.anchor = { ...node.center };
    markEntityDirty(train);
    return platform.state;
}

const safeId = (id) => `${id}`.toLowerCase().replace(/[^a-z0-9_]/g, "_");
function structureIdFor(train, kind = "train") {
    return `brr:${kind}_${safeId(train.id ?? train)}`;
}

// SECTION: Platform Blocks
const SKIP_TYPES = new Set(["minecraft:air", "minecraft:water", "minecraft:flowing_water", "minecraft:lava", "minecraft:flowing_lava", "minecraft:structure_void", "minecraft:light_block"]);
// Blocks that don't hide their neighbours, and blocks that hang on others (cleared first, so they don't drop).
const SEE_THROUGH = /glass|leaves|slab|stair|fence|wall|door|pane|bars|torch|lantern|carpet|rail|button|lever|sign|flower|sapling|tallgrass|short_grass|fern|vine|ladder|chain|candle|pressure_plate|banner|head|skull|pot|bed|chest|anvil|hopper|cauldron|campfire|bell|scaffold|snow_layer|ice|slime|honey|kelp|coral|azalea|dripleaf|cactus|cake|lectern|grindstone|stonecutter|bamboo|^brr:/;
const HANGS = /torch|lantern|carpet|rail|button|lever|sign|flower|sapling|tallgrass|short_grass|fern|vine|ladder|chain|candle|pressure_plate|banner|head|skull|pot|snow_layer|redstone_wire|repeater|comparator|door|bed|bell|dripleaf|azalea|cactus|cake|bamboo/;
// Blocks that keep more than their type and states (contents, text, commands): covered ones are saved whole.
const HOLDS_DATA = /sign|chest|barrel|shulker|command_block|furnace|smoker|hopper|dispenser|dropper|lectern|flower_pot|banner|skull|head|frame|bed$|beehive|bee_nest|jukebox|noteblock|spawner|campfire|brewing_stand|enchanting_table|decorated_pot|bookshelf|crafter|shelf|cauldron|piston|structure_block|jigsaw|beacon|conduit|bell|daylight_detector|comparator|vault|sculk_sensor|sculk_shrieker|sculk_catalyst|suspicious|creaking_heart/;

// Blocks nobody stands on (no collision): no stand-in while moving, and never a floor for riders.
const NO_COLLISION = /carpet|pressure_plate|rail|button|torch|sign|flower|sapling|tallgrass|short_grass|fern|vine|snow_layer|redstone_wire|lever|ladder|tripwire|cobweb|bush|kelp|seagrass|lichen|moss_carpet|dead_bush|frame/;
// How tall a block's top is, for riders standing on it (bottom slabs and similar are half height).
function blockTop(typeId, states = {}) {
    if (/slab/.test(typeId) && !/double/.test(typeId) && states["minecraft:vertical_half"] !== "top" && states.top_slot_bit !== true) return 0.5;
    // Upright stairs: riders stand on the low step or the high one (the highest floor under them counts).
    if (/_stairs$/.test(typeId) && !states.upside_down_bit) return 0.5;
    if (/trapdoor/.test(typeId)) return states.open_bit ? 1 : states.upside_down_bit ? 1 : 0.1875;
    if (/door/.test(typeId) && states.open_bit) return 0;
    return 1;
}
const isEngineBlock = (typeId) => isEntityClass(typeId) || PLACEHOLDER_BLOCK_TYPES.has(typeId);
const isSkip = (typeId) => SKIP_TYPES.has(typeId) || typeId === "minecraft:air";
function movesWithPlatform(typeId) {
    return !SKIP_TYPES.has(typeId) && !isEngineBlock(typeId);
}

const keyOf = (at) => `${at.x},${at.y},${at.z}`;
function boxSize(box) {
    return { x: box.max.x - box.min.x + 1, y: box.max.y - box.min.y + 1, z: box.max.z - box.min.z + 1 };
}
const indexOf = (size, dx, dy, dz) => (dx * size.y + dy) * size.z + dz;
const cellAt = (size, index) => ({ dx: Math.floor(index / (size.y * size.z)), dy: Math.floor(index / size.z) % size.y, dz: index % size.z, index });
const cellOffset = (cell) => ({ x: cell.dx, y: cell.dy, z: cell.dz });

// SECTION: Turning
// A smooth platform turns around the track point (its anchor while parked) as the track changes
// direction. A pose is { point, turn }: the track point and the turn in degrees (clockwise from above,
// like entity yaw). It lands on whole blocks and quarter turns; a structure placed with a rotation
// turns its blocks' facing states too.
const quarterOf = (degrees) => ((Math.round(degrees / 90) % 4) + 4) % 4;
const wrap180 = (degrees) => ((((degrees + 180) % 360) + 360) % 360) - 180;

function rotateYaw(v, degrees) {
    const r = (degrees * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
    return { x: v.x * c - v.z * s, y: v.y, z: v.x * s + v.z * c };
}

/** Exact quarter turns clockwise (seen from above): north becomes east. */
function rotateQuarter(v, quarter) {
    switch (((quarter % 4) + 4) % 4) {
        case 1: return { x: -v.z, y: v.y, z: v.x };
        case 2: return { x: -v.x, y: v.y, z: -v.z };
        case 3: return { x: v.z, y: v.y, z: -v.x };
        default: return { ...v };
    }
}

function turnedSize(size, quarter) {
    return quarter % 2 ? { x: size.z, y: size.y, z: size.x } : { ...size };
}

/** Where a box cell ends up inside the box turned by `quarter` (as a rotated structure places it). */
export function turnedCell(cell, quarter, size) {
    switch (((quarter % 4) + 4) % 4) {
        case 1: return { x: size.z - 1 - cell.dz, y: cell.dy, z: cell.dx };
        case 2: return { x: size.x - 1 - cell.dx, y: cell.dy, z: size.z - 1 - cell.dz };
        case 3: return { x: cell.dz, y: cell.dy, z: size.x - 1 - cell.dx };
        default: return { x: cell.dx, y: cell.dy, z: cell.dz };
    }
}

function turnedBox(min, size, quarter) {
    const turned = turnedSize(size, quarter);
    return { min: { ...min }, max: { x: min.x + turned.x - 1, y: min.y + turned.y - 1, z: min.z + turned.z - 1 } };
}

/** Where a point of the parked box (`frame` = { box, anchor }) is with the platform at `pose`. */
function worldOf(frame, at, pose) {
    return add(pose.point, rotateYaw(sub(at, frame.anchor), pose.turn));
}

/** The parked-box point that is at `location` with the platform at `pose`. */
function toParked(frame, location, pose) {
    return add(frame.anchor, rotateYaw(sub(location, pose.point), -pose.turn));
}

/** A cell's block corner (fractions allowed) with the platform at `pose`, for things drawn axis-aligned. */
function poseCorner(frame, cell, pose) {
    const centre = worldOf(frame, { x: frame.box.min.x + cell.dx + 0.5, y: frame.box.min.y + cell.dy, z: frame.box.min.z + cell.dz + 0.5 }, pose);
    return { x: centre.x - 0.5, y: centre.y, z: centre.z - 0.5 };
}

/** Where the display carrier sits: the bottom centre of the box's first cell. */
function carrierSpot(frame, pose) {
    return worldOf(frame, { x: frame.box.min.x + 0.5, y: frame.box.min.y, z: frame.box.min.z + 0.5 }, pose);
}

/**
 * Where a platform lands with the train at `point` after turning `turnDegrees`: on whole blocks and
 * the nearest quarter turn. Returns { min, turn (quarters), anchor }: anchor is the track point the
 * landed blocks are placed for (point, less the rounding).
 */
export function landingFor(frame, point, turnDegrees) {
    const turn = quarterOf(turnDegrees);
    const size = boxSize(frame.box), turned = turnedSize(size, turn);
    const { min } = frame.box;
    const centre = rotateQuarter({ x: min.x + size.x / 2 - frame.anchor.x, y: min.y - frame.anchor.y, z: min.z + size.z / 2 - frame.anchor.z }, turn);
    const exact = { x: point.x + centre.x - turned.x / 2, y: point.y + centre.y, z: point.z + centre.z - turned.z / 2 };
    const at = rounded(exact);
    return { min: at, turn, anchor: sub(point, sub(exact, at)) };
}

/** After landing: the box, the mask, the hidden blocks and the heading follow the turn. */
function applyLanding(platform, landing) {
    const size = boxSize(platform.box);
    if (landing.turn) {
        const turned = turnedSize(size, landing.turn);
        const remap = (index) => {
            const t = turnedCell(cellAt(size, index), landing.turn, size);
            return indexOf(turned, t.x, t.y, t.z);
        };
        if (platform.mask) platform.mask = encodeMask([...decodeMask(platform.mask)].map(remap));
        const next = {};
        for (const [index, entry] of Object.entries(hiddenOf(platform))) next[remap(Number(index))] = entry;
        platform.hidden = next;
        if (platform.heading !== undefined) platform.heading = (platform.heading + landing.turn * 90) % 360;
    }
    platform.box = turnedBox(landing.min, size, landing.turn);
    if (landing.anchor) platform.anchor = { ...landing.anchor };
    platform.turn = 0;
}

function permutationData(permutation) {
    if (!permutation) return undefined;
    let states = {};
    try {
        states = permutation.getAllStates();
    } catch { }
    return [permutation.type.id, states];
}

function resolveData(data) {
    try {
        return mc.BlockPermutation.resolve(data[0], data[1]);
    } catch {
        try {
            return mc.BlockPermutation.resolve(data[0]);
        } catch {
            return undefined;
        }
    }
}

/** A hidden entry's block: [type, states], or { s } (a one-block structure holding it with its contents). */
function hiddenPermutation(entry) {
    if (entry?.s) {
        try {
            return world.structureManager.get(entry.s)?.getBlockPermutation({ x: 0, y: 0, z: 0 });
        } catch {
            return undefined;
        }
    }
    return entry ? resolveData(entry) : undefined;
}

// The mask is the platform's own cells, as runs of cell indices ("start+length,...") over the box.
export function encodeMask(indices) {
    const sorted = [...indices].sort((a, b) => a - b);
    const parts = [];
    for (let i = 0; i < sorted.length;) {
        let j = i;
        while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
        parts.push(`${sorted[i]}+${j - i + 1}`);
        i = j + 1;
    }
    return parts.join(",");
}

export function decodeMask(text) {
    const indices = new Set();
    for (const part of `${text ?? ""}`.split(",")) {
        const [start, length] = part.split("+").map(Number);
        if (!Number.isInteger(start) || !Number.isInteger(length)) continue;
        for (let i = 0; i < length; i++) indices.add(start + i);
    }
    return indices;
}

/** The platform's own cells from its mask, without reading the world: [{ dx, dy, dz, index }]. */
function maskCells(platform) {
    const size = boxSize(platform.box);
    return [...decodeMask(platform.mask)].map((index) => cellAt(size, index));
}

function displacedOf(platform) {
    if (!platform.displaced || typeof platform.displaced !== "object") platform.displaced = {};
    return platform.displaced;
}

function hiddenOf(platform) {
    if (!platform.hidden || typeof platform.hidden !== "object") platform.hidden = {};
    return platform.hidden;
}

/**
 * Reads the platform's blocks: { cells: [{ dx, dy, dz, index, permutation, typeId, present, exposed }],
 * voids: [{ dx, dy, dz }] } (voids are the box's other cells), or { error }. Cells hidden under an
 * engine block are included (present: false) with the block remembered for them. Cells that are
 * empty now (a block broken off the platform) leave the mask, and whatever the platform covered there
 * comes back.
 */
function scanPlatform(train) {
    const platform = platformOf(train);
    const dimension = safeGetDimension(train.dimension);
    if (!platform || !dimension) return { error: "no platform" };
    const { min } = platform.box;
    const size = boxSize(platform.box);
    const mask = platform.mask ? decodeMask(platform.mask) : undefined;
    const hidden = hiddenOf(platform), displaced = displacedOf(platform);
    const cells = [], voids = [], byKey = new Map(), emptied = [];
    for (let dx = 0; dx < size.x; dx++) {
        for (let dy = 0; dy < size.y; dy++) {
            for (let dz = 0; dz < size.z; dz++) {
                const at = { x: min.x + dx, y: min.y + dy, z: min.z + dz };
                let block;
                try {
                    block = dimension.getBlock(at);
                } catch { }
                if (!block) return { error: "the platform isn't loaded" };
                const index = indexOf(size, dx, dy, dz);
                const cell = { dx, dy, dz, index };
                const typeId = block.typeId;
                const inMask = mask ? mask.has(index) : true;
                const remembered = hidden[index];
                if (inMask && remembered && (isEngineBlock(typeId) || isSkip(typeId))) {
                    const permutation = hiddenPermutation(remembered);
                    if (permutation) {
                        Object.assign(cell, { permutation, typeId: permutation.type.id, present: false, hiddenStructure: remembered.s });
                        cells.push(cell);
                        byKey.set(`${dx},${dy},${dz}`, cell);
                        continue;
                    }
                }
                if (inMask && movesWithPlatform(typeId)) {
                    Object.assign(cell, { permutation: block.permutation, typeId, present: true });
                    cells.push(cell);
                    byKey.set(`${dx},${dy},${dz}`, cell);
                    continue;
                }
                voids.push(cell);
                if (mask && inMask) emptied.push({ at, typeId });
            }
        }
    }
    if (cells.length > MAX_PLATFORM_BLOCKS) return { error: `the platform has ${cells.length} blocks (the limit is ${MAX_PLATFORM_BLOCKS})` };
    // A cell that lost its block: put back what the platform covered there, and stop counting it as the platform's.
    // (Kept when something solid sits there now, so it isn't lost.)
    for (const { at, typeId } of emptied) {
        const key = keyOf(at);
        if (!displaced[key] || !isSkip(typeId)) continue;
        restoreCovered(dimension, at, displaced[key]);
        delete displaced[key];
    }
    const kept = new Set(cells.map((c) => c.index));
    for (const index of Object.keys(hidden)) {
        if (kept.has(Number(index))) continue;
        if (hidden[index]?.s) deleteStructure(hidden[index].s);
        delete hidden[index];
    }
    const nextMask = encodeMask(cells.map((c) => c.index));
    if (nextMask !== platform.mask) {
        platform.mask = nextMask;
        markEntityDirty(train);
    }
    for (const cell of cells) {
        cell.exposed = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].some(([x, y, z]) => {
            const next = byKey.get(`${cell.dx + x},${cell.dy + y},${cell.dz + z}`);
            return !next || SEE_THROUGH.test(next.typeId);
        });
    }
    return { cells, voids };
}

/** Saves the box as a structure of the platform's blocks: `voids` become structure void, `extra` cells get the given block. */
function saveStructure(id, dimension, box, voids, saveMode, extra = []) {
    const manager = world.structureManager;
    try {
        manager.delete(id);
    } catch { }
    const structure = manager.createFromWorld(id, dimension, box.min, box.max, { includeEntities: false, includeBlocks: true, saveMode });
    let voidPermutation;
    for (const cell of voids) {
        const at = cellOffset(cell);
        try {
            structure.setBlockPermutation(at, undefined);
        } catch {
            try {
                voidPermutation ??= mc.BlockPermutation.resolve("minecraft:structure_void");
                structure.setBlockPermutation(at, voidPermutation);
            } catch { }
        }
    }
    for (const cell of extra) {
        try {
            structure.setBlockPermutation(cellOffset(cell), cell.permutation);
        } catch { }
    }
    if (saveMode === SaveMode().World) {
        try {
            structure.saveToWorld();
        } catch { }
    }
    return structure;
}

const ROTATIONS = ["None", "Rotate90", "Rotate180", "Rotate270"];
function placeStructure(id, dimension, location, turn = 0) {
    try {
        const options = { includeEntities: false, includeBlocks: true };
        if (turn) options.rotation = mc.StructureRotation?.[ROTATIONS[turn]] ?? ROTATIONS[turn];
        world.structureManager.place(id, dimension, location, options);
        return true;
    } catch (error) {
        console.warn(`[BSE] Could not place platform ${id}: ${error?.message ?? error}`);
        return false;
    }
}

function deleteStructure(id) {
    if (!id) return;
    try {
        world.structureManager.delete(id);
    } catch { }
}

/** The block a saved structure holds for a cell, as [type, states]. */
function structureCellData(structureId, cell) {
    try {
        return permutationData(world.structureManager.get(structureId)?.getBlockPermutation(cellOffset(cell)));
    } catch {
        return undefined;
    }
}

/** Remembers a block the platform is about to cover: its type and states, or the whole block for ones holding data. */
function rememberCovered(dimension, at, block, ownerId) {
    let waterlogged = false;
    try {
        waterlogged = Boolean(block.isWaterlogged);
    } catch { }
    if (HOLDS_DATA.test(block.typeId) || waterlogged) {
        const id = `brr:cover_${safeId(ownerId)}_${[at.x, at.y, at.z].map((n) => (n < 0 ? `m${-n}` : `${n}`)).join("_")}`;
        try {
            try {
                world.structureManager.delete(id);
            } catch { }
            world.structureManager.createFromWorld(id, dimension, at, at, { includeEntities: false, includeBlocks: true, saveMode: SaveMode().World });
            return { s: id };
        } catch { }
    }
    return permutationData(block.permutation);
}

function restoreCovered(dimension, at, saved) {
    try {
        if (saved?.s) {
            placeStructure(saved.s, dimension, at);
            deleteStructure(saved.s);
            return;
        }
        const permutation = saved && resolveData(saved);
        const block = dimension.getBlock(at);
        if (permutation) block?.setPermutation(permutation);
        else block?.setType("minecraft:air");
    } catch { }
}

/** Whether every chunk the box would cover at `min` is loaded. */
function areaLoaded(dimension, box, min) {
    const size = boxSize(box);
    for (let x = min.x; x <= min.x + size.x - 1 + 15; x += 16) {
        for (let z = min.z; z <= min.z + size.z - 1 + 15; z += 16) {
            const at = { x: Math.min(x, min.x + size.x - 1), y: min.y, z: Math.min(z, min.z + size.z - 1) };
            try {
                if (!dimension.getBlock(at)) return false;
            } catch {
                return false;
            }
        }
    }
    return true;
}

/**
 * Puts the platform's saved blocks (structure `structureId`, cells run.cells) with the box corner at
 * `min`, turned `turn` quarter turns (the hidden records keep the unturned indices: applyLanding). Engine blocks there stay (that platform block is remembered as hidden); other blocks there
 * are remembered to be put back later. Sets run.occupied (cells the platform now fills) and
 * run.present (their indices). Returns false, changing nothing, if the area isn't loaded.
 */
function placePlatform(platform, dimension, run, min, structureId = run.structureId, turn = 0) {
    const displaced = displacedOf(platform), hidden = hiddenOf(platform);
    const keep = [], covered = [], placed = [];
    const size = boxSize(platform.box);
    for (const cell of run.cells) {
        const at = add(min, turnedCell(cell, turn, size));
        let block;
        try {
            block = dimension.getBlock(at);
        } catch { }
        if (!block) return false;
        if (isEngineBlock(block.typeId)) {
            keep.push({ at, permutation: block.permutation, cell });
            continue;
        }
        if (block.typeId !== "minecraft:air") covered.push({ at, block });
        placed.push({ at, cell });
    }
    const coverRecords = [];
    for (const { at, block } of covered) {
        const key = keyOf(at);
        if (displaced[key]) continue;
        coverRecords.push(key);
        displaced[key] = rememberCovered(dimension, at, block, run.trainId ?? "platform");
    }
    if (!placeStructure(structureId, dimension, min, turn)) {
        for (const key of coverRecords) {
            if (displaced[key]?.s) deleteStructure(displaced[key].s);
            delete displaced[key];
        }
        return false;
    }
    for (const { at, permutation, cell } of keep) {
        // The structure just put the platform's block here: remember it (whole, if it holds
        // contents), then give the spot back to the engine block.
        if (!(cell.hiddenStructure && hidden[cell.index]?.s === cell.hiddenStructure)) {
            let block;
            try {
                block = dimension.getBlock(at);
            } catch { }
            const typeId = block?.typeId ?? "minecraft:air";
            if (hidden[cell.index]?.s) deleteStructure(hidden[cell.index].s);
            delete hidden[cell.index];
            if (block && !isSkip(typeId) && !isEngineBlock(typeId)) {
                let saved;
                if (HOLDS_DATA.test(typeId)) {
                    const id = `brr:hidden_${safeId(run.trainId ?? "platform")}_${cell.index}`;
                    try {
                        try {
                            world.structureManager.delete(id);
                        } catch { }
                        world.structureManager.createFromWorld(id, dimension, at, at, { includeEntities: false, includeBlocks: true, saveMode: SaveMode().World });
                        saved = { s: id };
                    } catch { }
                }
                hidden[cell.index] = saved ?? permutationData(block.permutation);
            }
        }
        try {
            dimension.getBlock(at)?.setPermutation(permutation);
        } catch { }
    }
    for (const { at, cell } of placed) {
        // A block that waited under an engine block comes back with its contents.
        const entry = hidden[cell.index];
        if (entry?.s) {
            placeStructure(entry.s, dimension, at);
            deleteStructure(entry.s);
        }
        delete hidden[cell.index];
    }
    run.occupied = placed.map(({ at, cell }) => ({ at, typeId: cell.typeId ?? "" }));
    run.present = new Set(placed.map(({ cell }) => cell.index));
    return true;
}

/** Takes the platform's blocks away from where it is, putting back whatever it covered there. */
function clearPlatform(platform, dimension, run) {
    const displaced = displacedOf(platform);
    // Hanging blocks first, then top down, so nothing pops off and drops.
    const order = [...(run.occupied ?? [])].sort((a, b) => (HANGS.test(b.typeId) - HANGS.test(a.typeId)) || (b.at.y - a.at.y));
    for (const { at } of order) {
        const key = keyOf(at);
        let block;
        try {
            block = dimension.getBlock(at);
        } catch { }
        if (!block || isEngineBlock(block.typeId)) continue;
        restoreCovered(dimension, at, displaced[key]);
        delete displaced[key];
    }
    run.occupied = [];
    run.present = new Set();
}

// SECTION: Stand-ins
// A stand-in is an invisible sulfur cube holding the block: the game draws a sulfur cube's block
// upright and full size, and the cube is solid, so it looks and collides like the real block (the
// user's find; map makers have used it for block displays since the cube came out). Medium cubes
// hold blocks; the block goes in the main hand, which is how the cube absorbs one.
// Stand-ins are held exactly in place every tick (a sulfur cube would otherwise hop about), and
// players can't hurt, shear or swap them (startPlatformSystem cancels those).
const STANDIN_SPAWN_EVENT = "minecraft:spawn_medium";
// Blocks a sulfur cube turns dangerous with (explosive, hot) get no stand-in; they reappear at the stop.
const NO_STANDIN = /^minecraft:(tnt|magma|lava|fire|soul_fire|campfire|soul_campfire)$/;
const EFFECT_TICKS = 20000000;

// Which way the cube faces for the block's facing (entity yaw: south 0, west 90, north 180, east -90).
const FACING_YAW = { south: 0, west: 90, north: 180, east: -90 };
function standinYaw(permutation) {
    let states = {};
    try {
        states = permutation.getAllStates();
    } catch { }
    let facing;
    if (typeof states["minecraft:cardinal_direction"] === "string") facing = states["minecraft:cardinal_direction"];
    else if (typeof states["minecraft:facing_direction"] === "string") facing = states["minecraft:facing_direction"];
    else if (Number.isInteger(states.weirdo_direction)) facing = ["east", "west", "south", "north"][states.weirdo_direction];
    else if (Number.isInteger(states.facing_direction)) facing = ["down", "up", "north", "south", "west", "east"][states.facing_direction];
    else if (Number.isInteger(states.direction)) facing = ["south", "west", "north", "east"][states.direction];
    return FACING_YAW[facing] ?? 0;
}

function itemIdFor(permutation) {
    try {
        const item = permutation.getItemStack(1);
        if (item) return item.typeId;
    } catch { }
    return permutation.type.id;
}

/**
 * Spawns a stand-in for `permutation` whose block corner sits at `corner`. Returns
 * { entity, yaw } or undefined (no stand-in for this block, or the area isn't loaded).
 */
export function spawnStandin(dimension, corner, permutation, tag) {
    const itemId = itemIdFor(permutation);
    if (!itemId || NO_STANDIN.test(itemId)) return undefined;
    const yaw = standinYaw(permutation);
    let entity;
    try {
        entity = dimension.spawnEntity(STANDIN, { x: corner.x + 0.5, y: corner.y, z: corner.z + 0.5 }, { spawnEvent: STANDIN_SPAWN_EVENT, initialPersistence: true });
    } catch {
        return undefined;
    }
    try {
        entity.addTag(STANDIN_TAG);
        if (tag) entity.addTag(tag);
        entity.addEffect("invisibility", EFFECT_TICKS, { showParticles: false });
        entity.addEffect("fire_resistance", EFFECT_TICKS, { showParticles: false });
        entity.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 ${itemId}`);
    } catch { }
    const standin = { entity, yaw };
    moveStandin(standin, corner);
    return standin;
}

/** Puts a stand-in's block exactly at `corner` (fractions allowed), facing its block's way, and stops it. */
export function moveStandin(standin, corner) {
    try {
        standin.entity.teleport({ x: corner.x + 0.5, y: corner.y, z: corner.z + 0.5 }, { rotation: { x: 0, y: standin.yaw } });
        standin.entity.clearVelocity();
        return true;
    } catch {
        return false;
    }
}

export function removeStandin(standinOrEntity) {
    try {
        (standinOrEntity.entity ?? standinOrEntity).remove();
    } catch { }
}

/** Every stand-in in loaded areas (only our tagged sulfur cubes, never the world's own). */
function findStandins(extraTags = []) {
    const found = [];
    for (const dimensionId of ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"]) {
        try {
            found.push(...(safeGetDimension(dimensionId)?.getEntities({ type: STANDIN, tags: [STANDIN_TAG, ...extraTags] }) ?? []));
        } catch { }
    }
    return found;
}

// SECTION: Riders
// Whoever stands on a moving platform rides along. Players move by the user's boat trick, taken
// from their Flood Escape lifts (player_tp.mcfunction, later room.js movePlayers): summon a boat
// where the player should end up, make them ride it with teleport_rider, and kill it in the same
// tick. Unlike /tp it doesn't lock the camera or stop them walking. Mobs and items are teleported.
// Smooth platforms carry riders every CARRY_INTERVAL_TICKS while they move sideways (the trick feels
// normal 2+ ticks apart) and every tick while they move up or down, putting riders onto the floor's
// real height so they never sink into it.
const CARRY_INTERVAL_TICKS = 2;
// A rider this close above a floor (and not jumping) is standing on it, and is put exactly on it.
const STAND_GAP = 0.6;
const CARRY_TAG = "brr_carry_boat";
const CARRY_BOAT_ITEM = "minecraft:oak_boat";
let carrySerial = 0;
// Each rider moves with one train per tick at most, even with two platforms under them.
let carriedTick = -1;
const carriedBy = new Map();

function alreadyCarried(entity, trainId) {
    if (system.currentTick !== carriedTick) {
        carriedTick = system.currentTick;
        carriedBy.clear();
    }
    const by = carriedBy.get(entity.id);
    if (by !== undefined && by !== trainId) return true;
    carriedBy.set(entity.id, trainId);
    return false;
}

function boatItemIds(dimension, at) {
    try {
        return new Set(dimension.getEntities({ type: "minecraft:item", location: at, maxDistance: 2 }).map((item) => item.id));
    } catch {
        return new Set();
    }
}

// Boats killed by the trick drop as items unless the doentitydrops gamerule is off (setup.mcfunction
// turns it off, but not every world ran it). Each carry removes exactly one boat item that wasn't
// there before it and that no other carry has claimed.
const claimedBoatItems = new Set();
function clearBoatDrop(dimension, at, before) {
    try {
        if (world.gameRules.doEntityDrops === false) return;
    } catch { }
    if (claimedBoatItems.size > 256) claimedBoatItems.clear();
    const claim = () => {
        let items = [];
        try {
            items = dimension.getEntities({ type: "minecraft:item", location: at, maxDistance: 2 });
        } catch { }
        for (const item of items) {
            if (before.has(item.id) || claimedBoatItems.has(item.id)) continue;
            try {
                if (item.getComponent("minecraft:item")?.itemStack?.typeId !== CARRY_BOAT_ITEM) continue;
                claimedBoatItems.add(item.id);
                item.remove();
                return true;
            } catch { }
        }
        return false;
    };
    if (!claim()) system.run(claim);
}

// Getting out of a boat lifts the rider a little. A lift does that once, unnoticed; a platform
// carries its riders many times a second, and the lifts add up until the rider is above the platform
// and left behind. So each player's lift is measured a tick after a carry (while standing on a
// floor) and the next boat spawns that much lower.
const carryLift = new Map();
const MAX_CARRY_LIFT = 1.5;

function learnCarryLift(player, expectedY, lift) {
    try {
        if (!player.isValid || player.isJumping || player.getComponent("minecraft:riding")?.entityRidingOn) return;
        const error = player.location.y - expectedY;
        if (Math.abs(error) >= MAX_CARRY_LIFT) return;
        carryLift.set(player.id, Math.max(-MAX_CARRY_LIFT, Math.min(MAX_CARRY_LIFT, lift + error * 0.5)));
    } catch { }
}

/**
 * Moves a player by `delta` with the boat trick, or by a teleport if no boat could carry them.
 * `standing`: they stand on a floor and should end up exactly at the target height.
 */
export function carryPlayer(player, delta, standing = false) {
    const dimension = player.dimension;
    const to = add(player.location, delta);
    const lift = standing ? carryLift.get(player.id) ?? 0 : 0;
    let boat;
    try {
        boat = dimension.spawnEntity("minecraft:boat", { x: to.x, y: to.y - lift, z: to.z }, { initialRotation: 0 });
    } catch { }
    if (boat) {
        // A tag only this boat has, so the ride can't pick up someone else's boat.
        const tag = `${CARRY_TAG}_${(carrySerial = (carrySerial + 1) % 1000000)}`;
        let rode = false;
        try {
            boat.addTag(CARRY_TAG);
            boat.addTag(tag);
            player.runCommand(`ride @s start_riding @e[type=boat,tag=${tag},c=1] teleport_rider until_full`);
            rode = player.getComponent("minecraft:riding")?.entityRidingOn?.id === boat.id;
        } catch { }
        const before = boatItemIds(dimension, to);
        try {
            boat.kill();
        } catch {
            try {
                boat.remove();
            } catch { }
        }
        clearBoatDrop(dimension, to, before);
        if (rode) {
            if (standing) system.run(() => learnCarryLift(player, to.y, lift));
            return true;
        }
    }
    try {
        player.teleport(to);
        return true;
    } catch {
        return false;
    }
}

/** Moves one rider by `move`: players by the boat trick, anything else by a teleport. `standing`: on a floor. */
function carryRider(entity, move, trainId, standing = false) {
    try {
        // Riders of something else (a pet on a shoulder, a player in a minecart) move with what they
        // ride: the mount is carried itself when it's on the platform.
        if (entity.getComponent("minecraft:riding")?.entityRidingOn) return;
    } catch { }
    if (alreadyCarried(entity, trainId)) return;
    try {
        if (entity.typeId === "minecraft:player") {
            if (`${entity.getGameMode()}`.toLowerCase() !== "spectator") carryPlayer(entity, move, standing);
            return;
        }
        entity.teleport(add(entity.location, move), { keepVelocity: true });
    } catch { }
}

/** The surfaces riders can stand on, per column: Map("dx,dz" -> [{ dy, top }]) (top = 1, or 0.5 for a bottom slab). */
function floorSurfaces(cells) {
    const solid = cells.filter((c) => !NO_COLLISION.test(c.typeId ?? ""));
    const own = new Map(solid.map((c) => [`${c.dx},${c.dy},${c.dz}`, c]));
    const surfaces = new Map();
    for (const c of solid) {
        let states = {};
        try {
            states = c.permutation?.getAllStates() ?? {};
        } catch { }
        const top = blockTop(c.typeId ?? "", states);
        if (top <= 0) continue;
        // A floor only if nothing solid of the platform sits right on top of it.
        if (top >= 1 && own.has(`${c.dx},${c.dy + 1},${c.dz}`)) continue;
        const key = `${c.dx},${c.dz}`;
        surfaces.set(key, [...(surfaces.get(key) ?? []), { dy: c.dy, top }]);
    }
    return surfaces;
}

/**
 * The top of the platform floor at `location` (in the parked box's frame): the highest surface under
 * its feet that isn't above them and is at most 2.5 blocks below (riders jumping or falling inside a
 * cabin still count). Undefined if none.
 */
function floorUnder(platform, run, location) {
    if (!run?.surfaces) return undefined;
    const { min } = platform.box;
    const { x, y, z } = location;
    let best;
    for (const ex of [x - 0.3, x + 0.3]) for (const ez of [z - 0.3, z + 0.3]) {
        const key = `${Math.floor(ex - min.x)},${Math.floor(ez - min.z)}`;
        for (const surface of run.surfaces.get(key) ?? []) {
            const top = min.y + surface.dy + surface.top;
            if (top > y + 0.25 || top < y - 2.5) continue;
            if (best === undefined || top > best) best = top;
        }
    }
    return best;
}

const isHelper = (entity) => DISPLAY_PART_TYPES.has(entity.typeId) || entity.hasTag(STANDIN_TAG) || entity.hasTag(CARRY_TAG) || entity.hasTag(PART_TAG);

/**
 * Entities standing on (or just above) the platform's floors, except our helpers: with the platform
 * parked, or at `pose` (a moving smooth platform, which may be turned).
 */
function ridersIn(dimension, platform, run, pose) {
    const { min, max } = platform.box;
    let lo = { ...min }, hi = { x: max.x + 1, y: max.y + 1, z: max.z + 1 };
    if (pose) {
        const corners = [[min.x, min.z], [max.x + 1, min.z], [min.x, max.z + 1], [max.x + 1, max.z + 1]].map(([x, z]) => worldOf(platform, { x, y: min.y, z }, pose));
        lo = { x: Math.min(...corners.map((c) => c.x)), y: corners[0].y, z: Math.min(...corners.map((c) => c.z)) };
        hi = { x: Math.max(...corners.map((c) => c.x)), y: corners[0].y + max.y - min.y + 1, z: Math.max(...corners.map((c) => c.z)) };
    }
    let found = [];
    try {
        found = dimension.getEntities({
            location: { x: lo.x - 0.3, y: lo.y, z: lo.z - 0.3 },
            volume: { x: hi.x - lo.x + 0.6, y: hi.y - lo.y + 2, z: hi.z - lo.z + 0.6 }
        }).filter((entity) => !isHelper(entity));
    } catch {
        return [];
    }
    if (!run?.surfaces) return found;
    return found.filter((entity) => floorUnder(platform, run, pose ? toParked(platform, entity.location, pose) : entity.location) !== undefined);
}

/**
 * Carries whoever is on a smooth platform from its pose at the last carry (run.carriedPose; parked
 * at first) to `pose`, turning them around the track point with it. Riders sunk into a floor go onto
 * its top; riders standing on a floor that moves up or down stay on it; riders in the air (or
 * jumping) just move with the platform. `frame` is { box, anchor } of the parked platform.
 */
function carrySmoothRiders(frame, dimension, run, pose, trainId) {
    const from = run.carriedPose ?? { point: frame.anchor, turn: 0 };
    const shift = sub(pose.point, from.point);
    if (Math.abs(shift.x) + Math.abs(shift.y) + Math.abs(shift.z) < 1e-4 && Math.abs(pose.turn - from.turn) < 1e-4) return;
    const lift = (p) => p.point.y - frame.anchor.y;
    for (const rider of ridersIn(dimension, frame, run, from)) {
        const local = toParked(frame, rider.location, from);
        const move = sub(worldOf(frame, local, pose), rider.location);
        const floor = floorUnder(frame, run, local);
        let standing = false;
        if (floor !== undefined) {
            const y = rider.location.y, floorNow = floor + lift(from), newTop = floor + lift(pose);
            let rising = false;
            try {
                rising = rider.getVelocity().y > 0.05 || rider.isJumping === true;
            } catch { }
            // Sunk into the floor, or standing on it (or just above it) and not jumping: onto its top.
            standing = y + move.y < newTop || (!rising && y - floorNow < STAND_GAP);
            if (standing) move.y = newTop - y;
        }
        carryRider(rider, move, trainId, standing);
    }
    run.carriedPose = { point: { ...pose.point }, turn: pose.turn };
}

// SECTION: Runs
// A run is one trip: it starts when the train starts and ends when it stops. Kept in memory only;
// the saved platform data is enough to put the blocks back after a reload.
const runs = new Map();

function runTag(train) {
    return `brr_train_${`${train.id}`.replace(/[^A-Za-z0-9_]/g, "_")}`;
}

function structureExists(id) {
    try {
        return Boolean(id && world.structureManager.get(id));
    } catch {
        return false;
    }
}

/** Rebuilds a platform's cells from its saved structure (for data saved before platforms had a mask). */
function cellsFromStructure(platform) {
    const cells = [];
    let structure;
    try {
        structure = world.structureManager.get(platform.structureId);
    } catch { }
    if (!structure) return cells;
    const size = boxSize(platform.box);
    for (let dx = 0; dx < size.x; dx++) for (let dy = 0; dy < size.y; dy++) for (let dz = 0; dz < size.z; dz++) {
        let permutation;
        try {
            permutation = structure.getBlockPermutation({ x: dx, y: dy, z: dz });
        } catch { }
        if (!permutation || isSkip(permutation.type.id)) continue;
        cells.push({ dx, dy, dz, index: indexOf(size, dx, dy, dz), typeId: permutation.type.id, permutation });
    }
    return cells;
}

/** Rebuilds a run's lookups after its cells change. */
function refreshRunCells(run, cells) {
    run.cells = cells;
    run.columns = new Set(cells.map((c) => `${c.dx},${c.dz}`));
    run.surfaces = floorSurfaces(run.smooth ? cells.filter((c) => run.standinCells?.has(c.index)) : cells);
}

/**
 * Reads and saves the platform for a trip: { cells, structureId, occupied, present, ... }, or
 * undefined. Smooth trips save to the world (the blocks live only there while moving); stepped
 * trips keep a copy in memory and take a fresh one before every step.
 */
function preparePlatform(train, smooth) {
    const platform = platformOf(train);
    const dimension = safeGetDimension(train.dimension);
    if (!platform || !dimension) return undefined;
    // A platform still waiting to land has its only copy in the saved structure: never overwrite it.
    if (platform.parked === false) return undefined;
    const scan = scanPlatform(train);
    if (scan.error) {
        console.warn(`[BSE] Train ${train.data.name || train.id} can't move: ${scan.error}`);
        return undefined;
    }
    if (!scan.cells.length) return undefined;
    const structureId = structureIdFor(train);
    const hiddenCells = scan.cells.filter((c) => !c.present);
    try {
        saveStructure(structureId, dimension, platform.box, [...scan.voids, ...hiddenCells], smooth ? SaveMode().World : SaveMode().Memory, hiddenCells);
    } catch (error) {
        console.warn(`[BSE] Train ${train.data.name || train.id} can't save its platform: ${error?.message ?? error}`);
        return undefined;
    }
    const present = scan.cells.filter((c) => c.present);
    const run = {
        smooth,
        trainId: train.id,
        voids: scan.voids,
        structureId,
        dimension: train.dimension,
        box: platform.box,
        occupied: present.map((cell) => ({ at: add(platform.box.min, cellOffset(cell)), typeId: cell.typeId })),
        present: new Set(present.map((c) => c.index)),
        anchor: platform.anchor ? { ...platform.anchor } : undefined,
        standins: [],
        colliders: [],
        display: undefined,
        // Cells drawn solid while moving (a stand-in, or a display block with its collider).
        standinCells: new Set(),
        startTick: system.currentTick,
        cleared: false,
        lastOffset: undefined,
        lastPoint: undefined,
        lastPose: undefined,
        turn: 0,
        turns: false,
        // Riders start on the real blocks (the parked pose).
        carriedPose: undefined
    };
    refreshRunCells(run, scan.cells);
    return run;
}

function beginRun(train, activator) {
    let smooth = `${train.data.motion ?? "smooth"}` !== "stepped";
    const run = preparePlatform(train, smooth);
    if (!run) return undefined;
    run.activator = activator;
    const platform = platformOf(train);
    if (smooth) {
        // Visible solid blocks: displays draw the ones they can (each with a collider), stand-ins the rest.
        const solid = run.cells.filter((c) => c.exposed && !NO_COLLISION.test(c.typeId));
        // Fences join the platform's own blocks beside them.
        const byOffset = new Map(run.cells.map((c) => [`${c.dx},${c.dy},${c.dz}`, c.permutation]));
        for (const c of solid) c.parts = displayParts(c.permutation, (dx, dz) => byOffset.get(`${c.dx + dx},${c.dy},${c.dz + dz}`));
        const drawn = solid.filter((c) => c.parts.length > 0);
        const held = solid.filter((c) => c.parts.length === 0 && !NO_STANDIN.test(itemIdFor(c.permutation)));
        if (drawn.length + held.length > MAX_STANDINS) {
            // Too big to draw: move it a block at a time instead of leaving holes.
            console.warn(`[BSE] Train ${train.data.name || train.id}: ${drawn.length + held.length} visible blocks is more than ${MAX_STANDINS}, so it moves stepped this trip.`);
            smooth = run.smooth = false;
            refreshRunCells(run, run.cells);
        } else {
            const dimension = safeGetDimension(train.dimension);
            const tag = runTag(train);
            const rest = { point: platform.anchor, turn: 0 };
            run.turns = isTrue(train.data.turns ?? true);
            if (drawn.length) {
                run.display = spawnDisplayGroup(dimension, carrierSpot(platform, rest), drawn.map((c) => ({ dx: c.dx, dy: c.dy, dz: c.dz, permutation: c.permutation, values: c.parts })), [PART_TAG, tag]);
                if (run.display) {
                    for (const cell of drawn) {
                        // Slabs and stairs get a half-height collider (at the top for upper slabs and upside-down stairs).
                        const { half, lift } = colliderFor(cell.permutation);
                        const spot = lift ? { ...cell, dy: cell.dy + lift } : cell;
                        const entity = spawnCollider(dimension, poseCorner(platform, spot, rest), [PART_TAG, tag], half);
                        if (entity) run.colliders.push({ entity, cell: spot });
                        run.standinCells.add(cell.index);
                    }
                } else {
                    held.push(...drawn.filter((c) => !NO_STANDIN.test(itemIdFor(c.permutation))));
                }
            }
            for (const cell of held) {
                const standin = spawnStandin(dimension, poseCorner(platform, cell, rest), cell.permutation, tag);
                if (!standin) continue;
                run.standins.push({ standin, cell });
                run.standinCells.add(cell.index);
            }
            refreshRunCells(run, run.cells);
            // The way the track runs here is the way the blocks were built (turns are measured from it).
            if (platform.heading === undefined) {
                const yaw = trackYaw(platform.state);
                if (yaw !== undefined) platform.heading = yaw;
            }
            // The saved copy exists now; the real blocks stay until the stand-ins have drawn
            // (tickRun clears them, and only then is the platform "parked: false").
            platform.structureId = run.structureId;
        }
    }
    runs.set(train.id, run);
    markEntityDirty(train);
    saveNow();
    return run;
}

/**
 * Saves the platform as it is now for the next step: blocks changed on board ride along, and cells
 * whose block was broken (or replaced by an engine block) stop being the platform's.
 */
function captureStep(train, run, dimension, platform) {
    const nextId = run.structureId === structureIdFor(train) ? structureIdFor(train, "trainb") : structureIdFor(train);
    const gone = new Set();
    for (const cell of run.cells) {
        if (!run.present.has(cell.index)) continue;
        let block;
        try {
            block = dimension.getBlock(add(platform.box.min, cellOffset(cell)));
        } catch { }
        if (block && (isSkip(block.typeId) || isEngineBlock(block.typeId))) gone.add(cell.index);
    }
    if (gone.size) {
        const goneAt = new Set(run.cells.filter((c) => gone.has(c.index)).map((c) => keyOf(add(platform.box.min, cellOffset(c)))));
        run.voids = [...run.voids, ...run.cells.filter((c) => gone.has(c.index))];
        for (const index of gone) run.present.delete(index);
        run.occupied = run.occupied.filter((o) => !goneAt.has(keyOf(o.at)));
        refreshRunCells(run, run.cells.filter((c) => !gone.has(c.index)));
        platform.mask = encodeMask(run.cells.map((c) => c.index));
    }
    const hidden = hiddenOf(platform);
    const notPresent = run.cells.filter((c) => !run.present.has(c.index)).map((c) => ({ ...c, permutation: hiddenPermutation(hidden[c.index]) ?? c.permutation }));
    saveStructure(nextId, dimension, platform.box, [...run.voids, ...notPresent], SaveMode().Memory, notPresent.filter((c) => c.permutation));
    return nextId;
}

/** Moves a stepped (or parked) platform's real blocks by `delta`, carrying what stands on them. */
function stepBlocks(train, run, delta) {
    const platform = platformOf(train);
    const dimension = safeGetDimension(train.dimension);
    if (!platform || !dimension || isZero(delta)) return true;
    const { min, max } = platform.box;
    const next = add(min, delta);
    // Both where it is and where it goes must be loaded before anything changes.
    if (!areaLoaded(dimension, platform.box, min) || !areaLoaded(dimension, platform.box, next)) return false;
    const riders = ridersIn(dimension, platform, run);
    let freshId;
    try {
        freshId = captureStep(train, run, dimension, platform);
    } catch {
        return false;
    }
    clearPlatform(platform, dimension, run);
    const previous = run.structureId;
    run.structureId = freshId;
    if (!placePlatform(platform, dimension, run, next, freshId)) {
        if (!placePlatform(platform, dimension, run, min, freshId)) {
            // Can't put it back either: keep this copy with the world and land it later.
            try {
                world.structureManager.get(freshId)?.saveToWorld();
            } catch { }
            Object.assign(platform, { structureId: freshId, parked: false, landing: undefined, landAt: { ...ZERO }, mask: encodeMask(run.cells.map((c) => c.index)) });
            run.keepStructure = freshId;
        }
        if (previous !== freshId) deleteStructure(previous);
        markEntityDirty(train);
        saveNow();
        return false;
    }
    if (previous !== freshId) deleteStructure(previous);
    for (const rider of riders) carryRider(rider, delta, train.id);
    platform.box = { min: next, max: add(max, delta) };
    platform.anchor = add(platform.anchor, delta);
    markEntityDirty(train);
    saveNow();
    return true;
}

// Trains whose platform waits to land, with where it would land: if the train block goes, the
// platform becomes an orphan and still lands there.
const waitingLand = new Map();

function noteWaiting(train) {
    const platform = platformOf(train);
    if (!platform || platform.parked !== false || !platform.structureId) {
        waitingLand.delete(train.id);
        return;
    }
    const landing = landingOf(platform) ?? { min: { ...platform.box.min }, turn: 0 };
    waitingLand.set(train.id, { structureId: platform.structureId, dimension: train.dimension, at: landing.min, turn: landing.turn, box: platform.box, mask: platform.mask, trainId: train.id });
}

/**
 * Where a platform waiting to land goes: its saved landing, an older save's landAt (a whole-block
 * move), or where the train is now (turned as far as the trip had turned). Undefined if unknown.
 */
function landingOf(platform) {
    if (platform.landing?.min) return { turn: 0, ...platform.landing };
    if (platform.landAt) return { min: add(platform.box.min, platform.landAt), turn: 0, anchor: platform.anchor ? add(platform.anchor, platform.landAt) : undefined };
    const point = platform.state ? trainPoint(platform.state) : undefined;
    if (!point || !platform.anchor) return undefined;
    return landingFor(platform, point, platform.turn ?? 0);
}

/**
 * Puts a smooth platform's saved blocks down where it should land, if they're only in the saved
 * structure (stopped somewhere unloaded, or the world closed mid-ride). Returns true when the
 * platform's blocks are in the world.
 */
function landPlatform(train) {
    const platform = platformOf(train);
    if (!platform || platform.parked !== false) return true;
    const dimension = safeGetDimension(train.dimension);
    if (!dimension) return false;
    const giveUp = (why) => {
        console.warn(`[BSE] Train ${train.data.name || train.id}: ${why}; its platform can't be put back.`);
        Object.assign(platform, { parked: true, structureId: undefined, landing: undefined, landAt: undefined, landPoint: undefined });
        waitingLand.delete(train.id);
        markEntityDirty(train);
        saveNow();
        return true;
    };
    if (!structureExists(platform.structureId)) return giveUp("its saved blocks are missing");
    const landing = landingOf(platform);
    // Don't guess: without a place to land, keep waiting.
    if (!landing) return false;
    let cells = platform.mask ? maskCells(platform) : cellsFromStructure(platform);
    if (!platform.mask && cells.length) platform.mask = encodeMask(cells.map((c) => c.index));
    if (!cells.length) return giveUp("its saved copy is empty");
    if (!areaLoaded(dimension, turnedBox(landing.min, boxSize(platform.box), landing.turn), landing.min)) return false;
    if (!placePlatform(platform, dimension, { trainId: train.id, structureId: platform.structureId, cells }, landing.min, platform.structureId, landing.turn)) return false;
    applyLanding(platform, landing);
    // After a lost stop the train restarts from its node: measure the platform from there.
    if (platform.landPoint && platform.anchor) {
        const now = platform.state ? trainPoint(platform.state) : undefined;
        if (now) platform.anchor = add(now, sub(platform.anchor, platform.landPoint));
    }
    const id = platform.structureId;
    Object.assign(platform, { parked: true, structureId: undefined, landing: undefined, landAt: undefined, landPoint: undefined });
    waitingLand.delete(train.id);
    markEntityDirty(train);
    saveNow();
    deleteStructure(id);
    return true;
}

function finishRun(train, run, reason) {
    const platform = platformOf(train);
    const dimension = safeGetDimension(train.dimension);
    runs.delete(train.id);
    if (!platform) {
        dropOrphanedRun(train.id, run);
        return;
    }
    if (!dimension) return;
    if (run.smooth && !run.cleared) {
        // Stopped before its blocks were taken away: they're still where they were.
        removeRunParts(run);
        deleteStructure(run.structureId);
        platform.structureId = undefined;
        markEntityDirty(train);
        saveNow();
        return;
    }
    // A node broken mid-ride: land where the train last was, not back at the node it came from.
    const point = reason === "lost" ? run.lastPoint ?? trainPoint(platform.state) : trainPoint(platform.state);
    if (run.smooth) {
        const pose = point ? { point, turn: run.turn } : run.lastPose ?? { point: platform.anchor, turn: 0 };
        const landing = landingFor(platform, pose.point, pose.turn);
        // Exactly where the landed blocks are, in the trip's frame (the nearest quarter turn, no full spins).
        const final = { point: landing.anchor, turn: pose.turn + wrap180(landing.turn * 90 - pose.turn) };
        const frame = { box: platform.box, anchor: platform.anchor };
        // Hold the moving copy on the landing spot while the real blocks draw, then remove it.
        poseParts(frame, run, final);
        if (placePlatform(platform, dimension, run, landing.min, run.structureId, landing.turn)) {
            // The real blocks land on whole blocks and quarter turns: riders take that last step with them.
            carrySmoothRiders(frame, dimension, run, final, train.id);
            applyLanding(platform, landing);
            Object.assign(platform, { parked: true, structureId: undefined, landing: undefined, landAt: undefined, landPoint: undefined });
            markEntityDirty(train);
            saveNow();
            deleteStructure(run.structureId);
            if (reason === "lost" && point) {
                const now = trainPoint(platform.state);
                if (now) platform.anchor = add(now, sub(platform.anchor, point));
            }
        } else {
            // Somewhere unloaded: keep the saved copy and exactly where to land it (retryPending).
            platform.landing = landing;
            platform.landAt = undefined;
            platform.landPoint = reason === "lost" ? point : undefined;
            markEntityDirty(train);
            saveNow();
            noteWaiting(train);
        }
        system.runTimeout(() => poseParts(frame, run, final), 1);
        system.runTimeout(() => removeRunParts(run), 2);
        return;
    }
    if (run.keepStructure !== run.structureId) deleteStructure(run.structureId);
    if (reason === "lost" && point && platform.parked !== false) {
        const now = trainPoint(platform.state);
        if (now) platform.anchor = add(now, sub(platform.anchor, point));
    }
    markEntityDirty(train);
    saveNow();
}

/** Moves a smooth trip's moving copy (displays, colliders, stand-ins) to `pose`. */
function poseParts(frame, run, pose) {
    for (const { standin, cell } of run.standins) moveStandin(standin, poseCorner(frame, cell, pose));
    for (const { entity, cell } of run.colliders ?? []) moveCollider(entity, poseCorner(frame, cell, pose));
    if (run.display) moveDisplayGroup(run.display, carrierSpot(frame, pose), pose.turn);
}

function removeRunParts(run) {
    run.standins.forEach(({ standin }) => removeStandin(standin));
    (run.colliders ?? []).forEach(({ entity }) => removeEntity(entity));
    removeDisplayGroup(run.display);
}

/** The trip's turn this tick: easing toward the way the track runs (at once after a teleport). */
function nextTurn(platform, run, state, snap) {
    if (!run.turns) return run.turn;
    const yaw = trackYaw(state);
    if (yaw === undefined) return run.turn;
    if (platform.heading === undefined) platform.heading = yaw - run.turn;
    const diff = wrap180(yaw - platform.heading - run.turn);
    if (snap) return run.turn + diff;
    const rate = Math.max(MIN_TURN_DEGREES_PER_SECOND, Math.abs(state.speed ?? 0) * TURN_DEGREES_PER_BLOCK) / 20;
    return run.turn + Math.max(-rate, Math.min(rate, diff));
}

function tickRun(train, run) {
    const platform = platformOf(train);
    const state = platform?.state;
    if (!state) {
        dropOrphanedRun(train.id, run);
        return;
    }
    const dimension = safeGetDimension(train.dimension);
    if (run.smooth && !run.cleared) {
        if (!state.moving) {
            finishRun(train, run, "stopped");
            fireOutput(train, "OnStop", run.activator, train);
            return;
        }
        if (system.currentTick - run.startTick < CLEAR_DELAY_TICKS || !dimension) {
            // Hold still over the real blocks until the moving copy has drawn.
            poseParts(platform, run, { point: platform.anchor, turn: 0 });
            return;
        }
        clearPlatform(platform, dimension, run);
        run.cleared = true;
        // Only now are the blocks in the saved copy alone.
        platform.parked = false;
        markEntityDirty(train);
        saveNow();
    }
    const events = state.moving ? advanceTrain(state, Math.max(0, state.speed) / 20) : [{ type: "stop", reason: "stopped" }];
    let stopped;
    for (const event of events) {
        if (event.type === "pass") {
            passNode(event.node, run);
            fireOutput(train, "OnNext", run.activator, train);
        } else if (event.type === "teleport") {
            teleportedToNode(event.node, run);
        } else if (event.type === "stop") {
            stopped = event;
        }
    }
    // At the end of the line, "Go back" turns it around instead of stopping.
    if (stopped?.reason === "end" && `${train.data.atEnd ?? "stop"}` === "reverse" && aimTrain(state, -(state.dir ?? 1))) {
        state.moving = true;
        stopped = undefined;
    }

    const point = stopped?.reason === "lost" ? run.lastPoint : trainPoint(state);
    if (point && dimension) {
        run.lastPoint = point;
        if (run.smooth) {
            run.turn = nextTurn(platform, run, state, events.some((e) => e.type === "teleport"));
            platform.turn = run.turn;
            const pose = { point, turn: run.turn };
            run.lastOffset = sub(point, platform.anchor);
            run.lastPose = pose;
            // Every tick, moving or not: a sulfur cube left alone would hop off.
            poseParts(platform, run, pose);
            // Riders follow: every tick while it climbs or drops, every few ticks otherwise.
            const vertical = Math.abs(point.y - (run.carriedPose?.point.y ?? platform.anchor.y)) > 1e-6;
            if (!stopped && (vertical || (system.currentTick - run.startTick) % CARRY_INTERVAL_TICKS === 0)) carrySmoothRiders(platform, dimension, run, pose, train.id);
        } else {
            const delta = rounded(sub(point, platform.anchor));
            if (!isZero(delta) && !stepBlocks(train, run, delta)) {
                // Blocked by an unloaded area: wait here.
                state.moving = false;
                stopped ??= { type: "stop", reason: "unloaded" };
            }
        }
    }

    if (stopped) {
        finishRun(train, run, stopped.reason);
        fireOutput(train, "OnStop", run.activator, train);
        if (stopped.reason === "destination") fireOutput(train, "OnArrivedAtDestinationNode", run.activator, train);
    } else if ((system.currentTick - run.startTick) % SAVE_EVERY_TICKS === 0) {
        markEntityDirty(train);
    }
}

// SECTION: Orphaned platforms
// A train block broken mid-ride (or while its platform waits to land) leaves the platform without
// a train. Its blocks are put down where they were heading, through the same safe placement as any
// landing; if that area isn't loaded, the saved copy is kept with the world and placed once it is.
const ORPHANS_KEY = "brr:platform_orphans";

function readOrphans() {
    try {
        const list = JSON.parse(`${world.getDynamicProperty(ORPHANS_KEY) ?? "[]"}`);
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

function writeOrphans(list) {
    try {
        world.setDynamicProperty(ORPHANS_KEY, list.length ? JSON.stringify(list) : undefined);
    } catch { }
}

/** Puts an orphan down. Returns true when its blocks are in the world (or its copy is gone). */
function landOrphan(orphan) {
    const dimension = safeGetDimension(orphan.dimension);
    if (!dimension) return false;
    if (!structureExists(orphan.structureId)) return true;
    const holder = { box: orphan.box, mask: orphan.mask, structureId: orphan.structureId, displaced: {}, hidden: {} };
    const cells = holder.mask ? maskCells(holder) : cellsFromStructure(holder);
    const turn = orphan.turn ?? 0;
    if (!cells.length || !areaLoaded(dimension, turnedBox(orphan.at, boxSize(orphan.box), turn), orphan.at)) return false;
    if (!placePlatform(holder, dimension, { cells, structureId: orphan.structureId, trainId: orphan.trainId }, orphan.at, orphan.structureId, turn)) return false;
    deleteStructure(orphan.structureId);
    return true;
}

function retryOrphans() {
    const list = readOrphans();
    if (!list.length) return;
    const left = list.filter((orphan) => !landOrphan(orphan));
    if (left.length !== list.length) writeOrphans(left);
}

function addOrphan(orphan) {
    if (!landOrphan(orphan)) writeOrphans([...readOrphans(), orphan]);
}

function dropOrphanedRun(id, run) {
    runs.delete(id);
    removeRunParts(run);
    if (!run.smooth || !run.cleared) {
        // Stepped, or smooth before its blocks were taken away: the blocks are still in the world.
        if (run.keepStructure !== run.structureId) deleteStructure(run.structureId);
        return;
    }
    const dimension = safeGetDimension(run.dimension);
    const mask = encodeMask(run.cells.map((c) => c.index));
    if (!run.anchor) {
        addOrphan({ structureId: run.structureId, dimension: run.dimension, at: add(run.box.min, run.lastOffset ? rounded(run.lastOffset) : ZERO), box: run.box, mask, trainId: run.trainId });
        return;
    }
    const frame = { box: run.box, anchor: run.anchor };
    const pose = run.lastPose ?? { point: run.anchor, turn: 0 };
    const landing = landingFor(frame, pose.point, pose.turn);
    if (dimension) carrySmoothRiders(frame, dimension, run, { point: landing.anchor, turn: pose.turn + wrap180(landing.turn * 90 - pose.turn) }, id);
    addOrphan({ structureId: run.structureId, dimension: run.dimension, at: landing.min, turn: landing.turn, box: run.box, mask, trainId: run.trainId });
}

function tickTrains() {
    for (const [id, run] of [...runs]) {
        const train = getEntityById(id);
        if (!train || train.typeId !== TRAIN) {
            dropOrphanedRun(id, run);
            continue;
        }
        tickRun(train, run);
    }
}

// SECTION: Train Controls
/**
 * Starts (or keeps going) a train in `dir` (1 forward, -1 backward). `dest` is the node id
 * MoveToPathNode stops at; any other start clears it. Returns whether the train is now moving.
 */
export function startTrain(train, dir, activator, { dest } = {}) {
    if (train.disabled) return false;
    const platform = platformOf(train);
    const state = stateOf(train);
    if (!platform || !state) return false;
    if (state.speed <= 0) state.speed = startSpeed(train);
    const run = runs.get(train.id);
    if (run) {
        // A trip is under way (maybe told to stop this same tick): keep it going in the new direction.
        if (!aimTrain(state, dir)) return false;
        state.moving = true;
        state.dest = dest;
        if (activator) run.activator = activator;
        markEntityDirty(train);
        return true;
    }
    // Blocks still only in the saved copy (stopped somewhere unloaded) must land first.
    if (!landPlatform(train)) return false;
    if (!aimTrain(state, dir)) return false;
    state.dest = dest;
    state.moving = true;
    if (!beginRun(train, activator)) {
        state.moving = false;
        state.dest = undefined;
        return false;
    }
    platform.resume = undefined;
    fireOutput(train, "OnStart", activator, train);
    markEntityDirty(train);
    return true;
}

export function stopTrain(train) {
    const platform = platformOf(train);
    if (!platform) return;
    if (platform.state) platform.state.moving = false;
    // A trip waiting to resume after a reload stays stopped too.
    platform.resume = undefined;
    markEntityDirty(train);
}

// SECTION: Setup Help
// New players can't guess how a train starts, so the Platform Tool and the form both tell them what
// is missing, and once it's ready, exactly how to start it.

/** Names an unnamed train train_N, so other blocks and /brr:fire can target it. */
export function ensureTrainName(train) {
    if (`${train.data.name ?? ""}`.trim()) return train.data.name;
    let n = 1;
    while (findEntitiesByName(`train_${n}`).length > 0) n++;
    updateEntityData(train, { ...train.data, name: `train_${n}` });
    return train.data.name;
}

/** What's still missing before the train can move, as player-facing lines (empty when ready). */
export function trainSetupProblems(train) {
    const problems = [];
    if (!platformOf(train)) problems.push("No platform yet: hold the Platform Tool, click this train, then two opposite corners of the build it moves.");
    const firstStop = `${train.data.firstStop ?? ""}`.trim();
    const node = findNode(firstStop, train.dimension);
    if (!firstStop) problems.push("No First stop: place path_track nodes, then type the name of the one it starts at into First stop.");
    else if (!node) problems.push(`No path_track named "${firstStop}" in this dimension. Check First stop.`);
    else if (!nodeAfter(node, 1) && !nodeAfter(node, -1)) problems.push(`"${firstStop}" isn't linked to another node yet: link them with the Track Linker (click one node, then the next).`);
    if (train.disabled) problems.push("It's disabled (Start disabled, or a Disable input): send it Enable first.");
    if (platformOf(train)?.parked === false && !runs.has(train.id)) problems.push("Its blocks are waiting to be put back where it stopped: go near that spot so it's loaded, and they'll land.");
    return problems;
}

/** The setup checklist, or how to start it when it's ready. */
export function describeTrainSetup(train) {
    const name = ensureTrainName(train);
    const problems = trainSetupProblems(train);
    if (problems.length) return [`§e${name} can't move yet:`, ...problems.map((line) => `§7- ${line}`)].join("\n");
    if (runs.has(train.id)) return `§a${name} is moving.`;
    return [
        `§a${name} is ready. To start it, send it StartForward (StartBackward goes back):`,
        `§7- Quick test: turn on Start moving right away in its form, or type §f/brr:fire ${name} StartForward`,
        `§7- From a trigger: an Output OnStartTouch > ${name} > StartForward`,
        "§7- When the world loads: a logic_auto with OnMapSpawn > StartForward",
        `§7- From a vanilla button or lever: put it on a command block running /brr:fire ${name} StartForward`
    ].join("\n");
}

/** After the form is saved: applies the new speed, starts the train if it starts right away, and says what happens next. */
export function trainFormSaved(train) {
    const state = platformOf(train)?.state;
    if (state) {
        state.speed = startSpeed(train);
        markEntityDirty(train);
    }
    if (isTrue(train.data.startMoving) && !trainSetupProblems(train).length && !runs.has(train.id)) {
        const dir = state?.dir ?? 1;
        if (startTrain(train, dir) || startTrain(train, -dir)) return `§a${ensureTrainName(train)} is on its way (Start moving right away is on).`;
        return `§c${ensureTrainName(train)} couldn't start. Check that the platform is loaded (stand near it) and that the track leads somewhere from where the train is now.`;
    }
    return describeTrainSetup(train);
}

function setSpeed(train, param) {
    const speed = Number(`${param ?? ""}`.trim());
    const state = stateOf(train);
    if (!state || !Number.isFinite(speed)) return;
    state.speed = Math.max(0, speed);
    if (state.speed === 0) stopTrain(train);
    markEntityDirty(train);
}

function reverse(train, activator) {
    const state = stateOf(train);
    if (!state) return;
    const dir = -(state.dir ?? 1);
    if (runs.has(train.id) && state.moving) startTrain(train, dir, activator);
    else state.dir = dir;
    markEntityDirty(train);
}

function moveToNode(train, param, activator) {
    const state = stateOf(train);
    const node = findNode(param, train.dimension);
    if (!state || !node) return;
    const dir = routeTo(state, node);
    if (dir === undefined) return;
    if (dir === 0) {
        fireOutput(train, "OnArrivedAtDestinationNode", activator, train);
        return;
    }
    startTrain(train, dir, activator, { dest: node.id });
}

function teleportToNode(train, param) {
    const platform = platformOf(train);
    const state = stateOf(train);
    const node = findNode(param, train.dimension);
    if (!platform || !state || !node?.center) return;
    const run = runs.get(train.id);
    if (run) {
        state.moving = false;
        finishRun(train, run, "stopped");
        // Gone now, not in 2 ticks: they'd stand solid where the platform used to be.
        removeRunParts(run);
    }
    if (!landPlatform(train)) return;
    // The blocks sit where the anchor says; move them by the whole blocks between it and the node.
    const delta = rounded(sub(node.center, platform.anchor));
    const trip = preparePlatform(train, false);
    if (!trip) return;
    const moved = stepBlocks(train, trip, delta);
    if (trip.keepStructure !== trip.structureId) deleteStructure(trip.structureId);
    if (moved) {
        Object.assign(state, { at: node.id, toward: undefined, t: 0, dest: undefined });
        teleportedToNode(node, run);
    }
    markEntityDirty(train);
    saveNow();
}

registerInputHandlers(TRAIN, {
    StartForward: (train, param, context) => startTrain(train, 1, context.activator),
    StartBackward: (train, param, context) => startTrain(train, -1, context.activator),
    Stop: (train) => stopTrain(train),
    Resume: (train, param, context) => startTrain(train, stateOf(train)?.dir ?? 1, context.activator, { dest: stateOf(train)?.dest }),
    Reverse: (train, param, context) => reverse(train, context.activator),
    SetSpeed: (train, param) => setSpeed(train, param),
    MoveToPathNode: (train, param, context) => moveToNode(train, param, context.activator),
    TeleportToPathNode: (train, param) => teleportToNode(train, param)
});

// SECTION: Recovery
// After a load: trips the world closed in the middle of are resumed, and smooth platforms whose
// blocks are only in their saved copy are landed, retrying until their area is loaded.

/** Run once when the engine starts, before any input can reach a train. */
function prepareAfterLoad() {
    for (const train of getEntitiesOfClass(TRAIN)) {
        const platform = platformOf(train);
        if (!platform) continue;
        // A stepped trip's copy is left over if the world closed mid-ride: its blocks are already in place.
        if (platform.parked !== false && platform.structureId) {
            deleteStructure(platform.structureId);
            platform.structureId = undefined;
        }
        if (platform.state?.moving) {
            platform.resume = platform.state.dir ?? 1;
            platform.state.moving = false;
        } else if (isTrue(train.data.startMoving) && platform.resume === undefined) {
            platform.resume = platform.state?.dir ?? 1;
        }
        noteWaiting(train);
        markEntityDirty(train);
    }
}

/** Lands waiting platforms and resumes interrupted trips, once their area is loaded. */
function retryPending() {
    for (const train of getEntitiesOfClass(TRAIN)) {
        const platform = platformOf(train);
        if (!platform || runs.has(train.id)) continue;
        if (platform.parked === false && !landPlatform(train)) {
            noteWaiting(train);
            continue;
        }
        if (platform.resume !== undefined) {
            // Wait for the platform's area to load rather than give the trip up.
            const dimension = safeGetDimension(train.dimension);
            if (!dimension || !areaLoaded(dimension, platform.box, platform.box.min)) continue;
            const dir = platform.resume, dest = platform.state?.dest;
            platform.resume = undefined;
            if (!startTrain(train, dir, undefined, { dest })) startTrain(train, -dir, undefined, { dest });
            markEntityDirty(train);
        }
    }
    // A train block that went while its platform waited to land: the platform still lands.
    for (const [id, waiting] of [...waitingLand]) {
        const train = getEntityById(id);
        if (train && train.typeId === TRAIN) continue;
        waitingLand.delete(id);
        addOrphan(waiting);
    }
    retryOrphans();
}

// Stand-ins left behind by a closed world, or a train that's gone, are removed.
function sweepStandins() {
    const live = new Set();
    for (const run of runs.values()) for (const { standin } of run.standins) live.add(standin.entity.id);
    for (const id of testStandinIds) live.add(id);
    for (const entity of findStandins()) if (!live.has(entity.id)) removeStandin(entity);
    // Display entities, carriers and colliders of trips that are over.
    const liveParts = new Set();
    for (const run of runs.values()) {
        for (const { entity } of run.colliders ?? []) liveParts.add(entity.id);
        for (const entity of [run.display?.carrier, ...(run.display?.displays ?? [])]) if (entity) liveParts.add(entity.id);
    }
    for (const entity of findTagged(PART_TAG)) if (!liveParts.has(entity.id)) removeEntity(entity);
    // Carry boats live for a single tick; one still around means something cut the trick short.
    for (const dimensionId of ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"]) {
        try {
            safeGetDimension(dimensionId)?.getEntities({ type: "minecraft:boat", tags: [CARRY_TAG] }).forEach((boat) => boat.remove());
        } catch { }
    }
}

// SECTION: Platform Tool
// Click a func_tracktrain block, then the platform's two opposite corners. Sneak-click a
// func_tracktrain block to clear its platform.
const toolSelections = new Map();
const TOOL_TIMEOUT_TICKS = 2400;

function platformBusy(train) {
    if (runs.has(train.id)) return "§cStop the train before changing its platform.";
    const platform = platformOf(train);
    if (platform?.parked === false) {
        // A saved copy that has gone missing can't be landed: let it be given up.
        if (!structureExists(platform.structureId)) landPlatform(train);
        else return "§cIts blocks are waiting to be put back where it stopped: go near that spot first.";
    }
    return "";
}

/** Forgets the saved copies of blocks a platform covers (they stay where they are, under it). */
function dropCoverRecords(platform) {
    let count = 0;
    for (const entry of [...Object.values(platform?.displaced ?? {}), ...Object.values(platform?.hidden ?? {})]) {
        count++;
        if (entry?.s) deleteStructure(entry.s);
    }
    return count;
}

export function platformToolClickTrain(playerId, train, sneaking, tick = system.currentTick) {
    if (sneaking) {
        toolSelections.delete(playerId);
        if (!platformOf(train)) return "§7This train has no platform.";
        const busy = platformBusy(train);
        if (busy) return busy;
        const covered = dropCoverRecords(platformOf(train));
        updateEntityData(train, { ...train.data, platform: undefined });
        const note = covered ? ` §7(${covered} block${covered === 1 ? "" : "s"} it was covering stay under it.)` : "";
        return `§eCleared ${train.data.name || "the train"}'s platform.${note}`;
    }
    toolSelections.set(playerId, { trainId: train.id, tick });
    const name = ensureTrainName(train);
    const again = platformOf(train) ? " (this replaces its current platform)" : "";
    return `§eSelected ${name}. Click one corner of the build it moves, then the opposite corner${again}.`;
}

export function platformToolClickBlock(playerId, dimension, cell, tick = system.currentTick) {
    const selection = toolSelections.get(playerId);
    const train = selection && tick - selection.tick <= TOOL_TIMEOUT_TICKS ? getEntityById(selection.trainId) : undefined;
    if (!train || train.typeId !== TRAIN) {
        toolSelections.delete(playerId);
        return "§7Click a func_tracktrain block first, then the platform's two corners.";
    }
    if (train.dimension !== dimension) return "§cThe platform must be in the same dimension as its train.";
    if (!selection.corner) {
        toolSelections.set(playerId, { ...selection, corner: { ...cell }, tick });
        return `§eFirst corner at ${cell.x} ${cell.y} ${cell.z}. Now click the opposite corner.`;
    }
    const a = selection.corner;
    const min = { x: Math.min(a.x, cell.x), y: Math.min(a.y, cell.y), z: Math.min(a.z, cell.z) };
    const max = { x: Math.max(a.x, cell.x), y: Math.max(a.y, cell.y), z: Math.max(a.z, cell.z) };
    const size = { x: max.x - min.x + 1, y: max.y - min.y + 1, z: max.z - min.z + 1 };
    if (Math.max(size.x, size.y, size.z) > MAX_PLATFORM_SIDE) return `§cThat's ${size.x}×${size.y}×${size.z}; a platform can be at most ${MAX_PLATFORM_SIDE} blocks on each side. Click a nearer corner.`;
    if (size.x * size.y * size.z > MAX_PLATFORM_VOLUME) return `§cThat box holds ${size.x * size.y * size.z} blocks; a platform's box can hold at most ${MAX_PLATFORM_VOLUME}. Click a nearer corner.`;
    const busy = platformBusy(train);
    if (busy) return busy;
    // Blocks the old platform covers must stay remembered so they come back when it moves away:
    // keep the ones inside the new box, and refuse when that would lose any.
    const old = platformOf(train);
    if (old?.hidden && Object.keys(old.hidden).length) return "§cPart of the platform is waiting under an engine block (a path node or trigger): move the train off it first.";
    const inside = (key) => {
        const [x, y, z] = key.split(",").map(Number);
        return x >= min.x && x <= max.x && y >= min.y && y <= max.y && z >= min.z && z <= max.z;
    };
    const covered = Object.keys(old?.displaced ?? {});
    if (covered.some((key) => !inside(key))) return "§cThe platform is covering blocks outside that box: include them, or move the train back where it started first.";
    toolSelections.delete(playerId);
    const displaced = old?.displaced;
    updateEntityData(train, { ...train.data, platform: { box: { min, max }, parked: true, ...(covered.length ? { displaced } : {}) } });
    return `§aPlatform set for ${ensureTrainName(train)}: ${size.x}×${size.y}×${size.z}.\n${describeTrainSetup(train)}`;
}

/** The train a player selected with the Platform Tool, and the first corner they clicked, for the outline. */
function toolSelectionOf(playerId) {
    const selection = toolSelections.get(playerId);
    return selection ? { train: getEntityById(selection.trainId), corner: selection.corner } : undefined;
}

// SECTION: Outlines
// Platforms show as dotted boxes while a player holds the Platform Tool or a func_tracktrain.
const OUTLINE_INTERVAL_TICKS = 10;
const OUTLINE_RADIUS = 64;
const MAX_OUTLINE_DOTS = 900;
const BOX_PARTICLE = "brr:path_track_link";
const SELECTED_PARTICLE = "brr:path_track_branch";

function drawBox(player, min, max, particle, budget) {
    const lo = { x: min.x, y: min.y, z: min.z }, hi = { x: max.x + 1, y: max.y + 1, z: max.z + 1 };
    const edges = [];
    for (const y of [lo.y, hi.y]) for (const z of [lo.z, hi.z]) edges.push([{ x: lo.x, y, z }, { x: hi.x, y, z }]);
    for (const x of [lo.x, hi.x]) for (const z of [lo.z, hi.z]) edges.push([{ x, y: lo.y, z }, { x, y: hi.y, z }]);
    for (const x of [lo.x, hi.x]) for (const y of [lo.y, hi.y]) edges.push([{ x, y, z: lo.z }, { x, y, z: hi.z }]);
    for (const [a, b] of edges) {
        const length = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
        const steps = Math.min(Math.round(length / 0.5), budget);
        for (let i = 0; i <= steps; i++) {
            const k = steps ? i / steps : 0;
            try {
                player.spawnParticle(particle, { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k });
            } catch {
                return 0;
            }
        }
        budget -= steps + 1;
        if (budget <= 0) return 0;
    }
    return budget;
}

function runOutlinePass() {
    const trains = getEntitiesOfClass(TRAIN);
    const settings = getEngineSettings();
    for (const player of world.getPlayers()) {
        const holdingTool = getMainhandTypeId(player) === PLATFORM_TOOL;
        if (!holdingTool && getHeldEntityClass(player) !== TRAIN && !(settings.alwaysVisible && (trains.size ?? trains.length))) continue;
        const where = player.location, dimension = player.dimension.id;
        const selection = toolSelectionOf(player.id);
        let budget = MAX_OUTLINE_DOTS;
        for (const train of trains) {
            const platform = platformOf(train);
            if (!platform || train.dimension !== dimension || runs.get(train.id)?.smooth) continue;
            const { min, max } = platform.box;
            const cx = (min.x + max.x + 1) / 2, cy = (min.y + max.y + 1) / 2, cz = (min.z + max.z + 1) / 2;
            if ((cx - where.x) ** 2 + (cy - where.y) ** 2 + (cz - where.z) ** 2 > OUTLINE_RADIUS ** 2) continue;
            budget = drawBox(player, min, max, selection?.train === train ? SELECTED_PARTICLE : BOX_PARTICLE, budget);
            if (budget <= 0) break;
        }
        if (holdingTool && selection?.corner && budget > 0) drawBox(player, selection.corner, selection.corner, SELECTED_PARTICLE, budget);
    }
}

// SECTION: Stand-in Test
// /brr:platform_test: sample blocks, each with its stand-in right beside it (they should look the
// same), and a row of stand-ins gliding back and forth above, as a moving platform would.
// /brr:platform_test clear removes the stand-ins and puts back the blocks the test replaced.
const testStandinIds = new Set();
let testScene;

const TEST_SAMPLES = [
    ["minecraft:stone_bricks", {}],
    ["minecraft:oak_planks", {}],
    ["minecraft:oak_stairs", { weirdo_direction: 3 }],
    ["minecraft:oak_stairs", { weirdo_direction: 0 }],
    ["minecraft:glass", {}],
    ["minecraft:oak_slab", {}],
    ["minecraft:chest", { "minecraft:cardinal_direction": "north" }],
    ["brr:bm_acl", { "minecraft:cardinal_direction": "north" }],
    ["brr:bm_acl", { "minecraft:cardinal_direction": "east" }]
];

function resolveSample([typeId, states]) {
    try {
        return mc.BlockPermutation.resolve(typeId, states);
    } catch {
        try {
            return mc.BlockPermutation.resolve(typeId);
        } catch {
            return undefined;
        }
    }
}

export function clearStandinTest() {
    if (testScene?.interval !== undefined) system.clearRun(testScene.interval);
    const placed = testScene?.placed ?? [];
    testScene = undefined;
    findStandins(["brr_standin_test"]).forEach(removeStandin);
    for (const { dimension, at, previous } of placed) {
        try {
            const block = dimension.getBlock(at);
            if (previous) block?.setPermutation(previous);
            else block?.setType("minecraft:air");
        } catch { }
    }
    testStandinIds.clear();
}

/** Builds the test in front of the player and stands them facing it. Returns a message. */
export function startStandinTest(player) {
    clearStandinTest();
    testScene = { placed: [] };
    const view = player.getViewDirection();
    const forward = Math.abs(view.x) > Math.abs(view.z) ? { x: Math.sign(view.x), z: 0 } : { x: 0, z: Math.sign(view.z) || 1 };
    const right = { x: -forward.z, z: forward.x };
    const along = (from, n, up = 0) => ({ x: from.x + right.x * n, y: from.y + up, z: from.z + right.z * n });
    const dimension = player.dimension;
    const start = {
        x: Math.floor(player.location.x) + forward.x * 6 - right.x * 9,
        y: Math.floor(player.location.y),
        z: Math.floor(player.location.z) + forward.z * 6 - right.z * 9
    };
    const held = [], glide = [];
    TEST_SAMPLES.forEach((sample, i) => {
        const permutation = resolveSample(sample);
        if (!permutation) return;
        const real = along(start, i * 2);
        // Only into empty spots, so the test never overwrites part of the map.
        try {
            const block = dimension.getBlock(real);
            if (block && isSkip(block.typeId)) {
                testScene.placed.push({ dimension, at: real, previous: block.permutation });
                block.setPermutation(permutation);
            }
        } catch { }
        const still = spawnStandin(dimension, along(real, 1), permutation, "brr_standin_test");
        const moving = spawnStandin(dimension, along(real, 0, 3), permutation, "brr_standin_test");
        if (still) {
            testStandinIds.add(still.entity.id);
            held.push({ standin: still, at: along(real, 1) });
        }
        if (moving) {
            testStandinIds.add(moving.entity.id);
            glide.push({ standin: moving, at: along(real, 0, 3) });
        }
    });
    const begin = system.currentTick;
    testScene.interval = system.runInterval(() => {
        for (const { standin, at } of held) moveStandin(standin, at);
        // Three blocks along the row and back, every 4 seconds, as a platform at ~4.7 blocks/s would.
        const shift = Math.sin(((system.currentTick - begin) / 80) * Math.PI * 2) * 3;
        for (const { standin, at } of glide) moveStandin(standin, along(at, shift));
    }, 1);
    try {
        const eye = along(start, 8.5, 1);
        player.teleport({ x: eye.x + 0.5 - forward.x * 6, y: eye.y, z: eye.z + 0.5 - forward.z * 6 }, { facingLocation: { x: eye.x + 0.5, y: eye.y + 0.5, z: eye.z + 0.5 } });
    } catch { }
    return "§aStand-in test: each real block has its stand-in (an invisible sulfur cube) right beside it, and a row of stand-ins glides above. §f/brr:platform_test clear§7 removes it and puts back what was there.";
}

// SECTION: Startup
export function startPlatformSystem() {
    // Before any input can reach a train: note trips the world closed in the middle of.
    prepareAfterLoad();
    system.runInterval(tickTrains, 1);
    system.runInterval(retryPending, RETRY_EVERY_TICKS);
    system.runInterval(runOutlinePass, OUTLINE_INTERVAL_TICKS);
    system.runInterval(sweepStandins, 200);
    system.runTimeout(sweepStandins, 40);
    world.afterEvents.playerLeave.subscribe(({ playerId }) => toolSelections.delete(playerId));
    // Stand-ins are vanilla sulfur cubes: nobody may shear, swap, lead, name or hurt them, or their
    // block would drop (a duplicate of the real one) or the platform would lose it.
    try {
        world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
            try {
                if (event.target?.hasTag(STANDIN_TAG) || event.target?.hasTag(PART_TAG)) event.cancel = true;
            } catch { }
        });
    } catch { }
    try {
        world.beforeEvents.entityHurt?.subscribe((event) => {
            try {
                if (event.hurtEntity?.hasTag(STANDIN_TAG) || event.hurtEntity?.hasTag(PART_TAG)) event.cancel = true;
            } catch { }
        });
    } catch { }
    // Write the engine's records when the world closes, in case a trip changed them this second.
    try {
        system.beforeEvents.shutdown?.subscribe(() => {
            for (const id of runs.keys()) {
                const train = getEntityById(id);
                if (train) markEntityDirty(train);
            }
            saveNow();
        });
    } catch { }
}
