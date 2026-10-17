import { gameTick } from "../core/pause.js";
import { AIR, blockIndexAt, isPassableDecorType, typeIdOfIndex } from "../core/block_cache.js";
import { isDoorBarredForCharacters, isDoorLockedAt, isDoorType, openDoorAt, SMALL_DOOR_CLOSE_DELAY_TICKS } from "../doors.js";

const SQRT2 = Math.SQRT2;
// the 8 neighbours as parallel arrays, straight ones first (the hot loops index them directly)
const DIR_X = [1, -1, 0, 0, 1, 1, -1, -1];
const DIR_Z = [0, 0, 1, -1, 1, -1, 1, -1];
const DIR_COST = [1, 1, 1, 1, SQRT2, SQRT2, SQRT2, SQRT2];
// how far (manhattan) the goal of a partial path may drift before replanning
const PARTIAL_GOAL_TOLERANCE = 2;
// how many raw cells a single straight-line shortcut may span while smoothing
const MAX_SMOOTH_SPAN = 24;
// how far a walker's body reaches sideways from its centre while following a line
const DEFAULT_RADIUS = 0.3;
// full path searches the whole server runs per tick; walkers over budget wait their turn (oldest first)
const SEARCHES_PER_TICK = 2;
// a waiting walker that hasn't asked again for this long gave up (reset, removed, ...) and loses its place
const WAIT_FORGET_TICKS = 20;
// Search limits: maxNodes caps the work (cells expanded), maxDistance (manhattan) the area searched.
// Wander goals (pickWanderGoal) are always close, so their searches never expand more than
// LOCAL_MAX_NODES, even for a walker with the long-range budget for chasing across the school.
const DEFAULT_MAX_NODES = 800;
const DEFAULT_MAX_DISTANCE = 48;
const LOCAL_MAX_NODES = 800;
export const LONG_RANGE = { maxNodes: 2000, maxDistance: 96 };
// pickWanderGoal: how far a random point may be moved onto standable floor, and how many points it tries
const WANDER_SNAP_RADIUS = 3;
const WANDER_TRIES = 4;
// how long a walker whose wander goal didn't work out waits before picking another
export const WANDER_RETRY_TICKS = 10;

// ------------------------------------------------------------- cells ----

// per interned block type (block_cache.js blockIndexAt): what it is to a walker, worked out once
const TYPE_AIR = 1;
const TYPE_DOOR = 2;
const TYPE_DECOR = 4;
const TYPE_WINDOW = 8;
const NO_SUPPORT = TYPE_AIR | TYPE_DOOR | TYPE_DECOR | TYPE_WINDOW;
// Collisionless blocks that still look solid (so they still block sight, unlike passable decor):
// the wall under a smashed window, and the windows that are always broken. Walkers go through.
const WALK_THROUGH = new Set(["brr:wall01_nocollide", "brr:window_broke_left", "brr:window_broke_right"]);
// windows that can be smashed (main.js breakWindowGroup): a way through once brr:broken
const BREAKABLE_WINDOWS = new Set(["brr:window_left", "brr:window_right", "brr:window_obligatory"]);
// index 0 is an unloaded block: neither floor nor space
const typeFlags = [0];

function flagsOf(index) {
    let flags = typeFlags[index];
    if (flags === undefined) {
        const typeId = typeIdOfIndex(index);
        flags = (typeId === AIR ? TYPE_AIR : 0) | (isDoorType(typeId) ? TYPE_DOOR : 0)
            | (isPassableDecorType(typeId) || WALK_THROUGH.has(typeId) ? TYPE_DECOR : 0)
            | (BREAKABLE_WINDOWS.has(typeId) ? TYPE_WINDOW : 0);
        typeFlags[index] = flags;
    }
    return flags;
}

// the block cache only knows types, so a window's state is read from the block itself (few cells)
function isBrokenWindowAt(dimension, x, y, z) {
    try { return dimension.getBlock({ x, y, z })?.permutation.getState("brr:broken") === true; } catch { return false; }
}

// windows count as space here; standInfo then checks they're actually smashed
function isPathSpace(index, flags, doorFilter) {
    if ((flags & (TYPE_AIR | TYPE_DECOR | TYPE_WINDOW)) !== 0) return true;
    return (flags & TYPE_DOOR) !== 0 && (!doorFilter || doorFilter(typeIdOfIndex(index)));
}

// 0: can't stand there, 1: can, 2: can and it's a doorway (door at the feet or head).
// Lock and bar state is only looked up for actual door blocks.
function standInfo(dimension, x, y, z, doorFilter) {
    const support = blockIndexAt(dimension, x, y - 1, z);
    if (support === 0 || (flagsOf(support) & NO_SUPPORT) !== 0) return 0;
    const feet = blockIndexAt(dimension, x, y, z);
    const feetFlags = flagsOf(feet);
    if (!isPathSpace(feet, feetFlags, doorFilter)) return 0;
    const head = blockIndexAt(dimension, x, y + 1, z);
    const headFlags = flagsOf(head);
    if (!isPathSpace(head, headFlags, doorFilter)) return 0;
    if ((feetFlags & TYPE_WINDOW) !== 0 && !isBrokenWindowAt(dimension, x, y, z)) return 0;
    if ((headFlags & TYPE_WINDOW) !== 0 && !isBrokenWindowAt(dimension, x, y + 1, z)) return 0;
    let door = false;
    if ((feetFlags & TYPE_DOOR) !== 0) {
        if (isDoorLockedAt(dimension, x, y, z) || isDoorBarredForCharacters(dimension, x, y, z, typeIdOfIndex(feet))) return 0;
        door = true;
    }
    if ((headFlags & TYPE_DOOR) !== 0) {
        if (isDoorLockedAt(dimension, x, y + 1, z) || isDoorBarredForCharacters(dimension, x, y + 1, z, typeIdOfIndex(head))) return 0;
        door = true;
    }
    return door ? 2 : 1;
}

// needs solid non-door support and two blocks of air-or-door clearance
export function canStandAt(dimension, x, y, z, doorFilter) {
    return standInfo(dimension, x, y, z, doorFilter) !== 0;
}

function isDoorCell(dimension, x, y, z) {
    return ((flagsOf(blockIndexAt(dimension, x, y, z)) | flagsOf(blockIndexAt(dimension, x, y + 1, z))) & TYPE_DOOR) !== 0;
}

const cellKey = (x, z) => (x & 0x3ffff) * 0x40000 + (z & 0x3ffff);

// memoised walkability test for one horizontal slice; door cells are optional obstacles
function createWalkTest(dimension, y, allowDoors, doorFilter) {
    const cache = new Map();
    return (x, z) => {
        const key = cellKey(x, z);
        let value = cache.get(key);
        if (value === undefined) {
            const info = standInfo(dimension, x, y, z, doorFilter);
            value = info === 1 || (allowDoors && info === 2);
            cache.set(key, value);
        }
        return value;
    };
}

// The nearest standable cell within `radius` (square) of (x, z) at height y, or undefined.
export function nearestStandable(dimension, x, y, z, radius, doorFilter) {
    if (standInfo(dimension, x, y, z, doorFilter) !== 0) return { x, y, z };
    let best;
    let bestDistance = Infinity;
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
            const distance = dx * dx + dz * dz;
            if (distance === 0 || distance >= bestDistance) continue;
            if (standInfo(dimension, x + dx, y, z + dz, doorFilter) === 0) continue;
            best = { x: x + dx, y, z: z + dz };
            bestDistance = distance;
        }
    }
    return best;
}

// A random spot minDistance..maxDistance blocks away, at the walker's own height, moved onto the
// nearest floor it could stand on, so the path search has a reachable-looking goal instead of the
// inside of a wall. `angle` (radians) with `spread` limits the direction. Tries a few points and
// returns undefined if none lands near floor: wait WANDER_RETRY_TICKS before asking again.
// The goal is marked local, which keeps its search to the short-range node budget.
export function pickWanderGoal(entity, minDistance, maxDistance, { angle, spread = 0, doorFilter } = {}) {
    const location = entity.location;
    const dimension = entity.dimension;
    const y = Math.floor(location.y);
    for (let attempt = 0; attempt < WANDER_TRIES; attempt++) {
        const direction = angle === undefined ? Math.random() * Math.PI * 2 : angle + (Math.random() - 0.5) * spread;
        const distance = minDistance + Math.random() * (maxDistance - minDistance);
        const cell = nearestStandable(dimension,
            Math.floor(location.x + Math.cos(direction) * distance), y,
            Math.floor(location.z + Math.sin(direction) * distance), WANDER_SNAP_RADIUS, doorFilter);
        if (cell) return { x: cell.x + 0.5, y: location.y, z: cell.z + 0.5, local: true };
    }
    return undefined;
}

// visits every cell a ray touches (Amanatides-Woo) and fails on the first unwalkable one
function rayClear(x0, z0, x1, z1, walkable) {
    let cx = Math.floor(x0);
    let cz = Math.floor(z0);
    if (!walkable(cx, cz)) return false;
    const endX = Math.floor(x1);
    const endZ = Math.floor(z1);
    const dx = x1 - x0;
    const dz = z1 - z0;
    const stepX = dx > 0 ? 1 : -1;
    const stepZ = dz > 0 ? 1 : -1;
    const deltaX = dx !== 0 ? 1 / Math.abs(dx) : Infinity;
    const deltaZ = dz !== 0 ? 1 / Math.abs(dz) : Infinity;
    let nextX = dx !== 0 ? (dx > 0 ? cx + 1 - x0 : x0 - cx) * deltaX : Infinity;
    let nextZ = dz !== 0 ? (dz > 0 ? cz + 1 - z0 : z0 - cz) * deltaZ : Infinity;
    let guard = 0;
    while ((cx !== endX || cz !== endZ) && guard++ < 512) {
        if (nextX < nextZ) {
            cx += stepX;
            nextX += deltaX;
        } else {
            cz += stepZ;
            nextZ += deltaZ;
        }
        if (!walkable(cx, cz)) return false;
    }
    return true;
}

// clearance for a body of the given radius sweeping from (x0,z0) to (x1,z1)
export function lineClear(x0, z0, x1, z1, radius, walkable) {
    const dx = x1 - x0;
    const dz = z1 - z0;
    const length = Math.hypot(dx, dz);
    if (length === 0) return walkable(Math.floor(x0), Math.floor(z0));
    const offsetX = -dz / length * radius;
    const offsetZ = dx / length * radius;
    return rayClear(x0 + offsetX, z0 + offsetZ, x1 + offsetX, z1 + offsetZ, walkable)
        && rayClear(x0 - offsetX, z0 - offsetZ, x1 - offsetX, z1 - offsetZ, walkable);
}

// String pulling: collapses the grid path into the fewest straight legs that stay clear,
// so walkers travel at any angle instead of hugging the grid axes. Door cells are never
// skipped, keeping them explicit waypoints that still get opened before entry.
export function smoothPath(dimension, start, nodes, y, radius = DEFAULT_RADIUS, walkable = createWalkTest(dimension, y, false)) {
    if (nodes.length < 2) return nodes;
    const result = [];
    let anchorX = start.x;
    let anchorZ = start.z;
    let index = 0;
    while (index < nodes.length) {
        let best = index;
        const limit = Math.min(nodes.length - 1, index + MAX_SMOOTH_SPAN);
        for (let j = index + 1; j <= limit; j++) {
            const node = nodes[j];
            if (!lineClear(anchorX, anchorZ, node.x + 0.5, node.z + 0.5, radius, walkable)) break;
            best = j;
        }
        const node = nodes[best];
        result.push(node);
        anchorX = node.x + 0.5;
        anchorZ = node.z + 0.5;
        index = best + 1;
    }
    return result;
}

// ------------------------------------------------------------ search ----

// Scratch space shared by every search (they never overlap): one slot per cell of the square window
// around the start. A slot only counts for the current search while its stamp matches, so nothing
// has to be cleared or allocated between searches.
const SLOT_WALK_KNOWN = 1;
const SLOT_WALKABLE = 2;
const SLOT_DOOR = 4;
const SLOT_CLOSED = 8;
let slotCapacity = 0;
let slotStamp;
let slotFlags;
let slotCost;
let slotParent;
let stamp = 0;

function beginSearch(size) {
    if (size > slotCapacity) {
        slotCapacity = size;
        slotStamp = new Uint32Array(size);
        slotFlags = new Uint8Array(size);
        slotCost = new Float64Array(size);
        slotParent = new Int32Array(size);
        stamp = 0;
    }
    if (++stamp >= 0xffffffff) {
        slotStamp.fill(0);
        stamp = 1;
    }
}

// Walkability of the cell at window offset (dx, dz), memoised in its slot. The search window is
// centred on (startX, startZ) with half-width `half`; the returned function reads SLOT_* flags.
function windowWalk(dimension, y, startX, startZ, half, doorFilter) {
    const width = half * 2 + 1;
    const current = stamp;
    return (dx, dz) => {
        const slot = (dx + half) * width + (dz + half);
        if (slotStamp[slot] !== current) {
            slotStamp[slot] = current;
            slotFlags[slot] = 0;
            slotCost[slot] = Infinity;
        }
        let flags = slotFlags[slot];
        if ((flags & SLOT_WALK_KNOWN) === 0) {
            const info = standInfo(dimension, startX + dx, y, startZ + dz, doorFilter);
            flags |= SLOT_WALK_KNOWN | (info !== 0 ? SLOT_WALKABLE : 0) | (info === 2 ? SLOT_DOOR : 0);
            slotFlags[slot] = flags;
        }
        return flags;
    };
}

// the most recent findPath's window, so smoothing can reuse its walkability without looking anything up again
let lastSearch;

function lastSearchWalkable(x, z) {
    const search = lastSearch;
    const dx = x - search.startX;
    const dz = z - search.startZ;
    if (search.stamp !== stamp || dx < -search.half || dx > search.half || dz < -search.half || dz > search.half) {
        return standInfo(search.dimension, x, search.y, z) === 1;
    }
    const flags = search.walk(dx, dz);
    return (flags & SLOT_WALKABLE) !== 0 && (flags & SLOT_DOOR) === 0;
}

// binary min-heap on (f, then h) in growable typed arrays, shared like the slots above
let heapCapacity = 0;
let heapKey;
let heapF;
let heapH;
let heapSize = 0;

function growHeap() {
    const capacity = Math.max(1024, heapCapacity * 2);
    const keys = new Int32Array(capacity);
    const f = new Float64Array(capacity);
    const h = new Float64Array(capacity);
    if (heapCapacity > 0) {
        keys.set(heapKey);
        f.set(heapF);
        h.set(heapH);
    }
    heapKey = keys;
    heapF = f;
    heapH = h;
    heapCapacity = capacity;
}

function heapLess(a, b) {
    return heapF[a] < heapF[b] || (heapF[a] === heapF[b] && heapH[a] < heapH[b]);
}

function heapSwap(a, b) {
    const key = heapKey[a];
    heapKey[a] = heapKey[b];
    heapKey[b] = key;
    const f = heapF[a];
    heapF[a] = heapF[b];
    heapF[b] = f;
    const h = heapH[a];
    heapH[a] = heapH[b];
    heapH[b] = h;
}

function heapPush(key, f, h) {
    if (heapSize === heapCapacity) growHeap();
    let index = heapSize++;
    heapKey[index] = key;
    heapF[index] = f;
    heapH[index] = h;
    while (index > 0) {
        const parent = (index - 1) >> 1;
        if (!heapLess(index, parent)) break;
        heapSwap(index, parent);
        index = parent;
    }
}

function heapPop() {
    const top = heapKey[0];
    const last = heapSize - 1;
    heapSwap(0, last);
    heapSize = last;
    let index = 0;
    for (;;) {
        const left = index * 2 + 1;
        const right = left + 1;
        let smallest = index;
        if (left < last && heapLess(left, smallest)) smallest = left;
        if (right < last && heapLess(right, smallest)) smallest = right;
        if (smallest === index) break;
        heapSwap(index, smallest);
        index = smallest;
    }
    return top;
}

// Flat (same y as start) 8-direction A* with octile costs. Returns { nodes, complete, exhausted };
// when the goal can't be reached within the limits, nodes lead to the closest explored cell and
// complete is false. exhausted says the limits (not the map) stopped it, so searching again from
// further along may get closer. Diagonals never cut corners and never enter or leave a doorway.
export function findPath(dimension, start, destination, maxNodes, maxDistance, doorFilter) {
    const startX = Math.floor(start.x);
    const startZ = Math.floor(start.z);
    const y = Math.floor(start.y);
    const goalDx = Math.floor(destination.x) - startX;
    const goalDz = Math.floor(destination.z) - startZ;
    if (goalDx === 0 && goalDz === 0) return { nodes: [], complete: true, exhausted: false };

    const half = maxDistance + 1;
    const width = half * 2 + 1;
    beginSearch(width * width);
    const current = stamp;
    const walk = windowWalk(dimension, y, startX, startZ, half, doorFilter);
    lastSearch = { dimension, y, startX, startZ, half, walk, stamp: current };
    const startKey = half * width + half;
    const startDoor = isDoorCell(dimension, startX, y, startZ);

    const build = (key) => {
        const nodes = [];
        while (key !== startKey) {
            nodes.push({ x: startX + Math.floor(key / width) - half, y, z: startZ + (key % width) - half });
            key = slotParent[key];
        }
        return nodes.reverse();
    };

    const diagonalH = SQRT2 - 2;
    let ax = Math.abs(goalDx);
    let az = Math.abs(goalDz);
    const startH = ax + az + diagonalH * Math.min(ax, az);
    heapSize = 0;
    slotStamp[startKey] = current;
    slotFlags[startKey] = 0;
    slotCost[startKey] = 0;
    heapPush(startKey, startH, startH);
    let bestKey = startKey;
    let bestH = startH;
    let expanded = 0;
    let pruned = false;

    while (heapSize > 0 && expanded < maxNodes) {
        const key = heapPop();
        if ((slotFlags[key] & SLOT_CLOSED) !== 0) continue;
        slotFlags[key] |= SLOT_CLOSED;
        expanded++;

        const dx = Math.floor(key / width) - half;
        const dz = (key % width) - half;
        ax = Math.abs(goalDx - dx);
        az = Math.abs(goalDz - dz);
        const h = ax + az + diagonalH * Math.min(ax, az);
        if (dx === goalDx && dz === goalDz) return { nodes: build(key), complete: true, exhausted: false };
        if (h < bestH) {
            bestH = h;
            bestKey = key;
        }

        const base = slotCost[key];
        const hereDoor = key === startKey ? startDoor : (slotFlags[key] & SLOT_DOOR) !== 0;
        for (let direction = 0; direction < 8; direction++) {
            const ox = DIR_X[direction];
            const oz = DIR_Z[direction];
            const nx = dx + ox;
            const nz = dz + oz;
            if (Math.abs(nx) + Math.abs(nz) > maxDistance) {
                pruned = true;
                continue;
            }
            const nextKey = key + ox * width + oz;
            if (slotStamp[nextKey] === current) {
                if ((slotFlags[nextKey] & SLOT_CLOSED) !== 0) continue;
            }
            const nextCost = base + DIR_COST[direction];
            const nextFlags = walk(nx, nz);
            if (nextCost >= slotCost[nextKey] || (nextFlags & SLOT_WALKABLE) === 0) continue;
            if (direction >= 4) {
                if ((walk(nx, dz) & SLOT_WALKABLE) === 0 || (walk(dx, nz) & SLOT_WALKABLE) === 0) continue;
                if ((nextFlags & SLOT_DOOR) !== 0 || hereDoor) continue;
            }
            slotCost[nextKey] = nextCost;
            slotParent[nextKey] = key;
            ax = Math.abs(goalDx - nx);
            az = Math.abs(goalDz - nz);
            const nextH = ax + az + diagonalH * Math.min(ax, az);
            heapPush(nextKey, nextCost + nextH, nextH);
        }
    }

    const exhausted = pruned || (heapSize > 0 && expanded >= maxNodes);
    return { nodes: bestKey === startKey ? [] : build(bestKey), complete: false, exhausted };
}

export function farthestReachableFrom(dimension, start, source, maxNodes = 3000, maxDistance = 48) {
    const startX = Math.floor(start.x);
    const startZ = Math.floor(start.z);
    const y = Math.floor(start.y);
    const half = maxDistance + 1;
    const width = half * 2 + 1;
    beginSearch(width * width);
    const walk = windowWalk(dimension, y, startX, startZ, half);
    const walkable = (dx, dz) => (walk(dx, dz) & SLOT_WALKABLE) !== 0;
    // queued window offsets and step counts, as flat parallel lists
    const queueX = [0];
    const queueZ = [0];
    const queueSteps = [0];
    walk(0, 0);
    slotFlags[half * width + half] |= SLOT_CLOSED;
    let best = { x: startX + 0.5, y, z: startZ + 0.5 };
    let bestDistance = distanceFromSource(best.x, best.z);

    function distanceFromSource(x, z) {
        return (x - source.x) ** 2 + (z - source.z) ** 2;
    }

    for (let index = 0; index < queueX.length && index < maxNodes; index++) {
        const dx = queueX[index];
        const dz = queueZ[index];
        const steps = queueSteps[index];
        if (steps >= maxDistance) continue;
        const hereDoor = index === 0 ? isDoorCell(dimension, startX, y, startZ) : (slotFlags[(dx + half) * width + dz + half] & SLOT_DOOR) !== 0;
        for (let direction = 0; direction < 8; direction++) {
            const offsetX = DIR_X[direction];
            const offsetZ = DIR_Z[direction];
            const nextX = dx + offsetX;
            const nextZ = dz + offsetZ;
            const flags = walk(nextX, nextZ);
            if ((flags & SLOT_CLOSED) !== 0 || (flags & SLOT_WALKABLE) === 0) continue;
            if (direction >= 4) {
                if (!walkable(nextX, dz) || !walkable(dx, nextZ)) continue;
                if ((flags & SLOT_DOOR) !== 0 || hereDoor) continue;
            }
            slotFlags[(nextX + half) * width + nextZ + half] |= SLOT_CLOSED;
            queueX.push(nextX);
            queueZ.push(nextZ);
            queueSteps.push(steps + 1);
            const distance = distanceFromSource(startX + nextX + 0.5, startZ + nextZ + 0.5);
            if (distance > bestDistance) {
                best = { x: startX + nextX + 0.5, y, z: startZ + nextZ + 0.5 };
                bestDistance = distance;
            }
        }
    }
    return best;
}

// opens every door group occupying the node's column up to `height` blocks
export function openDoorsAt(dimension, node, height, closeDelayTicks = SMALL_DOOR_CLOSE_DELAY_TICKS, skipDoor) {
    let opened;
    for (let dy = 0; dy < height; dy++) {
        const y = node.y + dy;
        const index = blockIndexAt(dimension, node.x, y, node.z);
        if (opened?.has(y) || (flagsOf(index) & TYPE_DOOR) === 0 || skipDoor?.(typeIdOfIndex(index))) continue;
        for (const part of openDoorAt(dimension, { x: node.x, y, z: node.z }, closeDelayTicks)) {
            if (part.x === node.x && part.z === node.z) (opened ??= new Set()).add(part.y);
        }
    }
}

// ------------------------------------------------------- search budget ----

let budgetTick;
let searchesLeft = 0;
// navigators that were refused a search, oldest first
const waiting = [];

// true when `navigator` may run a full search this tick. Walkers that already waited go first.
function claimSearch(navigator, tick) {
    if (tick !== budgetTick) {
        budgetTick = tick;
        searchesLeft = SEARCHES_PER_TICK;
        for (let i = waiting.length - 1; i >= 0; i--) {
            if (tick - waiting[i].waitingAt > WAIT_FORGET_TICKS) waiting.splice(i, 1);
        }
    }
    let position = waiting.indexOf(navigator);
    const queued = position >= 0;
    if (!queued) position = waiting.length;
    // everyone ahead in the queue still needs a slot this tick
    if (position < searchesLeft) {
        if (queued) waiting.splice(position, 1);
        searchesLeft--;
        return true;
    }
    if (!queued) waiting.push(navigator);
    navigator.waitingAt = tick;
    return false;
}

// ----------------------------------------------------------- navigator ----

const NO_REPLAN = 0;
// the old path is still fine to walk while the new search waits for its turn
const SOFT_REPLAN = 1;
// the old path is unusable (none, other height, blocked): stand still until the search runs
const HARD_REPLAN = 2;

// Per-character path follower. Plans a grid path, string-pulls it into straight legs and walks
// them in any direction. Only replans when the goal drifts relative to the distance left, the
// straight line to the next waypoint gets blocked, a partial path cut short by the search limits
// runs out, or the path is older than maxAgeTicks. Searches share a per-tick budget; a walker
// whose search has to wait is `pending` (still on its way, just not moving this tick).
export class Navigator {
    constructor({ maxNodes = DEFAULT_MAX_NODES, maxDistance = DEFAULT_MAX_DISTANCE, maxAgeTicks = 100, clearanceCheckTicks = 5, doorFilter, doorHeight = 0, radius = DEFAULT_RADIUS, doorCloseTicks = SMALL_DOOR_CLOSE_DELAY_TICKS, skipOpenDoor } = {}) {
        this.maxNodes = maxNodes;
        this.maxDistance = maxDistance;
        this.maxAgeTicks = maxAgeTicks;
        this.clearanceCheckTicks = clearanceCheckTicks;
        this.doorFilter = doorFilter;
        this.doorHeight = doorHeight;
        this.radius = radius;
        this.doorCloseTicks = doorCloseTicks;
        this.skipOpenDoor = skipOpenDoor;
        this.waitingAt = -Infinity;
        this.reset();
    }

    reset() {
        this.nodes = undefined;
        this.index = 0;
        this.complete = false;
        // a partial path the search limits cut short: worth searching again from its end
        this.extendable = false;
        this.blocked = false;
        this.pending = false;
        this.goalX = 0;
        this.goalZ = 0;
        this.y = 0;
        this.plannedAt = 0;
        this.enteredIndex = -1;
        this.checkedIndex = -1;
        this.checkedAt = 0;
        // the last plan() call, so a peek and a glide in the same tick only plan once
        this.lastPlanTick = undefined;
        this.lastPlanCell = undefined;
        this.lastPlanGoal = undefined;
        this.lastPlanResult = false;
    }

    get remaining() {
        return this.nodes ? this.nodes.length - this.index : 0;
    }

    // out of path, and not just waiting for a search
    get finished() {
        return this.remaining === 0 && !this.pending;
    }

    replanReason(dimension, location, hereX, hereY, hereZ, goalX, goalZ, tick) {
        if (!this.nodes || hereY !== this.y || this.blocked) return HARD_REPLAN;
        if (tick - this.plannedAt > this.maxAgeTicks) return SOFT_REPLAN;
        const drift = Math.abs(goalX - this.goalX) + Math.abs(goalZ - this.goalZ);
        if (this.remaining === 0) {
            if (!this.complete) return drift > PARTIAL_GOAL_TOLERANCE || this.extendable ? SOFT_REPLAN : NO_REPLAN;
            return drift > 0 || hereX !== goalX || hereZ !== goalZ ? SOFT_REPLAN : NO_REPLAN;
        }
        const toGoal = Math.abs(goalX - hereX) + Math.abs(goalZ - hereZ);
        if (drift > Math.max(PARTIAL_GOAL_TOLERANCE, toGoal / 4)) return SOFT_REPLAN;
        const next = this.nodes[this.index];
        if (this.checkedIndex === this.index && tick - this.checkedAt < this.clearanceCheckTicks) return NO_REPLAN;
        this.checkedIndex = this.index;
        this.checkedAt = tick;
        const walkable = createWalkTest(dimension, this.y, true, this.doorFilter);
        if (!walkable(next.x, next.z) || !lineClear(location.x, location.z, next.x + 0.5, next.z + 0.5, this.radius, walkable)) {
            this.blocked = true;
            return HARD_REPLAN;
        }
        return NO_REPLAN;
    }

    // returns true when there is at least one waypoint left to walk
    plan(entity, destination) {
        const location = entity.location;
        const hereX = Math.floor(location.x);
        const hereY = Math.floor(location.y);
        const hereZ = Math.floor(location.z);
        const goalX = Math.floor(destination.x);
        const goalZ = Math.floor(destination.z);
        const tick = gameTick();
        const cell = cellKey(hereX, hereZ) * 512 + (hereY & 511);
        const goal = cellKey(goalX, goalZ);
        if (tick === this.lastPlanTick && cell === this.lastPlanCell && goal === this.lastPlanGoal) return this.lastPlanResult && this.remaining > 0;
        this.lastPlanTick = tick;
        this.lastPlanCell = cell;
        this.lastPlanGoal = goal;
        this.lastPlanResult = this.planNow(entity.dimension, location, destination, hereX, hereY, hereZ, goalX, goalZ, tick);
        return this.lastPlanResult;
    }

    planNow(dimension, location, destination, hereX, hereY, hereZ, goalX, goalZ, tick) {
        const reason = this.replanReason(dimension, location, hereX, hereY, hereZ, goalX, goalZ, tick);
        this.pending = false;
        if (reason === NO_REPLAN) return this.remaining > 0;
        // standing on the goal needs no search, so it never waits for one
        if ((hereX !== goalX || hereZ !== goalZ) && !claimSearch(this, tick)) {
            this.pending = true;
            return reason === SOFT_REPLAN && this.remaining > 0;
        }
        const maxNodes = destination.local === true ? Math.min(this.maxNodes, LOCAL_MAX_NODES) : this.maxNodes;
        const result = findPath(dimension, location, destination, maxNodes, this.maxDistance, this.doorFilter);
        this.nodes = result.nodes.length < 2 ? result.nodes : smoothPath(dimension, location, result.nodes, hereY, this.radius, lastSearchWalkable);
        this.index = 0;
        this.complete = result.complete;
        this.extendable = !result.complete && result.exhausted && result.nodes.length > 0;
        this.blocked = false;
        this.goalX = goalX;
        this.goalZ = goalZ;
        this.y = hereY;
        this.plannedAt = tick;
        this.enteredIndex = -1;
        this.checkedIndex = -1;
        return this.remaining > 0;
    }

    enter(dimension, node) {
        if (this.doorHeight > 0) openDoorsAt(dimension, node, this.doorHeight, this.doorCloseTicks, this.skipOpenDoor);
    }

    // walks `distance` blocks along the smoothed polyline, crossing as many waypoints as it fits.
    // `yaw` (degrees) overrides the default of facing the destination, for walkers that steer.
    // Returns false once there's nothing left to walk; true while moving or waiting for a search.
    follow(entity, destination, distance, yaw) {
        if (!this.plan(entity, destination)) return this.pending;
        const dimension = entity.dimension;
        const location = entity.location;
        let x = location.x;
        let z = location.z;
        let y = this.nodes[this.index].y;
        let budget = distance;
        while (this.index < this.nodes.length) {
            const node = this.nodes[this.index];
            if (this.enteredIndex !== this.index) {
                this.enter(dimension, node);
                this.enteredIndex = this.index;
            }
            y = node.y;
            const targetX = node.x + 0.5;
            const targetZ = node.z + 0.5;
            const dx = targetX - x;
            const dz = targetZ - z;
            const length = Math.hypot(dx, dz);
            if (length > budget) {
                if (budget > 0) {
                    x += dx / length * budget;
                    z += dz / length * budget;
                }
                break;
            }
            x = targetX;
            z = targetZ;
            budget -= length;
            this.index++;
        }
        entity.teleport({ x, y, z }, yaw === undefined ? { facingLocation: destination } : { rotation: { x: 0, y: yaw } });
        return true;
    }

    // the current waypoint and the one after it (either may be undefined), without moving;
    // check `pending` to tell "no path" from "waiting for a search"
    peek(entity, destination) {
        if (!this.plan(entity, destination)) return { next: undefined, after: undefined };
        return { next: this.nodes[this.index], after: this.nodes[this.index + 1] };
    }

    // interval movement: covers up to `maxSteps` blocks of path in one hop
    step(entity, destination, maxSteps) {
        return this.follow(entity, destination, maxSteps);
    }

    // continuous movement: covers `speed` blocks of path this tick
    glide(entity, destination, speed, yaw) {
        return this.follow(entity, destination, speed, yaw);
    }
}
