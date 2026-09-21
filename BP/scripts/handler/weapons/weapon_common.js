import { world, system, ItemStack, EntityDamageCause } from "@minecraft/server";

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
    try {
        const tick = Number(system?.currentTick);
        if (Number.isFinite(tick) && tick >= 0) return tick;
    } catch { }

    try {
        return Number.parseInt(`${world.getAbsoluteTime?.() ?? 0}`, 10) || 0;
    } catch {
        return 0;
    }
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
    if (!player?.id) return false;

    try {
        if (typeof player.getGameMode === "function") {
            return `${player.getGameMode()}`.trim().toLowerCase() === "creative";
        }
    } catch { }

    try {
        return (player.runCommand("testfor @s[m=creative]")?.successCount ?? 0) > 0;
    } catch { }

    try {
        return (player.runCommand("testfor @s[m=1]")?.successCount ?? 0) > 0;
    } catch { }

    return false;
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
export function getMainhandTypeId(player) {
    try {
        const equipment = player.getComponent("minecraft:equippable");
        return `${equipment?.getEquipment("Mainhand")?.typeId ?? ""}`.trim().toLowerCase();
    } catch {
        return "";
    }
}

export function setMainhandType(player, itemTypeId) {
    if (!player?.id || !itemTypeId) return false;

    try {
        const equippable = player.getComponent("minecraft:equippable");
        if (!equippable) return false;
        equippable.setEquipment("Mainhand", new ItemStack(itemTypeId, 1));
        return true;
    } catch (error) {
        logWeaponError("setMainhandType", error);
        return false;
    }
}

// SECTION: Sound Helpers
export function playSoundForPlayer(player, soundId, options = { pitch: 1, volume: 1 }) {
    if (!player?.id || !soundId) return;

    try {
        player.playSound(soundId, options);
        return;
    } catch { }

    try {
        player.runCommand(`playsound ${soundId} @s ~ ~ ~ 1 1`);
    } catch (error) {
        logWeaponError(`playSoundForPlayer(${soundId})`, error);
    }
}

export function stopSoundForPlayer(player, soundId) {
    if (!player?.id || !soundId) return;

    try {
        player.runCommand(`stopsound @s ${soundId}`);
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

export function getAimPoint(entity) {
    const head = getHeadLocation(entity);
    return {
        x: head.x,
        y: head.y - 0.2,
        z: head.z
    };
}

/** Builds a forward/right/up basis for a beam direction, used to offset a muzzle point from the head. */
export function getBeamBasis(direction) {
    const forward = normalize(direction);
    const worldUp = { x: 0, y: 1, z: 0 };

    let right = normalize(cross(forward, worldUp));
    if (lengthOf(right) <= 0.000001) {
        right = { x: 1, y: 0, z: 0 };
    }

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

/** Excludes non-combat entities (dropped items, xp orbs, projectiles) from hit-scan targeting. */
export function isDamageableTarget(target, actor) {
    if (!target?.id || target.id === actor?.id) return false;

    const typeId = `${target.typeId ?? ""}`.trim().toLowerCase();
    if (!typeId) return false;

    if (typeId === "minecraft:item"
        || typeId === "minecraft:xp_orb"
        || typeId === "minecraft:arrow"
        || typeId === "minecraft:snowball"
        || typeId === "minecraft:egg") {
        return false;
    }

    try {
        return !!target.getComponent("minecraft:health");
    } catch {
        return false;
    }
}

export function getFirstBlockingBlockHit(dimension, origin, direction, maxDistance) {
    try {
        return dimension.getBlockFromRay(origin, direction, {
            maxDistance,
            includePassableBlocks: false,
            includeLiquidBlocks: false
        });
    } catch {
        return null;
    }
}

export function getDistanceToFirstBlockingBlock(dimension, origin, direction, maxDistance) {
    const hit = getFirstBlockingBlockHit(dimension, origin, direction, maxDistance);
    const distance = Number(hit?.distance);
    if (Number.isFinite(distance) && distance >= 0) {
        return Math.max(0, distance - 0.05);
    }

    return maxDistance;
}

/** Finds the closest hit-scan-eligible entity within a cylinder around the ray, respecting block occlusion. */
export function findEntityHit(shooter, origin, direction, maxDistance, hitRadius) {
    let closestHit = null;
    let entities = [];

    try {
        entities = shooter.dimension.getEntities({
            location: origin,
            maxDistance: maxDistance + 2
        });
    } catch {
        entities = [];
    }

    for (const target of entities) {
        if (!isDamageableTarget(target, shooter)) continue;

        const targetPoint = getAimPoint(target);
        const toTarget = subtract(targetPoint, origin);
        const forwardDistance = dot(toTarget, direction);

        if (!Number.isFinite(forwardDistance) || forwardDistance <= 0 || forwardDistance > maxDistance) {
            continue;
        }

        const nearestOnRay = add(origin, scale(direction, forwardDistance));
        const lateralDistance = lengthOf(subtract(targetPoint, nearestOnRay));
        if (lateralDistance > hitRadius) continue;

        const blockingHit = getFirstBlockingBlockHit(shooter.dimension, origin, direction, forwardDistance);
        const blockingDistance = Number(blockingHit?.distance);
        if (Number.isFinite(blockingDistance) && blockingDistance >= 0 && blockingDistance < (forwardDistance - 0.01)) {
            continue;
        }

        if (!closestHit || forwardDistance < closestHit.distance) {
            closestHit = {
                entity: target,
                distance: forwardDistance,
                impactPoint: nearestOnRay
            };
        }
    }

    return closestHit;
}

// SECTION: Damage
/** Applies hit-scan damage, falling back to a targeted /damage command when the direct component call fails. */
export function applyWeaponDamage(actor, target, amount, cause = EntityDamageCause.entityAttack) {
    if (!actor?.id || !target?.id) return false;

    const safeDamage = Math.max(0, Number(amount) || 0);
    if (safeDamage <= 0) return false;

    try {
        target.applyDamage(safeDamage, {
            cause,
            damagingEntity: actor
        });
        return true;
    } catch { }

    if (!isPlayerEntity(target)) return false;

    try {
        actor.runCommand(`damage @a[name=\"${target.name}\",c=1] ${safeDamage} entity_attack entity @s`);
        return true;
    } catch (error) {
        logWeaponError("applyWeaponDamage", error);
        return false;
    }
}

// SECTION: Per-Player State Lifecycle
/** Deletes every entry keyed by a player id that is no longer online, across any number of maps. */
export function pruneStalePlayerState(stateMaps, onlinePlayers) {
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
}, 1);
