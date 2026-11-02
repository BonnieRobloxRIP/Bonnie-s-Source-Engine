import { system, world } from "@minecraft/server";
import { parseBooleanLike } from "./core/parse.js";

// SECTION: Constants
const ADVENTURE_PERMISSION_MESSAGE_COOLDOWN_MS = 1000;
const PRESSURE_PLATE_PUSH_OFF_COOLDOWN_MS = 180;
// Half the plate (7/16) plus half the player's width (0.3), rounded up a little.
const PRESSURE_PLATE_BLOCK_HALF_EXTENT = 0.8;

// /brr:adventure <name> -> permission key. The name is also the world property it is saved under.
export const ADVENTURE_COMMAND_TO_KEY = {
    can_use_pots: "canUsePots",
    can_use_shelves: "canUseShelves",
    can_use_trapdoors: "canUseTrapdoors",
    can_use_doors: "canUseDoors",
    can_use_itemframes: "canUseItemframes",
    can_use_candles: "canUseCandles",
    can_open_containers: "canOpenContainers",
    can_use_buttons: "canUseButtons",
    can_use_pressure_plates: "canUsePressurePlates",
    can_use_incompatible_respawns: "canUseIncompatibleRespawns",
    can_use_daylight_sensors: "canUseDaylightSensors",
    can_hit_entities: "canHitEntities",
    can_hit_players: "canHitPlayers",
    can_use_jukebox: "canUseJukebox",
    can_use_redstone_components: "canUseRedstoneComponents",
    can_use_noteblocks: "canUseNoteblocks",
    can_use_levers: "canUseLevers",
    can_use_all: "canUseAll"
};

const ADVENTURE_KEY_TO_PROPERTY = Object.fromEntries(Object.entries(ADVENTURE_COMMAND_TO_KEY).map(([property, key]) => [key, property]));
// Every permission except canUseAll, which is just "all of these are on".
const SINGLE_PERMISSION_KEYS = Object.values(ADVENTURE_COMMAND_TO_KEY).filter(key => key !== "canUseAll");

const ADVENTURE_BLOCKED_MESSAGES = {
    canUsePots: "You cannot use flower pots right now.",
    canUseShelves: "You cannot use shelves right now.",
    canUseTrapdoors: "You cannot use trapdoors right now.",
    canUseDoors: "You cannot use doors right now.",
    canUseItemframes: "You cannot use item frames right now.",
    canUseCandles: "You cannot use candles right now.",
    canOpenContainers: "You cannot open containers right now.",
    canUseButtons: "You cannot use buttons right now.",
    canUsePressurePlates: "You cannot use pressure plates right now.",
    canUseIncompatibleRespawns: "You cannot use beds or respawn anchors here right now.",
    canUseDaylightSensors: "You cannot use daylight sensors right now.",
    canHitEntities: "You cannot hit entities right now.",
    canHitPlayers: "You cannot hit players right now.",
    canUseJukebox: "You cannot use jukeboxes right now.",
    canUseRedstoneComponents: "You cannot use redstone components right now.",
    canUseNoteblocks: "You cannot use note blocks right now.",
    canUseLevers: "You cannot use levers right now."
};

// SECTION: Runtime State
const adventureInteractionMessageCooldowns = new Map();
const pressurePlatePushCooldowns = new Map();
const pressurePlateEnforcementCache = new Map();

export const adventureInteractionPermissions = Object.fromEntries(Object.values(ADVENTURE_COMMAND_TO_KEY).map(key => [key, true]));

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    adventureInteractionMessageCooldowns.delete(playerId);
    pressurePlatePushCooldowns.delete(playerId);
    for (const key of pressurePlateEnforcementCache.keys()) {
        if (key.startsWith(`${playerId}_`)) pressurePlateEnforcementCache.delete(key);
    }
});

// SECTION: Player Helpers
export function isPlayerInAdventure(player) {
    try {
        return `${player.getGameMode()}`.toLowerCase() === "adventure";
    } catch {
        return false;
    }
}

// SECTION: Persistence
function updateCanUseAll() {
    adventureInteractionPermissions.canUseAll = SINGLE_PERMISSION_KEYS.every(key => adventureInteractionPermissions[key]);
}

function persistAdventurePermissions() {
    for (const [permissionKey, propertyId] of Object.entries(ADVENTURE_KEY_TO_PROPERTY)) {
        world.setDynamicProperty(propertyId, adventureInteractionPermissions[permissionKey]);
    }
}

export function loadPersistedPermissions() {
    for (const key of SINGLE_PERMISSION_KEYS) {
        adventureInteractionPermissions[key] = parseBooleanLike(world.getDynamicProperty(ADVENTURE_KEY_TO_PROPERTY[key]), true);
    }
    updateCanUseAll();
}

// SECTION: Permission Management
export function setAdventurePermission(permissionKey, enabled) {
    const normalizedValue = !!enabled;

    if (permissionKey === "canUseAll") {
        for (const key of SINGLE_PERMISSION_KEYS) adventureInteractionPermissions[key] = normalizedValue;
    } else if (SINGLE_PERMISSION_KEYS.includes(permissionKey)) {
        adventureInteractionPermissions[permissionKey] = normalizedValue;
    } else {
        return;
    }
    updateCanUseAll();
    persistAdventurePermissions();
}

// SECTION: Block Type Helpers
function isContainerBlockType(typeId) {
    const normalizedTypeId = `${typeId ?? ""}`;
    if (!normalizedTypeId) return false;

    // endsWith("chest"): also the ender chest and every copper chest.
    return normalizedTypeId.endsWith("chest")
        || normalizedTypeId === "minecraft:crafter"
        || normalizedTypeId === "minecraft:barrel"
        || normalizedTypeId === "minecraft:hopper"
        || normalizedTypeId === "minecraft:dropper"
        || normalizedTypeId === "minecraft:dispenser"
        || normalizedTypeId === "minecraft:furnace"
        || normalizedTypeId === "minecraft:blast_furnace"
        || normalizedTypeId === "minecraft:smoker"
        || normalizedTypeId === "minecraft:brewing_stand"
        || normalizedTypeId === "minecraft:shulker_box"
        || normalizedTypeId.endsWith("_shulker_box")
        || normalizedTypeId.includes("container")
        || normalizedTypeId.includes("crate")
        || normalizedTypeId.includes("locker")
        || normalizedTypeId.includes("cabinet")
        || normalizedTypeId.includes("drawers");
}

function isButtonBlockType(typeId) {
    const normalizedTypeId = `${typeId ?? ""}`;
    return normalizedTypeId.endsWith("_button") || normalizedTypeId.includes("button");
}

function isPressurePlateBlockType(typeId) {
    const normalizedTypeId = `${typeId ?? ""}`;
    return normalizedTypeId.endsWith("_pressure_plate") || normalizedTypeId.includes("pressure_plate");
}

function isLeverBlockType(typeId) {
    const normalizedTypeId = `${typeId ?? ""}`;
    return normalizedTypeId === "minecraft:lever" || normalizedTypeId.endsWith(":lever") || normalizedTypeId.includes("lever");
}

function isNoteblockType(typeId) {
    const normalizedTypeId = `${typeId ?? ""}`;
    return normalizedTypeId === "minecraft:noteblock" || normalizedTypeId.includes("noteblock") || normalizedTypeId.includes("note_block");
}

function isRedstoneComponentBlockType(typeId) {
    const normalizedTypeId = `${typeId ?? ""}`;
    if (!normalizedTypeId) return false;

    return normalizedTypeId === "minecraft:unpowered_repeater"
        || normalizedTypeId === "minecraft:powered_repeater"
        || normalizedTypeId === "minecraft:unpowered_comparator"
        || normalizedTypeId === "minecraft:powered_comparator"
        || normalizedTypeId === "minecraft:observer"
        || normalizedTypeId === "minecraft:target"
        || normalizedTypeId === "minecraft:redstone_torch"
        || normalizedTypeId === "minecraft:unlit_redstone_torch"
        || normalizedTypeId === "minecraft:redstone_wire"
        || normalizedTypeId === "minecraft:redstone_block"
        || normalizedTypeId.includes("repeater")
        || normalizedTypeId.includes("comparator")
        || normalizedTypeId.includes("observer")
        || normalizedTypeId.includes("redstone")
        || normalizedTypeId.includes("target");
}

export function getAdventurePermissionForBlock(blockTypeId) {
    const normalizedTypeId = `${blockTypeId ?? ""}`;
    if (!normalizedTypeId) return undefined;

    // "pot" as a whole word (flower_pot, decorated_pot), so potatoes don't count.
    if (/(^|[:_])pot(_|$)/.test(normalizedTypeId)) return "canUsePots";
    if (normalizedTypeId === "minecraft:chiseled_bookshelf" || normalizedTypeId === "minecraft:bookshelf" || normalizedTypeId.includes("shelf")) return "canUseShelves";
    if (normalizedTypeId.endsWith("_trapdoor") || normalizedTypeId.includes("trapdoor") || normalizedTypeId.includes("trap_door")) return "canUseTrapdoors";
    if (normalizedTypeId.endsWith("_door")) return "canUseDoors";
    if (normalizedTypeId.includes("_candle") || normalizedTypeId === "minecraft:candle") return "canUseCandles";
    if (normalizedTypeId === "minecraft:frame" || normalizedTypeId === "minecraft:glow_frame" || normalizedTypeId.includes("item_frame")) return "canUseItemframes";
    if (normalizedTypeId === "minecraft:jukebox" || normalizedTypeId.includes("jukebox")) return "canUseJukebox";
    if (normalizedTypeId === "minecraft:daylight_detector" || normalizedTypeId === "minecraft:daylight_detector_inverted") return "canUseDaylightSensors";
    if (isNoteblockType(normalizedTypeId)) return "canUseNoteblocks";
    if (isLeverBlockType(normalizedTypeId)) return "canUseLevers";
    if (isContainerBlockType(normalizedTypeId)) return "canOpenContainers";
    if (isButtonBlockType(normalizedTypeId)) return "canUseButtons";
    if (isRedstoneComponentBlockType(normalizedTypeId)) return "canUseRedstoneComponents";

    return undefined;
}

export function shouldBlockAdventureInteraction(player, blockTypeId) {
    if (!isPlayerInAdventure(player)) return false;

    const permissionKey = getAdventurePermissionForBlock(blockTypeId);
    if (!permissionKey) return false;

    return !adventureInteractionPermissions[permissionKey];
}

export function getIncompatibleRespawnPermissionForBlock(player, blockTypeId, dimensionId) {
    if (!player || !isPlayerInAdventure(player)) return undefined;

    const normalizedTypeId = `${blockTypeId ?? ""}`;
    const normalizedDimensionId = `${dimensionId ?? player.dimension?.id ?? ""}`;
    if (!normalizedTypeId || !normalizedDimensionId) return undefined;

    // Every colour of bed is minecraft:bed in Bedrock.
    const isBed = normalizedTypeId === "minecraft:bed" || normalizedTypeId.endsWith("_bed");
    const isRespawnAnchor = normalizedTypeId === "minecraft:respawn_anchor";

    const bedIncompatible = isBed && normalizedDimensionId !== "minecraft:overworld";
    const anchorIncompatible = isRespawnAnchor && normalizedDimensionId !== "minecraft:nether";

    if (bedIncompatible || anchorIncompatible) {
        return "canUseIncompatibleRespawns";
    }

    return undefined;
}

// SECTION: Notifications
export function notifyAdventureInteractionBlocked(player, permissionKey) {
    if (!player?.id || !permissionKey) return;

    const now = Date.now();
    const previous = adventureInteractionMessageCooldowns.get(player.id) ?? 0;
    if (now - previous < ADVENTURE_PERMISSION_MESSAGE_COOLDOWN_MS) return;

    adventureInteractionMessageCooldowns.set(player.id, now);
    player.sendMessage(ADVENTURE_BLOCKED_MESSAGES[permissionKey] ?? "You cannot use that block right now.");
}

// SECTION: Pressure Plate Enforcement
function pushPlayerOffPressurePlate(player, platePos) {
    if (!player || !platePos) return;

    const now = Date.now();
    const previous = pressurePlatePushCooldowns.get(player.id) ?? 0;
    if (now - previous < PRESSURE_PLATE_PUSH_OFF_COOLDOWN_MS) return;

    const playerLocation = player.location;
    const targetX = platePos.x + 0.5;
    const targetZ = platePos.z + 0.5;
    let offsetX = playerLocation.x - targetX;
    let offsetZ = playerLocation.z - targetZ;

    if (Math.abs(offsetX) < 0.001 && Math.abs(offsetZ) < 0.001) {
        offsetX = 1;
        offsetZ = 0;
    }

    const magnitude = Math.hypot(offsetX, offsetZ) || 1;
    const pushDistance = 0.65;
    const nextPos = {
        x: playerLocation.x + (offsetX / magnitude) * pushDistance,
        y: playerLocation.y,
        z: playerLocation.z + (offsetZ / magnitude) * pushDistance
    };

    try {
        player.teleport(nextPos, {
            dimension: player.dimension,
            keepVelocity: false
        });
        pressurePlatePushCooldowns.set(player.id, now);
    } catch { }
}

function enforcePressurePlateRestrictionForPlayer(player) {
    // The permission flag is checked first: it is a plain read, the game mode lookup is a native call.
    if (!player || adventureInteractionPermissions.canUsePressurePlates || !isPlayerInAdventure(player)) return;

    const location = player.location;
    const dimensionId = player.dimension?.id ?? "";
    const cacheKey = `${player.id}_${dimensionId}`;
    const cached = pressurePlateEnforcementCache.get(cacheKey);

    // Only scan if player moved or dimension changed
    if (cached) {
        const posChanged = cached.x !== Math.floor(location.x) || cached.y !== Math.floor(location.y) || cached.z !== Math.floor(location.z);
        if (!posChanged) return;
    }

    const baseX = Math.floor(location.x);
    const baseY = Math.floor(location.y);
    const baseZ = Math.floor(location.z);
    const dimension = player.dimension;

    // Full 3x3 grid at Y and Y-1 so diagonal corners are always covered.
    const candidatePositions = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            candidatePositions.push({ x: baseX + dx, y: baseY, z: baseZ + dz });
            candidatePositions.push({ x: baseX + dx, y: baseY - 1, z: baseZ + dz });
        }
    }

    for (const pos of candidatePositions) {
        let block;
        try {
            block = dimension.getBlock(pos);
        } catch {
            continue; // above or below the world
        }
        if (!isPressurePlateBlockType(block?.typeId)) continue;

        const centerX = pos.x + 0.5;
        const centerZ = pos.z + 0.5;
        const deltaX = Math.abs(location.x - centerX);
        const deltaZ = Math.abs(location.z - centerZ);

        // Square zone centred on the plate, about where the player's hitbox touches it.
        if (deltaX > PRESSURE_PLATE_BLOCK_HALF_EXTENT || deltaZ > PRESSURE_PLATE_BLOCK_HALF_EXTENT) continue;

        // Not cached: if the push was skipped by its cooldown, the next pass has to try again.
        pushPlayerOffPressurePlate(player, pos);
        notifyAdventureInteractionBlocked(player, "canUsePressurePlates");
        return;
    }

    pressurePlateEnforcementCache.set(cacheKey, { x: baseX, y: baseY, z: baseZ });
}

// SECTION: Event Subscriptions
// Taking the item out of a frame is a break (item frames are blocks in Bedrock).
world.beforeEvents.playerBreakBlock.subscribe((data) => {
    const player = data.player;
    const typeId = `${data.block?.typeId ?? ""}`;
    if (!player || !isPlayerInAdventure(player)) return;

    const isItemFrame = typeId.includes("item_frame") || typeId === "minecraft:frame" || typeId === "minecraft:glow_frame";
    if (isItemFrame && !adventureInteractionPermissions.canUseItemframes) {
        data.cancel = true;
        notifyAdventureInteractionBlocked(player, "canUseItemframes");
    }
});

/**
 * Cancels a block interaction the Adventure rules forbid; true when it did. main.js calls this before
 * handing the click to the engine, so a forbidden click never reaches an engine block either.
 */
export function cancelForbiddenBlockInteraction(data) {
    const block = data.block;
    const incompatibleRespawnPermission = getIncompatibleRespawnPermissionForBlock(data.player, block?.typeId, block?.dimension?.id);
    if (incompatibleRespawnPermission && !adventureInteractionPermissions[incompatibleRespawnPermission]) {
        data.cancel = true;
        notifyAdventureInteractionBlocked(data.player, incompatibleRespawnPermission);
        return true;
    }

    const blockedPermission = getAdventurePermissionForBlock(block?.typeId);
    if (blockedPermission && shouldBlockAdventureInteraction(data.player, block.typeId)) {
        data.cancel = true;
        notifyAdventureInteractionBlocked(data.player, blockedPermission);
        return true;
    }
    return false;
}

world.beforeEvents.entityHurt.subscribe((data) => {
    if (data.cancel) return;

    let attacker = data?.damageSource?.damagingEntity;

    if (!attacker) {
        const projectile = data?.damageSource?.damagingProjectile;
        try {
            attacker = projectile?.getComponent?.("minecraft:projectile")?.owner;
        } catch { }
    }

    if (!attacker || attacker.typeId !== "minecraft:player") return;
    if (!isPlayerInAdventure(attacker)) return;

    const hurtEntity = data?.hurtEntity;
    const hitPlayers = hurtEntity?.typeId === "minecraft:player";
    const permissionKey = hitPlayers ? "canHitPlayers" : "canHitEntities";
    if (adventureInteractionPermissions[permissionKey]) return;

    data.cancel = true;
    notifyAdventureInteractionBlocked(attacker, permissionKey);
});

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        enforcePressurePlateRestrictionForPlayer(player);
    }
}, 2);
