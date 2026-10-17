import { blockTypeAt } from "./block_cache.js";

// Things that smash windows just by running into them (a monke, Neil, a hammered First Prize).
// main.js owns the window helpers and hands them over at startup.
let breakWindowGroup = () => false;
let isIntactWindow = () => false;

export function setWindowBreaker(options) {
    breakWindowGroup = options.breakWindowGroup ?? breakWindowGroup;
    isIntactWindow = options.isIntactWindow ?? isIntactWindow;
}

// the blocks just beside an entity at foot and head height, `reach` blocks out from its centre
export function touchedBlocks(entity, reach = 0.5) {
    const { x, y, z } = entity.location;
    const blocks = [];
    for (const [dx, dz] of [[reach, 0], [-reach, 0], [0, reach], [0, -reach]]) {
        for (const height of [0.5, 1.5]) {
            blocks.push({ x: Math.floor(x + dx), y: Math.floor(y + height), z: Math.floor(z + dz) });
        }
    }
    return blocks;
}

export function smashWindowAt(dimension, location) {
    if (!blockTypeAt(dimension, location.x, location.y, location.z)?.includes("window")) return false;
    let block;
    try { block = dimension.getBlock(location); } catch { }
    return !!block && isIntactWindow(block) && breakWindowGroup(block) !== false;
}

export function smashTouchedWindows(entity, reach = 0.5) {
    for (const location of touchedBlocks(entity, reach)) smashWindowAt(entity.dimension, location);
}
