import { world } from "@minecraft/server";

// SECTION: Per-Entity Persistence
// Every engine entity is stored in its own world dynamic property, so changing one entity
// rewrites only that entity instead of the whole map. Brushes are stored as merged boxes, so a
// 20x10x1 clip wall is one record of a few dozen characters instead of 200 entries.
//
// Record layout (JSON): { v, t: typeId, d: dimension, b: [[x1,y1,z1,x2,y2,z2], ...], k: keyvalues, s: disabled }

const ENTITY_PREFIX = "bse:e:";
const CHUNK_PREFIX = "bse:c:";
const NEXT_ID_KEY = "bse:next_id";
const RECORD_VERSION = 1;
// Dynamic property strings are capped at 32767 characters; leave headroom.
const MAX_PROPERTY_LENGTH = 30000;
const CHUNK_MARKER = "\u0001";

const cellKey = (x, y, z) => `${x},${y},${z}`;

// SECTION: Box Compression
// Greedy merge: take the lowest remaining cell, grow along x, then z, then y while the whole
// face is present. Cells are visited in (y, z, x) order, so each start cell is its box's minimum.
export function cellsToBoxes(cells) {
    const remaining = new Set(cells.map(cell => cellKey(cell.x, cell.y, cell.z)));
    const sorted = [...cells].sort((a, b) => a.y - b.y || a.z - b.z || a.x - b.x);
    const boxes = [];

    for (const start of sorted) {
        if (!remaining.has(cellKey(start.x, start.y, start.z))) continue;

        let x2 = start.x;
        while (remaining.has(cellKey(x2 + 1, start.y, start.z))) x2++;

        let z2 = start.z;
        while (rowPresent(remaining, start.x, x2, start.y, z2 + 1)) z2++;

        let y2 = start.y;
        while (layerPresent(remaining, start.x, x2, y2 + 1, start.z, z2)) y2++;

        for (let y = start.y; y <= y2; y++) {
            for (let z = start.z; z <= z2; z++) {
                for (let x = start.x; x <= x2; x++) remaining.delete(cellKey(x, y, z));
            }
        }
        boxes.push([start.x, start.y, start.z, x2, y2, z2]);
    }

    return boxes;
}

function rowPresent(remaining, x1, x2, y, z) {
    for (let x = x1; x <= x2; x++) {
        if (!remaining.has(cellKey(x, y, z))) return false;
    }
    return true;
}

function layerPresent(remaining, x1, x2, y, z1, z2) {
    for (let z = z1; z <= z2; z++) {
        if (!rowPresent(remaining, x1, x2, y, z)) return false;
    }
    return true;
}

export function boxesToCells(boxes) {
    const cells = [];
    for (const box of Array.isArray(boxes) ? boxes : []) {
        if (!Array.isArray(box) || box.length !== 6 || !box.every(Number.isFinite)) continue;
        const [x1, y1, z1, x2, y2, z2] = box;
        for (let y = y1; y <= y2; y++) {
            for (let z = z1; z <= z2; z++) {
                for (let x = x1; x <= x2; x++) cells.push({ x, y, z });
            }
        }
    }
    return cells;
}

// SECTION: Record Encoding
export function encodeEntity(entity) {
    return {
        v: RECORD_VERSION,
        t: entity.typeId,
        d: entity.dimension,
        b: cellsToBoxes(entity.cells),
        k: entity.data ?? {},
        s: entity.disabled ? 1 : 0
    };
}

export function decodeEntity(id, record) {
    if (!record || typeof record !== "object" || record.v !== RECORD_VERSION) return null;
    if (typeof record.t !== "string" || typeof record.d !== "string") return null;

    const cells = boxesToCells(record.b);
    if (cells.length === 0) return null;

    return {
        id,
        typeId: record.t,
        dimension: record.d,
        cells,
        data: record.k && typeof record.k === "object" ? record.k : {},
        disabled: record.s === 1
    };
}

// SECTION: Dynamic Property Access
function readRaw(id) {
    const head = world.getDynamicProperty(`${ENTITY_PREFIX}${id}`);
    if (typeof head !== "string") return undefined;
    if (!head.startsWith(CHUNK_MARKER)) return head;

    const count = Number.parseInt(head.slice(1), 10) || 0;
    let json = "";
    for (let i = 0; i < count; i++) {
        const chunk = world.getDynamicProperty(`${CHUNK_PREFIX}${id}:${i}`);
        if (typeof chunk !== "string") return undefined;
        json += chunk;
    }
    return json;
}

function getStoredChunkCount(id) {
    const head = world.getDynamicProperty(`${ENTITY_PREFIX}${id}`);
    if (typeof head !== "string" || !head.startsWith(CHUNK_MARKER)) return 0;
    return Number.parseInt(head.slice(1), 10) || 0;
}

function clearChunks(id, fromIndex, toCount) {
    for (let i = fromIndex; i < toCount; i++) {
        world.setDynamicProperty(`${CHUNK_PREFIX}${id}:${i}`, undefined);
    }
}

export function writeEntity(entity) {
    const json = JSON.stringify(encodeEntity(entity));
    const previousChunks = getStoredChunkCount(entity.id);

    if (json.length <= MAX_PROPERTY_LENGTH) {
        world.setDynamicProperty(`${ENTITY_PREFIX}${entity.id}`, json);
        clearChunks(entity.id, 0, previousChunks);
        return;
    }

    let count = 0;
    for (let pos = 0; pos < json.length; pos += MAX_PROPERTY_LENGTH) {
        world.setDynamicProperty(`${CHUNK_PREFIX}${entity.id}:${count}`, json.slice(pos, pos + MAX_PROPERTY_LENGTH));
        count++;
    }
    world.setDynamicProperty(`${ENTITY_PREFIX}${entity.id}`, `${CHUNK_MARKER}${count}`);
    clearChunks(entity.id, count, previousChunks);
}

export function eraseEntity(id) {
    clearChunks(id, 0, getStoredChunkCount(id));
    world.setDynamicProperty(`${ENTITY_PREFIX}${id}`, undefined);
}

export function loadStoredEntities() {
    const loaded = [];
    for (const key of world.getDynamicPropertyIds()) {
        if (!key.startsWith(ENTITY_PREFIX)) continue;
        const id = key.slice(ENTITY_PREFIX.length);

        let entity = null;
        try {
            const raw = readRaw(id);
            entity = raw === undefined ? null : decodeEntity(id, JSON.parse(raw));
        } catch {
            entity = null;
        }

        if (entity) loaded.push(entity);
        else console.warn(`[BSE] Skipping unreadable entity record '${id}'.`);
    }
    return loaded;
}

export function readNextEntityId() {
    const raw = world.getDynamicProperty(NEXT_ID_KEY);
    return typeof raw === "number" && Number.isFinite(raw) && raw >= 1 ? raw : 1;
}

export function writeNextEntityId(next) {
    world.setDynamicProperty(NEXT_ID_KEY, next);
}
