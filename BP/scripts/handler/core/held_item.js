import { system } from "@minecraft/server";

// SECTION: Held Item Cache
// Weapons, dynamic lighting, the collar and the engine all ask what a player holds,
// several times per tick. Each lookup is two native calls, so results are cached per player and
// slot for the current tick: the first caller pays, everyone after it in the same tick reads the
// cache. Code that changes an equipped item in the middle of a tick calls invalidateHeldItem.

let cacheTick = -1;
const cacheBySlot = new Map(); // slot -> Map(player id -> typeId)

/** Type id of the item in an equipment slot ("" when empty), cached for this tick. */
export function getEquipmentTypeId(player, slot = "Mainhand") {
    const tick = system.currentTick;
    if (tick !== cacheTick) {
        cacheTick = tick;
        cacheBySlot.clear();
    }

    let bySlot = cacheBySlot.get(slot);
    if (!bySlot) cacheBySlot.set(slot, bySlot = new Map());

    const playerId = player?.id;
    if (playerId && bySlot.has(playerId)) return bySlot.get(playerId);

    let typeId = "";
    try {
        typeId = player.getComponent("minecraft:equippable")?.getEquipment(slot)?.typeId ?? "";
    } catch { }

    if (playerId) bySlot.set(playerId, typeId);
    return typeId;
}

export function getMainhandTypeId(player) {
    return getEquipmentTypeId(player, "Mainhand");
}

export function invalidateHeldItem(player) {
    for (const bySlot of cacheBySlot.values()) bySlot.delete(player?.id);
}
