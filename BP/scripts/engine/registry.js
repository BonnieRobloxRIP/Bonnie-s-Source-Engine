import {
    loadStoredEntities,
    writeEntity,
    eraseEntity,
    readNextEntityId,
    writeNextEntityId
} from "./storage.js";
import { getClassDefaults } from "./classes.js";

// SECTION: Entity Registry
// In-memory home of every engine entity. An entity is
//   { id, typeId, dimension, cells: [{x,y,z}], data: {keyvalues..., outputs}, disabled }
// Point entities have one cell; brush entities own every tool block of their volume.
//
// Lookups are indexed by position, name and class, so runtime systems never scan the whole map.
// Mutations only touch memory and mark the entity dirty; flushRegistry() writes dirty entities
// to dynamic properties from a normal tick, which also makes every mutation safe to call from
// before-events (where dynamic property writes are not allowed).

const entities = new Map();
const byPos = new Map();
const byName = new Map();
const byClass = new Map();
const dirtyIds = new Set();
const erasedIds = new Set();
const disabledListeners = [];
const updateListeners = [];
const EMPTY_SET = new Set();

let revision = 0;
let loaded = false;
let nextId = 1;
let nextIdDirty = false;

export function posKey(dimension, x, y, z) {
    return `${dimension}|${x}|${y}|${z}`;
}

export function normalizeEntityName(name) {
    return `${name ?? ""}`.trim().toLowerCase();
}

// SECTION: Index Maintenance
function computeBounds(entity) {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const cell of entity.cells) {
        if (cell.x < minX) minX = cell.x;
        if (cell.y < minY) minY = cell.y;
        if (cell.z < minZ) minZ = cell.z;
        if (cell.x > maxX) maxX = cell.x;
        if (cell.y > maxY) maxY = cell.y;
        if (cell.z > maxZ) maxZ = cell.z;
    }
    entity.bounds = { minX, minY, minZ, maxX, maxY, maxZ };
    entity.center = { x: (minX + maxX + 1) / 2, y: (minY + maxY + 1) / 2, z: (minZ + maxZ + 1) / 2 };
}

function indexName(entity) {
    const name = normalizeEntityName(entity.data?.name);
    entity.indexedName = name;
    if (!name) return;
    let set = byName.get(name);
    if (!set) byName.set(name, set = new Set());
    set.add(entity);
}

function unindexName(entity) {
    const name = entity.indexedName;
    if (!name) return;
    const set = byName.get(name);
    set?.delete(entity);
    if (set?.size === 0) byName.delete(name);
    entity.indexedName = "";
}

function indexEntity(entity) {
    let classSet = byClass.get(entity.typeId);
    if (!classSet) byClass.set(entity.typeId, classSet = new Set());
    classSet.add(entity);

    for (const cell of entity.cells) {
        byPos.set(posKey(entity.dimension, cell.x, cell.y, cell.z), entity);
    }
    indexName(entity);
    computeBounds(entity);
}

function unindexEntity(entity) {
    const classSet = byClass.get(entity.typeId);
    classSet?.delete(entity);
    if (classSet?.size === 0) byClass.delete(entity.typeId);

    for (const cell of entity.cells) {
        const key = posKey(entity.dimension, cell.x, cell.y, cell.z);
        if (byPos.get(key) === entity) byPos.delete(key);
    }
    unindexName(entity);
}

function touch(entity) {
    if (entity) dirtyIds.add(entity.id);
    revision++;
}

// SECTION: Loading & Flushing
export function loadRegistry() {
    if (loaded) return;
    loaded = true;

    nextId = readNextEntityId();
    for (const entity of loadStoredEntities()) {
        // A cell can only belong to one entity; first one loaded wins.
        entity.cells = entity.cells.filter(cell => !byPos.has(posKey(entity.dimension, cell.x, cell.y, cell.z)));
        if (entity.cells.length === 0) {
            erasedIds.add(entity.id);
            continue;
        }
        entities.set(entity.id, entity);
        indexEntity(entity);

        const numericId = Number.parseInt(entity.id, 36);
        if (Number.isFinite(numericId) && numericId >= nextId) {
            nextId = numericId + 1;
            nextIdDirty = true;
        }
    }
    revision++;
}

export function isRegistryLoaded() {
    return loaded;
}

// Writes pending changes. Must run outside before-events.
export function flushRegistry() {
    if (nextIdDirty) {
        try {
            writeNextEntityId(nextId);
            nextIdDirty = false;
        } catch (error) {
            console.warn(`[BSE] Could not save entity id counter: ${error}`);
        }
    }

    for (const id of erasedIds) {
        try {
            eraseEntity(id);
        } catch (error) {
            console.warn(`[BSE] Could not erase entity '${id}': ${error}`);
        }
    }
    erasedIds.clear();

    for (const id of dirtyIds) {
        const entity = entities.get(id);
        if (!entity) continue;
        try {
            writeEntity(entity);
        } catch (error) {
            console.warn(`[BSE] Could not save entity '${id}': ${error}`);
        }
    }
    dirtyIds.clear();
}

export function hasPendingWrites() {
    return nextIdDirty || dirtyIds.size > 0 || erasedIds.size > 0;
}

// SECTION: Queries
// Bumped on every structural or keyvalue change; systems use it to rebuild derived caches.
export function getRegistryRevision() {
    return revision;
}

export function getEntityById(id) {
    return entities.get(id);
}

export function getEntityAt(dimension, x, y, z) {
    return byPos.get(posKey(dimension, x, y, z));
}

// Live set: copy it before mutating the registry while iterating.
export function getEntitiesOfClass(typeId) {
    return byClass.get(typeId) ?? EMPTY_SET;
}

export function getAllEntities() {
    return entities.values();
}

export function getEntityCount() {
    return entities.size;
}

// One { typeId, dimension, x, y, z, data } entry per engine block, for the engine locator.
export function getEngineCellEntries() {
    const entries = [];
    for (const entity of entities.values()) {
        for (const cell of entity.cells) {
            entries.push({ typeId: entity.typeId, dimension: entity.dimension, x: cell.x, y: cell.y, z: cell.z, data: entity.data });
        }
    }
    return entries;
}

// Source semantics: names are case-insensitive, several entities may share one, and a
// trailing '*' matches every name with that prefix.
export function findEntitiesByName(name) {
    const wanted = normalizeEntityName(name);
    if (!wanted) return [];

    if (wanted.endsWith("*")) {
        const prefix = wanted.slice(0, -1);
        const matches = [];
        for (const [entityName, set] of byName) {
            if (entityName.startsWith(prefix)) matches.push(...set);
        }
        return matches;
    }

    return [...(byName.get(wanted) ?? EMPTY_SET)];
}

// SECTION: Mutations
export function createEntity(typeId, dimension, cells, data = {}) {
    const entity = {
        id: (nextId++).toString(36),
        typeId,
        dimension,
        cells: [],
        data: { ...getClassDefaults(typeId), ...data },
        disabled: false
    };
    nextIdDirty = true;
    entity.disabled = Boolean(entity.data.startDisabled);
    if (!Array.isArray(entity.data.outputs)) entity.data.outputs = [];

    for (const cell of cells) {
        const key = posKey(dimension, cell.x, cell.y, cell.z);
        if (byPos.has(key)) removeCellAt(dimension, cell.x, cell.y, cell.z);
        entity.cells.push({ x: cell.x, y: cell.y, z: cell.z });
    }

    entities.set(entity.id, entity);
    indexEntity(entity);
    touch(entity);
    return entity;
}

export function addCell(entity, cell) {
    const key = posKey(entity.dimension, cell.x, cell.y, cell.z);
    const owner = byPos.get(key);
    if (owner === entity) return;
    if (owner) removeCellAt(entity.dimension, cell.x, cell.y, cell.z);

    entity.cells.push({ x: cell.x, y: cell.y, z: cell.z });
    byPos.set(key, entity);
    computeBounds(entity);
    touch(entity);
}

// Returns the entity that owned the cell (deleted if it was its last cell), or undefined.
export function removeCellAt(dimension, x, y, z) {
    const key = posKey(dimension, x, y, z);
    const entity = byPos.get(key);
    if (!entity) return undefined;

    byPos.delete(key);
    const index = entity.cells.findIndex(cell => cell.x === x && cell.y === y && cell.z === z);
    if (index !== -1) entity.cells.splice(index, 1);

    if (entity.cells.length === 0) {
        deleteEntity(entity);
    } else {
        computeBounds(entity);
        touch(entity);
    }
    return entity;
}

// Moves every cell of `sources` into `target` and deletes the sources; target keeps its keyvalues.
export function mergeEntities(target, sources) {
    for (const source of sources) {
        if (!source || source === target || !entities.has(source.id)) continue;
        for (const cell of source.cells) {
            target.cells.push(cell);
            byPos.set(posKey(target.dimension, cell.x, cell.y, cell.z), target);
        }
        source.cells = [];
        deleteEntity(source);
    }
    computeBounds(target);
    touch(target);
}

export function deleteEntity(entity) {
    if (!entities.has(entity.id)) return;
    unindexEntity(entity);
    entities.delete(entity.id);
    dirtyIds.delete(entity.id);
    erasedIds.add(entity.id);
    revision++;
}

export function updateEntityData(entity, data) {
    unindexName(entity);
    entity.data = data;
    if (!Array.isArray(entity.data.outputs)) entity.data.outputs = [];
    indexName(entity);
    touch(entity);
    for (const listener of updateListeners) {
        try {
            listener(entity);
        } catch { }
    }
}

// Called after an entity's keyvalues were replaced (form save or AddOutput).
export function onEntityDataUpdated(listener) {
    updateListeners.push(listener);
}

// Persists without bumping the revision: for runtime-only changes such as fire counts.
export function markEntityDirty(entity) {
    if (entity && entities.has(entity.id)) dirtyIds.add(entity.id);
}

export function setEntityDisabled(entity, disabled) {
    const next = Boolean(disabled);
    if (entity.disabled === next) return false;
    entity.disabled = next;
    markEntityDirty(entity);
    for (const listener of disabledListeners) {
        try {
            listener(entity);
        } catch { }
    }
    return true;
}

export function onEntityDisabledChanged(listener) {
    disabledListeners.push(listener);
}

// Test hook: forget everything without touching storage.
export function resetRegistryForTests() {
    entities.clear();
    byPos.clear();
    byName.clear();
    byClass.clear();
    dirtyIds.clear();
    erasedIds.clear();
    revision = 0;
    loaded = false;
    nextId = 1;
    nextIdDirty = false;
}
