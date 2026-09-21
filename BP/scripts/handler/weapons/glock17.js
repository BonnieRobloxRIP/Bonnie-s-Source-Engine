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

// SECTION: Glock Constants
const GLOCK_ITEM_ID = "brr:glock17";
const GLOCK_EMPTY_ITEM_ID = "brr:glock17_empty";
const GLOCK_AMMO_ITEM_ID = "brr:9mmclip";
const GLOCK_AMMO_POOL = createReserveAmmoPool([GLOCK_AMMO_ITEM_ID]);

const GLOCK_DAMAGE = 2;
const GLOCK_MAG_SIZE = 17;
const GLOCK_MAX_DISTANCE = 48;
const GLOCK_HIT_RADIUS = 0.85;
const AUTO_FIRE_ROUNDS_PER_SECOND = 3;
const AUTO_FIRE_INTERVAL_TICKS = 20 / AUTO_FIRE_ROUNDS_PER_SECOND;
const MIN_SHOT_INTERVAL_TICKS = 1;
const RELOAD_LOCK_TICKS = 50;

const EMPTY_SOUND = "weapons.glock.empty";
const FIRE_SOUND = "weapons.glock.fire";
const RELOAD_SOUND = "weapons.glock.reload";
const RELOAD_EMPTY_SOUND = "weapons.glock.reload_empty";
const DRAW_ADMIRE_SOUND = "weapons.glock.draw_admire";
const IDLE_FIDGET_SOUND = "weapons.glock.idle_fidget";

const EMPTY_SOUND_COOLDOWN_TICKS = 8;
const IDLE_FIDGET_MIN_INTERVAL_TICKS = 200;
const IDLE_FIDGET_MAX_INTERVAL_TICKS = 340;
const HUD_UPDATE_INTERVAL_TICKS = 2;
const GLOCK_LOADED_ROUNDS_DP_KEY = "brr_glock_loaded_rounds";

// SECTION: Glock Runtime State
const autoFireStateByPlayer = new Map();
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
function isGlockTypeId(typeId) {
    const normalized = `${typeId ?? ""}`.trim().toLowerCase();
    return normalized === GLOCK_ITEM_ID
        || normalized === GLOCK_EMPTY_ITEM_ID;
}

function isHoldingGlock(player) {
    return isGlockTypeId(getMainhandTypeId(player));
}

// SECTION: Ammo and Reload Helpers
function getLoadedRounds(player) {
    if (!player?.id) return 0;

    const cached = loadedRoundsByPlayer.get(player.id);
    if (Number.isFinite(cached)) return Math.max(0, Math.min(GLOCK_MAG_SIZE, Math.floor(cached)));

    let initialRounds = null;
    try {
        const stored = Number(player.getDynamicProperty?.(GLOCK_LOADED_ROUNDS_DP_KEY));
        if (Number.isFinite(stored)) {
            initialRounds = Math.max(0, Math.min(GLOCK_MAG_SIZE, Math.floor(stored)));
        }
    } catch { }

    if (!Number.isFinite(initialRounds)) {
        const heldType = getMainhandTypeId(player);
        initialRounds = heldType === GLOCK_EMPTY_ITEM_ID ? 0 : GLOCK_MAG_SIZE;
    }

    loadedRoundsByPlayer.set(player.id, initialRounds);
    return initialRounds;
}

function syncGlockItemVariant(player) {
    if (!player?.id) return;

    const mainhandTypeId = getMainhandTypeId(player);
    if (!isGlockTypeId(mainhandTypeId)) return;

    const pendingReload = pendingReloadByPlayer.get(player.id);
    if (pendingReload && (getCurrentTick() < pendingReload.completeTick)) return;

    const rounds = getLoadedRounds(player);
    const expectedTypeId = rounds <= 0 ? GLOCK_EMPTY_ITEM_ID : GLOCK_ITEM_ID;
    if (mainhandTypeId === expectedTypeId) return;

    setMainhandType(player, expectedTypeId);
}

function initializeGlockRoundsFromHeldItem(player, mainhandTypeId) {
    if (!player?.id) return;
    if (!isGlockTypeId(mainhandTypeId)) return;

    const pendingReload = pendingReloadByPlayer.get(player.id);
    if (pendingReload && (getCurrentTick() < pendingReload.completeTick)) return;

    // Keep runtime ammo as source-of-truth so inventory slot swaps do not refill the weapon.
    getLoadedRounds(player);
}

function setLoadedRounds(player, rounds) {
    if (!player?.id) return;
    const safeRounds = Math.max(0, Math.min(GLOCK_MAG_SIZE, Math.floor(rounds)));
    loadedRoundsByPlayer.set(player.id, safeRounds);
    try {
        player.setDynamicProperty?.(GLOCK_LOADED_ROUNDS_DP_KEY, safeRounds);
    } catch { }
    syncGlockItemVariant(player);
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
    if (!player?.id || !isHoldingGlock(player)) return;

    const lastHudTick = lastAmmoHudTickByPlayer.get(player.id) ?? -999999;
    if ((tick - lastHudTick) < HUD_UPDATE_INTERVAL_TICKS) return;

    const loadedRounds = getLoadedRounds(player);
    const reserveRounds = GLOCK_AMMO_POOL.getReserveTotal(player);
    const hudText = `${loadedRounds}/${GLOCK_MAG_SIZE} | ${reserveRounds} 9mm`;
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
    if (!player?.id || !isHoldingGlock(player)) return false;

    const tick = getCurrentTick();
    const reloadUntil = reloadUntilTickByPlayer.get(player.id) ?? -1;
    if (tick < reloadUntil) return false;

    const currentRounds = getLoadedRounds(player);
    if (currentRounds >= GLOCK_MAG_SIZE) return false;

    const roundsNeeded = GLOCK_MAG_SIZE - currentRounds;
    const consumed = GLOCK_AMMO_POOL.consumeReserve(player, roundsNeeded);
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

// SECTION: Shot Geometry Helpers
function applyShotDamage(shooter, target) {
    return applyWeaponDamage(shooter, target, GLOCK_DAMAGE);
}

function fireGlockShot(player) {
    if (!player?.id || !isHoldingGlock(player)) return false;

    const tick = getCurrentTick();
    if (!canShootNow(player, tick)) {
        return false;
    }

    const loadedRounds = getLoadedRounds(player);
    if (loadedRounds <= 0) {
        tryPlayEmptySound(player, tick);
        syncGlockItemVariant(player);
        return false;
    }

    lastShotTickByPlayer.set(player.id, tick);
    setLoadedRounds(player, loadedRounds - 1);
    playSoundForPlayer(player, FIRE_SOUND);
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
        GLOCK_MAX_DISTANCE
    );

    const hit = findEntityHit(player, origin, viewDirection, blockDistance, GLOCK_HIT_RADIUS);
    const trailDistance = hit?.distance ?? blockDistance;
    spawnLinearTrail(player.dimension, origin, viewDirection, trailDistance, {
        primaryParticle: "minecraft:basic_smoke_particle",
        fallbackParticle: "minecraft:basic_flame_particle",
        step: 0.2,
        maxPoints: 260
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
function beginAutoFire(player) {
    if (!player?.id || !isHoldingGlock(player)) return;

    if (isSneaking(player)) {
        stopAutoFire(player);
        tryReload(player);
        return;
    }

    const tick = getCurrentTick();

    autoFireStateByPlayer.set(player.id, {
        nextShotTick: tick + 1
    });
}

function stopAutoFire(player) {
    if (!player?.id) return;
    autoFireStateByPlayer.delete(player.id);
}

// SECTION: Event Wiring
world.afterEvents.itemUse.subscribe((eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (!isPlayerEntity(player)) return;

    const itemTypeId = getEventItemTypeId(eventData);
    if (!isGlockTypeId(itemTypeId) && !isHoldingGlock(player)) return;

    if (isSneaking(player)) {
        tryReload(player);
    }
});

world.afterEvents.itemStartUse.subscribe((eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (!isPlayerEntity(player)) return;

    const itemTypeId = getEventItemTypeId(eventData);
    if (!isGlockTypeId(itemTypeId) && !isHoldingGlock(player)) return;

    beginAutoFire(player);
});

world.afterEvents.itemStopUse.subscribe((eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (!isPlayerEntity(player)) return;

    stopAutoFire(player);
});

world.afterEvents.itemReleaseUse.subscribe((eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (!isPlayerEntity(player)) return;

    stopAutoFire(player);
});

// SECTION: Runtime Tick
registerWeaponTick((players, tick, onlinePlayers) => {
    if (!players.length) return;
    const hasActiveState = pendingReloadByPlayer.size > 0 || autoFireStateByPlayer.size > 0
        || nextIdleFidgetSoundTickByPlayer.size > 0;
    if (!hasActiveState && !players.some(p => isHoldingGlock(p))) return;

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
            initializeGlockRoundsFromHeldItem(player, mainhandTypeId);
        }

        if (!isGlockTypeId(previousMainhandTypeId) && isGlockTypeId(mainhandTypeId)) {
            nextIdleFidgetSoundTickByPlayer.set(
                player.id,
                tick + getRandomIntInclusive(IDLE_FIDGET_MIN_INTERVAL_TICKS, IDLE_FIDGET_MAX_INTERVAL_TICKS)
            );
        }
        lastMainhandTypeByPlayer.set(player.id, mainhandTypeId);

        if (isGlockTypeId(mainhandTypeId)) {
            syncGlockItemVariant(player);
        }

        if (!isHoldingGlock(player)) {
            autoFireStateByPlayer.delete(player.id);
            if (isGlockTypeId(previousMainhandTypeId)) {
                try {
                    player.onScreenDisplay?.setActionBar("");
                } catch { }
                lastAmmoHudTextByPlayer.delete(player.id);
                lastAmmoHudTickByPlayer.delete(player.id);
            }
            continue;
        }

        updateAmmoHud(player, tick);

        if (!autoFireStateByPlayer.has(player.id)
            && !isSneaking(player)
        ) {
            const nextFidgetTick = nextIdleFidgetSoundTickByPlayer.get(player.id)
                ?? (tick + IDLE_FIDGET_MIN_INTERVAL_TICKS);
            if (tick >= nextFidgetTick) {
                nextIdleFidgetSoundTickByPlayer.set(
                    player.id,
                    tick + getRandomIntInclusive(IDLE_FIDGET_MIN_INTERVAL_TICKS, IDLE_FIDGET_MAX_INTERVAL_TICKS)
                );
            }
        }

        if (isSneaking(player)) {
            autoFireStateByPlayer.delete(player.id);
            continue;
        }

        const autoFireState = autoFireStateByPlayer.get(player.id);
        if (!autoFireState) continue;

        if (tick >= autoFireState.nextShotTick) {
            const fired = fireGlockShot(player);
            autoFireState.nextShotTick = fired
                ? (autoFireState.nextShotTick + AUTO_FIRE_INTERVAL_TICKS)
                : (tick + 1);
            autoFireStateByPlayer.set(player.id, autoFireState);
        }
    }

    pruneStalePlayerState([
        autoFireStateByPlayer,
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