import { system, EntityDamageCause } from "@minecraft/server";
import { consumeAmmo, getAmmoRemaining, playEmptySound } from "./ammo_system.js";
import { flashShooterLight, spawnImpactParticle, spawnLinearTrail } from "./effects.js";
import {
    getCurrentTick,
    getEventSourcePlayer,
    getEventItemTypeId,
    isPlayerEntity,
    getMainhandTypeId,
    playSoundForPlayer,
    stopSoundForPlayer,
    playRandomSound,
    clamp,
    normalize,
    add,
    subtract,
    scale,
    getAimPoint,
    getBeamOriginFromLaserPointApprox,
    getFirstBlockingBlockHit,
    getDistanceToFirstBlockingBlock,
    findEntityHit,
    applyWeaponDamage,
    subscribeAfterEvent,
    registerWeaponTick,
    pruneStalePlayerState
} from "./weapon_common.js";

// SECTION: Tau Constants
const TAU_ITEM_ID = "brr:tau_cannon";
const TAU_AURA_PARTICLE = "brr:tau_beam_aura";
const TAU_CORE_PARTICLE = "brr:tau_beam_core";
const TAU_FALLBACK_PARTICLE = "minecraft:basic_flame_particle";

const TAU_FIRE_SOUNDS = [
    "weapons.gauss.fire1",
    "weapons.gauss.fire2",
    "weapons.gauss.fire3",
    "weapons.gauss.fire4"
];
const TAU_CHARGED_FIRE_SOUNDS = [
    "weapons.gauss.overcharged_fire1",
    "weapons.gauss.overcharged_fire2",
    "weapons.gauss.overcharged_fire3"
];
const TAU_CHARGE_START_SOUND = "weapons.gauss.spinup";
const TAU_CHARGE_SPIN_LOOP_SOUND = "weapons.gauss.spin_loop";
const TAU_CHARGE_LOOP_SOUND = "weapons.gauss.overcharging";
const TAU_OVERLOAD_SOUND = "weapons.gauss.overcharged";
const TAU_CHARGED_READY_SOUND = "weapons.gauss.charged";

const LEFT_CLICK_DAMAGE = 3;
const RIGHT_CLICK_COOLDOWN_TICKS = 10;
const RIGHT_CLICK_HOLD_THRESHOLD_TICKS = 10;
const RIGHT_CLICK_TAP_MIN_TICKS = 2;
const INTERACTION_SUPPRESS_WINDOW_TICKS = 2;
const CHARGED_MIN_DAMAGE = 5;
const CHARGED_MAX_DAMAGE = 30;
const CHARGED_MAX_TICKS = 200;
const CHARGED_READY_DAMAGE = 13;
const MAX_BEAM_DISTANCE = 128;
const BEAM_HIT_RADIUS = 1;
const SPINUP_DURATION_TICKS = 55;
const SPIN_LOOP_INTERVAL_TICKS = 6;
const OVERCHARGING_LOOP_INTERVAL_TICKS = 60;
const CHARGED_RECOIL_MIN_HORIZONTAL = 0.5;
const CHARGED_RECOIL_MAX_HORIZONTAL = 3;
const CHARGED_RECOIL_BASE_VERTICAL = 0.1;
const CHARGED_RECOIL_MAX_VERTICAL_BONUS = 1;
const CHARGED_RECOIL_MIN_RATIO = 0.2;

const LASER_POINT_FORWARD_OFFSET = 0.72;
const LASER_POINT_RIGHT_OFFSET = 0.4;
const LASER_POINT_UP_OFFSET = -0.4;
const TAP_AMMO_COST = 2;
const CHARGE_AMMO_CAP = 18;
const CHARGE_AMMO_RAMP_TICKS = 60;

// SECTION: Tau Runtime State
const rightClickCooldownByPlayer = new Map();
const pendingUseByPlayer = new Map();
const interactionSuppressUntilTickByPlayer = new Map();
const chargeStateByPlayer = new Map();

// SECTION: Shared Helpers
function isTauItem(typeId) {
    return `${typeId ?? ""}`.trim().toLowerCase() === TAU_ITEM_ID;
}

function isHoldingTau(player) {
    return isTauItem(getMainhandTypeId(player));
}

// SECTION: Beam Damage and Recoil

function applyBeamDamage(shooter, target, amount) {
    applyWeaponDamage(shooter, target, amount);
}

function buildShotTrace(player) {
    let viewDirection;
    try {
        viewDirection = normalize(player.getViewDirection());
    } catch {
        return null;
    }

    const viewOrigin = getAimPoint(player);
    const initialBlockDistance = getDistanceToFirstBlockingBlock(
        player.dimension,
        viewOrigin,
        viewDirection,
        MAX_BEAM_DISTANCE
    );

    const initialEntityHit = findEntityHit(player, viewOrigin, viewDirection, initialBlockDistance, BEAM_HIT_RADIUS);
    const initialDistance = initialEntityHit ? initialEntityHit.distance : initialBlockDistance;
    const targetPoint = add(viewOrigin, scale(viewDirection, Math.max(0.05, initialDistance)));

    const beamOrigin = getBeamOriginFromLaserPointApprox(
        player,
        viewDirection,
        LASER_POINT_FORWARD_OFFSET,
        LASER_POINT_RIGHT_OFFSET,
        LASER_POINT_UP_OFFSET
    );
    const direction = normalize(subtract(targetPoint, beamOrigin));

    const blockRayHit = getFirstBlockingBlockHit(player.dimension, beamOrigin, direction, MAX_BEAM_DISTANCE);
    const blockHitDistance = Number(blockRayHit?.distance);
    const hasBlockHit = Number.isFinite(blockHitDistance) && blockHitDistance >= 0 && blockHitDistance <= MAX_BEAM_DISTANCE;
    const blockDistance = hasBlockHit ? Math.max(0, blockHitDistance - 0.05) : MAX_BEAM_DISTANCE;

    const entityHit = findEntityHit(player, beamOrigin, direction, blockDistance, BEAM_HIT_RADIUS);
    const beamLength = entityHit ? entityHit.distance : blockDistance;
    const impactPoint = entityHit
        ? entityHit.impactPoint
        : add(beamOrigin, scale(direction, Math.max(0.05, beamLength)));

    return {
        beamOrigin,
        direction,
        beamLength,
        entityHit,
        impactPoint,
        blockRayHit,
        hasBlockHit,
        blockHitDistance
    };
}

function renderTauBeam(player, trace, charged, tick) {
    spawnLinearTrail(player.dimension, trace.beamOrigin, trace.direction, trace.beamLength, {
        primaryParticle: TAU_CORE_PARTICLE,
        fallbackParticle: TAU_FALLBACK_PARTICLE,
        step: charged ? 0.07 : 0.09,
        maxPoints: charged ? 1900 : 1400
    });

    spawnImpactParticle(player.dimension, trace.impactPoint, {
        primaryParticle: TAU_CORE_PARTICLE,
        fallbackParticle: TAU_FALLBACK_PARTICLE
    });

    if (charged) {
        spawnImpactParticle(player.dimension, trace.impactPoint, {
            primaryParticle: TAU_AURA_PARTICLE,
            fallbackParticle: TAU_FALLBACK_PARTICLE
        });
    }
}

function fireTauBeam(player, damageAmount, charged) {
    if (!player?.id || !isHoldingTau(player)) return null;

    const trace = buildShotTrace(player);
    if (!trace) return null;

    const tick = getCurrentTick();
    renderTauBeam(player, trace, charged, tick);
    flashShooterLight(player, 2, 9);

    if (trace.entityHit?.entity) {
        applyBeamDamage(player, trace.entityHit.entity, damageAmount);
    }

    playRandomSound(player, charged ? TAU_CHARGED_FIRE_SOUNDS : TAU_FIRE_SOUNDS);
    return trace;
}

function applyChargedRecoilKnockback(player, trace, chargedDamage) {
    if (!player?.id || !trace?.direction) return;

    const damageRange = Math.max(0.000001, CHARGED_MAX_DAMAGE - CHARGED_MIN_DAMAGE);
    const chargeRatio = clamp((chargedDamage - CHARGED_MIN_DAMAGE) / damageRange, 0, 1);
    const effectiveRatio = Math.max(CHARGED_RECOIL_MIN_RATIO, chargeRatio);

    let recoilX = -(Number(trace.direction.x) || 0);
    let recoilZ = -(Number(trace.direction.z) || 0);
    const recoilLengthXZ = Math.hypot(recoilX, recoilZ);

    if (recoilLengthXZ > 0.000001) {
        recoilX /= recoilLengthXZ;
        recoilZ /= recoilLengthXZ;
    } else {
        let viewDirection = { x: 0, y: 0, z: 1 };
        try {
            viewDirection = normalize(player.getViewDirection());
        } catch { }
        recoilX = -(Number(viewDirection.x) || 0);
        recoilZ = -(Number(viewDirection.z) || 0);
        const fallbackLengthXZ = Math.hypot(recoilX, recoilZ) || 1;
        recoilX /= fallbackLengthXZ;
        recoilZ /= fallbackLengthXZ;
    }

    const horizontalStrength = CHARGED_RECOIL_MIN_HORIZONTAL
        + ((CHARGED_RECOIL_MAX_HORIZONTAL - CHARGED_RECOIL_MIN_HORIZONTAL) * effectiveRatio);
    const downwardAimFactor = clamp(-(Number(trace.direction.y) || 0), 0, 1);
    const verticalStrength = CHARGED_RECOIL_BASE_VERTICAL
        + (CHARGED_RECOIL_MAX_VERTICAL_BONUS * effectiveRatio * downwardAimFactor);

    // Apply recoil on the next tick so item-use state changes do not swallow motion.
    system.run(() => {
        if (!player?.id) return;

        let applied = false;
        try {
            player.applyKnockback(
                {
                    x: recoilX * horizontalStrength,
                    z: recoilZ * horizontalStrength
                },
                verticalStrength
            );
            applied = true;
        } catch { }

        if (!applied) {
            try {
                player.applyImpulse({
                    x: recoilX * horizontalStrength,
                    y: verticalStrength,
                    z: recoilZ * horizontalStrength
                });
            } catch { }
        }
    });
}

// SECTION: Charge and Fire Helpers

function getHealthSnapshot(player) {
    try {
        const health = player.getComponent("minecraft:health");
        const current = Number(health?.currentValue);
        const effectiveMax = Number(health?.effectiveMax);
        const defaultValue = Number(health?.defaultValue);

        return {
            current: Number.isFinite(current) ? current : 20,
            max: Number.isFinite(effectiveMax)
                ? effectiveMax
                : (Number.isFinite(defaultValue) ? defaultValue : 20)
        };
    } catch {
        return { current: 20, max: 20 };
    }
}

function applyTauOverloadPenalty(player) {
    if (!player?.id) return;

    const health = getHealthSnapshot(player);
    const damageAmount = health.current < 10
        ? Math.max(1, health.current + 100)
        : Math.max(1, health.max * 0.9);

    try {
        player.applyDamage(damageAmount, {
            cause: EntityDamageCause.magic,
            damagingEntity: player
        });
    } catch {
        try {
            player.runCommand(`damage @s ${Math.ceil(damageAmount)} magic`);
        } catch { }
    }

    try {
        player.runCommand("camera @s fade time 0 0.1 2 color 255 206 0");
    } catch { }

    try {
        player.runCommand("camerashake add @s 0.2 4 positional");
    } catch { }

    playSoundForPlayer(player, TAU_OVERLOAD_SOUND);
}

function startCharging(player) {
    if (!player?.id || !isHoldingTau(player)) return;

    if (getAmmoRemaining(player) <= 0) {
        playEmptySound(player);
        return;
    }

    stopChargeSounds(player);

    chargeStateByPlayer.set(player.id, {
        startTick: getCurrentTick(),
        spinupFinished: false,
        chargedCuePlayed: false,
        nextSpinLoopTick: Number.MAX_SAFE_INTEGER,
        nextOverchargingTick: Number.MAX_SAFE_INTEGER,
        ammoDrained: 0
    });

    playSoundForPlayer(player, TAU_CHARGE_START_SOUND);
}

function stopChargeSounds(player) {
    stopSoundForPlayer(player, TAU_CHARGE_START_SOUND);
    stopSoundForPlayer(player, TAU_CHARGE_SPIN_LOOP_SOUND);
    stopSoundForPlayer(player, TAU_CHARGE_LOOP_SOUND);
}

function getChargedDamageFromHeldTicks(heldTicks) {
    const chargeRatio = clamp(heldTicks / CHARGED_MAX_TICKS, 0, 1);
    return CHARGED_MIN_DAMAGE + ((CHARGED_MAX_DAMAGE - CHARGED_MIN_DAMAGE) * chargeRatio);
}

function releaseChargeShot(player) {
    if (!player?.id) return;

    const chargeState = chargeStateByPlayer.get(player.id);
    if (!chargeState) return;

    chargeStateByPlayer.delete(player.id);
    stopChargeSounds(player);

    if (!isHoldingTau(player)) return;

    const heldTicks = Math.max(0, getCurrentTick() - (Number(chargeState.startTick) || 0));

    if (heldTicks >= CHARGED_MAX_TICKS) {
        applyTauOverloadPenalty(player);
        return;
    }

    const chargedDamage = getChargedDamageFromHeldTicks(heldTicks);

    const trace = fireTauBeam(player, chargedDamage, true);
    applyChargedRecoilKnockback(player, trace, chargedDamage);
}

function cancelTauUse(player) {
    if (!player?.id) return;

    pendingUseByPlayer.delete(player.id);

    if (chargeStateByPlayer.has(player.id)) {
        chargeStateByPlayer.delete(player.id);
        stopChargeSounds(player);
    }
}

function suppressInteractionForPlayer(player, durationTicks = INTERACTION_SUPPRESS_WINDOW_TICKS) {
    if (!player?.id) return;
    interactionSuppressUntilTickByPlayer.set(player.id, getCurrentTick() + Math.max(1, durationTicks));
}

function isInteractionSuppressed(player, tick = getCurrentTick()) {
    if (!player?.id) return false;
    const suppressUntil = Number(interactionSuppressUntilTickByPlayer.get(player.id));
    return Number.isFinite(suppressUntil) && tick <= suppressUntil;
}

function triggerTapPrimaryFire(player, tick = getCurrentTick()) {
    if (!player?.id || !isHoldingTau(player)) return;
    if (isInteractionSuppressed(player, tick)) return;

    const nextRightClickTick = Number(rightClickCooldownByPlayer.get(player.id));
    if (Number.isFinite(nextRightClickTick) && tick < nextRightClickTick) return;

    if (!consumeAmmo(player, TAP_AMMO_COST)) {
        playEmptySound(player);
        return;
    }

    rightClickCooldownByPlayer.set(player.id, tick + RIGHT_CLICK_COOLDOWN_TICKS);
    fireTauBeam(player, LEFT_CLICK_DAMAGE, false);
}

function finalizeRightClickUse(player) {
    if (!player?.id) return;

    if (chargeStateByPlayer.has(player.id)) {
        releaseChargeShot(player);
        return;
    }

    const pendingStartTick = Number(pendingUseByPlayer.get(player.id));
    if (!Number.isFinite(pendingStartTick)) return;

    pendingUseByPlayer.delete(player.id);

    if (!isHoldingTau(player)) return;

    const tick = getCurrentTick();
    if (isInteractionSuppressed(player, tick)) return;

    const heldTicks = Math.max(0, tick - pendingStartTick);
    if (heldTicks < RIGHT_CLICK_TAP_MIN_TICKS) return;

    triggerTapPrimaryFire(player, tick);
}

// SECTION: Event Wiring
subscribeAfterEvent("playerSwingStart", (eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (!isPlayerEntity(player) || !isHoldingTau(player)) return;
    // Intentionally do nothing: primary fire is handled on right-click tap.
});

subscribeAfterEvent("itemStartUse", (eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (!isPlayerEntity(player)) return;

    const itemTypeId = getEventItemTypeId(eventData);
    if (!isTauItem(itemTypeId) && !(isHoldingTau(player) && !itemTypeId)) return;

    const tick = getCurrentTick();
    if (isInteractionSuppressed(player, tick)) return;
    if (chargeStateByPlayer.has(player.id)) return;

    pendingUseByPlayer.set(player.id, tick);
});

subscribeAfterEvent("itemUseOn", (eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (!isPlayerEntity(player) || !isHoldingTau(player)) return;

    suppressInteractionForPlayer(player);
    cancelTauUse(player);
});

subscribeAfterEvent("playerInteractWithEntity", (eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (!isPlayerEntity(player) || !isHoldingTau(player)) return;

    suppressInteractionForPlayer(player);
    cancelTauUse(player);
});

subscribeAfterEvent("itemReleaseUse", (eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (!isPlayerEntity(player)) return;

    finalizeRightClickUse(player);
});

subscribeAfterEvent("itemStopUse", (eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (!isPlayerEntity(player)) return;

    finalizeRightClickUse(player);
});

// SECTION: Runtime Tick
registerWeaponTick((players, tick, onlinePlayers) => {
    if (!players.length) return;
    const hasActiveState = chargeStateByPlayer.size > 0 || pendingUseByPlayer.size > 0
        || rightClickCooldownByPlayer.size > 0 || interactionSuppressUntilTickByPlayer.size > 0;
    if (!hasActiveState && !players.some(p => isHoldingTau(p))) return;

    for (const [playerId, state] of chargeStateByPlayer.entries()) {
        const player = onlinePlayers.get(playerId);
        if (!player) {
            chargeStateByPlayer.delete(playerId);
            continue;
        }

        if (!isHoldingTau(player)) {
            chargeStateByPlayer.delete(playerId);
            stopChargeSounds(player);
            continue;
        }

        const heldTicks = tick - (Number(state?.startTick) || 0);
        if (heldTicks >= CHARGED_MAX_TICKS) {
            chargeStateByPlayer.delete(playerId);
            stopChargeSounds(player);
            applyTauOverloadPenalty(player);
            continue;
        }

        const targetDrain = Math.min(CHARGE_AMMO_CAP, Math.floor(heldTicks * CHARGE_AMMO_CAP / CHARGE_AMMO_RAMP_TICKS));
        const ammoDrained = state.ammoDrained || 0;
        const drainDelta = targetDrain - ammoDrained;
        if (drainDelta > 0) {
            if (!consumeAmmo(player, drainDelta)) {
                chargeStateByPlayer.delete(playerId);
                stopChargeSounds(player);
                playEmptySound(player);
                continue;
            }
            state.ammoDrained = targetDrain;
        }

        if (!state.spinupFinished && heldTicks >= SPINUP_DURATION_TICKS) {
            state.spinupFinished = true;
            playSoundForPlayer(player, TAU_CHARGE_SPIN_LOOP_SOUND);
            playSoundForPlayer(player, TAU_CHARGE_LOOP_SOUND);
            state.nextSpinLoopTick = tick + SPIN_LOOP_INTERVAL_TICKS;
            state.nextOverchargingTick = tick + OVERCHARGING_LOOP_INTERVAL_TICKS;
        }

        if (state.spinupFinished) {
            if (tick >= (Number(state.nextSpinLoopTick) || 0)) {
                playSoundForPlayer(player, TAU_CHARGE_SPIN_LOOP_SOUND);
                state.nextSpinLoopTick = tick + SPIN_LOOP_INTERVAL_TICKS;
            }

            if (tick >= (Number(state.nextOverchargingTick) || 0)) {
                playSoundForPlayer(player, TAU_CHARGE_LOOP_SOUND);
                state.nextOverchargingTick = tick + OVERCHARGING_LOOP_INTERVAL_TICKS;
            }
        }

        const liveDamage = getChargedDamageFromHeldTicks(heldTicks);
        if (!state.chargedCuePlayed && liveDamage >= CHARGED_READY_DAMAGE) {
            state.chargedCuePlayed = true;
            playSoundForPlayer(player, TAU_CHARGED_READY_SOUND);
        }

        chargeStateByPlayer.set(playerId, state);
    }

    for (const [playerId, startTick] of pendingUseByPlayer.entries()) {
        const player = onlinePlayers.get(playerId);
        if (!player) {
            pendingUseByPlayer.delete(playerId);
            continue;
        }

        if (!isHoldingTau(player)) {
            pendingUseByPlayer.delete(playerId);
            continue;
        }

        if (isInteractionSuppressed(player, tick)) {
            pendingUseByPlayer.delete(playerId);
            continue;
        }

        const heldTicks = tick - (Number(startTick) || 0);
        if (heldTicks >= RIGHT_CLICK_HOLD_THRESHOLD_TICKS) {
            pendingUseByPlayer.delete(playerId);
            startCharging(player);
        }
    }

    for (const [playerId, nextReadyTick] of rightClickCooldownByPlayer.entries()) {
        if (!onlinePlayers.has(playerId) || tick >= (Number(nextReadyTick) || 0)) {
            rightClickCooldownByPlayer.delete(playerId);
        }
    }

    for (const [playerId, suppressUntilTick] of interactionSuppressUntilTickByPlayer.entries()) {
        if (!onlinePlayers.has(playerId) || tick > (Number(suppressUntilTick) || 0)) {
            interactionSuppressUntilTickByPlayer.delete(playerId);
        }
    }

    for (const [playerId] of pendingUseByPlayer.entries()) {
        if (!onlinePlayers.has(playerId)) {
            pendingUseByPlayer.delete(playerId);
        }
    }
});