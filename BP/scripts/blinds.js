import { NEIGHBOR_OFFSETS } from "./core/math.js";
import { invalidateBlock } from "./core/block_cache.js";

export const BLINDS_BLOCKS = new Set(["brr:blinds_left", "brr:blinds_right"]);

const HORIZONTAL_OFFSETS = NEIGHBOR_OFFSETS.filter((offset) => offset.y === 0);

const MAX_WINDOW_THICKNESS = 2;

function isWindowBlock(block) {
    return block.typeId.includes("window");
}

// the block on the far side of the window that `block` is hanging on, looking along `offset`
function acrossWindow(block, offset) {
    const dimension = block.dimension;
    for (let step = 1; step <= MAX_WINDOW_THICKNESS + 1; step++) {
        const next = dimension.getBlock({ x: block.x + offset.x * step, y: block.y, z: block.z + offset.z * step });
        if (!next) return undefined;
        if (!isWindowBlock(next)) return step > 1 ? next : undefined;
    }
    return undefined;
}

// every blinds piece connected to startBlock (both halves, both sides);
// throughWindow also pulls in blinds hanging on the opposite face of the same window
function findBlindsGroup(startBlock, throughWindow = false) {
    const dimension = startBlock.dimension;
    const found = [];
    const visited = new Set();
    const stack = [startBlock];

    while (stack.length > 0) {
        const current = stack.pop();
        const key = `${current.x},${current.y},${current.z}`;
        if (visited.has(key)) continue;
        visited.add(key);
        if (!BLINDS_BLOCKS.has(current.typeId)) continue;
        found.push(current);

        for (const offset of NEIGHBOR_OFFSETS) {
            const neighbor = dimension.getBlock({ x: current.x + offset.x, y: current.y + offset.y, z: current.z + offset.z });
            if (neighbor) stack.push(neighbor);
        }
        if (!throughWindow) continue;
        for (const offset of HORIZONTAL_OFFSETS) {
            const across = acrossWindow(current, offset);
            if (across) stack.push(across);
        }
    }
    return found;
}

function toggleBlinds(startBlock) {
    const group = findBlindsGroup(startBlock, true);
    if (group.length === 0) return;
    const open = !startBlock.permutation.getState("brr:open");
    for (const block of group) {
        block.setPermutation(block.permutation.withState("brr:open", open));
        invalidateBlock(block.dimension, block.location);
    }
    startBlock.dimension.playSound("block.blinds_open", { x: startBlock.x + 0.5, y: startBlock.y + 0.5, z: startBlock.z + 0.5 });
}

// window blocks that just smashed take any blinds hanging on them down too
export function removeBlindsAround(windowBlocks) {
    for (const windowBlock of windowBlocks) {
        const dimension = windowBlock.dimension;
        for (const offset of HORIZONTAL_OFFSETS) {
            const neighbor = dimension.getBlock({ x: windowBlock.x + offset.x, y: windowBlock.y, z: windowBlock.z + offset.z });
            if (!neighbor || !BLINDS_BLOCKS.has(neighbor.typeId)) continue;
            for (const block of findBlindsGroup(neighbor)) {
                block.setType("minecraft:air");
                invalidateBlock(dimension, block.location);
            }
        }
    }
}

// the window a set of blinds is hanging on, so the hammer still works through closed blinds
function findAdjacentBlock(startBlock, predicate) {
    for (const block of findBlindsGroup(startBlock)) {
        for (const offset of HORIZONTAL_OFFSETS) {
            const neighbor = block.dimension.getBlock({ x: block.x + offset.x, y: block.y, z: block.z + offset.z });
            if (neighbor && predicate(neighbor)) return neighbor;
        }
    }
    return undefined;
}

export function registerBlindsComponents(blockComponentRegistry, { hammerId, isIntactWindow, breakWindowGroup, useHammer }) {
    blockComponentRegistry.registerCustomComponent("brr:blinds", {
        onPlayerInteract({ block, player }) {
            const held = player?.getComponent("minecraft:inventory")?.container?.getItem(player.selectedSlotIndex);
            if (held?.typeId === hammerId) {
                const window = findAdjacentBlock(block, isIntactWindow);
                if (window) {
                    if (breakWindowGroup(window)) useHammer?.(player);
                    return;
                }
            }
            toggleBlinds(block);
        }
    });
}
