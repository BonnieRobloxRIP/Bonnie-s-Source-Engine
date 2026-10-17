import { system, world } from "@minecraft/server";
import { isCreativePlayer, isPlayerEntity, playSoundForPlayer } from "./weapon_common.js";

// SECTION: Ammo Types
// Ammo items are single, non-stacking boxes whose durability is the rounds left in them.
export const AMMO_ITEM = Object.freeze({
    NINE_MM: "brr:9mmclip",
    MAGNUM: "brr:357_ammobox",
    URANIUM: "brr:gaussammo",
    BUCKSHOT: "brr:shotbox"
});

// Half-Life carry limits in rounds; ammo types without an entry have no limit.
const CARRY_CAP = {
    [AMMO_ITEM.NINE_MM]: 250,
    [AMMO_ITEM.MAGNUM]: 36,
    [AMMO_ITEM.BUCKSHOT]: 125
};

const URANIUM_EMPTY_SOUND = "weapons.gauss.empty";

// SECTION: Inventory Scanning
function getContainer(player) {
    try {
        return player.getComponent("minecraft:inventory")?.container;
    } catch {
        return undefined;
    }
}

/** Every inventory slot holding one of the ammo ids, with its rounds left. */
function collectAmmoSlots(player, idSet) {
    const container = getContainer(player);
    const slots = [];
    if (!container) return { container, slots };

    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (!item || !idSet.has(item.typeId)) continue;

        const durability = item.getComponent("minecraft:durability");
        if (!durability) continue;

        slots.push({ index: i, item, durability, rounds: Math.max(0, durability.maxDurability - durability.damage) });
    }
    return { container, slots };
}

function writeRounds(container, slot, rounds) {
    if (rounds <= 0) {
        container.setItem(slot.index, undefined);
        return;
    }
    slot.durability.damage = slot.durability.maxDurability - rounds;
    container.setItem(slot.index, slot.item);
}

// SECTION: Reserve Pools
function drainSlots(container, slots, roundsNeeded) {
    let remaining = roundsNeeded;
    let consumed = 0;
    for (const slot of slots) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, slot.rounds);
        if (take <= 0) continue;
        writeRounds(container, slot, slot.rounds - take);
        consumed += take;
        remaining -= take;
    }
    return consumed;
}

/**
 * Reserve-ammo accessor summing and draining across every matching box in the inventory.
 * Creative players have unlimited reserve.
 *
 * options.cacheTicks: reuse getReserveTotal's inventory scan for this many ticks (0 = scan every call). Consuming
 * updates the cached total and invalidate(player) drops it, e.g. after a pickup.
 */
export function createReserveAmmoPool(ammoItemIds, options = {}) {
    const idSet = ammoItemIds instanceof Set ? ammoItemIds : new Set(ammoItemIds);
    const cacheTicks = Math.max(0, options.cacheTicks ?? 0);
    const totalByPlayer = new Map(); // player id -> { total, tick }

    const remember = (player, total) => {
        if (cacheTicks > 0 && player?.id) totalByPlayer.set(player.id, { total, tick: system.currentTick });
    };

    return {
        getReserveTotal(player) {
            const cached = cacheTicks > 0 ? totalByPlayer.get(player?.id) : undefined;
            if (cached && system.currentTick - cached.tick < cacheTicks) return cached.total;

            let total;
            if (isCreativePlayer(player)) total = Number.POSITIVE_INFINITY;
            else {
                try {
                    total = collectAmmoSlots(player, idSet).slots.reduce((sum, slot) => sum + slot.rounds, 0);
                } catch {
                    total = 0;
                }
            }
            remember(player, total);
            return total;
        },

        /** Takes up to roundsNeeded from the inventory; returns how many were taken. */
        consumeReserve(player, roundsNeeded) {
            const needed = Math.max(0, Math.floor(roundsNeeded));
            if (needed <= 0) return 0;
            if (isCreativePlayer(player)) return needed;

            try {
                const { container, slots } = collectAmmoSlots(player, idSet);
                const total = slots.reduce((sum, slot) => sum + slot.rounds, 0);
                const consumed = drainSlots(container, slots, needed);
                remember(player, total - consumed);
                return consumed;
            } catch {
                totalByPlayer.delete(player?.id);
                return 0;
            }
        },

        /** Takes exactly `cost` rounds if available (all or nothing), from a single inventory scan. */
        consumeExact(player, cost) {
            if (cost <= 0 || isCreativePlayer(player)) return true;

            try {
                const { container, slots } = collectAmmoSlots(player, idSet);
                const total = slots.reduce((sum, slot) => sum + slot.rounds, 0);
                if (total < cost) {
                    remember(player, total);
                    return false;
                }
                const consumed = drainSlots(container, slots, cost);
                remember(player, total - consumed);
                return consumed >= cost;
            } catch {
                totalByPlayer.delete(player?.id);
                return false;
            }
        },

        invalidate(player) {
            totalByPlayer.delete(player?.id);
        },

        forgetOfflinePlayers(onlineIds) {
            for (const id of totalByPlayer.keys()) if (!onlineIds.has(id)) totalByPlayer.delete(id);
        }
    };
}

// SECTION: Uranium (Tau Cannon and Gluon Gun)
// Both guns read the uranium total every tick while held; the cache saves a 36-slot scan per tick.
const URANIUM_POOL = createReserveAmmoPool([AMMO_ITEM.URANIUM], { cacheTicks: 10 });

world.afterEvents.playerLeave.subscribe(() => {
    system.run(() => URANIUM_POOL.forgetOfflinePlayers(new Set(world.getPlayers().map((player) => player.id))));
});

export function getAmmoRemaining(player) {
    return URANIUM_POOL.getReserveTotal(player);
}

export function consumeAmmo(player, cost) {
    return URANIUM_POOL.consumeExact(player, cost);
}

export function playEmptySound(player) {
    playSoundForPlayer(player, URANIUM_EMPTY_SOUND);
}

// SECTION: Pickup Merging and Carry Caps
/** Packs an ammo type into as few boxes as possible (filling from the first slot) and trims it to the cap. */
function consolidateAmmo(player, typeId) {
    const { container, slots } = collectAmmoSlots(player, new Set([typeId]));
    if (!container || slots.length === 0) return;

    const capacity = slots[0].durability.maxDurability;
    const cap = CARRY_CAP[typeId] ?? Number.POSITIVE_INFINITY;
    let total = Math.min(cap, slots.reduce((sum, slot) => sum + slot.rounds, 0));

    for (const slot of slots) {
        const rounds = Math.min(capacity, total);
        total -= rounds;
        if (rounds !== slot.rounds) writeRounds(container, slot, rounds);
    }
}

const AMMO_IDS = new Set(Object.values(AMMO_ITEM));
const POOL_BY_ID = new Map([...AMMO_IDS].map((id) => [id, createReserveAmmoPool([id])]));

// At the carry cap, ammo stays on the ground (as in Half-Life).
world.beforeEvents.entityItemPickup.subscribe((event) => {
    if (!isPlayerEntity(event.entity)) return;

    let typeId;
    try {
        typeId = event.item.getComponent("minecraft:item")?.itemStack?.typeId;
    } catch {
        return;
    }

    const cap = CARRY_CAP[typeId];
    if (!cap || isCreativePlayer(event.entity)) return;
    if (POOL_BY_ID.get(typeId).getReserveTotal(event.entity) >= cap) event.cancel = true;
});

world.afterEvents.entityItemPickup.subscribe((event) => {
    if (!isPlayerEntity(event.entity)) return;

    const pickedTypes = new Set(event.items.map((item) => item.typeId).filter((id) => AMMO_IDS.has(id)));
    if (pickedTypes.has(AMMO_ITEM.URANIUM)) URANIUM_POOL.invalidate(event.entity);
    for (const typeId of pickedTypes) {
        try {
            consolidateAmmo(event.entity, typeId);
        } catch { }
    }
});
