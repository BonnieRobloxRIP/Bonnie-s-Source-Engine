import { system } from "@minecraft/server";
import { renderGluonBeamVisual } from "./gluon_beam_visual.js";
import { consumeAmmo, getAmmoRemaining, playEmptySound } from "./ammo_system.js";
import { flashShooterLight } from "./effects.js";
import {
    WEAPON_ACTION,
    getCurrentTick,
    getEventSourcePlayer,
    getEventItemTypeId,
    isPlayerEntity,
    getMainhandTypeId,
    playSoundForPlayer,
    stopSoundForPlayer,
    lengthOf,
    normalize,
    add,
    subtract,
    scale,
    dot,
    clamp,
    getAimPoint,
    getBeamBasis,
    getBeamOriginFromLaserPointApprox,
    traceShot,
    applyWeaponDamage,
    setWeaponAction,
    reportWeaponHud,
    subscribeAfterEvent,
    registerWeaponTick,
    pruneStalePlayerState
} from "./weapon_common.js";

// SECTION: Gluon Constants
const GLUON_ITEM_ID = "brr:gluon_gun";
const GLUON_AURA_PARTICLE = "brr:gluon_beam_aura";
const GLUON_CORE_PARTICLE = "brr:gluon_beam_core";
const GLUON_ARC_PARTICLE = "brr:gluon_beam_arc";
const GLUON_TRAIL_PARTICLE = "brr:gluon_beam_trail";
const GLUON_SPARK_PARTICLE = "brr:gluon_beam_particle";
const GLUON_FALLBACK_PARTICLE = "minecraft:basic_flame_particle";
const GLUON_FIRE_START_SOUND = "weapons.egon_fire_start";
const GLUON_FIRE_SOUND = "weapons.egon_fire";
const GLUON_FIRE_END_SOUND = "weapons.egon_fire_end";
const GLUON_HIT_SOUNDS = [
    "weapons.egon_hit1",
    "weapons.egon_hit2",
    "weapons.egon_hit3",
    "weapons.egon_hit4",
    "weapons.egon_hit5"
];
const FIRE_LOOP_START_DELAY_TICKS = 6;
const FIRE_LOOP_INTERVAL_TICKS = 165;
const HIT_SOUND_INTERVAL_TICKS = 2;
const MAX_BEAM_DISTANCE = 64;
const LASER_POINT_FORWARD_OFFSET = 0.72;
const LASER_POINT_RIGHT_OFFSET = 0.4;
const LASER_POINT_UP_OFFSET = -0.4;
const MOVE_WOBBLE_MAX_RIGHT_OFFSET = 0.8;
const MOVE_WOBBLE_FULL_SPEED = 0.5;
const MOVE_WOBBLE_TIME_SCALE = 1;
const MOVE_WOBBLE_STRAFE_BIAS = 0.2;
const MOVE_WOBBLE_SMOOTHING = 0.24;
// The gluon's beam reach: entities within 2 blocks of the beam line are caught (by design, with a clear line).
const BEAM_HIT_RADIUS = 2;
// 20 damage every tick, by design. (Minecraft's hurt cooldown may cap how much of it actually lands.)
const DAMAGE_PER_TICK = 20;
const USE_HOLD_THRESHOLD_TICKS = 3;
// Beam particles live ~3 ticks, so drawing every 2nd tick looks continuous at half the cost.
const BEAM_RENDER_INTERVAL_TICKS = 2;
const MUZZLE_LIGHT_INTERVAL_TICKS = 4;
const GLUON_KILL_EFFECT_WINDOW_TICKS = 8;
const GLUON_DISINTEGRATE_PASSES = 6;
const GLUON_DISINTEGRATE_PASS_INTERVAL_TICKS = 2;
const GLUON_DISINTEGRATE_PARTICLES_PER_PASS = 18;
const DEBUG_ENABLED = false;
const DEBUG_ACTIONBAR_INTERVAL_TICKS = 6;

// SECTION: Gluon Runtime State
const firingPlayers = new Set();
const lastHitSoundTickByPair = new Map();
const pressTickByPlayer = new Map();
const nextFireLoopTickByPlayer = new Map();
const movementStateByPlayer = new Map();
const recentGluonHitByTarget = new Map();
const debugLastActionbarTickByPlayer = new Map();
const debugLastEventByPlayer = new Map();

// SECTION: Shared Helpers
function playLoopedFireSound(player, tick) {
    const scheduledTick = nextFireLoopTickByPlayer.get(player.id);
    if (scheduledTick !== undefined && tick < scheduledTick) return;

    playSoundForPlayer(player, GLUON_FIRE_SOUND);
    nextFireLoopTickByPlayer.set(player.id, tick + FIRE_LOOP_INTERVAL_TICKS);
}

function playRandomHitSound(player, tick, pairKey) {
    const previousTick = lastHitSoundTickByPair.get(pairKey);
    if (previousTick !== undefined && (tick - previousTick) < HIT_SOUND_INTERVAL_TICKS) return;

    lastHitSoundTickByPair.set(pairKey, tick);
    const soundId = GLUON_HIT_SOUNDS[Math.floor(Math.random() * GLUON_HIT_SOUNDS.length)] ?? GLUON_HIT_SOUNDS[0];
    playSoundForPlayer(player, soundId);
}

const isGluonItem = (typeId) => `${typeId ?? ""}`.trim().toLowerCase() === GLUON_ITEM_ID;
const isHoldingGluon = (player) => isGluonItem(getMainhandTypeId(player));

// SECTION: Firing State
function beginFiring(player, tick) {
    if (getAmmoRemaining(player) <= 0) {
        playEmptySound(player);
        return;
    }

    if (!firingPlayers.has(player.id)) {
        playSoundForPlayer(player, GLUON_FIRE_START_SOUND);
        nextFireLoopTickByPlayer.set(player.id, tick + FIRE_LOOP_START_DELAY_TICKS);
    }
    firingPlayers.add(player.id);
    setWeaponAction(player, WEAPON_ACTION.BEAM);
    debugSetEvent(player, "begin");
}

function stopFiring(player) {
    pressTickByPlayer.delete(player.id);
    if (!firingPlayers.delete(player.id)) return;

    nextFireLoopTickByPlayer.delete(player.id);
    stopSoundForPlayer(player, GLUON_FIRE_START_SOUND);
    stopSoundForPlayer(player, GLUON_FIRE_SOUND);
    playSoundForPlayer(player, GLUON_FIRE_END_SOUND);
    setWeaponAction(player, WEAPON_ACTION.NONE);
    debugSetEvent(player, "stop");
}

// SECTION: Debug Helpers
function debugActionbar(player, message, force = false) {
    if (!DEBUG_ENABLED || !player?.id) return;

    const tick = getCurrentTick();
    const lastTick = debugLastActionbarTickByPlayer.get(player.id) ?? -Infinity;
    if (!force && (tick - lastTick) < DEBUG_ACTIONBAR_INTERVAL_TICKS) return;

    debugLastActionbarTickByPlayer.set(player.id, tick);
    try {
        player.onScreenDisplay.setActionBar(`[gluon dbg] ${`${message ?? ""}`.slice(0, 180)}`);
    } catch { }
}

function debugSetEvent(player, eventName) {
    if (!DEBUG_ENABLED || !player?.id) return;
    debugLastEventByPlayer.set(player.id, eventName);
    debugActionbar(player, `event=${eventName}`, true);
}

// SECTION: Beam Math and Targeting
function getPlayerMovePhaseOffset(playerId) {
    const safeId = `${playerId ?? ""}`;
    let hash = 0;

    for (let i = 0; i < safeId.length; i++) {
        hash = ((hash * 31) + safeId.charCodeAt(i)) | 0;
    }

    return Math.abs(hash % 628) / 100;
}

function sampleHorizontalMotion(player, tick) {
    const previousState = movementStateByPlayer.get(player.id) ?? {
        lastLocation: { ...player.location },
        lastTick: tick,
        smoothedSpeed: 0,
        phaseOffset: getPlayerMovePhaseOffset(player.id)
    };

    const currentLocation = player.location ?? previousState.lastLocation;
    const elapsedTicks = Math.max(1, tick - previousState.lastTick);

    let horizontal = { x: 0, y: 0, z: 0 };
    let speed = 0;

    try {
        const velocity = player.getVelocity();
        horizontal = { x: velocity.x, y: 0, z: velocity.z };
        speed = Math.hypot(horizontal.x, horizontal.z);
    } catch { }

    if (speed <= 0.0001) {
        const dx = currentLocation.x - previousState.lastLocation.x;
        const dz = currentLocation.z - previousState.lastLocation.z;
        speed = Math.hypot(dx, dz) / elapsedTicks;
        horizontal = { x: dx, y: 0, z: dz };
    }

    const smoothedSpeed = (previousState.smoothedSpeed * (1 - MOVE_WOBBLE_SMOOTHING)) + (speed * MOVE_WOBBLE_SMOOTHING);
    movementStateByPlayer.set(player.id, {
        lastLocation: { ...currentLocation },
        lastTick: tick,
        smoothedSpeed,
        phaseOffset: previousState.phaseOffset
    });

    return {
        direction: speed > 0.0001 ? normalize(horizontal) : { x: 0, y: 0, z: 0 },
        movementFactor: clamp(smoothedSpeed / MOVE_WOBBLE_FULL_SPEED, 0, 1),
        phaseOffset: previousState.phaseOffset
    };
}

function getMovementWobbleRightOffset(player, aimDirection, tick) {
    const movement = sampleHorizontalMotion(player, tick);
    if (movement.movementFactor <= 0.0001) return { rightOffset: 0, movementFactor: 0 };

    const { right } = getBeamBasis(aimDirection);
    const oscillation = Math.sin((tick * MOVE_WOBBLE_TIME_SCALE) + movement.phaseOffset)
        * MOVE_WOBBLE_MAX_RIGHT_OFFSET
        * movement.movementFactor;
    const strafeBias = dot(movement.direction, right) * MOVE_WOBBLE_STRAFE_BIAS * movement.movementFactor;

    return { rightOffset: oscillation + strafeBias, movementFactor: movement.movementFactor };
}

function getDirectionToTarget(origin, targetPoint, fallbackDirection) {
    const toTarget = subtract(targetPoint, origin);
    const toTargetLength = lengthOf(toTarget);
    if (!Number.isFinite(toTargetLength) || toTargetLength <= 0.0001) return normalize(fallbackDirection);
    return normalize(toTarget);
}

// SECTION: Beam Damage and Effects
function applyBeamDamage(shooter, target, tick) {
    playRandomHitSound(shooter, tick, `${shooter.id}|${target.id}`);

    // Track recent hits so we can trigger disintegration particles if this hit causes death.
    try {
        recentGluonHitByTarget.set(target.id, { tick, location: { ...target.location } });
    } catch { }

    applyWeaponDamage(shooter, target, DAMAGE_PER_TICK);
}

function spawnParticleSafe(dimension, particle, location, fallback = GLUON_FALLBACK_PARTICLE) {
    try {
        dimension.spawnParticle(particle, location);
    } catch {
        if (!fallback) return;
        try {
            dimension.spawnParticle(fallback, location);
        } catch { }
    }
}

function randomRange(minValue, maxValue) {
    return minValue + (Math.random() * (maxValue - minValue));
}

function spawnDisintegratePass(dimension, center) {
    for (let i = 0; i < GLUON_DISINTEGRATE_PARTICLES_PER_PASS; i++) {
        const point = {
            x: center.x + randomRange(-0.55, 0.55),
            y: center.y + randomRange(0.05, 1.65),
            z: center.z + randomRange(-0.55, 0.55)
        };

        spawnParticleSafe(dimension, GLUON_TRAIL_PARTICLE, point);
        if (Math.random() < 0.2) spawnParticleSafe(dimension, GLUON_AURA_PARTICLE, point, null);
    }
}

function startGluonDisintegrationEffect(dimension, center) {
    if (!dimension || !center) return;

    for (let pass = 0; pass < GLUON_DISINTEGRATE_PASSES; pass++) {
        system.runTimeout(() => spawnDisintegratePass(dimension, center), pass * GLUON_DISINTEGRATE_PASS_INTERVAL_TICKS);
    }
}

function fireBeamTick(player, tick) {
    let viewDirection;
    try {
        viewDirection = normalize(player.getViewDirection());
    } catch {
        return;
    }

    // Aim: what the crosshair (or anything within the beam's reach) is on, stopping at walls.
    const aim = traceShot(player, getAimPoint(player), viewDirection, MAX_BEAM_DISTANCE, BEAM_HIT_RADIUS);
    const baseOrigin = getBeamOriginFromLaserPointApprox(
        player,
        viewDirection,
        LASER_POINT_FORWARD_OFFSET,
        LASER_POINT_RIGHT_OFFSET,
        LASER_POINT_UP_OFFSET
    );
    const { right: baseRight } = getBeamBasis(viewDirection);
    const movementWobble = getMovementWobbleRightOffset(player, viewDirection, tick);
    const beamOrigin = add(baseOrigin, scale(baseRight, movementWobble.rightOffset));
    const direction = getDirectionToTarget(beamOrigin, aim.entityHit ? aim.entityHit.impactPoint : aim.endPoint, viewDirection);

    const beam = traceShot(player, beamOrigin, direction, MAX_BEAM_DISTANCE);
    const hitEntity = beam.entityHit?.entity ?? aim.entityHit?.entity;
    const beamLength = beam.distance;
    const impactPoint = beam.entityHit ? beam.entityHit.impactPoint : beam.endPoint;
    const dimension = player.dimension;

    if ((tick % BEAM_RENDER_INTERVAL_TICKS) === 0) {
        const beamRender = renderGluonBeamVisual({
            dimension,
            origin: beamOrigin,
            direction,
            length: beamLength,
            tick,
            auraParticle: GLUON_AURA_PARTICLE,
            coreParticle: GLUON_CORE_PARTICLE,
            arcParticle: GLUON_ARC_PARTICLE,
            fallbackAuraParticle: GLUON_FALLBACK_PARTICLE,
            fallbackCoreParticle: GLUON_FALLBACK_PARTICLE,
            fallbackArcParticle: GLUON_FALLBACK_PARTICLE,
            step: 0.21,
            stepGrowth: 0.55,
            strands: 3,
            ampNear: 0.11,
            ampFar: 0.52,
            spiralTightness: 1.1,
            spiralTimeScale: 0.58,
            forwardLeadNear: 0.08,
            forwardLeadFar: 0.44,
            pathWobbleNear: 0.03,
            pathWobbleFar: 0.36,
            pathSwayAmount: 0.62 + (movementWobble.movementFactor * 1.18),
            pathSwayFrequency: 0.8 + (movementWobble.movementFactor * 0.45),
            pathSwayTimeScale: 0.47,
            coreFollowNear: 0.02,
            coreFollowFar: 0.16,
            auraStride: 3,
            maxParticles: Math.min(1400, Math.max(360, Math.ceil(beamLength * 10)))
        });

        if (!beamRender?.hasVisual) spawnParticleSafe(dimension, GLUON_FALLBACK_PARTICLE, beamOrigin, null);
        if (Math.random() < 0.55) spawnParticleSafe(dimension, GLUON_SPARK_PARTICLE, beamOrigin);

        if (hitEntity) {
            spawnParticleSafe(dimension, GLUON_SPARK_PARTICLE, impactPoint);
            if (Math.random() < 0.65) spawnParticleSafe(dimension, GLUON_SPARK_PARTICLE, impactPoint, null);
            spawnParticleSafe(dimension, GLUON_AURA_PARTICLE, impactPoint, null);
        } else if (beam.blockHit) {
            spawnParticleSafe(dimension, GLUON_TRAIL_PARTICLE, impactPoint);
            spawnParticleSafe(dimension, GLUON_SPARK_PARTICLE, impactPoint);
            if (Math.random() < 0.4) spawnParticleSafe(dimension, GLUON_AURA_PARTICLE, impactPoint, null);
        }
    }

    if ((tick % MUZZLE_LIGHT_INTERVAL_TICKS) === 0) flashShooterLight(player, MUZZLE_LIGHT_INTERVAL_TICKS + 1, 9);

    if (DEBUG_ENABLED) {
        const lastEvent = debugLastEventByPlayer.get(player.id) ?? "none";
        debugActionbar(player, `len=${beamLength.toFixed(1)} hit=${hitEntity ? 1 : 0} move=${movementWobble.movementFactor.toFixed(2)} event=${lastEvent}`);
    }

    if (hitEntity) applyBeamDamage(player, hitEntity, tick);
}

// SECTION: Event Wiring
subscribeAfterEvent("itemStartUse", (eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (!isPlayerEntity(player) || !isGluonItem(getEventItemTypeId(eventData))) return;

    pressTickByPlayer.set(player.id, getCurrentTick());
    debugSetEvent(player, "itemStartUse");
});

const onRelease = (eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (!isPlayerEntity(player)) return;
    if (pressTickByPlayer.has(player.id) || firingPlayers.has(player.id)) stopFiring(player);
};
subscribeAfterEvent("itemStopUse", onRelease);
subscribeAfterEvent("itemReleaseUse", onRelease);

subscribeAfterEvent("entityDie", (eventData) => {
    const deadEntity = eventData?.deadEntity;
    if (!deadEntity?.id) return;

    const marker = recentGluonHitByTarget.get(deadEntity.id);
    if (!marker) return;
    recentGluonHitByTarget.delete(deadEntity.id);
    if ((getCurrentTick() - marker.tick) > GLUON_KILL_EFFECT_WINDOW_TICKS) return;

    let center = marker.location;
    let dimension = null;
    try {
        center = deadEntity.location ?? center;
        dimension = deadEntity.dimension;
    } catch { }

    startGluonDisintegrationEffect(dimension, center);
});

// SECTION: Runtime Tick
registerWeaponTick((players, tick, onlinePlayers) => {
    for (const player of players) {
        const holding = isHoldingGluon(player);
        if (holding) {
            const uranium = getAmmoRemaining(player);
            reportWeaponHud(player, `Uranium ${Number.isFinite(uranium) ? uranium : "∞"}`);
        }

        const pressTick = pressTickByPlayer.get(player.id);
        if (pressTick !== undefined && !firingPlayers.has(player.id)) {
            if (!holding) pressTickByPlayer.delete(player.id);
            else if ((tick - pressTick) >= USE_HOLD_THRESHOLD_TICKS) beginFiring(player, tick);
        }

        if (!firingPlayers.has(player.id)) continue;

        if (!holding) {
            stopFiring(player);
            continue;
        }

        if (!consumeAmmo(player, 1)) {
            stopFiring(player);
            playEmptySound(player);
            continue;
        }

        playLoopedFireSound(player, tick);
        fireBeamTick(player, tick);
    }

    pruneStalePlayerState([
        pressTickByPlayer,
        nextFireLoopTickByPlayer,
        movementStateByPlayer,
        debugLastEventByPlayer,
        debugLastActionbarTickByPlayer
    ], onlinePlayers);
    for (const playerId of firingPlayers) {
        if (!onlinePlayers.has(playerId)) firingPlayers.delete(playerId);
    }

    for (const [targetId, marker] of recentGluonHitByTarget.entries()) {
        if ((tick - marker.tick) > 80) recentGluonHitByTarget.delete(targetId);
    }

    if ((tick % 120) !== 0) return;
    for (const [pairKey, soundTick] of lastHitSoundTickByPair.entries()) {
        if ((tick - soundTick) > 600) lastHitSoundTickByPair.delete(pairKey);
    }
});
