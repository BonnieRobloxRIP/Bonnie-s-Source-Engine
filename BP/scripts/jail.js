import { system, world } from "@minecraft/server";
import { distanceSquared } from "./core/math.js";
import { gameTick } from "./core/pause.js";
import { setStatusDisplay } from "./core/status_displays.js";
import { setPlayerDoorGate } from "./doors.js";

const JAIL_SPOT_ID = "brr:chipfloke_player_tp";
const JAIL_DOOR_ID = "brr:door_jail";
const JAIL_CARD_ID = "brr:item_jailcard";
const HAMMER_ID = "brr:item_hammer";
const PRINCIPAL_KEYS_ID = "brr:item_key";
// players with this tag are a monke right now (monke.js)
export const MONKENATOR_TAG = "brr:monkenator";
const SPOTS_PROPERTY = "brr:jail_spots";
const COUNTDOWN_INTERVAL_TICKS = 10;

// player id -> { until, doorAccess, escaped, spot }
const jailed = new Map();
let spots;

function loadSpots() {
    if (spots) return spots;
    try { spots = JSON.parse(world.getDynamicProperty(SPOTS_PROPERTY) ?? "[]"); } catch { spots = []; }
    return spots;
}

function saveSpots() {
    world.setDynamicProperty(SPOTS_PROPERTY, JSON.stringify(spots));
}

function spotIndex(dimensionId, location) {
    return loadSpots().findIndex((spot) => spot.dimensionId === dimensionId
        && spot.x === location.x && spot.y === location.y && spot.z === location.z);
}

function registerJailSpot(dimension, location) {
    if (spotIndex(dimension.id, location) !== -1) return;
    spots.push({ dimensionId: dimension.id, x: location.x, y: location.y, z: location.z });
    saveSpots();
}

function unregisterJailSpot(dimensionId, location) {
    const index = spotIndex(dimensionId, location);
    if (index === -1) return;
    spots.splice(index, 1);
    saveSpots();
}

// nearest chipfloke_player_tp in the dimension; stale entries (block gone) are dropped on the way
export function findJailSpot(dimension, near) {
    const candidates = loadSpots()
        .filter((spot) => spot.dimensionId === dimension.id)
        .sort((a, b) => distanceSquared(a, near) - distanceSquared(b, near));
    for (const spot of candidates) {
        let block;
        try { block = dimension.getBlock(spot); } catch { }
        // unloaded chunks can't be verified, trust the saved entry
        if (block && block.typeId !== JAIL_SPOT_ID) {
            unregisterJailSpot(spot.dimensionId, spot);
            continue;
        }
        return { x: spot.x, y: spot.y, z: spot.z };
    }
    return undefined;
}

export function jailPlayer(player, seconds, spot) {
    jailed.set(player.id, { until: gameTick() + seconds * 20, doorAccess: false, escaped: false, spot });
    setStatusDisplay(player, "J", seconds);
}

// active jail entry or undefined
export function getJail(player) {
    const entry = jailed.get(player.id);
    if (!entry) return undefined;
    if (gameTick() >= entry.until) {
        jailed.delete(player.id);
        setStatusDisplay(player, "J", undefined);
        return undefined;
    }
    return entry;
}

function heldItem(player) {
    return player.getComponent("minecraft:inventory")?.container?.getItem(player.selectedSlotIndex);
}

function consumeHeld(player) {
    const container = player.getComponent("minecraft:inventory")?.container;
    const item = container?.getItem(player.selectedSlotIndex);
    if (!item) return;
    if (item.amount > 1) {
        item.amount--;
        container.setItem(player.selectedSlotIndex, item);
    } else {
        container.setItem(player.selectedSlotIndex);
    }
}

// jailed players can't open doors, except: jail card on a jail door (frees them), hammer on a
// jail door or monkenator'd through one (door access back, jail time stays)
function jailDoorGate(player, block) {
    const entry = getJail(player);
    if (!entry) return true;
    const jailDoor = block.typeId === JAIL_DOOR_ID;
    if (jailDoor) {
        const held = heldItem(player)?.typeId;
        if (held === JAIL_CARD_ID) {
            consumeHeld(player);
            jailed.delete(player.id);
            setStatusDisplay(player, "J", undefined);
            player.onScreenDisplay.setActionBar("Get out of Jail Free!");
            return true;
        }
        if (held === HAMMER_ID || held === PRINCIPAL_KEYS_ID || player.hasTag(MONKENATOR_TAG)) entry.doorAccess = true;
    }
    if (!entry.doorAccess) return false;
    if (jailDoor) entry.escaped = true;
    return true;
}

export function registerJailComponents(blockComponentRegistry) {
    blockComponentRegistry.registerCustomComponent("brr:jail_spot", {
        onPlace({ block, dimension }) {
            registerJailSpot(dimension, block.location);
        },
        onTick({ block, dimension }) {
            registerJailSpot(dimension, block.location);
        },
        onPlayerBreak({ block, dimension }) {
            unregisterJailSpot(dimension.id, block.location);
        }
    });
}

setPlayerDoorGate(jailDoorGate);

system.runInterval(() => {
    if (jailed.size === 0) return;
    for (const [id, entry] of jailed) {
        const player = world.getEntity(id);
        if (!player?.isValid) {
            jailed.delete(id);
            continue;
        }
        const ticksLeft = entry.until - gameTick();
        if (ticksLeft <= 0) {
            jailed.delete(id);
            setStatusDisplay(player, "J", undefined);
            player.onScreenDisplay.setActionBar("You're out of jail.");
            continue;
        }
    }
}, COUNTDOWN_INTERVAL_TICKS);
