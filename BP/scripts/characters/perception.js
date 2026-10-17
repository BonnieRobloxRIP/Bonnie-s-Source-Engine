import { GameMode } from "@minecraft/server";
import { blockIndexAt, blockTypeAt, isBallsPosterType, typeIdOfIndex } from "../core/block_cache.js";
import { isInMainMenu } from "../main_menu.js";

export function isTargetablePlayer(player) {
    // sitting in the main menu while others play a run (BP/scripts/run.js)
    if (isInMainMenu(player)) return false;
    const gameMode = player.getGameMode();
    return gameMode !== GameMode.Creative && gameMode !== GameMode.Spectator;
}

// isOpaque -> its answer per interned block type, so each type is classified once per filter.
// Filters must be stable functions of the typeId alone (each character keeps one at module level).
const opaqueTables = new WeakMap();

function opaqueTable(isOpaque) {
    let table = opaqueTables.get(isOpaque);
    if (!table) {
        table = [];
        opaqueTables.set(isOpaque, table);
    }
    return table;
}

// voxel traversal (each block on the line checked once); start and end blocks are skipped.
// isOpaque(typeId) receives undefined for unloaded blocks.
export function hasLineOfSight(dimension, from, to, isOpaque) {
    const table = opaqueTable(isOpaque);
    let x = Math.floor(from.x);
    let y = Math.floor(from.y);
    let z = Math.floor(from.z);
    const endX = Math.floor(to.x);
    const endY = Math.floor(to.y);
    const endZ = Math.floor(to.z);
    // A player can occupy a poster cell; skipping that endpoint would reveal them through it.
    if (isBallsPosterType(blockTypeAt(dimension, endX, endY, endZ))) return false;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    const stepX = Math.sign(dx);
    const stepY = Math.sign(dy);
    const stepZ = Math.sign(dz);
    const deltaX = dx !== 0 ? Math.abs(1 / dx) : Infinity;
    const deltaY = dy !== 0 ? Math.abs(1 / dy) : Infinity;
    const deltaZ = dz !== 0 ? Math.abs(1 / dz) : Infinity;
    let maxX = dx > 0 ? (x + 1 - from.x) / dx : dx < 0 ? (x - from.x) / dx : Infinity;
    let maxY = dy > 0 ? (y + 1 - from.y) / dy : dy < 0 ? (y - from.y) / dy : Infinity;
    let maxZ = dz > 0 ? (z + 1 - from.z) / dz : dz < 0 ? (z - from.z) / dz : Infinity;

    let remaining = Math.abs(endX - x) + Math.abs(endY - y) + Math.abs(endZ - z);
    while (remaining-- > 0) {
        if (maxX < maxY && maxX < maxZ) {
            x += stepX;
            maxX += deltaX;
        } else if (maxY < maxZ) {
            y += stepY;
            maxY += deltaY;
        } else {
            z += stepZ;
            maxZ += deltaZ;
        }
        if (x === endX && y === endY && z === endZ) return true;
        const index = blockIndexAt(dimension, x, y, z);
        let opaque = table[index];
        if (opaque === undefined) {
            opaque = !!isOpaque(typeIdOfIndex(index));
            table[index] = opaque;
        }
        if (opaque) return false;
    }
    return true;
}

export function isNearBlockType(dimension, center, radius, typeIds) {
    const cx = Math.floor(center.x);
    const cy = Math.floor(center.y);
    const cz = Math.floor(center.z);
    const radiusSquared = radius * radius;
    for (let x = -radius; x <= radius; x++) {
        for (let y = -radius; y <= radius; y++) {
            for (let z = -radius; z <= radius; z++) {
                if (x * x + y * y + z * z > radiusSquared) continue;
                if (typeIds.has(blockTypeAt(dimension, cx + x, cy + y, cz + z))) return true;
            }
        }
    }
    return false;
}

// caches compute(key) results for ttlTicks; returns (key, tick, compute) => value
export function createMemo(ttlTicks, maxEntries = 256) {
    const entries = new Map();
    return (key, tick, compute) => {
        const hit = entries.get(key);
        if (hit && tick - hit.at < ttlTicks) return hit.value;
        if (entries.size >= maxEntries) entries.clear();
        const value = compute();
        entries.set(key, { value, at: tick });
        return value;
    };
}

// Sight checks that don't need to run every tick: each viewer re-tests a target once every
// `interval` ticks and reuses the answer in between. Every memo gets its own random phase, so
// several viewers spread their re-checks over different ticks.
export class SightMemo {
    constructor(interval) {
        this.interval = interval;
        this.phase = Math.floor(Math.random() * interval);
        this.entries = new Map();
    }

    // compute() is the real check for this target (usually a player id)
    check(targetId, tick, compute) {
        const slot = Math.floor((tick + this.phase) / this.interval);
        const hit = this.entries.get(targetId);
        if (hit !== undefined && hit.slot === slot) return hit.value;
        const value = compute();
        if (hit !== undefined) {
            hit.slot = slot;
            hit.value = value;
        } else {
            if (this.entries.size >= 32) this.entries.clear();
            this.entries.set(targetId, { slot, value });
        }
        return value;
    }
}
