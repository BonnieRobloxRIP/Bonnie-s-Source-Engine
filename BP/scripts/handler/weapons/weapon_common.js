import { world, system, ItemStack, EntityDamageCause } from "@minecraft/server";
import { scaleSoundOptions } from "../core/player_settings.js";
import { pruneActionBar, updateActionBar } from "../core/action_bar.js";
import { getMainhandTypeId as getCachedMainhandTypeId, invalidateHeldItem } from "../core/held_item.js";

// SECTION: Debug Logging
// Flip on to surface swallowed errors from the helpers below during development.
const WEAPON_DEBUG_LOGGING = false;

export function logWeaponError(context, error) {
    if (!WEAPON_DEBUG_LOGGING) return;
    try {
        console.warn(`[weapons] ${context}: ${error?.message ?? error}`);
    } catch { }
}

// SECTION: Tick and Event Helpers
export function getCurrentTick() {
    return system.currentTick;
}

export function getEventSourcePlayer(eventData) {
    return eventData?.source
        ?? eventData?.sourceEntity
        ?? eventData?.player
        ?? eventData?.damagingEntity;
}

export function getEventItemTypeId(eventData) {
    return `${eventData?.itemStack?.typeId ?? eventData?.item?.typeId ?? ""}`.trim().toLowerCase();
}

export function isPlayerEntity(entity) {
    return `${entity?.typeId ?? ""}`.trim().toLowerCase() === "minecraft:player";
}

export function isSneaking(player) {
    try {
        return !!player?.isSneaking;
    } catch {
        return false;
    }
}

export function isCreativePlayer(player) {
    try {
        return `${player?.getGameMode?.() ?? ""}`.toLowerCase() === "creative";
    } catch {
        return false;
    }
}

/** Subscribes to a world.afterEvents signal by name, tolerating signals missing from older API versions. */
export function subscribeAfterEvent(signalName, callback) {
    try {
        const signal = world.afterEvents?.[signalName];
        if (signal && typeof signal.subscribe === "function") {
            signal.subscribe(callback);
            return true;
        }
    } catch { }

    return false;
}

// SECTION: Equipment Helpers
// Mainhand lookups are cached per player per tick (core/held_item.js), shared with every other system.
export function getMainhandTypeId(player) {
    return getCachedMainhandTypeId(player).trim().toLowerCase();
}

/** Replaces the held item with a fresh stack of another id. Only used to migrate retired item ids. */
export function setMainhandType(player, itemTypeId) {
    if (!player?.id || !itemTypeId) return false;

    try {
        const equippable = player.getComponent("minecraft:equippable");
        if (!equippable) return false;
        equippable.setEquipment("Mainhand", new ItemStack(itemTypeId, 1));
        invalidateHeldItem(player);
        return true;
    } catch (error) {
        logWeaponError("setMainhandType", error);
        return false;
    }
}

// SECTION: Sound Helpers
// Weapon sounds are played at the shooter's head for every nearby player (each at their own volume
// settings), so gunfire, reloads and beams are heard in multiplayer.
const WEAPON_SOUND_RANGE = 64;

/**
 * A weapon sound from this player: the player hears the first-person copy ("<id>.fp", music category, on themselves),
 * everyone else nearby hears the normal one from the player's position, so the shooter never hears both.
 */
export function playSoundForPlayer(player, soundId, options = {}) {
    if (!player?.id || !soundId) return;

    try {
        player.playSound(`${soundId}.fp`, scaleSoundOptions(player, options));
    } catch (error) {
        logWeaponError(`playSoundForPlayer(${soundId}.fp)`, error);
    }

    let others;
    try {
        const location = getHeadLocation(player);
        others = player.dimension.getPlayers({ location, maxDistance: WEAPON_SOUND_RANGE });
        for (const other of others) {
            if (other.id === player.id) continue;
            const scaled = scaleSoundOptions(other, options);
            if (scaled.volume <= 0) continue;
            try {
                other.playSound(soundId, { ...scaled, location });
            } catch { }
        }
    } catch { }
}

/** Stops a weapon sound for everyone near the player (looping charge/beam sounds): both copies. */
export function stopSoundForPlayer(player, soundId) {
    if (!player?.id || !soundId) return;

    try {
        player.runCommand(`stopsound @a[r=${WEAPON_SOUND_RANGE}] ${soundId}`);
        player.runCommand(`stopsound @s ${soundId}.fp`);
    } catch { }
}

export function playRandomSound(player, soundPool) {
    if (!player?.id || !Array.isArray(soundPool) || soundPool.length <= 0) return;
    const randomIndex = Math.floor(Math.random() * soundPool.length);
    playSoundForPlayer(player, soundPool[randomIndex] ?? soundPool[0]);
}

export function getRandomIntInclusive(minValue, maxValue) {
    const min = Math.floor(minValue);
    const max = Math.floor(maxValue);
    return min + Math.floor(Math.random() * ((max - min) + 1));
}

// SECTION: Vector Math
export function lengthOf(vector) {
    return Math.sqrt((vector.x * vector.x) + (vector.y * vector.y) + (vector.z * vector.z));
}

export function normalize(vector) {
    const vectorLength = lengthOf(vector);
    if (!Number.isFinite(vectorLength) || vectorLength <= 0.000001) {
        return { x: 0, y: 0, z: 1 };
    }

    return {
        x: vector.x / vectorLength,
        y: vector.y / vectorLength,
        z: vector.z / vectorLength
    };
}

export function add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function subtract(a, b) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scale(vector, scalar) {
    return {
        x: vector.x * scalar,
        y: vector.y * scalar,
        z: vector.z * scalar
    };
}

export function dot(a, b) {
    return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
}

export function cross(a, b) {
    return {
        x: (a.y * b.z) - (a.z * b.y),
        y: (a.z * b.x) - (a.x * b.z),
        z: (a.x * b.y) - (a.y * b.x)
    };
}

export function clamp(value, minValue, maxValue) {
    return Math.min(maxValue, Math.max(minValue, value));
}

/** Rotates a unit direction by a random angle inside a cone of the given half-angle (degrees). */
export function applySpread(direction, halfAngleDegrees) {
    if (!(halfAngleDegrees > 0)) return direction;

    const { right, up } = getBeamBasis(direction);
    const maxTan = Math.tan((halfAngleDegrees * Math.PI) / 180);
    const radius = Math.sqrt(Math.random()) * maxTan;
    const angle = Math.random() * Math.PI * 2;
    return normalize(add(direction, add(scale(right, Math.cos(angle) * radius), scale(up, Math.sin(angle) * radius))));
}

// SECTION: Aim and Hit Detection
export function getHeadLocation(entity) {
    try {
        if (typeof entity?.getHeadLocation === "function") {
            return entity.getHeadLocation();
        }
    } catch { }

    const location = entity?.location ?? { x: 0, y: 0, z: 0 };
    return {
        x: Number(location.x) || 0,
        y: (Number(location.y) || 0) + 1.62,
        z: Number(location.z) || 0
    };
}

/** Where shots start: the shooter's eye, so they land on the crosshair. */
export function getAimPoint(entity) {
    return getHeadLocation(entity);
}

/** Builds a forward/right/up basis for a beam direction, used to offset a muzzle point from the head. */
export function getBeamBasis(direction) {
    const forward = normalize(direction);
    const worldUp = Math.abs(forward.y) > 0.98 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };

    const right = normalize(cross(forward, worldUp));
    const up = normalize(cross(right, forward));
    return { forward, right, up };
}

/** Approximates a muzzle-mounted beam origin since the Script API cannot read attachable locators directly. */
export function getBeamOriginFromLaserPointApprox(player, direction, forwardOffset, rightOffset, upOffset) {
    const { forward, right, up } = getBeamBasis(direction);
    const head = getHeadLocation(player);

    return add(
        add(
            add(head, scale(forward, forwardOffset)),
            scale(right, rightOffset)
        ),
        scale(up, upOffset)
    );
}

// Entities a shot never stops on (pickups, projectiles, decorations).
const NON_TARGET_TYPES = [
    "minecraft:item", "minecraft:xp_orb", "minecraft:arrow", "minecraft:snowball", "minecraft:egg",
    "minecraft:ender_pearl", "minecraft:fishing_hook", "minecraft:thrown_trident", "minecraft:splash_potion",
    "minecraft:lingering_potion", "minecraft:xp_bottle", "minecraft:small_fireball", "minecraft:fireball",
    "minecraft:wind_charge_projectile", "minecraft:falling_block", "minecraft:painting", "minecraft:leash_knot",
    "minecraft:area_effect_cloud", "minecraft:lightning_bolt"
];

/** Excludes non-combat entities (dropped items, xp orbs, projectiles) from hit-scan targeting. */
export function isDamageableTarget(target, actor) {
    if (!target?.id || target.id === actor?.id) return false;

    const typeId = `${target.typeId ?? ""}`.trim().toLowerCase();
    if (!typeId || NON_TARGET_TYPES.includes(typeId)) return false;

    try {
        return !!target.getComponent("minecraft:health");
    } catch {
        return false;
    }
}

/**
 * First solid block along a ray, with the distance to the point where the ray meets it.
 * (Block raycast results carry no distance of their own; faceLocation is relative to the block.)
 */
export function getFirstBlockingBlockHit(dimension, origin, direction, maxDistance) {
    try {
        const hit = dimension.getBlockFromRay(origin, direction, {
            maxDistance,
            includePassableBlocks: false,
            includeLiquidBlocks: false
        });
        if (!hit?.block) return null;

        const blockLocation = hit.block.location;
        const point = {
            x: blockLocation.x + hit.faceLocation.x,
            y: blockLocation.y + hit.faceLocation.y,
            z: blockLocation.z + hit.faceLocation.z
        };
        return { block: hit.block, face: hit.face, point, distance: lengthOf(subtract(point, origin)) };
    } catch {
        return null;
    }
}

export function getDistanceToFirstBlockingBlock(dimension, origin, direction, maxDistance) {
    const hit = getFirstBlockingBlockHit(dimension, origin, direction, maxDistance);
    return hit ? Math.max(0, hit.distance - 0.05) : maxDistance;
}

function getEntityCenter(entity) {
    const feet = entity.location;
    const head = getHeadLocation(entity);
    return { x: feet.x, y: (feet.y + head.y) / 2, z: feet.z };
}

/**
 * Traces a shot: the nearest damageable entity whose hitbox the ray crosses before the first solid block.
 * assistRadius > 0 additionally accepts entities whose centre lies within that distance of the ray
 * (still requiring a clear line to them); weapons that want exact aim pass 0.
 * Returns { entityHit, blockHit, distance, endPoint } where entityHit = { entity, distance, impactPoint }.
 */
export function traceShot(shooter, origin, direction, maxDistance, assistRadius = 0) {
    const dimension = shooter.dimension;
    const blockHit = getFirstBlockingBlockHit(dimension, origin, direction, maxDistance);
    const limit = blockHit ? blockHit.distance : maxDistance;
    let entityHit = null;

    try {
        const hits = dimension.getEntitiesFromRay(origin, direction, {
            maxDistance: limit,
            ignoreBlockCollision: true,
            excludeTypes: NON_TARGET_TYPES
        });
        for (const hit of hits) {
            if (hit.distance > limit || !isDamageableTarget(hit.entity, shooter)) continue;
            if (!entityHit || hit.distance < entityHit.distance) {
                entityHit = { entity: hit.entity, distance: hit.distance, impactPoint: add(origin, scale(direction, hit.distance)) };
            }
        }
    } catch (error) {
        logWeaponError("traceShot ray", error);
    }

    if (!entityHit && assistRadius > 0) {
        entityHit = findAssistTarget(shooter, origin, direction, limit, assistRadius);
    }

    const distance = entityHit ? entityHit.distance : limit;
    return { entityHit, blockHit: entityHit ? null : blockHit, distance, endPoint: add(origin, scale(direction, distance)) };
}

function findAssistTarget(shooter, origin, direction, limit, assistRadius) {
    let candidates = [];
    try {
        const half = limit / 2;
        candidates = shooter.dimension.getEntities({
            location: add(origin, scale(direction, half)),
            maxDistance: half + assistRadius + 1,
            excludeTypes: NON_TARGET_TYPES
        });
    } catch {
        return null;
    }

    let best = null;
    for (const target of candidates) {
        if (!isDamageableTarget(target, shooter)) continue;

        const center = getEntityCenter(target);
        const along = dot(subtract(center, origin), direction);
        if (!(along > 0) || along > limit) continue;

        const lateral = lengthOf(subtract(center, add(origin, scale(direction, along))));
        if (lateral > assistRadius) continue;
        if (best && along >= best.distance) continue;

        const toCenter = subtract(center, origin);
        const blocked = getFirstBlockingBlockHit(shooter.dimension, origin, normalize(toCenter), lengthOf(toCenter));
        if (blocked) continue;

        best = { entity: target, distance: along, impactPoint: center };
    }
    return best;
}

/** Nearest entity hit along a ray (see traceShot); kept for callers that only need the entity. */
export function findEntityHit(shooter, origin, direction, maxDistance, assistRadius = 0) {
    return traceShot(shooter, origin, direction, maxDistance, assistRadius).entityHit;
}

// SECTION: Damage
/** Applies hit-scan damage, falling back to a /damage command run as the target when the direct call fails. */
export function applyWeaponDamage(actor, target, amount, cause = EntityDamageCause.entityAttack) {
    if (!actor?.id || !target?.id) return false;

    const safeDamage = Math.max(0, Number(amount) || 0);
    if (safeDamage <= 0) return false;

    try {
        return target.applyDamage(safeDamage, { cause, damagingEntity: actor });
    } catch { }

    if (!isPlayerEntity(target)) return false;

    try {
        target.runCommand(`damage @s ${safeDamage} entity_attack`);
        return true;
    } catch (error) {
        logWeaponError("applyWeaponDamage", error);
        return false;
    }
}

// SECTION: Animation Signals
// Weapon animations follow what the server actually did, through two player values the attachable
// controllers read (see BP/entities/player.json):
//   query.mark_variant: the current weapon action (WEAPON_ACTION), set by brr:wpn_action_<n>
//   query.variant:      the held gun's condition, 0 loaded / 1 empty, set by brr:wpn_cond_<loaded|empty>
// One-shot actions (shots, melee hits) are "pulsed": set, then cleared after a few ticks.
export const WEAPON_ACTION = Object.freeze({
    NONE: 0,
    MAGNUM_RELOAD: 1,
    RELOAD: 2,
    SHOT_A: 3,
    SHOT_B: 4,
    MELEE_HIT: 5,
    MELEE_MISS: 6,
    CHARGED_SHOT: 7,
    CHARGING: 8,
    BEAM: 9,
    MELEE_HIT_B: 10,
    MELEE_MISS_B: 11,
    DOUBLE_SHOT_A: 12,
    DOUBLE_SHOT_B: 13,
    SHELL_RELOAD: 14
});
const PULSE_TICKS = 3;

const actionByPlayer = new Map();
const pulseResetTickByPlayer = new Map();
const conditionByPlayer = new Map();
const lastShotSlotByPlayer = new Map();
const lastDoubleSlotByPlayer = new Map();

function triggerPlayerEvent(player, eventName) {
    try {
        player.triggerEvent(eventName);
        return true;
    } catch (error) {
        logWeaponError(`triggerEvent(${eventName})`, error);
        return false;
    }
}

export function setWeaponAction(player, action) {
    if (!player?.id) return;
    pulseResetTickByPlayer.delete(player.id);
    if (actionByPlayer.get(player.id) === action) return;
    if (triggerPlayerEvent(player, `brr:wpn_action_${action}`)) actionByPlayer.set(player.id, action);
}

export function pulseWeaponAction(player, action, ticks = PULSE_TICKS) {
    if (!player?.id) return;
    setWeaponAction(player, action);
    pulseResetTickByPlayer.set(player.id, getCurrentTick() + ticks);
}

/**
 * Signals one melee swing. Swings alternate between slot A (hit 5 / miss 6) and slot B (hit 10 / miss 11) on every
 * swing, hit or miss, so each new swing is a different value and restarts the attack animation.
 */
const meleeSlotBByPlayer = new Map();
export function pulseMelee(player, hit) {
    if (!player?.id) return;
    const slotB = meleeSlotBByPlayer.has(player.id) ? !meleeSlotBByPlayer.get(player.id) : false; // first swing: slot A
    meleeSlotBByPlayer.set(player.id, slotB);
    const action = hit
        ? (slotB ? WEAPON_ACTION.MELEE_HIT_B : WEAPON_ACTION.MELEE_HIT)
        : (slotB ? WEAPON_ACTION.MELEE_MISS_B : WEAPON_ACTION.MELEE_MISS);
    pulseWeaponAction(player, action);
}

/** Signals one shot; alternates between two values so back-to-back shots each restart the fire animation. */
export function pulseShot(player) {
    if (!player?.id) return;
    const next = lastShotSlotByPlayer.get(player.id) === WEAPON_ACTION.SHOT_A ? WEAPON_ACTION.SHOT_B : WEAPON_ACTION.SHOT_A;
    lastShotSlotByPlayer.set(player.id, next);
    pulseWeaponAction(player, next);
}

/** Signals one double-barrel shot (shotgun secondary fire); alternates like pulseShot. */
export function pulseDoubleShot(player) {
    if (!player?.id) return;
    const next = lastDoubleSlotByPlayer.get(player.id) === WEAPON_ACTION.DOUBLE_SHOT_A ? WEAPON_ACTION.DOUBLE_SHOT_B : WEAPON_ACTION.DOUBLE_SHOT_A;
    lastDoubleSlotByPlayer.set(player.id, next);
    pulseWeaponAction(player, next);
}

export function getWeaponAction(player) {
    return actionByPlayer.get(player?.id) ?? WEAPON_ACTION.NONE;
}

export function setWeaponCondition(player, empty) {
    if (!player?.id) return;
    const value = empty ? "empty" : "loaded";
    if (conditionByPlayer.get(player.id) === value) return;
    if (triggerPlayerEvent(player, `brr:wpn_cond_${value}`)) conditionByPlayer.set(player.id, value);
}

// Values saved on the player survive rejoining; reset them so nothing is stuck mid-reload or mid-beam.
world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    if (!initialSpawn) return;
    actionByPlayer.delete(player.id);
    conditionByPlayer.delete(player.id);
    setWeaponAction(player, WEAPON_ACTION.NONE);
    setWeaponCondition(player, false);
});

// SECTION: Ammo HUD
// Each weapon reports its readout every tick it's held; the action bar owner (core/action_bar.js) shows it under
// any NPC subtitle and clears it when nothing reports.
const hudReportsThisTick = new Map();

export function reportWeaponHud(player, text) {
    if (player?.id) hudReportsThisTick.set(player.id, text);
}

function flushWeaponHud(players, tick) {
    for (const player of players) updateActionBar(player, hudReportsThisTick.get(player.id), tick);
    hudReportsThisTick.clear();
}

// SECTION: Per-Player State Lifecycle
// Entries only go stale when a player leaves, so pruning runs on the dispatcher tick after a leave
// (and every PRUNE_BACKSTOP_TICKS as a safety net) instead of every tick in every weapon.
const PRUNE_BACKSTOP_TICKS = 200;
let pruneDue = true;
world.afterEvents.playerLeave.subscribe(() => {
    pruneDue = true;
});

/** Deletes every entry keyed by a player id that is no longer online, across any number of maps. */
export function pruneStalePlayerState(stateMaps, onlinePlayers) {
    if (!pruneDue) return;
    for (const map of stateMaps) {
        for (const key of map.keys()) {
            if (!onlinePlayers.has(key)) {
                map.delete(key);
            }
        }
    }
}

// SECTION: Shared Tick Dispatcher
// Single system.runInterval fans out to every registered weapon so world.getPlayers()/currentTick
// are only computed once per tick instead of once per weapon file.
const weaponTickCallbacks = [];

export function registerWeaponTick(callback) {
    weaponTickCallbacks.push(callback);
}

// SECTION: Guns don't break blocks
// Left click is a shot with the shotgun (and a swing with everything else): no gun ever breaks the block it is
// pointed at, in any game mode (the items also have can_destroy_in_creative off). The crowbar is a tool and still can.
const GUN_ITEMS = new Set([
    "brr:glock17", "brr:glock17_empty", "brr:magnum357", "brr:magnum357_empty",
    "brr:spas12", "brr:tau_cannon", "brr:gluon_gun"
]);

world.beforeEvents.playerBreakBlock.subscribe((event) => {
    if (GUN_ITEMS.has(event.itemStack?.typeId)) event.cancel = true;
});

// SECTION: Put-away weapon sounds
// The draw-admire and fidget sounds are played by the weapon animations (tools/bm_anim/weapons.config.mjs). They are
// long, so when the weapon is put away mid-sound they are stopped: the first-person ".fp" copy for the player, the
// normal copy for everyone around.
const ANIMATION_SOUNDS = {
    "brr:glock17": ["weapons.glock.draw_admire", "weapons.glock.idle_fidget"],
    "brr:magnum357": ["weapons.357.draw_admire"],
    "brr:tau_cannon": ["weapons.gauss.draw_admire", "weapons.gauss.idle_fidget"],
    "brr:spas12": ["weapons.shotgun.draw_admire"]
};
const lastHeldByPlayer = new Map();

function stopSoundsOfPutAwayWeapons(players) {
    for (const player of players) {
        const held = getMainhandTypeId(player);
        const before = lastHeldByPlayer.get(player.id);
        lastHeldByPlayer.set(player.id, held);
        if (before === undefined || before === held) continue;
        for (const soundId of ANIMATION_SOUNDS[before] ?? []) stopSoundForPlayer(player, soundId);
    }
}

system.runInterval(() => {
    const players = world.getPlayers();
    const tick = getCurrentTick();
    const onlinePlayers = new Map();

    for (const player of players) {
        if (player?.id) onlinePlayers.set(player.id, player);
    }

    for (const callback of weaponTickCallbacks) {
        try {
            callback(players, tick, onlinePlayers);
        } catch (error) {
            logWeaponError("weapon tick callback", error);
        }
    }

    for (const [playerId, resetTick] of pulseResetTickByPlayer) {
        if (tick < resetTick) continue;
        pulseResetTickByPlayer.delete(playerId);
        const player = onlinePlayers.get(playerId);
        if (player) setWeaponAction(player, WEAPON_ACTION.NONE);
    }

    stopSoundsOfPutAwayWeapons(players);
    flushWeaponHud(players, tick);

    if (tick % PRUNE_BACKSTOP_TICKS === 0) pruneDue = true;
    if (pruneDue) {
        pruneStalePlayerState([actionByPlayer, pulseResetTickByPlayer, conditionByPlayer, lastShotSlotByPlayer, lastDoubleSlotByPlayer, meleeSlotBByPlayer, lastHeldByPlayer], onlinePlayers);
        pruneActionBar(onlinePlayers);
        pruneDue = false;
    }
}, 1);
