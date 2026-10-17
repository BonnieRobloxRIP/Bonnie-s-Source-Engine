import { system, EntityDamageCause } from "@minecraft/server";
import { consumeAmmo, getAmmoRemaining, playEmptySound } from "./ammo_system.js";
import { flashShooterLight, spawnImpactParticle, spawnLinearTrail } from "./effects.js";
import {
    WEAPON_ACTION,
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
    subtract,
    getAimPoint,
    getBeamOriginFromLaserPointApprox,
    traceShot,
    applyWeaponDamage,
    pulseShot,
    pulseWeaponAction,
    setWeaponAction,
    reportWeaponHud,
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

const TAP_DAMAGE = 3;
const TAP_COOLDOWN_TICKS = 10;
const CHARGE_HOLD_THRESHOLD_TICKS = 10;
const INTERACTION_SUPPRESS_WINDOW_TICKS = 2;
const CHARGED_MIN_DAMAGE = 5;
const CHARGED_MAX_DAMAGE = 30;
const CHARGED_MAX_TICKS = 200;
const CHARGED_READY_DAMAGE = 13;
const MAX_BEAM_DISTANCE = 128;
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
const tapCooldownUntilByPlayer = new Map();
const pressTickByPlayer = new Map();
const interactionSuppressUntilTickByPlayer = new Map();
const chargeStateByPlayer = new Map();

// SECTION: Shared Helpers
const isTauItem = (typeId) => `${typeId ?? ""}`.trim().toLowerCase() === TAU_ITEM_ID;
const isHoldingTau = (player) => isTauItem(getMainhandTypeId(player));

// SECTION: Beam
/** Aims from the eye at what the crosshair is on, then traces the visible beam from the muzzle to that point. */
function buildShotTrace(player) {
    let viewDirection;
    try {
        viewDirection = normalize(player.getViewDirection());
    } catch {
        return null;
    }

    const aim = traceShot(player, getAimPoint(player), viewDirection, MAX_BEAM_DISTANCE);
    const beamOrigin = getBeamOriginFromLaserPointApprox(
        player,
        viewDirection,
        LASER_POINT_FORWARD_OFFSET,
        LASER_POINT_RIGHT_OFFSET,
        LASER_POINT_UP_OFFSET
    );
    const direction = normalize(subtract(aim.endPoint, beamOrigin));
    const beam = traceShot(player, beamOrigin, direction, MAX_BEAM_DISTANCE);

    return {
        beamOrigin,
        direction,
        beamLength: beam.distance,
        entityHit: beam.entityHit,
        impactPoint: beam.entityHit ? beam.entityHit.impactPoint : beam.endPoint
    };
}

function renderTauBeam(player, trace, charged) {
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

    renderTauBeam(player, trace, charged);
    flashShooterLight(player, 2, 9);

    if (trace.entityHit?.entity) {
        applyWeaponDamage(player, trace.entityHit.entity, damageAmount);
    }

    playRandomSound(player, charged ? TAU_CHARGED_FIRE_SOUNDS : TAU_FIRE_SOUNDS);
    if (charged) pulseWeaponAction(player, WEAPON_ACTION.CHARGED_SHOT, 6);
    else pulseShot(player);
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
        if (!player.isValid) return;
        try {
            player.applyKnockback({ x: recoilX * horizontalStrength, z: recoilZ * horizontalStrength }, verticalStrength);
        } catch { }
    });
}

// SECTION: Charge and Overload
function getHealthSnapshot(player) {
    try {
        const health = player.getComponent("minecraft:health");
        const current = Number(health?.currentValue);
        const effectiveMax = Number(health?.effectiveMax);
        return {
            current: Number.isFinite(current) ? current : 20,
            max: Number.isFinite(effectiveMax) ? effectiveMax : 20
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

    // No damagingEntity: the player didn't "kill themselves" as an attacker (avoids odd kill credit).
    try {
        player.applyDamage(damageAmount, { cause: EntityDamageCause.magic });
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
    setWeaponAction(player, WEAPON_ACTION.NONE);
}

/** Charging counts from the moment the button was pressed, not from when the hold was recognised. */
function startCharging(player, pressTick) {
    if (!player?.id || !isHoldingTau(player)) return;

    if (getAmmoRemaining(player) <= 0) {
        playEmptySound(player);
        return;
    }

    stopChargeSounds(player);
    chargeStateByPlayer.set(player.id, {
        startTick: pressTick,
        spinupFinished: false,
        chargedCuePlayed: false,
        nextSpinLoopTick: Number.MAX_SAFE_INTEGER,
        nextOverchargingTick: Number.MAX_SAFE_INTEGER,
        ammoDrained: 0
    });

    playSoundForPlayer(player, TAU_CHARGE_START_SOUND);
    setWeaponAction(player, WEAPON_ACTION.CHARGING);
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

function releaseChargeShot(player, tick = getCurrentTick()) {
    const chargeState = chargeStateByPlayer.get(player.id);
    if (!chargeState) return;

    chargeStateByPlayer.delete(player.id);
    stopChargeSounds(player);

    if (!isHoldingTau(player)) {
        setWeaponAction(player, WEAPON_ACTION.NONE);
        return;
    }

    const heldTicks = Math.max(0, tick - chargeState.startTick);
    if (heldTicks >= CHARGED_MAX_TICKS) {
        applyTauOverloadPenalty(player);
        return;
    }

    const chargedDamage = getChargedDamageFromHeldTicks(heldTicks);
    const trace = fireTauBeam(player, chargedDamage, true);
    applyChargedRecoilKnockback(player, trace, chargedDamage);
}

function cancelCharge(player) {
    if (!chargeStateByPlayer.has(player.id)) return;
    chargeStateByPlayer.delete(player.id);
    stopChargeSounds(player);
    setWeaponAction(player, WEAPON_ACTION.NONE);
}

// SECTION: Tap Fire and Interaction Guard
function suppressInteractionForPlayer(player) {
    interactionSuppressUntilTickByPlayer.set(player.id, getCurrentTick() + INTERACTION_SUPPRESS_WINDOW_TICKS);
}

function isInteractionSuppressed(player, tick) {
    const suppressUntil = interactionSuppressUntilTickByPlayer.get(player.id);
    return suppressUntil !== undefined && tick <= suppressUntil;
}

function triggerTapPrimaryFire(player, tick) {
    if (!isHoldingTau(player) || isInteractionSuppressed(player, tick)) return;
    if (tick < (tapCooldownUntilByPlayer.get(player.id) ?? 0)) return;

    if (!consumeAmmo(player, TAP_AMMO_COST)) {
        playEmptySound(player);
        return;
    }

    tapCooldownUntilByPlayer.set(player.id, tick + TAP_COOLDOWN_TICKS);
    fireTauBeam(player, TAP_DAMAGE, false);
}

function finalizeRightClickUse(player) {
    if (!player?.id) return;

    if (chargeStateByPlayer.has(player.id)) {
        releaseChargeShot(player);
        return;
    }

    // Released before the charge began: a tap. Fires even when press and release land in the same tick.
    if (!pressTickByPlayer.has(player.id)) return;
    pressTickByPlayer.delete(player.id);
    triggerTapPrimaryFire(player, getCurrentTick());
}

// SECTION: Event Wiring
subscribeAfterEvent("itemStartUse", (eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (!isPlayerEntity(player) || !isTauItem(getEventItemTypeId(eventData))) return;

    const tick = getCurrentTick();
    if (isInteractionSuppressed(player, tick) || chargeStateByPlayer.has(player.id)) return;
    pressTickByPlayer.set(player.id, tick);
});

// Using the tau on a block or entity (doors, buttons, villagers) is an interaction, not a shot.
const onInteract = (eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (!isPlayerEntity(player) || !isHoldingTau(player)) return;
    suppressInteractionForPlayer(player);
    pressTickByPlayer.delete(player.id);
    cancelCharge(player);
};
subscribeAfterEvent("itemUseOn", onInteract);
subscribeAfterEvent("playerInteractWithEntity", onInteract);

const onRelease = (eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (isPlayerEntity(player)) finalizeRightClickUse(player);
};
subscribeAfterEvent("itemReleaseUse", onRelease);
subscribeAfterEvent("itemStopUse", onRelease);

// SECTION: Runtime Tick
registerWeaponTick((players, tick, onlinePlayers) => {
    for (const player of players) {
        if (isHoldingTau(player)) {
            const uranium = getAmmoRemaining(player);
            reportWeaponHud(player, `Uranium ${Number.isFinite(uranium) ? uranium : "∞"}`);
        }
    }

    for (const [playerId, state] of chargeStateByPlayer.entries()) {
        const player = onlinePlayers.get(playerId);
        if (!player) {
            chargeStateByPlayer.delete(playerId);
            continue;
        }

        if (!isHoldingTau(player)) {
            cancelCharge(player);
            continue;
        }

        const heldTicks = tick - state.startTick;
        if (heldTicks >= CHARGED_MAX_TICKS) {
            chargeStateByPlayer.delete(playerId);
            stopChargeSounds(player);
            applyTauOverloadPenalty(player);
            continue;
        }

        const targetDrain = Math.min(CHARGE_AMMO_CAP, Math.floor(heldTicks * CHARGE_AMMO_CAP / CHARGE_AMMO_RAMP_TICKS));
        const drainDelta = targetDrain - state.ammoDrained;
        if (drainDelta > 0) {
            if (!consumeAmmo(player, drainDelta)) {
                // Out of uranium mid-charge: the shot goes off with the charge built so far.
                releaseChargeShot(player, tick);
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
            if (tick >= state.nextSpinLoopTick) {
                playSoundForPlayer(player, TAU_CHARGE_SPIN_LOOP_SOUND);
                state.nextSpinLoopTick = tick + SPIN_LOOP_INTERVAL_TICKS;
            }

            if (tick >= state.nextOverchargingTick) {
                playSoundForPlayer(player, TAU_CHARGE_LOOP_SOUND);
                state.nextOverchargingTick = tick + OVERCHARGING_LOOP_INTERVAL_TICKS;
            }
        }

        if (!state.chargedCuePlayed && getChargedDamageFromHeldTicks(heldTicks) >= CHARGED_READY_DAMAGE) {
            state.chargedCuePlayed = true;
            playSoundForPlayer(player, TAU_CHARGED_READY_SOUND);
        }
    }

    for (const [playerId, pressTick] of pressTickByPlayer.entries()) {
        const player = onlinePlayers.get(playerId);
        if (!player || !isHoldingTau(player) || isInteractionSuppressed(player, tick)) {
            pressTickByPlayer.delete(playerId);
            continue;
        }

        if ((tick - pressTick) >= CHARGE_HOLD_THRESHOLD_TICKS) {
            pressTickByPlayer.delete(playerId);
            startCharging(player, pressTick);
        }
    }

    for (const [playerId, until] of tapCooldownUntilByPlayer.entries()) {
        if (tick >= until) tapCooldownUntilByPlayer.delete(playerId);
    }
    for (const [playerId, until] of interactionSuppressUntilTickByPlayer.entries()) {
        if (tick > until) interactionSuppressUntilTickByPlayer.delete(playerId);
    }
    pruneStalePlayerState([chargeStateByPlayer, pressTickByPlayer, tapCooldownUntilByPlayer, interactionSuppressUntilTickByPlayer], onlinePlayers);
});
