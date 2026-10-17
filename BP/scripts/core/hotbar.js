import { GameMode, ItemLockMode, ItemStack, system, world } from "@minecraft/server";

// The original's five item slots (ItemManager.numSlots): one item in each, and no way to stash one
// anywhere else. Items given here are locked in their slot (they can't be moved into the rest of the
// inventory, or dropped); a pickup with all five full trades places with the selected item
// (ItemManager.CollectItem), which the caller puts down where the pickup was.
export const HOTBAR_SIZE = 5;
const SWEEP_TICKS = 10;
const IN_MENU_PROPERTY = "brr:in_menu";

function containerOf(player) {
    try { return player.getComponent("minecraft:inventory")?.container; } catch { return undefined; }
}

// one of an item, locked in whichever slot it goes into
export function hotbarItem(itemOrId) {
    const item = typeof itemOrId === "string" ? new ItemStack(itemOrId, 1) : itemOrId;
    item.amount = 1;
    try { item.lockMode = ItemLockMode.slot; } catch { }
    return item;
}

// the first of the five slots with nothing in it
export function freeHotbarSlot(player) {
    const container = containerOf(player);
    if (!container) return undefined;
    for (let slot = 0; slot < HOTBAR_SIZE; slot++) {
        if (!container.getItem(slot)) return slot;
    }
    return undefined;
}

export function isHotbarFull(player) {
    return freeHotbarSlot(player) === undefined;
}

// puts one item in the first free slot; false (and nothing changes) when all five are taken
export function giveToHotbar(player, itemOrId) {
    const slot = freeHotbarSlot(player);
    if (slot === undefined) return false;
    containerOf(player).setItem(slot, hotbarItem(itemOrId));
    return true;
}

// the selected slot, kept within the five
export function selectedHotbarSlot(player) {
    const slot = player.selectedSlotIndex;
    return slot < HOTBAR_SIZE ? slot : HOTBAR_SIZE - 1;
}

// CollectItem with every slot full: the item takes the selected item's place. Returns the item it
// replaced (the caller puts it down where the pickup was), or undefined if nothing was swapped.
export function swapIntoHotbar(player, itemOrId) {
    const container = containerOf(player);
    if (!container) return undefined;
    const slot = selectedHotbarSlot(player);
    const replaced = container.getItem(slot);
    container.setItem(slot, hotbarItem(itemOrId));
    return replaced;
}

function inRun(player) {
    if (player.getDynamicProperty(IN_MENU_PROPERTY) !== false) return false;
    try { return player.getGameMode() !== GameMode.Creative; } catch { return false; }
}

// Players in a game: the selection never leaves the five slots (scrolling past either end wraps
// round), and anything that got into the rest of the inventory some other way goes back into a free
// slot, or is dropped (main.js turns dropped items into their item blocks).
const lastSlot = new Map();
export function startHotbar() {
    world.afterEvents.playerLeave.subscribe(({ playerId }) => lastSlot.delete(playerId));
    system.runInterval(() => {
        const sweep = system.currentTick % SWEEP_TICKS === 0;
        for (const player of world.getAllPlayers()) {
            if (!inRun(player)) continue;
            const selected = player.selectedSlotIndex;
            if (selected >= HOTBAR_SIZE) {
                // past slot 5 from slot 5 (scrolling on): round to the first; from slot 1 back: to the last
                try { player.selectedSlotIndex = lastSlot.get(player.id) === HOTBAR_SIZE - 1 ? 0 : HOTBAR_SIZE - 1; } catch { }
            }
            lastSlot.set(player.id, player.selectedSlotIndex);
            if (sweep) tidy(player);
        }
    }, 1);
}

function tidy(player) {
    const container = containerOf(player);
    if (!container) return;
    for (let slot = 0; slot < HOTBAR_SIZE; slot++) {
        const item = container.getItem(slot);
        if (!item || item.lockMode === ItemLockMode.slot) continue;
        container.setItem(slot, hotbarItem(item));
    }
    for (let slot = HOTBAR_SIZE; slot < container.size; slot++) {
        const item = container.getItem(slot);
        if (!item) continue;
        container.setItem(slot);
        if (giveToHotbar(player, item)) continue;
        try { player.dimension.spawnItem(item, player.location); } catch { }
    }
}
