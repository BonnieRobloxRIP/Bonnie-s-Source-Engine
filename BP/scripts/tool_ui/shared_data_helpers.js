import { world, system } from "@minecraft/server";

// SECTION: Chunked Dynamic Property Storage
const MAX_CHUNK_SIZE = 28000;
const BLOCKS_KEY = "blocks";
const CACHE_TTL_TICKS = 10;

let cachedBlocks = null;
let cachedAtTick = -1;
let blocksRevision = 0;

export function loadLargeJSON(keyBase) {
    const count = world.getDynamicProperty(`${keyBase}_count`);
    if (typeof count !== "number") return [];

    let result = "";
    for (let i = 0; i < count; i++) {
        const chunk = world.getDynamicProperty(`${keyBase}_${i}`);
        if (typeof chunk === "string") result += chunk;
    }

    try {
        const parsed = JSON.parse(result);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function saveLargeJSON(keyBase, value) {
    const json = JSON.stringify(value);

    let index = 0;
    while (world.getDynamicProperty(`${keyBase}_${index}`) !== undefined) {
        world.setDynamicProperty(`${keyBase}_${index}`, undefined);
        index++;
    }

    index = 0;
    for (let pos = 0; pos < json.length; pos += MAX_CHUNK_SIZE) {
        world.setDynamicProperty(`${keyBase}_${index}`, json.slice(pos, pos + MAX_CHUNK_SIZE));
        index++;
    }
    world.setDynamicProperty(`${keyBase}_count`, index);

    if (keyBase === BLOCKS_KEY) {
        cachedBlocks = Array.isArray(value) ? value : [];
        cachedAtTick = system.currentTick;
        blocksRevision++;
    }
}

// SECTION: Block Registry Cache
// Reading the registry means re-parsing every dynamic property chunk, so every subsystem
// shares this one tick-scoped cache instead of loading its own copy each loop.
export function getBlocks(forceRefresh = false) {
    if (!forceRefresh && cachedBlocks && (system.currentTick - cachedAtTick) < CACHE_TTL_TICKS) {
        return cachedBlocks;
    }

    cachedBlocks = loadLargeJSON(BLOCKS_KEY);
    cachedAtTick = system.currentTick;
    return cachedBlocks;
}

export function saveBlocks(blocks) {
    saveLargeJSON(BLOCKS_KEY, blocks);
}

export function getBlocksRevision() {
    return blocksRevision;
}

export function invalidateBlocksCache() {
    cachedAtTick = -1;
}

// SECTION: Registry Queries
export function getBlocksTargetingCurrent(currentBlockName) {
    const name = `${currentBlockName ?? ""}`.trim();
    if (!name) return [];

    const inputs = [];
    for (const block of getBlocks()) {
        const outputs = block?.data?.outputs;
        if (!Array.isArray(outputs)) continue;

        for (const output of outputs) {
            if (`${output?.targetName ?? ""}`.trim() !== name) continue;
            inputs.push({
                sourceBlockName: block.data.name || `[Block at ${block.x},${block.y},${block.z}]`,
                outputName: output?.name || "(unnamed)"
            });
        }
    }

    return inputs;
}

export function getNamedTargetEntries() {
    const seen = new Set();
    const entries = [];

    for (const block of getBlocks()) {
        const name = `${block?.data?.name ?? ""}`.trim();
        if (!name || seen.has(name)) continue;

        seen.add(name);
        entries.push({ name, typeId: `${block?.typeId ?? ""}` });
    }

    return entries;
}

export function getNamedTargets() {
    return getNamedTargetEntries().map(entry => entry.name);
}