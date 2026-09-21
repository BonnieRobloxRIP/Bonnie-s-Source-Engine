import { world } from "@minecraft/server";
import { flashShooterLight, spawnImpactParticle, spawnLinearTrail } from "./effects.js";
import { createReserveAmmoPool } from "./ammo_system.js";
import {
    getCurrentTick,
    getEventSourcePlayer,
    getEventItemTypeId,
    isPlayerEntity,
    getMainhandTypeId,
    setMainhandType,
    isSneaking,
    playSoundForPlayer,
    getRandomIntInclusive,
    normalize,
    add,
    scale,
    getAimPoint,
    getDistanceToFirstBlockingBlock,
    findEntityHit,
    applyWeaponDamage,
    registerWeaponTick,
    pruneStalePlayerState
} from "./weapon_common.js";

// SECTION: Magnum Constants
const MAGNUM_ITEM_ID = "brr:magnum357";
const MAGNUM_EMPTY_ITEM_ID = "brr:magnum357_empty";
const MAGNUM_AMMO_ITEM_IDS = new Set(["brr:357_ammobox"]);
const MAGNUM_AMMO_POOL = createReserveAmmoPool(MAGNUM_AMMO_ITEM_IDS);

const MAGNUM_DAMAGE = 12;
const MAGNUM_MAG_SIZE = 6;
const MAGNUM_MAX_DISTANCE = 128;
const MAGNUM_HIT_RADIUS = 0.9;
const MIN_SHOT_INTERVAL_TICKS = 6;
const RELOAD_LOCK_TICKS = 87;
const RELOAD_HOLD_THRESHOLD_TICKS = 20;

const EMPTY_SOUND = "weapons.gauss.empty";
const FIRE_SOUND = "weapons.357.fire";
const FIRE_CENTERFIRE_SOUND = "weapons.357.centerfire";
const RELOAD_SOUND = "weapons.357.reload";
const RELOAD_EMPTY_SOUND = "weapons.357.reload";
const DRAW_ADMIRE_SOUND = "weapons.357.draw_admire";
const IDLE_FIDGET_SOUND = "weapons.357.draw_admire";

const EMPTY_SOUND_COOLDOWN_TICKS = 8;
const IDLE_FIDGET_MIN_INTERVAL_TICKS = 200;
const IDLE_FIDGET_MAX_INTERVAL_TICKS = 340;
const HUD_UPDATE_INTERVAL_TICKS = 2;
const MAGNUM_LOADED_ROUNDS_DP_KEY = "brr_magnum_loaded_rounds";

// SECTION: Magnum Runtime State
const rightClickUseStartTickByPlayer = new Map();
const rightClickUseReloadTriggeredByPlayer = new Set();
const lastShotTickByPlayer = new Map();
const reloadUntilTickByPlayer = new Map();
const pendingReloadByPlayer = new Map();
const loadedRoundsByPlayer = new Map();
const lastEmptySoundTickByPlayer = new Map();
const lastMainhandTypeByPlayer = new Map();
const nextIdleFidgetSoundTickByPlayer = new Map();
const lastAmmoHudTextByPlayer = new Map();
const lastAmmoHudTickByPlayer = new Map();

// SECTION: Shared Helpers
function isMagnumTypeId(typeId) {
    const normalized = `${typeId ?? ""}`.trim().toLowerCase();
    return normalized === MAGNUM_ITEM_ID
        || normalized === MAGNUM_EMPTY_ITEM_ID;
}

function isHoldingMagnum(player) {
    return isMagnumTypeId(getMainhandTypeId(player));
}

// SECTION: Ammo and Reload Helpers
function getLoadedRounds(player) {
    if (!player?.id) return 0;

    const cached = loadedRoundsByPlayer.get(player.id);
    if (Number.isFinite(cached)) return Math.max(0, Math.min(MAGNUM_MAG_SIZE, Math.floor(cached)));

    let initialRounds = null;
    try {
        const stored = Number(player.getDynamicProperty?.(MAGNUM_LOADED_ROUNDS_DP_KEY));
        if (Number.isFinite(stored)) {
            initialRounds = Math.max(0, Math.min(MAGNUM_MAG_SIZE, Math.floor(stored)));
        }
    } catch { }

    if (!Number.isFinite(initialRounds)) {
        const heldType = getMainhandTypeId(player);
        initialRounds = heldType === MAGNUM_EMPTY_ITEM_ID ? 0 : MAGNUM_MAG_SIZE;
    }

    loadedRoundsByPlayer.set(player.id, initialRounds);
    return initialRounds;
}

// Swapping between the loaded/empty item ids re-created the attachable and reset its animation
// controller, so the empty variant is only migrated back to the single loaded item id.
function syncMagnumItemVariant(player) {
    if (!player?.id) return;
    if (getMainhandTypeId(player) !== MAGNUM_EMPTY_ITEM_ID) return;

    setMainhandType(player, MAGNUM_ITEM_ID);
}

function initializeMagnumRoundsFromHeldItem(player, mainhandTypeId) {
    if (!player?.id) return;
    if (!isMagnumTypeId(mainhandTypeId)) return;

    const pendingReload = pendingReloadByPlayer.get(player.id);
    if (pendingReload && (getCurrentTick() < pendingReload.completeTick)) return;

    // Keep runtime ammo as source-of-truth so inventory slot swaps do not refill the weapon.
    getLoadedRounds(player);
}

function setLoadedRounds(player, rounds) {
    if (!player?.id) return;
    const safeRounds = Math.max(0, Math.min(MAGNUM_MAG_SIZE, Math.floor(rounds)));
    loadedRoundsByPlayer.set(player.id, safeRounds);
    try {
        player.setDynamicProperty?.(MAGNUM_LOADED_ROUNDS_DP_KEY, safeRounds);
    } catch { }
    syncMagnumItemVariant(player);
}

function canShootNow(player, tick) {
    if (!player?.id) return false;

    const reloadUntil = reloadUntilTickByPlayer.get(player.id) ?? -1;
    if (tick < reloadUntil) return false;

    const lastShotTick = lastShotTickByPlayer.get(player.id) ?? -999999;
    if ((tick - lastShotTick) < MIN_SHOT_INTERVAL_TICKS) return false;

    return true;
}

function tryPlayEmptySound(player, tick) {
    if (!player?.id) return;

    const lastTick = lastEmptySoundTickByPlayer.get(player.id) ?? -999999;
    if ((tick - lastTick) < EMPTY_SOUND_COOLDOWN_TICKS) return;

    lastEmptySoundTickByPlayer.set(player.id, tick);
    playSoundForPlayer(player, EMPTY_SOUND);
}

function updateAmmoHud(player, tick) {
    if (!player?.id || !isHoldingMagnum(player)) return;

    const lastHudTick = lastAmmoHudTickByPlayer.get(player.id) ?? -999999;
    if ((tick - lastHudTick) < HUD_UPDATE_INTERVAL_TICKS) return;

    const loadedRounds = getLoadedRounds(player);
    const reserveRounds = MAGNUM_AMMO_POOL.getReserveTotal(player);
    const hudText = `${loadedRounds}/${MAGNUM_MAG_SIZE} | ${reserveRounds} .357`;
    const previousText = lastAmmoHudTextByPlayer.get(player.id) ?? "";

    if (hudText === previousText) {
        lastAmmoHudTickByPlayer.set(player.id, tick);
        return;
    }

    try {
        player.onScreenDisplay?.setActionBar(hudText);
        lastAmmoHudTextByPlayer.set(player.id, hudText);
        lastAmmoHudTickByPlayer.set(player.id, tick);
    } catch { }
}

function tryReload(player) {
    if (!player?.id || !isHoldingMagnum(player)) return false;

    const tick = getCurrentTick();
    const reloadUntil = reloadUntilTickByPlayer.get(player.id) ?? -1;
    if (tick < reloadUntil) return false;

    const currentRounds = getLoadedRounds(player);
    if (currentRounds >= MAGNUM_MAG_SIZE) return false;

    const roundsNeeded = MAGNUM_MAG_SIZE - currentRounds;
    const consumed = MAGNUM_AMMO_POOL.consumeReserve(player, roundsNeeded);
    if (consumed <= 0) {
        return false;
    }

    pendingReloadByPlayer.set(player.id, {
        roundsToAdd: consumed,
        completeTick: tick + RELOAD_LOCK_TICKS
    });
    reloadUntilTickByPlayer.set(player.id, tick + RELOAD_LOCK_TICKS);
    playSoundForPlayer(player, currentRounds <= 0 ? RELOAD_EMPTY_SOUND : RELOAD_SOUND);
    return true;
}

function canStartManualReload(player) {
    if (!player?.id || !isHoldingMagnum(player)) return false;

    const reloadUntil = reloadUntilTickByPlayer.get(player.id) ?? -1;
    if (getCurrentTick() < reloadUntil) return false;

    if (getLoadedRounds(player) >= MAGNUM_MAG_SIZE) return false;
    if (MAGNUM_AMMO_POOL.getReserveTotal(player) <= 0) return false;

    return true;
}

// SECTION: Shot Geometry Helpers
function applyShotDamage(shooter, target) {
    return applyWeaponDamage(shooter, target, MAGNUM_DAMAGE);
}

function fireMagnumShot(player) {
    if (!player?.id || !isHoldingMagnum(player)) return false;

    const tick = getCurrentTick();
    if (!canShootNow(player, tick)) {
        return false;
    }

    const loadedRounds = getLoadedRounds(player);
    if (loadedRounds <= 0) {
        tryPlayEmptySound(player, tick);
        syncMagnumItemVariant(player);
        return false;
    }

    lastShotTickByPlayer.set(player.id, tick);
    setLoadedRounds(player, loadedRounds - 1);
    playSoundForPlayer(player, isSneaking(player) ? FIRE_CENTERFIRE_SOUND : FIRE_SOUND);
    flashShooterLight(player, 2, 9);

    let viewDirection;
    try {
        viewDirection = normalize(player.getViewDirection());
    } catch {
        return false;
    }

    const origin = getAimPoint(player);
    const blockDistance = getDistanceToFirstBlockingBlock(
        player.dimension,
        origin,
        viewDirection,
        MAGNUM_MAX_DISTANCE
    );

    const hit = findEntityHit(player, origin, viewDirection, blockDistance, MAGNUM_HIT_RADIUS);
    const trailDistance = hit?.distance ?? blockDistance;
    spawnLinearTrail(player.dimension, origin, viewDirection, trailDistance, {
        primaryParticle: "minecraft:basic_smoke_particle",
        fallbackParticle: "minecraft:basic_flame_particle",
        step: 0.2,
        maxPoints: 380
    });

    if (!hit?.entity) {
        const impactPoint = add(origin, scale(viewDirection, Math.max(0.05, trailDistance)));
        spawnImpactParticle(player.dimension, impactPoint, {
            primaryParticle: "minecraft:basic_smoke_particle",
            fallbackParticle: "minecraft:basic_flame_particle"
        });
        return true;
    }

    applyShotDamage(player, hit.entity);
    const hitPoint = add(origin, scale(viewDirection, Math.max(0.05, hit.distance)));
    spawnImpactParticle(player.dimension, hitPoint, {
        primaryParticle: "minecraft:basic_smoke_particle",
        fallbackParticle: "minecraft:basic_flame_particle"
    });
    return true;
}

// SECTION: Input Helpers
function beginRightClickUse(player) {
    if (!player?.id || !isHoldingMagnum(player)) return;
    rightClickUseStartTickByPlayer.set(player.id, getCurrentTick());
    rightClickUseReloadTriggeredByPlayer.delete(player.id);
}

function cancelRightClickUse(player) {
    if (!player?.id) return;
    rightClickUseStartTickByPlayer.delete(player.id);
    rightClickUseReloadTriggeredByPlayer.delete(player.id);
}

function tryHoldReload(player, tick) {
    if (!player?.id) return;

    const startTick = rightClickUseStartTickByPlayer.get(player.id);
    if (!Number.isFinite(startTick)) return;
    if (rightClickUseReloadTriggeredByPlayer.has(player.id)) return;
    if ((tick - startTick) < RELOAD_HOLD_THRESHOLD_TICKS) return;

    // One attempt per hold so the reload animation state is not re-entered in a loop.
    rightClickUseReloadTriggeredByPlayer.add(player.id);
    if (canStartManualReload(player)) {
        tryReload(player);
    }
}

// SECTION: Event Wiring
// Firing happens on press so it lines up with the attachable controller's fire gate.
world.afterEvents.itemStartUse.subscribe((eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (!isPlayerEntity(player)) return;

    const itemTypeId = getEventItemTypeId(eventData);
    if (!isMagnumTypeId(itemTypeId) && !isHoldingMagnum(player)) return;

    beginRightClickUse(player);
    fireMagnumShot(player);
});

world.afterEvents.itemStopUse.subscribe((eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (!isPlayerEntity(player)) return;

    cancelRightClickUse(player);
});

world.afterEvents.itemReleaseUse.subscribe((eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (!isPlayerEntity(player)) return;

    cancelRightClickUse(player);
});

// SECTION: Runtime Tick
registerWeaponTick((players, tick, onlinePlayers) => {
    if (!players.length) return;
    const hasActiveState = pendingReloadByPlayer.size > 0 || rightClickUseStartTickByPlayer.size > 0
        || nextIdleFidgetSoundTickByPlayer.size > 0;
    if (!hasActiveState && !players.some(p => isHoldingMagnum(p))) return;

    for (const player of players) {
        if (!player?.id) continue;

        const pendingReload = pendingReloadByPlayer.get(player.id);
        if (pendingReload && tick >= pendingReload.completeTick) {
            pendingReloadByPlayer.delete(player.id);
            setLoadedRounds(player, getLoadedRounds(player) + pendingReload.roundsToAdd);
        }

        const mainhandTypeId = getMainhandTypeId(player);
        const previousMainhandTypeId = lastMainhandTypeByPlayer.get(player.id) ?? "";

        if (mainhandTypeId !== previousMainhandTypeId) {
            initializeMagnumRoundsFromHeldItem(player, mainhandTypeId);
        }

        if (!isMagnumTypeId(previousMainhandTypeId) && isMagnumTypeId(mainhandTypeId)) {
            nextIdleFidgetSoundTickByPlayer.set(
                player.id,
                tick + getRandomIntInclusive(IDLE_FIDGET_MIN_INTERVAL_TICKS, IDLE_FIDGET_MAX_INTERVAL_TICKS)
            );
        }
        lastMainhandTypeByPlayer.set(player.id, mainhandTypeId);

        if (isMagnumTypeId(mainhandTypeId)) {
            syncMagnumItemVariant(player);
        }

        if (!isHoldingMagnum(player)) {
            cancelRightClickUse(player);
            if (isMagnumTypeId(previousMainhandTypeId)) {
                try {
                    player.onScreenDisplay?.setActionBar("");
                } catch { }
                lastAmmoHudTextByPlayer.delete(player.id);
                lastAmmoHudTickByPlayer.delete(player.id);
            }
            continue;
        }

        updateAmmoHud(player, tick);
        tryHoldReload(player, tick);

        if (!isSneaking(player)) {
            const nextFidgetTick = nextIdleFidgetSoundTickByPlayer.get(player.id)
                ?? (tick + IDLE_FIDGET_MIN_INTERVAL_TICKS);
            if (tick >= nextFidgetTick) {
                nextIdleFidgetSoundTickByPlayer.set(
                    player.id,
                    tick + getRandomIntInclusive(IDLE_FIDGET_MIN_INTERVAL_TICKS, IDLE_FIDGET_MAX_INTERVAL_TICKS)
                );
            }
        }
    }

    pruneStalePlayerState([
        rightClickUseStartTickByPlayer,
        rightClickUseReloadTriggeredByPlayer,
        lastShotTickByPlayer,
        reloadUntilTickByPlayer,
        loadedRoundsByPlayer,
        pendingReloadByPlayer,
        lastEmptySoundTickByPlayer,
        lastMainhandTypeByPlayer,
        nextIdleFidgetSoundTickByPlayer,
        lastAmmoHudTextByPlayer,
        lastAmmoHudTickByPlayer
    ], onlinePlayers);
});