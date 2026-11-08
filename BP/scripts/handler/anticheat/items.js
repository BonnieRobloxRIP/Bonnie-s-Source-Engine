import { world, system } from "@minecraft/server";
import { alertOperators, reportBlocked } from "./common.js";

// SECTION: Impossible Durability (.unbreakable, .setDamage, .metadata on tools)
// The client's item commands edit the held item, and dropping it makes the edited copy real.
// In vanilla, wear never goes below 0 (unused) or past the item's maximum; the "unbreakable"
// command sets it to -32768. Such items are reset to unused: dropped items as they appear, and
// inventories whenever a player picks something up and every couple of seconds.
// Ammo counts too: the addon's ammo boxes keep their rounds in the durability bar.
//
// SECTION: Oversized Names (kill crashers)
// A kill crasher is a weapon renamed to something enormous: the kill message carries the
// weapon's name and crashes everyone who receives it. Items named longer than MAX_ITEM_NAME_LENGTH
// are deleted outright, on the same schedule as the durability check, plus whenever an inventory
// slot changes. death_messages.js also refuses to print such a name, to cover the gap in between.

const SWEEP_INTERVAL_TICKS = 40;
// Mainhand is a hotbar slot, which the inventory pass already covers.
const EQUIPMENT_SLOTS = ["Head", "Chest", "Legs", "Feet", "Offhand", "Body"];
const NEARBY_RADIUS = 8;
export const MAX_ITEM_NAME_LENGTH = 25;

/** True when the name is longer than any item is allowed to be named. Counts characters, not UTF-16 units. */
export function isOversizedName(name) {
    if (typeof name !== "string" || name.length <= MAX_ITEM_NAME_LENGTH) return false;
    return [...name].length > MAX_ITEM_NAME_LENGTH;
}

function hasOversizedName(item) {
    try {
        return isOversizedName(item?.nameTag);
    } catch {
        return false;
    }
}

// Resets impossible wear on the stack; true when it had to.
function fixDurability(item) {
    let durability;
    try {
        durability = item?.getComponent("minecraft:durability");
    } catch {
        return false;
    }
    if (!durability) return false;

    const { damage, maxDurability } = durability;
    if (damage >= 0 && damage <= maxDurability) return false;
    durability.damage = damage < 0 ? 0 : maxDurability;
    return true;
}

function fixPlayerItems(player) {
    let fixed = 0;
    let cleared = 0;

    const container = player.getComponent("minecraft:inventory")?.container;
    for (let slot = 0; slot < (container?.size ?? 0); slot++) {
        const item = container.getItem(slot);
        if (hasOversizedName(item)) {
            container.setItem(slot, undefined);
            cleared++;
            continue;
        }
        if (!fixDurability(item)) continue;
        container.setItem(slot, item);
        fixed++;
    }

    const equippable = player.getComponent("minecraft:equippable");
    for (const slot of equippable ? EQUIPMENT_SLOTS : []) {
        let item;
        try {
            item = equippable.getEquipment(slot);
        } catch {
            continue;
        }
        if (hasOversizedName(item)) {
            equippable.setEquipment(slot, undefined);
            cleared++;
            continue;
        }
        if (!fixDurability(item)) continue;
        equippable.setEquipment(slot, item);
        fixed++;
    }

    if (fixed > 0) reportBlocked(player, "Impossible Durability", `${fixed} item(s) reset to unused`);
    if (cleared > 0) reportBlocked(player, "Oversized Item Name", `${cleared} item(s) named over ${MAX_ITEM_NAME_LENGTH} characters deleted`);
}

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    if (entity?.typeId !== "minecraft:item") return;

    let item;
    try {
        item = entity.getComponent("minecraft:item")?.itemStack;
    } catch {
        return;
    }

    const { dimension, location } = entity;
    const nearbyNames = () => dimension.getPlayers({ location, maxDistance: NEARBY_RADIUS }).map(player => player.name).join(", ") || "nobody";
    const itemName = () => item.typeId.replace(/^minecraft:/, "");

    if (hasOversizedName(item)) {
        try {
            entity.remove();
        } catch {
            return;
        }
        alertOperators(`longname|${dimension.id}`,
            `§7A dropped ${itemName()} was named over ${MAX_ITEM_NAME_LENGTH} characters and was deleted.§r Nearby: §e${nearbyNames()}`);
        return;
    }

    if (!fixDurability(item)) return;

    // The dropped stack can't be edited in place, so it is swapped for a fixed copy.
    try {
        entity.remove();
        dimension.spawnItem(item, location);
    } catch {
        return;
    }
    alertOperators(`durability|${dimension.id}`,
        `§7A dropped ${itemName()} had impossible durability and was reset.§r Nearby: §e${nearbyNames()}`);
});

world.afterEvents.entityItemPickup.subscribe(({ entity }) => {
    if (entity?.typeId !== "minecraft:player") return;
    try {
        fixPlayerItems(entity);
    } catch { }
});

// Catches a renamed item the moment it lands in a slot, instead of up to two seconds later.
world.afterEvents.playerInventoryItemChange?.subscribe(({ player, itemStack }) => {
    if (!hasOversizedName(itemStack)) return;
    system.run(() => {
        try {
            if (player.isValid) fixPlayerItems(player);
        } catch { }
    });
});

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        try {
            fixPlayerItems(player);
        } catch { }
    }
}, SWEEP_INTERVAL_TICKS);
