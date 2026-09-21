import { isCreativePlayer } from "./weapon_common.js";

// SECTION: Ammo Constants
const AMMO_ITEM_ID = "brr:gaussammo";
const EMPTY_SOUND = "weapons.gauss.empty";

// SECTION: Single-Stack Durability Ammo (gauss-style energy cell)
function findAmmoInInventory(player) {
    try {
        const inventory = player.getComponent("minecraft:inventory");
        if (!inventory?.container) return null;

        const container = inventory.container;
        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (!item || item.typeId !== AMMO_ITEM_ID) continue;

            const durability = item.getComponent("minecraft:durability");
            if (!durability) continue;

            return { slotIndex: i, container, itemStack: item, durabilityComponent: durability };
        }
    } catch { }
    return null;
}

// SECTION: Public Ammo API
export function getAmmoRemaining(player) {
    if (isCreativePlayer(player)) return Number.MAX_SAFE_INTEGER;

    const ammo = findAmmoInInventory(player);
    if (!ammo) return 0;
    return Math.max(0, ammo.durabilityComponent.maxDurability - ammo.durabilityComponent.damage);
}

export function consumeAmmo(player, cost) {
    if (cost <= 0) return true;
    if (isCreativePlayer(player)) return true;

    const ammo = findAmmoInInventory(player);
    if (!ammo) return false;

    const remaining = ammo.durabilityComponent.maxDurability - ammo.durabilityComponent.damage;
    if (remaining < cost) return false;

    ammo.durabilityComponent.damage += cost;

    if (ammo.durabilityComponent.damage >= ammo.durabilityComponent.maxDurability) {
        ammo.container.setItem(ammo.slotIndex, undefined);
    } else {
        ammo.container.setItem(ammo.slotIndex, ammo.itemStack);
    }

    return true;
}

// SECTION: Feedback
export function playEmptySound(player) {
    if (!player?.id) return;
    try {
        player.playSound(EMPTY_SOUND, { pitch: 1, volume: 1 });
        return;
    } catch { }
    try {
        player.runCommand(`playsound ${EMPTY_SOUND} @s ~ ~ ~ 1 1`);
    } catch { }
}

// SECTION: Multi-Stack Reserve Ammo (magazine-fed weapons drawing from inventory ammo boxes)
/**
 * Creates a reserve-ammo accessor for weapons that reload a fixed-size magazine from
 * one or more inventory item ids, summing/draining across multiple partial stacks.
 */
export function createReserveAmmoPool(ammoItemIds) {
    const idSet = ammoItemIds instanceof Set ? ammoItemIds : new Set(ammoItemIds);

    function findStack(player) {
        try {
            const inventory = player.getComponent("minecraft:inventory");
            if (!inventory?.container) return null;

            const container = inventory.container;
            for (let i = 0; i < container.size; i++) {
                const item = container.getItem(i);
                if (!item || !idSet.has(`${item.typeId ?? ""}`)) continue;

                const durability = item.getComponent("minecraft:durability");
                if (!durability) continue;

                const available = durability.maxDurability - durability.damage;
                if (available <= 0) continue;

                return { slotIndex: i, container, itemStack: item, durabilityComponent: durability, available };
            }
        } catch { }

        return null;
    }

    return {
        getReserveTotal(player) {
            try {
                const inventory = player.getComponent("minecraft:inventory");
                if (!inventory?.container) return 0;

                const container = inventory.container;
                let total = 0;

                for (let i = 0; i < container.size; i++) {
                    const item = container.getItem(i);
                    if (!item || !idSet.has(`${item.typeId ?? ""}`)) continue;

                    const durability = item.getComponent("minecraft:durability");
                    if (!durability) continue;

                    total += Math.max(0, durability.maxDurability - durability.damage);
                }

                return total;
            } catch {
                return 0;
            }
        },

        consumeReserve(player, roundsNeeded) {
            let remaining = Math.max(0, Math.floor(roundsNeeded));
            if (remaining <= 0) return 0;

            let consumed = 0;
            while (remaining > 0) {
                const ammo = findStack(player);
                if (!ammo) break;

                const take = Math.min(remaining, ammo.available);
                ammo.durabilityComponent.damage += take;

                if (ammo.durabilityComponent.damage >= ammo.durabilityComponent.maxDurability) {
                    ammo.container.setItem(ammo.slotIndex, undefined);
                } else {
                    ammo.container.setItem(ammo.slotIndex, ammo.itemStack);
                }

                consumed += take;
                remaining -= take;
            }

            return consumed;
        }
    };
}