import { world } from "@minecraft/server";
import {
    getCurrentTick,
    getEventSourcePlayer,
    getEventItemTypeId,
    isPlayerEntity,
    getMainhandTypeId,
    lengthOf,
    normalize,
    add,
    subtract,
    scale,
    dot,
    getAimPoint,
    isDamageableTarget,
    getFirstBlockingBlockHit,
    applyWeaponDamage,
    playSoundForPlayer,
    registerWeaponTick,
    pruneStalePlayerState
} from "./weapon_common.js";

// SECTION: Crowbar Constants
const CROWBAR_ITEM_ID = "brr:crowbar";
const CROWBAR_DAMAGE = 5;
const CROWBAR_COOLDOWN_TICKS = 10;
const CROWBAR_HOLD_ATTACK_INTERVAL_TICKS = 10;
const CROWBAR_REACH = 4;
const CROWBAR_HIT_RADIUS = 1;
const CROWBAR_HIT_SOUNDS = [
    "weapons.crowbar.hit1",
    "weapons.crowbar.hit2",
    "weapons.crowbar.hit3"
];
const CROWBAR_MISS_SOUNDS = [
    "weapons.crowbar.miss1",
    "weapons.crowbar.miss2",
    "weapons.crowbar.miss3"
];

// SECTION: Crowbar Runtime State
const cooldownUntilTickByPlayer = new Map();
const heldUseByPlayer = new Map();
const nextHeldAttackTickByPlayer = new Map();

function isHoldingCrowbar(player) {
    return getMainhandTypeId(player) === CROWBAR_ITEM_ID;
}

// SECTION: Hit Detection
function findCrowbarHitTarget(player) {
    const origin = getAimPoint(player);

    let direction;
    try {
        direction = normalize(player.getViewDirection());
    } catch {
        return null;
    }

    let entities = [];
    try {
        entities = player.dimension.getEntities({
            location: origin,
            maxDistance: CROWBAR_REACH + 1.5
        });
    } catch {
        entities = [];
    }

    let closestHit = null;

    for (const target of entities) {
        if (!isDamageableTarget(target, player)) continue;

        const targetPoint = getAimPoint(target);
        const toTarget = subtract(targetPoint, origin);
        const forwardDistance = dot(toTarget, direction);

        if (!Number.isFinite(forwardDistance) || forwardDistance <= 0 || forwardDistance > CROWBAR_REACH) {
            continue;
        }

        const nearestOnRay = add(origin, scale(direction, forwardDistance));
        const lateralDistance = lengthOf(subtract(targetPoint, nearestOnRay));
        if (lateralDistance > CROWBAR_HIT_RADIUS) continue;

        if (!closestHit || forwardDistance < closestHit.distance) {
            closestHit = {
                entity: target,
                distance: forwardDistance
            };
        }
    }

    return closestHit?.entity ?? null;
}

// SECTION: Damage and Audio
function applyCrowbarDamage(attacker, target) {
    return applyWeaponDamage(attacker, target, CROWBAR_DAMAGE);
}

function playSwingSound(player, didHit) {
    if (!player?.id) return;

    const soundPool = didHit ? CROWBAR_HIT_SOUNDS : CROWBAR_MISS_SOUNDS;
    const index = Math.floor(Math.random() * soundPool.length);
    playSoundForPlayer(player, soundPool[index] ?? soundPool[0]);
}

// SECTION: Input Helpers
function handleCrowbarSwing(player) {
    if (!player?.id || !isHoldingCrowbar(player)) return;

    const tick = getCurrentTick();
    const cooldownUntil = cooldownUntilTickByPlayer.get(player.id) ?? -1;
    if (tick < cooldownUntil) return;

    cooldownUntilTickByPlayer.set(player.id, tick + CROWBAR_COOLDOWN_TICKS);

    const origin = getAimPoint(player);
    let direction;
    try {
        direction = normalize(player.getViewDirection());
    } catch {
        direction = { x: 0, y: 0, z: 1 };
    }

    const target = findCrowbarHitTarget(player);
    const didEntityHit = !!target && applyCrowbarDamage(player, target);
    const blockHit = getFirstBlockingBlockHit(player.dimension, origin, direction, CROWBAR_REACH);
    const blockDistance = Number(blockHit?.distance);
    const didBlockHit = Number.isFinite(blockDistance) && blockDistance >= 0 && blockDistance <= CROWBAR_REACH;
    const didHit = didEntityHit || didBlockHit;
    playSwingSound(player, didHit);
}

function beginHeldUse(player) {
    if (!player?.id || !isHoldingCrowbar(player)) return;
    heldUseByPlayer.set(player.id, true);
    nextHeldAttackTickByPlayer.set(player.id, getCurrentTick());
}

function endHeldUse(player) {
    if (!player?.id) return;
    heldUseByPlayer.delete(player.id);
    nextHeldAttackTickByPlayer.delete(player.id);
}

// SECTION: Event Wiring
world.afterEvents.playerSwingStart.subscribe((eventData) => {
    const player = eventData?.player ?? eventData?.source ?? eventData?.sourceEntity;
    if (!isPlayerEntity(player)) return;

    handleCrowbarSwing(player);
});

world.afterEvents.itemUse.subscribe((eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (!isPlayerEntity(player)) return;

    const itemTypeId = getEventItemTypeId(eventData);
    if (itemTypeId !== CROWBAR_ITEM_ID && !isHoldingCrowbar(player)) return;
    if (heldUseByPlayer.has(player.id)) return;

    handleCrowbarSwing(player);
});

world.afterEvents.itemStartUse.subscribe((eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (!isPlayerEntity(player)) return;

    const itemTypeId = getEventItemTypeId(eventData);
    if (itemTypeId !== CROWBAR_ITEM_ID && !isHoldingCrowbar(player)) return;

    beginHeldUse(player);
});

world.afterEvents.itemStopUse.subscribe((eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (!isPlayerEntity(player)) return;

    endHeldUse(player);
});

world.afterEvents.itemReleaseUse.subscribe((eventData) => {
    const player = getEventSourcePlayer(eventData);
    if (!isPlayerEntity(player)) return;

    endHeldUse(player);
});

// SECTION: Runtime Tick
registerWeaponTick((players, tick, onlinePlayers) => {
    if (!players.length) return;
    const hasActiveState = heldUseByPlayer.size > 0 || cooldownUntilTickByPlayer.size > 0;
    if (!hasActiveState && !players.some(p => isHoldingCrowbar(p))) return;

    for (const player of players) {
        if (!player?.id) continue;

        if (!isHoldingCrowbar(player)) {
            endHeldUse(player);
            continue;
        }

        if (heldUseByPlayer.has(player.id)) {
            const nextHeldTick = nextHeldAttackTickByPlayer.get(player.id) ?? 0;
            if (tick >= nextHeldTick) {
                handleCrowbarSwing(player);
                nextHeldAttackTickByPlayer.set(player.id, tick + CROWBAR_HOLD_ATTACK_INTERVAL_TICKS);
            }
        }
    }

    pruneStalePlayerState([cooldownUntilTickByPlayer, heldUseByPlayer, nextHeldAttackTickByPlayer], onlinePlayers);
});