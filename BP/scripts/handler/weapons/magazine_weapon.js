import { world, EntityDamageCause } from "@minecraft/server";
import { flashShooterLight, spawnBulletImpact, spawnImpactParticle, spawnLinearTrail } from "./effects.js";
import { createReserveAmmoPool } from "./ammo_system.js";
import {
    WEAPON_ACTION,
    applySpread,
    applyWeaponDamage,
    getAimPoint,
    getCurrentTick,
    getEventSourcePlayer,
    getMainhandTypeId,
    isPlayerEntity,
    isSneaking,
    normalize,
    playSoundForPlayer,
    pruneStalePlayerState,
    pulseDoubleShot,
    pulseShot,
    registerWeaponTick,
    reportWeaponHud,
    setMainhandType,
    setWeaponAction,
    setWeaponCondition,
    stopSoundForPlayer,
    traceShot
} from "./weapon_common.js";

// SECTION: Per-Gun Magazine Storage
// Each gun item gets an id (stored on the item once, the first time it's held); its loaded rounds are kept
// in a world property under that id. Rounds follow the gun between slots, chests and players without
// rewriting the held item on every shot.
const GUN_ID_PROPERTY = "brr_gun_id";
const ROUNDS_PROPERTY_PREFIX = "brr_gun_rounds:";
const roundsByGunId = new Map();

function newGunId() {
    return `${Date.now().toString(36)}${Math.floor(Math.random() * 0x7fffffff).toString(36)}`;
}

function readRounds(gunId, fallback) {
    if (roundsByGunId.has(gunId)) return roundsByGunId.get(gunId);
    let rounds = fallback;
    try {
        const stored = world.getDynamicProperty(ROUNDS_PROPERTY_PREFIX + gunId);
        if (typeof stored === "number" && Number.isFinite(stored)) rounds = stored;
    } catch { }
    roundsByGunId.set(gunId, rounds);
    return rounds;
}

function writeRounds(gunId, rounds) {
    roundsByGunId.set(gunId, rounds);
    try {
        world.setDynamicProperty(ROUNDS_PROPERTY_PREFIX + gunId, rounds);
    } catch { }
}

const EMPTY_SOUND_COOLDOWN_TICKS = 8;
const RESERVE_CACHE_TICKS = 10;

/**
 * Creates a magazine-fed hitscan weapon (Glock, .357, SPAS-12).
 *
 * config:
 *   itemId, retiredItemIds        held item id; retired ids (old "_empty" variants) are migrated to itemId
 *   ammoIds, magSize, hudLabel    reserve ammo boxes, rounds per magazine, action-bar label
 *   damage, range, assistRadius   per-shot damage, max range in blocks, aim forgiveness (0 = exact hitbox)
 *   refireTicks                   minimum ticks between single (tap) shots
 *   rapidFire                     optional { delayTicks, intervalTicks, spreadDegrees } while the button is held
 *   fireModes                     optional { attack?, use? }: what left click (attack) and right click (use) fire, as
 *                                 { rounds, pellets, spreadDegrees, damage (per pellet), refireTicks, sound,
 *                                 signal: "shot" | "double", fallback? (mode fired when fewer than `rounds` are loaded) }.
 *                                 Without it, right click fires one `damage` shot as above.
 *   reloadTicks, reloadAction     reload duration and the WEAPON_ACTION its animation listens for
 *   shellReload                   optional { startTicks, shellTicks, endTicks, pumpTicks }: loads one round at a time instead
 *                                 (WEAPON_ACTION.SHELL_RELOAD while it runs); firing stops it after the current shell
 *                                 and the shot goes off once the gun is back up (and pumped, if it was reloaded from empty)
 *   sneakUseReloads               sneak + use starts a reload
 *   autoReloadOnEmpty             clicking with an empty magazine starts a reload
 *   sounds                        { fire, fireSneaking?, empty, reload?, reloadEmpty? }
 *   trail                         { particle, fallbackParticle, step, maxPoints, pelletMaxPoints? }
 *   legacyRoundsProperty          old per-player rounds property, carried onto the first gun that gets an id
 */
export function createMagazineWeapon(config) {
    const {
        itemId, retiredItemIds = [], ammoIds, magSize, hudLabel,
        damage, range, assistRadius = 0, refireTicks, rapidFire = null, fireModes = null,
        reloadTicks, reloadAction = WEAPON_ACTION.RELOAD, shellReload = null, sneakUseReloads = false, autoReloadOnEmpty = false,
        sounds, trail, legacyRoundsProperty
    } = config;

    const pool = createReserveAmmoPool(ammoIds);
    const knownIds = new Set([itemId, ...retiredItemIds]);

    const heldGunByPlayer = new Map();
    const holdByPlayer = new Map();
    const lastShotTickByPlayer = new Map();
    const reloadByPlayer = new Map();
    const lastEmptySoundTickByPlayer = new Map();
    const reserveCacheByPlayer = new Map();
    // fire modes: no shot before this tick (the pump after a shotgun shot, the gun coming back up after a reload)
    const busyUntilByPlayer = new Map();
    const queuedShotByPlayer = new Map();

    // SECTION: Held Gun
    // Reading the stack and its gun id costs a few native calls, so the result is reused while the same slot holds
    // the same item type, and re-read every HELD_GUN_RECHECK_TICKS in case another gun of this kind was swapped in.
    const HELD_GUN_RECHECK_TICKS = 10;

    /** The gun in the player's selected slot ({ gunId }), assigning an id the first time; null if not held. */
    function resolveHeldGun(player, tick) {
        const typeId = getMainhandTypeId(player);
        if (!knownIds.has(typeId)) return null;

        if (typeId !== itemId) {
            setMainhandType(player, itemId);
            return null;
        }

        const cached = heldGunByPlayer.get(player.id);
        if (cached && tick - cached.tick < HELD_GUN_RECHECK_TICKS && cached.slot === player.selectedSlotIndex) return cached;

        let container, item;
        try {
            container = player.getComponent("minecraft:inventory").container;
            item = container.getItem(player.selectedSlotIndex);
        } catch {
            return null;
        }
        if (item?.typeId !== itemId) return null;

        let gunId = item.getDynamicProperty(GUN_ID_PROPERTY);
        if (typeof gunId !== "string") {
            gunId = newGunId();
            writeRounds(gunId, takeLegacyRounds(player));
            try {
                item.setDynamicProperty(GUN_ID_PROPERTY, gunId);
                container.setItem(player.selectedSlotIndex, item);
            } catch { }
        }

        const gun = { gunId, slot: player.selectedSlotIndex, tick };
        heldGunByPlayer.set(player.id, gun);
        return gun;
    }

    function takeLegacyRounds(player) {
        if (!legacyRoundsProperty) return magSize;
        try {
            const stored = player.getDynamicProperty(legacyRoundsProperty);
            if (typeof stored === "number") {
                player.setDynamicProperty(legacyRoundsProperty, undefined);
                return Math.max(0, Math.min(magSize, Math.floor(stored)));
            }
        } catch { }
        return magSize;
    }

    const getRounds = (gun) => Math.max(0, Math.min(magSize, readRounds(gun.gunId, magSize)));

    function getReserve(player, tick) {
        const cached = reserveCacheByPlayer.get(player.id);
        if (cached && (tick - cached.tick) < RESERVE_CACHE_TICKS) return cached.total;
        const total = pool.getReserveTotal(player);
        reserveCacheByPlayer.set(player.id, { total, tick });
        return total;
    }

    // SECTION: Reload
    function tryReload(player, gun, tick) {
        if (reloadByPlayer.has(player.id)) return false;
        if (tick < (busyUntilByPlayer.get(player.id) ?? -Infinity)) return false;

        const rounds = getRounds(gun);
        if (rounds >= magSize || getReserve(player, tick) <= 0) return false;
        holdByPlayer.delete(player.id);

        if (shellReload) {
            // the animation runs idle -> shell (startTicks), then one shell every shellTicks; the sounds are in it
            reloadByPlayer.set(player.id, { gunId: gun.gunId, shells: true, nextShellTick: tick + shellReload.startTicks + shellReload.shellTicks, stopRequested: false, startedEmpty: rounds <= 0 });
            setWeaponAction(player, WEAPON_ACTION.SHELL_RELOAD);
            return true;
        }

        // Ammo is only taken when the reload finishes, so an interrupted reload loses nothing.
        reloadByPlayer.set(player.id, { gunId: gun.gunId, completeTick: tick + reloadTicks, wasEmpty: rounds <= 0 });
        playSoundForPlayer(player, rounds <= 0 ? sounds.reloadEmpty : sounds.reload);
        setWeaponAction(player, reloadAction);
        return true;
    }

    function finishReload(player, gun) {
        const rounds = getRounds(gun);
        const added = pool.consumeReserve(player, magSize - rounds);
        writeRounds(gun.gunId, rounds + added);
        reserveCacheByPlayer.delete(player.id);
        reloadByPlayer.delete(player.id);
        setWeaponCondition(player, rounds + added <= 0);
        setWeaponAction(player, WEAPON_ACTION.NONE);
    }

    /** One shell in; the reload ends when full, out of ammo, or a shot was asked for. */
    function loadShell(player, gun, reload, tick) {
        const rounds = getRounds(gun);
        const added = rounds < magSize ? pool.consumeReserve(player, 1) : 0;
        if (added > 0) {
            writeRounds(gun.gunId, rounds + added);
            reserveCacheByPlayer.delete(player.id);
            setWeaponCondition(player, false);
        }
        const full = rounds + added >= magSize;
        if (added > 0 && !full && !reload.stopRequested && getReserve(player, tick) > 0) {
            reload.nextShellTick += shellReload.shellTicks;
            return;
        }
        reloadByPlayer.delete(player.id);
        setWeaponAction(player, WEAPON_ACTION.NONE);
        // from empty, the gun is pumped once it is back up (the animation plays it too)
        busyUntilByPlayer.set(player.id, tick + shellReload.endTicks + (reload.startedEmpty ? shellReload.pumpTicks ?? 0 : 0));
    }

    function cancelReload(player) {
        const reload = reloadByPlayer.get(player.id);
        if (!reload) return;
        reloadByPlayer.delete(player.id);
        queuedShotByPlayer.delete(player.id);
        if (!reload.shells) stopSoundForPlayer(player, reload.wasEmpty ? sounds.reloadEmpty : sounds.reload);
        setWeaponAction(player, WEAPON_ACTION.NONE);
    }

    // SECTION: Firing
    function fireShot(player, gun, tick, minIntervalTicks, spreadDegrees) {
        if (reloadByPlayer.has(player.id)) return false;

        const lastShot = lastShotTickByPlayer.get(player.id) ?? -Infinity;
        if ((tick - lastShot) < minIntervalTicks) return false;

        const rounds = getRounds(gun);
        if (rounds <= 0) {
            dryFire(player, gun, tick);
            return false;
        }

        lastShotTickByPlayer.set(player.id, tick);
        writeRounds(gun.gunId, rounds - 1);
        setWeaponCondition(player, rounds - 1 <= 0);
        pulseShot(player);
        playSoundForPlayer(player, (sounds.fireSneaking && isSneaking(player)) ? sounds.fireSneaking : sounds.fire);
        flashShooterLight(player, 2, 9);

        let direction;
        try {
            direction = applySpread(normalize(player.getViewDirection()), spreadDegrees);
        } catch {
            return true;
        }

        const origin = getAimPoint(player);
        const shot = traceShot(player, origin, direction, range, assistRadius);
        spawnLinearTrail(player.dimension, origin, direction, shot.distance, {
            primaryParticle: trail.particle,
            fallbackParticle: trail.fallbackParticle,
            step: trail.step,
            maxPoints: trail.maxPoints
        });
        spawnImpactParticle(player.dimension, shot.endPoint, {
            primaryParticle: trail.particle,
            fallbackParticle: trail.fallbackParticle
        });
        if (shot.blockHit) spawnBulletImpact(player.dimension, shot.blockHit);

        if (shot.entityHit) applyWeaponDamage(player, shot.entityHit.entity, damage);
        return true;
    }

    // Pellets hitting the same target are added up and applied once: separate hits in one tick would be swallowed by
    // the target's hurt cooldown. The script's own hits are told apart from the vanilla punch (same tick as the click):
    // the target being hit right now by the script, or failing that a same-tick hit bigger than a fist's 1 damage.
    // (Not by exact amount: armor - a zombie's 2 points - lowers the damage the hurt event sees.)
    const scriptedHitByTarget = new Map();
    const PUNCH_DAMAGE = 1;
    let scriptHitting = null;

    /** A shot of a fire mode (left/right click). Returns true if it fired. */
    function fireMode(player, gun, tick, mode) {
        if (reloadByPlayer.has(player.id)) {
            // Black Mesa: a shot stops a shell-by-shell reload once the current shell is in, then goes off
            const reload = reloadByPlayer.get(player.id);
            if (reload.shells && getRounds(gun) > 0) {
                reload.stopRequested = true;
                queuedShotByPlayer.set(player.id, mode);
            }
            return false;
        }
        if (tick < (busyUntilByPlayer.get(player.id) ?? -Infinity)) return false;

        const rounds = getRounds(gun);
        if (rounds <= 0) {
            dryFire(player, gun, tick);
            return false;
        }
        if (rounds < mode.rounds) {
            if (!mode.fallback) return false;
            mode = mode.fallback;
        }

        writeRounds(gun.gunId, rounds - mode.rounds);
        setWeaponCondition(player, rounds - mode.rounds <= 0);
        busyUntilByPlayer.set(player.id, tick + mode.refireTicks);
        lastShotTickByPlayer.set(player.id, tick);
        if (mode.signal === "double") pulseDoubleShot(player);
        else pulseShot(player);
        playSoundForPlayer(player, mode.sound);
        flashShooterLight(player, 2, 9);

        let view;
        try {
            view = normalize(player.getViewDirection());
        } catch {
            return true;
        }
        const origin = getAimPoint(player);
        const damageByTarget = new Map();
        for (let i = 0; i < mode.pellets; i++) {
            const direction = applySpread(view, mode.spreadDegrees);
            const shot = traceShot(player, origin, direction, range, assistRadius);
            spawnLinearTrail(player.dimension, origin, direction, shot.distance, {
                primaryParticle: trail.particle,
                fallbackParticle: trail.fallbackParticle,
                step: trail.step,
                maxPoints: mode.pellets > 1 ? (trail.pelletMaxPoints ?? trail.maxPoints) : trail.maxPoints
            });
            spawnImpactParticle(player.dimension, shot.endPoint, {
                primaryParticle: trail.particle,
                fallbackParticle: trail.fallbackParticle
            });
            if (shot.blockHit) spawnBulletImpact(player.dimension, shot.blockHit);
            const target = shot.entityHit?.entity;
            if (!target) continue;
            const entry = damageByTarget.get(target.id) ?? { target, amount: 0 };
            entry.amount += mode.damage;
            damageByTarget.set(target.id, entry);
        }
        for (const { target, amount } of damageByTarget.values()) {
            scriptedHitByTarget.set(target.id, { tick, amount });
            scriptHitting = target.id;
            try {
                applyWeaponDamage(player, target, amount);
            } finally {
                scriptHitting = null;
            }
        }
        return true;
    }

    // Left click is a shot, so the vanilla punch that comes with it on an entity is cancelled.
    if (fireModes?.attack) {
        world.beforeEvents.entityHurt.subscribe((event) => {
            const source = event.damageSource;
            if (source?.cause !== EntityDamageCause.entityAttack) return;
            const attacker = source.damagingEntity;
            if (!isPlayerEntity(attacker) || !knownIds.has(getMainhandTypeId(attacker))) return;
            const id = event.hurtEntity?.id;
            if (id !== undefined && id === scriptHitting) return;
            const scripted = scriptedHitByTarget.get(id);
            if (scripted && scripted.tick === getCurrentTick() && event.damage > PUNCH_DAMAGE + 1e-3) {
                scriptedHitByTarget.delete(id);
                return;
            }
            event.cancel = true;
        });
    }

    function dryFire(player, gun, tick) {
        if (autoReloadOnEmpty && tryReload(player, gun, tick)) return;

        const lastTick = lastEmptySoundTickByPlayer.get(player.id) ?? -Infinity;
        if ((tick - lastTick) < EMPTY_SOUND_COOLDOWN_TICKS) return;
        lastEmptySoundTickByPlayer.set(player.id, tick);
        playSoundForPlayer(player, sounds.empty);
    }

    // SECTION: Input
    world.afterEvents.itemStartUse.subscribe((event) => {
        const player = getEventSourcePlayer(event);
        if (!isPlayerEntity(player) || !knownIds.has(event.itemStack?.typeId)) return;

        const tick = getCurrentTick();
        const gun = resolveHeldGun(player, tick);
        if (!gun) return;

        if (sneakUseReloads && isSneaking(player)) {
            tryReload(player, gun, tick);
            return;
        }

        if (fireModes) {
            if (fireModes.use) fireMode(player, gun, tick, fireModes.use);
            return;
        }
        fireShot(player, gun, tick, refireTicks, 0);
        if (rapidFire) holdByPlayer.set(player.id, { nextRapidTick: tick + rapidFire.delayTicks });
    });

    if (fireModes?.attack) {
        world.afterEvents.playerSwingStart.subscribe((event) => {
            if (event.swingSource !== "Attack" || !knownIds.has(event.heldItemStack?.typeId)) return;
            const player = event.player;
            const tick = getCurrentTick();
            const gun = resolveHeldGun(player, tick);
            if (gun) fireMode(player, gun, tick, fireModes.attack);
        });
    }

    const endHold = (event) => {
        const player = getEventSourcePlayer(event);
        if (player?.id) holdByPlayer.delete(player.id);
    };
    world.afterEvents.itemStopUse.subscribe(endHold);
    world.afterEvents.itemReleaseUse.subscribe(endHold);

    // SECTION: Tick
    const lastGunIdByPlayer = new Map();

    registerWeaponTick((players, tick, onlinePlayers) => {
        for (const player of players) {
            const gun = resolveHeldGun(player, tick);
            const previousGunId = lastGunIdByPlayer.get(player.id);

            if (!gun) {
                if (previousGunId !== undefined) {
                    lastGunIdByPlayer.delete(player.id);
                    holdByPlayer.delete(player.id);
                    cancelReload(player);
                }
                continue;
            }

            // Drawn (or swapped to another gun of the same kind): match the empty/loaded pose to this gun.
            if (gun.gunId !== previousGunId) {
                lastGunIdByPlayer.set(player.id, gun.gunId);
                if (reloadByPlayer.get(player.id)?.gunId !== gun.gunId) cancelReload(player);
                setWeaponCondition(player, getRounds(gun) <= 0);
            }

            const reload = reloadByPlayer.get(player.id);
            if (reload?.shells) {
                if (tick >= reload.nextShellTick) loadShell(player, gun, reload, tick);
            } else if (reload && tick >= reload.completeTick) {
                finishReload(player, gun);
            }

            // a shot asked for during a shell reload goes off once the gun is back up
            const queued = queuedShotByPlayer.get(player.id);
            if (queued && !reloadByPlayer.has(player.id) && tick >= (busyUntilByPlayer.get(player.id) ?? -Infinity)) {
                queuedShotByPlayer.delete(player.id);
                fireMode(player, gun, tick, queued);
            }

            const hold = holdByPlayer.get(player.id);
            if (hold && rapidFire && tick >= hold.nextRapidTick) {
                fireShot(player, gun, tick, rapidFire.intervalTicks, rapidFire.spreadDegrees);
                hold.nextRapidTick = tick + rapidFire.intervalTicks;
            }

            const reserve = getReserve(player, tick);
            reportWeaponHud(player, `${getRounds(gun)}/${magSize} | ${Number.isFinite(reserve) ? reserve : "∞"} ${hudLabel}`);
        }

        pruneStalePlayerState([
            heldGunByPlayer, holdByPlayer, lastShotTickByPlayer, reloadByPlayer,
            lastEmptySoundTickByPlayer, reserveCacheByPlayer, lastGunIdByPlayer,
            busyUntilByPlayer, queuedShotByPlayer
        ], onlinePlayers);
        for (const [targetId, hit] of scriptedHitByTarget) if (hit.tick !== tick) scriptedHitByTarget.delete(targetId);
    });
}
