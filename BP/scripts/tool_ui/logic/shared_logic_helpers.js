// SECTION: Shared Logic UI Helpers

export function ensureBlockDataArray(blockEntry, key) {
    if (!blockEntry.data) blockEntry.data = {};
    if (!Array.isArray(blockEntry.data[key])) blockEntry.data[key] = [];
    return blockEntry.data[key];
}

export function getNamedTargetEntriesSafe(getNamedTargetEntries) {
    const entries = typeof getNamedTargetEntries === "function" ? getNamedTargetEntries() : [];
    return entries.filter(entry => entry?.name);
}

export function buildRunOutputOptions(blockOutputs) {
    const outputNames = blockOutputs.map(output => output.name).filter(Boolean);
    return ["(None)", ...outputNames];
}