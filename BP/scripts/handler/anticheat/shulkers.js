import { world, system } from "@minecraft/server";
import { reportBlocked } from "./common.js";

// SECTION: Shulker Nesting
// A shulker box item's contents can't be read from a script, only a placed box's. So nested boxes
// are popped out onto the ground when a box is placed and while it is open, and a box that still
// holds one can't be broken: it never goes back into an inventory nested.

const WATCH_TICKS = 1200;
const WATCH_INTERVAL_TICKS = 5;

// "dimension|x|y|z" -> { dimension, location, until, player } for boxes opened recently.
const openedBoxes = new Map();

const isShulkerBox = typeId => typeof typeId === "string" && typeId.endsWith("shulker_box");
const keyOf = block => `${block.dimension.id}|${block.x}|${block.y}|${block.z}`;

function getContainer(block) {
    try {
        return block.getComponent("minecraft:inventory")?.container;
    } catch {
        return undefined;
    }
}

// A box that can't be read is treated as fine, so an error never stops a normal box from breaking.
function holdsShulkerBox(block) {
    try {
        const container = getContainer(block);
        if (!container) return false;
        for (let slot = 0; slot < container.size; slot++) {
            if (isShulkerBox(container.getItem(slot)?.typeId)) return true;
        }
    } catch { }
    return false;
}

// Drops the nested boxes on top of the box; returns how many there were.
function ejectNested(block) {
    const container = getContainer(block);
    if (!container) return 0;

    const dropAt = { x: block.x + 0.5, y: block.y + 1.1, z: block.z + 0.5 };
    let count = 0;
    for (let slot = 0; slot < container.size; slot++) {
        const item = container.getItem(slot);
        if (!isShulkerBox(item?.typeId)) continue;
        container.setItem(slot);
        block.dimension.spawnItem(item, dropAt);
        count++;
    }
    return count;
}

world.afterEvents.playerPlaceBlock.subscribe(({ player, block }) => {
    if (!isShulkerBox(block.typeId)) return;
    const count = ejectNested(block);
    if (count > 0) reportBlocked(player, "Shulker Nesting", `placed a shulker box with ${count} inside`);
});

world.afterEvents.playerInteractWithBlock.subscribe(({ player, block }) => {
    if (!isShulkerBox(block.typeId)) return;
    openedBoxes.set(keyOf(block), {
        dimension: block.dimension,
        location: { x: block.x, y: block.y, z: block.z },
        until: system.currentTick + WATCH_TICKS,
        player
    });
});

system.runInterval(() => {
    if (openedBoxes.size === 0) return;

    const now = system.currentTick;
    for (const [key, box] of openedBoxes) {
        let block;
        try {
            block = box.dimension.getBlock(box.location);
        } catch { }
        if (!block || !isShulkerBox(block.typeId) || now > box.until) {
            openedBoxes.delete(key);
            continue;
        }

        const count = ejectNested(block);
        if (count > 0 && box.player.isValid) reportBlocked(box.player, "Shulker Nesting", `put ${count} shulker box(es) in a shulker box`);
    }
}, WATCH_INTERVAL_TICKS);

world.beforeEvents.playerBreakBlock.subscribe((event) => {
    if (event.cancel) return;

    const { player, block } = event;
    if (!isShulkerBox(block.typeId) || !holdsShulkerBox(block)) return;

    event.cancel = true;
    system.run(() => {
        if (block.isValid && isShulkerBox(block.typeId)) ejectNested(block);
    });
    reportBlocked(player, "Shulker Nesting", "tried to break a shulker box with another one inside");
});
