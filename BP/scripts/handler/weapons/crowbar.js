import { world, EntityDamageCause } from "@minecraft/server";
import {
    applyWeaponDamage,
    getAimPoint,
    getCurrentTick,
    getEventSourcePlayer,
    getMainhandTypeId,
    isPlayerEntity,
    normalize,
    playRandomSound,
    pruneStalePlayerState,
    pulseMelee,
    registerWeaponTick,
    traceShot
} from "./weapon_common.js";

// SECTION: Crowbar Constants
// Half-Life timing: 0.25 s between swings after a hit, 0.5 s after a miss. Damage comes only from this
// script (the vanilla melee hit is cancelled below), on left-click or while holding right-click.
const CROWBAR_ITEM_ID = "brr:crowbar";
const CROWBAR_DAMAGE = 5;
const CROWBAR_REACH = 4;
const CROWBAR_AIM_FORGIVENESS = 0.5;
const HIT_REFIRE_TICKS = 5;
const MISS_REFIRE_TICKS = 10;

// Black Mesa uses separate flesh hits (cbar_hitbod1-3); until those files are added the world hits stand in.
const FLESH_HIT_SOUNDS = ["weapons.crowbar.hit1", "weapons.crowbar.hit2", "weapons.crowbar.hit3"];
const WORLD_HIT_SOUNDS = ["weapons.crowbar.hit1", "weapons.crowbar.hit2", "weapons.crowbar.hit3"];
const MISS_SOUNDS = ["weapons.crowbar.miss1", "weapons.crowbar.miss2", "weapons.crowbar.miss3"];

// SECTION: Crowbar Runtime State
const nextSwingTickByPlayer = new Map();
const holdingUseByPlayer = new Set();
// Targets this script damaged this tick (by id), so its own hit is not cancelled with the vanilla one.
const scriptedHitTickByTarget = new Map();

const isHoldingCrowbar = (player) => getMainhandTypeId(player) === CROWBAR_ITEM_ID;

// SECTION: Swing
function swing(player, tick) {
    if (tick < (nextSwingTickByPlayer.get(player.id) ?? 0)) return;

    let direction;
    try {
        direction = normalize(player.getViewDirection());
    } catch {
        return;
    }

    const shot = traceShot(player, getAimPoint(player), direction, CROWBAR_REACH, CROWBAR_AIM_FORGIVENESS);

    if (shot.entityHit) {
        scriptedHitTickByTarget.set(shot.entityHit.entity.id, tick);
        applyWeaponDamage(player, shot.entityHit.entity, CROWBAR_DAMAGE);
        playRandomSound(player, FLESH_HIT_SOUNDS);
    } else if (shot.blockHit) {
        playRandomSound(player, WORLD_HIT_SOUNDS);
    } else {
        playRandomSound(player, MISS_SOUNDS);
    }

    const hit = !!(shot.entityHit || shot.blockHit);
    pulseMelee(player, hit);
    nextSwingTickByPlayer.set(player.id, tick + (hit ? HIT_REFIRE_TICKS : MISS_REFIRE_TICKS));
}

// SECTION: Event Wiring
world.afterEvents.playerSwingStart.subscribe((event) => {
    if (event.swingSource !== "Attack" || event.heldItemStack?.typeId !== CROWBAR_ITEM_ID) return;
    swing(event.player, getCurrentTick());
});

world.afterEvents.itemStartUse.subscribe((event) => {
    const player = getEventSourcePlayer(event);
    if (!isPlayerEntity(player) || event.itemStack?.typeId !== CROWBAR_ITEM_ID) return;

    holdingUseByPlayer.add(player.id);
    swing(player, getCurrentTick());
});

const endHold = (event) => {
    const player = getEventSourcePlayer(event);
    if (player?.id) holdingUseByPlayer.delete(player.id);
};
world.afterEvents.itemStopUse.subscribe(endHold);
world.afterEvents.itemReleaseUse.subscribe(endHold);

// The crowbar's own swing does the damage, so the vanilla melee hit it would also land is cancelled.
world.beforeEvents.entityHurt.subscribe((event) => {
    const source = event.damageSource;
    if (source?.cause !== EntityDamageCause.entityAttack) return;

    const attacker = source.damagingEntity;
    if (!isPlayerEntity(attacker) || !isHoldingCrowbar(attacker)) return;
    if (scriptedHitTickByTarget.get(event.hurtEntity?.id) === getCurrentTick()) return;

    event.cancel = true;
});

// SECTION: Runtime Tick
registerWeaponTick((players, tick, onlinePlayers) => {
    scriptedHitTickByTarget.clear();
    if (holdingUseByPlayer.size === 0) {
        if (nextSwingTickByPlayer.size > 0) pruneStalePlayerState([nextSwingTickByPlayer], onlinePlayers);
        return;
    }

    for (const playerId of holdingUseByPlayer) {
        const player = onlinePlayers.get(playerId);
        if (!player || !isHoldingCrowbar(player)) {
            holdingUseByPlayer.delete(playerId);
            continue;
        }
        swing(player, tick);
    }
});
