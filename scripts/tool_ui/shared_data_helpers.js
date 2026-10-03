import { world } from "@minecraft/server";

// SECTION: Chunked Dynamic Property Storage
const MAX_CHUNK_SIZE = 28000;
const BLOCKS_KEY = "blocks";

let cachedBlocks = null;
let blocksRevision = 0;
const lastSavedJsonByKey = new Map();

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
    if (lastSavedJsonByKey.get(keyBase) === json) return;

    let index = 0;
    for (let pos = 0; pos < json.length; pos += MAX_CHUNK_SIZE) {
        world.setDynamicProperty(`${keyBase}_${index}`, json.slice(pos, pos + MAX_CHUNK_SIZE));
        index++;
    }
    world.setDynamicProperty(`${keyBase}_count`, index);

    // Clear leftover chunks from a previously longer payload.
    while (world.getDynamicProperty(`${keyBase}_${index}`) !== undefined) {
        world.setDynamicProperty(`${keyBase}_${index}`, undefined);
        index++;
    }
    lastSavedJsonByKey.set(keyBase, json);

    if (keyBase === BLOCKS_KEY) {
        cachedBlocks = Array.isArray(value) ? value : [];
        blocksRevision++;
    }
}

// SECTION: Block Registry Cache
// All writes go through saveLargeJSON (which refreshes the cache), so the registry is only
// re-parsed on first use or explicit refresh; re-parsing on a timer churned script memory.
export function getBlocks(forceRefresh = false) {
    if (!forceRefresh && cachedBlocks) {
        return cachedBlocks;
    }

    cachedBlocks = loadLargeJSON(BLOCKS_KEY);
    return cachedBlocks;
}

export function saveBlocks(blocks) {
    saveLargeJSON(BLOCKS_KEY, blocks);
}

export function getBlocksRevision() {
    return blocksRevision;
}

export function invalidateBlocksCache() {
    cachedBlocks = null;
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