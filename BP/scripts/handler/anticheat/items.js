import { world, system } from "@minecraft/server";
import { alertOperators, reportBlocked } from "./common.js";

// SECTION: Impossible Durability (.unbreakable, .setDamage, .metadata on tools)
// The client's item commands edit the held item, and dropping it makes the edited copy real.
// In vanilla, wear never goes below 0 (unused) or past the item's maximum; the "unbreakable"
// command sets it to -32768. Such items are reset to unused: dropped items as they appear, and
// inventories whenever a player picks something up and every couple of seconds.
// Ammo counts too: the addon's ammo boxes keep their rounds in the durability bar.

const SWEEP_INTERVAL_TICKS = 40;
// Mainhand is a hotbar slot, which the inventory pass already covers.
const EQUIPMENT_SLOTS = ["Head", "Chest", "Legs", "Feet", "Offhand", "Body"];
const NEARBY_RADIUS = 8;

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

    const container = player.getComponent("minecraft:inventory")?.container;
    for (let slot = 0; slot < (container?.size ?? 0); slot++) {
        const item = container.getItem(slot);
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
        if (!fixDurability(item)) continue;
        equippable.setEquipment(slot, item);
        fixed++;
    }

    if (fixed > 0) reportBlocked(player, "Impossible Durability", `${fixed} item(s) reset to unused`);
}

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    if (entity?.typeId !== "minecraft:item") return;

    let item;
    try {
        item = entity.getComponent("minecraft:item")?.itemStack;
    } catch {
        return;
    }
    if (!fixDurability(item)) return;

    // The dropped stack can't be edited in place, so it is swapped for a fixed copy.
    const { dimension, location } = entity;
    try {
        entity.remove();
        dimension.spawnItem(item, location);
    } catch {
        return;
    }
    const nearby = dimension.getPlayers({ location, maxDistance: NEARBY_RADIUS }).map(player => player.name);
    alertOperators(`durability|${dimension.id}`,
        `§7A dropped ${item.typeId.replace(/^minecraft:/, "")} had impossible durability and was reset.§r Nearby: §e${nearby.join(", ") || "nobody"}`);
});

world.afterEvents.entityItemPickup.subscribe(({ entity }) => {
    if (entity?.typeId !== "minecraft:player") return;
    try {
        fixPlayerItems(entity);
    } catch { }
});

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        try {
            fixPlayerItems(player);
        } catch { }
    }
}, SWEEP_INTERVAL_TICKS);
