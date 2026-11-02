import { system, world } from "@minecraft/server";
import { getEquipmentTypeId } from "./core/held_item.js";

// SECTION: Pets
// A player wearing the pet collar becomes small and leashable, and can sit on the shoulders of
// anyone not wearing one. The leash item ties a pet to its owner (and lets them go again); the sit
// item puts a pet on its owner's shoulders.

// SECTION: Item and Property Constants
const COLLAR_ITEM = "brr:collar";
const LEASH_ITEM = "brr:leash";
const SIT_ITEM = "brr:sit";

// Whether a player is a pet is read from the collar they wear; nothing about it is saved. Only the
// leash owner is kept, on the pet player, so the rope comes back when an offline owner rejoins.
const DP_OWNER_ID = "brr_owner_id";
// Saved by older versions; deleted when found.
const LEGACY_DP_COLLARED = "brr_collared";
const LEGACY_WORLD_PET_STATE = "brr_pet_state";

// SECTION: Ride Rules
const RIDE_DENIED_MESSAGE = "Pets can't sit on other pets.";

// SECTION: Leash Follow Tuning
const LEASH_PULL_DISTANCE = 2.5;
const LEASH_STRONG_PULL_DISTANCE = 10;
const LEASH_HARD_PULL_DISTANCE = 18;
const LEASH_PULL_DISTANCE_SQUARED = LEASH_PULL_DISTANCE * LEASH_PULL_DISTANCE;
const LEASH_STRONG_PULL_DISTANCE_SQUARED = LEASH_STRONG_PULL_DISTANCE * LEASH_STRONG_PULL_DISTANCE;
const LEASH_HARD_PULL_DISTANCE_SQUARED = LEASH_HARD_PULL_DISTANCE * LEASH_HARD_PULL_DISTANCE;
const LEASH_ROPE_SYNC_INTERVAL_TICKS = 10;

// SECTION: Interaction Tuning
const INTERACTION_DEDUPE_WINDOW_TICKS = 2;

let tickCount = 0;

// SECTION: Runtime State
// Whether the collar effects (small, leashable) are on, as last applied this session.
const collarAppliedById = new Map();
const fallbackOwnerState = new Map();
const recentInteractionTickByKey = new Map();
const legacyCleanedIds = new Set();

function triggerPetEvent(entity, eventName) {
  if (!entity?.isValid || !eventName) return;

  try {
    entity.triggerEvent(eventName);
  } catch {
    // Ignore if the entity does not define this event.
  }
}

function getPlayers() {
  return world.getAllPlayers();
}

function isCollared(player) {
  return getCollaredState(player) || isWearingCollar(player);
}

// A pet (anyone wearing a collar) can sit on any player who isn't one.
function canPlayersRideEachOther(rider, mount) {
  return isCollared(rider) && !isCollared(mount);
}

function sendRideDenied(player) {
  try {
    player?.sendMessage(RIDE_DENIED_MESSAGE);
  } catch {
    // Ignore messaging failures on older runtimes.
  }
}

function getMainhandItemType(player) {
  return getEquipmentTypeId(player, "Mainhand") || undefined;
}

function isPlayerEntity(entity) {
  return entity?.typeId === "minecraft:player" || entity?.typeId?.endsWith(":player");
}

function isWearingCollar(player) {
  return getEquipmentTypeId(player, "Chest") === COLLAR_ITEM;
}

// The first time a player is seen this session, an older version's saved flag stands in for "applied", so a
// collar taken off back then is still cleaned up. (Read only: this also runs inside before-events.)
function getCollaredState(player) {
  if (!player?.id) return false;
  if (collarAppliedById.has(player.id)) return collarAppliedById.get(player.id);

  let applied = false;
  try {
    applied = player.getDynamicProperty(LEGACY_DP_COLLARED) === true;
  } catch { }
  collarAppliedById.set(player.id, applied);
  return applied;
}

function setCollaredState(player, collared) {
  if (!player?.id) return;
  collarAppliedById.set(player.id, collared);
}

function clearLegacyPetState(player) {
  if (legacyCleanedIds.has(player.id)) return;
  legacyCleanedIds.add(player.id);
  try {
    if (player.getDynamicProperty(LEGACY_DP_COLLARED) !== undefined) player.setDynamicProperty(LEGACY_DP_COLLARED, undefined);
  } catch { }
}

function getOwnerId(pet) {
  if (!pet?.id) return undefined;
  if (fallbackOwnerState.has(pet.id)) return fallbackOwnerState.get(pet.id);

  let ownerId;
  try {
    const value = pet.getDynamicProperty(DP_OWNER_ID);
    if (typeof value === "string" && value.length > 0) ownerId = value;
  } catch { }
  fallbackOwnerState.set(pet.id, ownerId);
  return ownerId;
}

function setOwnerId(pet, ownerId) {
  if (!pet?.id) return;
  fallbackOwnerState.set(pet.id, ownerId || undefined);

  try {
    pet.setDynamicProperty(DP_OWNER_ID, ownerId || undefined);
  } catch {
    // Ignore if dynamic properties are not supported.
  }
}

function getOwnerForPet(pet, players = getPlayers()) {
  const ownerId = getOwnerId(pet);
  if (!ownerId) return undefined;
  return players.find((p) => p.id === ownerId);
}

function getLeashable(pet) {
  try {
    return pet.getComponent("minecraft:leashable");
  } catch {
    return undefined;
  }
}

function attachLeashRope(pet, owner) {
  const leashable = getLeashable(pet);
  if (!leashable) {
    // Pets collared before brr:pet_leashable existed won't have it yet; the next sync attaches.
    triggerPetEvent(pet, "brr:leashable_on");
    return;
  }

  try {
    if (leashable.leashHolder?.id === owner.id) return;
    if (leashable.isLeashed) leashable.unleash();
    leashable.leashTo(owner);
  } catch {
    // leashTo throws past max_distance or for dead/spectator holders; retry on the next sync.
  }
}

function detachLeashRope(pet) {
  const leashable = getLeashable(pet);

  try {
    if (leashable?.isLeashed) leashable.unleash();
  } catch {
    // Ignore if the rope is already gone.
  }
}

function syncLeashRope(pet, owner) {
  if (owner) {
    if (owner.dimension.id === pet.dimension.id) attachLeashRope(pet, owner);
    return;
  }

  // Owner offline keeps the leash state so the rope comes back when they rejoin.
  if (!getOwnerId(pet)) detachLeashRope(pet);
}

function setLeash(owner, pet) {
  setOwnerId(pet, owner.id);
  attachLeashRope(pet, owner);
}

function clearCachedState(playerId) {
  if (!playerId) return;
  collarAppliedById.delete(playerId);
  fallbackOwnerState.delete(playerId);
  legacyCleanedIds.delete(playerId);

  for (const key of recentInteractionTickByKey.keys()) {
    if (key.startsWith(`${playerId}|`) || key.includes(`|${playerId}|`)) {
      recentInteractionTickByKey.delete(key);
    }
  }
}

function unleash(pet) {
  setOwnerId(pet, undefined);
  detachLeashRope(pet);
}

function normalizeRideState(player) {
  dismount(player);

  try {
    player.getComponent("minecraft:rideable")?.ejectRiders();
  } catch {
    // Ignore if player has no riders.
  }

  // brr:shoulders_off restores the brr:rideable_default seat layout.
  triggerPetEvent(player, "brr:shoulders_off");
}

function mountRider(rider, mount) {
  normalizeRideState(rider);
  normalizeRideState(mount);

  triggerPetEvent(mount, "brr:shoulders_on");

  // Seat on the next tick so the brr:rideable_shoulders component group is active first.
  system.runTimeout(() => {
    if (!rider.isValid || !mount.isValid) return;

    try {
      mount.getComponent("minecraft:rideable")?.addRider(rider);
    } catch {
      // Ignore if the mount cannot accept this rider.
    }
  }, 1);
}

function dismount(player) {
  const mount = getRideTarget(player);
  if (!mount) return;

  try {
    mount.getComponent("minecraft:rideable")?.ejectRider(player);
  } catch {
    // Ignore if the mount no longer has a rideable component.
  }

  if (isPlayerEntity(mount)) {
    triggerPetEvent(mount, "brr:shoulders_off");
  }
}

function getHeldItemType(player, itemStack) {
  return itemStack?.typeId ?? getMainhandItemType(player);
}

function getInteractionTick() {
  return system.currentTick;
}

function shouldSkipInteraction(source, target, held) {
  const sourceId = source?.id;
  const targetId = target?.id;
  if (!sourceId || !targetId) return false;

  const key = `${sourceId}|${targetId}|${held ?? "none"}`;
  const now = getInteractionTick();
  const previous = recentInteractionTickByKey.get(key);

  if (typeof previous === "number" && (now - previous) <= INTERACTION_DEDUPE_WINDOW_TICKS) {
    return true;
  }

  recentInteractionTickByKey.set(key, now);
  return false;
}

function getRideTarget(player) {
  try {
    return player.getComponent("minecraft:riding")?.entityRidingOn;
  } catch {
    return undefined;
  }
}

function applyCollarState(player, collared) {
  const hasCollarState = getCollaredState(player);

  if (collared && !hasCollarState) {
    setCollaredState(player, true);
    triggerPetEvent(player, "brr:collar_on");
    triggerPetEvent(player, "brr:leashable_on");
    return;
  }

  if (!collared && hasCollarState) {
    setCollaredState(player, false);
    normalizeRideState(player);
    triggerPetEvent(player, "brr:collar_off");
    unleash(player);
    triggerPetEvent(player, "brr:leashable_off");
  }
}

function scheduleRideableBaseline(player, delay = 1) {
  if (!player?.id) return;

  system.runTimeout(() => {
    if (!player?.isValid) return;

    triggerPetEvent(player, "brr:rideable_default");

    const collared = getCollaredState(player) || isWearingCollar(player);
    if (collared) {
      triggerPetEvent(player, "brr:collar_on");
    }
  }, delay);
}

world.afterEvents.playerSpawn.subscribe((event) => {
  scheduleRideableBaseline(event.player, event.initialSpawn ? 1 : 2);
});

system.runTimeout(() => {
  for (const player of getPlayers()) {
    scheduleRideableBaseline(player, 1);
  }
  // Older versions also kept every pet in one world list that only ever grew.
  try {
    world.setDynamicProperty(LEGACY_WORLD_PET_STATE, undefined);
  } catch { }
}, 1);

world.afterEvents?.playerLeave?.subscribe((event) => {
  clearCachedState(event?.playerId);
});

function handlePlayerInteraction(source, target, held) {
  if (!source || !target || !isPlayerEntity(target)) return;

  const sourceIsCollared = isCollared(source);
  const targetIsCollared = isCollared(target);
  // Checked by id so it also holds while the owner is offline.
  const ownerId = getOwnerId(target);

  if (held === LEASH_ITEM) {
    if (!targetIsCollared) {
      source.sendMessage("You can only leash players wearing a pet collar.");
      return;
    }

    // Using the leash on your own pet again lets them go.
    if (ownerId === source.id) {
      unleash(target);
      source.sendMessage("You let your pet off the leash.");
      return;
    }
    if (ownerId) {
      source.sendMessage("This pet is leashed to someone else.");
      return;
    }

    setLeash(source, target);
    return;
  }

  // Like a vanilla lead: an empty hand on your own leashed pet lets them go too.
  if (!held && ownerId === source.id) {
    unleash(target);
    source.sendMessage("You let your pet off the leash.");
    return;
  }

  if (held === SIT_ITEM) {
    if (!targetIsCollared) {
      source.sendMessage("You can only use the sit item on collared players.");
      return;
    }

    if (!canPlayersRideEachOther(target, source)) {
      sendRideDenied(source);
      return;
    }

    const owner = getOwnerForPet(target);
    if (owner && owner.id !== source.id) {
      source.sendMessage("This pet is leashed to someone else.");
      return;
    }

    mountRider(target, source);
    return;
  }

  if (sourceIsCollared) {
    if (!canPlayersRideEachOther(source, target)) {
      sendRideDenied(source);
      return;
    }

    const owner = getOwnerForPet(source);
    if (owner && owner.id !== target.id) {
      source.sendMessage("You are leashed and can only shoulder-sit your owner.");
      return;
    }

    mountRider(source, target);
  }
}

const beforeInteractWithEntitySignal = world.beforeEvents?.playerInteractWithEntity;

if (beforeInteractWithEntitySignal) {
  beforeInteractWithEntitySignal.subscribe((event) => {
    const source = event.player;
    const target = event.target;
    if (!source || !target || !isPlayerEntity(target) || source.id === target.id) return;

    const held = getHeldItemType(source, event.itemStack);
    const sourceIsCollared = getCollaredState(source) || isWearingCollar(source);
    const targetIsCollared = getCollaredState(target) || isWearingCollar(target);
    const usesPetItem = held === LEASH_ITEM || held === SIT_ITEM;
    // Collared targets also swallow vanilla clicks so a vanilla lead or empty-hand unleash can't touch the rope.
    if (!sourceIsCollared && !targetIsCollared && !usesPetItem) return;

    event.cancel = true;

    if (shouldSkipInteraction(source, target, held)) return;

    system.run(() => {
      if (!source.isValid || !target.isValid) return;
      handlePlayerInteraction(source, target, held);
    });
  });
}

system.runInterval(() => {
  tickCount++;

  if (tickCount % 40 === 0) {
    // Interaction keys are stamped with system.currentTick, not the local tickCount.
    const cutoff = getInteractionTick() - 80;
    for (const [key, seenTick] of recentInteractionTickByKey.entries()) {
      if (seenTick < cutoff) {
        recentInteractionTickByKey.delete(key);
      }
    }
  }

  const players = getPlayers();

  for (const player of players) {
    const collared = isWearingCollar(player);
    applyCollarState(player, collared);
    clearLegacyPetState(player);

    if (!collared) continue;

    if (tickCount % 20 === 0) {
      triggerPetEvent(player, "brr:collar_on");
    }

    if (player.isSneaking && tickCount % 2 === 0) {
      dismount(player);
    }

    const owner = getOwnerForPet(player, players);

    if (tickCount % LEASH_ROPE_SYNC_INTERVAL_TICKS === 0) {
      syncLeashRope(player, owner);
    }

    if (!owner || owner.dimension.id !== player.dimension.id) continue;

    const rideTarget = getRideTarget(player);
    if (rideTarget && rideTarget.id !== owner.id) {
      dismount(player);
      continue;
    }

    const dx = owner.location.x - player.location.x;
    const dy = owner.location.y - player.location.y;
    const dz = owner.location.z - player.location.z;
    const distanceSquared = (dx * dx) + (dy * dy) + (dz * dz);

    if (distanceSquared <= LEASH_PULL_DISTANCE_SQUARED) {
      continue;
    }

    const horizontal = Math.sqrt(dx * dx + dz * dz) || 1;
    const nx = dx / horizontal;
    const nz = dz / horizontal;
    const verticalStrength = Math.max(-0.15, Math.min(0.35, dy * 0.08));

    let horizontalStrength = 0.5;
    if (distanceSquared > LEASH_STRONG_PULL_DISTANCE_SQUARED) {
      horizontalStrength = 0.95;
    }
    if (distanceSquared > LEASH_HARD_PULL_DISTANCE_SQUARED) {
      horizontalStrength = 1.3;
    }

    try {
      player.applyKnockback({ x: nx * horizontalStrength, z: nz * horizontalStrength }, verticalStrength);
    } catch {
      try {
        player.teleport(
          {
            x: player.location.x + (nx * 0.65),
            y: player.location.y + Math.max(-0.1, Math.min(0.3, dy * 0.03)),
            z: player.location.z + (nz * 0.65)
          },
          { dimension: player.dimension, keepVelocity: true }
        );
      } catch {
        // Ignore movement fallback failures.
      }
    }
  }
}, 1);