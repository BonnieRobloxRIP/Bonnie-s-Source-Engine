import { world } from "@minecraft/server";
import { AIR, isPassableDecorType } from "../core/block_cache.js";
import { distanceSquared } from "../core/math.js";
import { gameTick } from "../core/pause.js";
import { isBigDoorType } from "../doors.js";
import { smashTouchedWindows } from "../core/windows.js";
import { Navigator, pickWanderGoal } from "./navigation.js";
import { hasLineOfSight, isTargetablePlayer, SightMemo } from "./perception.js";
import { isCharacterControlled, registerCharacter } from "./registry.js";

// Christian First Prize (FirstPrizeScript.cs). He wanders the hallways, has to turn in place before he
// can drive anywhere, and charges at any player he can see. Running into someone while he's moving
// pins them right in front of him (the hug). A hammer sends him spinning out of control for 30 s,
// smashing any window he hits. Speeds are blocks per tick; 10 Unity units = 3 blocks.

const TYPE_ID = "brr:first_prize";
const HAMMER_ID = "brr:item_hammer";
// normSpeed / runSpeed / turnSpeed are inspector values in the original
const NORMAL_SPEED = 0.15;
const RUN_SPEED = 0.45;
const TURN_DEGREES_PER_TICK = 4.5;
// he only drives off once he faces his next waypoint within this many degrees
const FACING_TOLERANCE = 5;
// gotHammered: runSpeed * 10 in the original, capped so the path walk stays sane
const CRAZY_SPEED = 1.2;
const CRAZY_TICKS = 600;
const CRAZY_FIRST_RECHECK_TICKS = 200;
const CRAZY_RECHECK_TICKS = 100;
const SIGHT_RANGE_SQUARED = 128 * 128;
// each player's line of sight is re-checked every few ticks, not every tick
const SIGHT_CHECK_TICKS = 3;
// hugs only happen while he's doing over 5 units/s
const HUG_MIN_SPEED = 0.075;
const TOUCH_DISTANCE_SQUARED = 1.2 * 1.2;
// the hugged player is held 3 units in front of him
const HUG_OFFSET = 0.9;
const ARRIVE_DISTANCE_SQUARED = 1.5 * 1.5;
const HAMMER_REACH = 3;
// cooldowns from the original: 0.5 s after targeting, 2 s after picking a wander spot
const TARGET_COOLDOWN_TICKS = 10;
const WANDER_COOLDOWN_TICKS = 40;
// Mathf.RoundToInt(Random.Range(0, 9)) == 0
const RANDOM_LINE_CHANCE = 1 / 18;
// 1pr_jesus when he spots you, 1pr_running as his wander chatter (lengths in ticks)
const FOUND_LINE = { id: "prize.jesus", ticks: 124 };
const RANDOM_LINE = { id: "prize.running", ticks: 60 };
const MOTOR_SOUND = "prize.motor";
// 1pr_motor.ogg is 2.39 s; its pitch rises with his speed like motorAudio.pitch
const MOTOR_TICKS = 48;

function blocksSight(typeId) {
    return typeId !== undefined && typeId !== AIR && !isBigDoorType(typeId) && !isPassableDecorType(typeId) && !typeId.includes("window");
}

function canSee(entity, player) {
    const from = entity.location;
    const to = player.location;
    if (distanceSquared(from, to) > SIGHT_RANGE_SQUARED) return false;
    return hasLineOfSight(
        entity.dimension,
        { x: from.x, y: from.y + 1.2, z: from.z },
        { x: to.x, y: to.y + 1.5, z: to.z },
        blocksSight
    );
}

function yawToward(from, to) {
    return Math.atan2(-(to.x - from.x), to.z - from.z) * 180 / Math.PI;
}

function deltaAngle(from, to) {
    return ((to - from) % 360 + 540) % 360 - 180;
}

function speak(entity, state, line, tick) {
    if (tick < state.voiceUntil) return;
    try { entity.dimension.playSound(line.id, entity.location); } catch { }
    state.voiceUntil = tick + line.ticks;
}

// a floor spot 8-30 blocks off; if none turns up he stays put, and the wander cooldown below
// paces the next try
function wander(entity, state, tick) {
    state.destination = pickWanderGoal(entity, 8, 30);
    state.targetId = undefined;
    state.nav.reset();
    if (Math.random() < RANDOM_LINE_CHANCE && tick >= state.cooldownUntil) speak(entity, state, RANDOM_LINE, tick);
    state.cooldownUntil = tick + WANDER_COOLDOWN_TICKS;
}

function goCrazy(entity, state, tick) {
    wander(entity, state, tick);
    state.crazyUntil = tick + CRAZY_TICKS;
    state.crazyRecheckAt = tick + CRAZY_FIRST_RECHECK_TICKS;
}

// turn on the spot until he faces the next waypoint, then drive
function drive(entity, state, speed) {
    if (!state.destination) return false;
    const { next } = state.nav.peek(entity, state.destination);
    if (!next) return false;
    const desired = yawToward(entity.location, { x: next.x + 0.5, z: next.z + 0.5 });
    const diff = deltaAngle(state.yaw, desired);
    if (Math.abs(diff) < FACING_TOLERANCE) {
        state.yaw = desired;
        return state.nav.glide(entity, state.destination, speed, state.yaw);
    }
    state.yaw += Math.sign(diff) * Math.min(Math.abs(diff), TURN_DEGREES_PER_TICK);
    try { entity.setRotation({ x: 0, y: state.yaw }); } catch { }
    return false;
}

// pins the player 3 units in front of him, square to the way he's facing (the hugging move in PlayerScript)
function hug(entity, state, player) {
    const radians = state.yaw * Math.PI / 180;
    const forward = { x: Math.round(-Math.sin(radians)), z: Math.round(Math.cos(radians)) };
    const destination = {
        x: entity.location.x + forward.x * HUG_OFFSET,
        y: player.location.y,
        z: entity.location.z + forward.z * HUG_OFFSET
    };
    try { player.teleport(destination, { keepVelocity: false }); } catch { }
}

function updateMotor(entity, state, tick, speed) {
    if (tick < state.motorNextAt) return;
    const pitch = Math.min(2, 1 + speed * 20 / 4);
    try { entity.dimension.playSound(MOTOR_SOUND, entity.location, { pitch }); } catch { }
    state.motorNextAt = tick + Math.round(MOTOR_TICKS / pitch);
}

function crazyTick(entity, state, tick) {
    if (tick >= state.crazyRecheckAt) {
        wander(entity, state, tick);
        state.crazyRecheckAt = tick + CRAZY_RECHECK_TICKS;
    }
    state.yaw += TURN_DEGREES_PER_TICK * (Math.random() * 20 - 10);
    if (!state.destination || !state.nav.glide(entity, state.destination, CRAZY_SPEED, state.yaw)) {
        try { entity.setRotation({ x: 0, y: state.yaw }); } catch { }
    }
    smashTouchedWindows(entity, 0.8);
}

function tick(entity, state, ctx) {
    const moved = state.lastLocation
        ? Math.hypot(entity.location.x - state.lastLocation.x, entity.location.z - state.lastLocation.z)
        : 0;
    state.lastLocation = { ...entity.location };
    updateMotor(entity, state, ctx.tick, moved);

    if (ctx.tick < state.crazyUntil) {
        crazyTick(entity, state, ctx.tick);
        return;
    }

    const players = ctx.players(entity.dimension).filter(isTargetablePlayer);
    let seen;
    let seenDistance = Infinity;
    for (const player of players) {
        if (!state.sight.check(player.id, ctx.tick, () => canSee(entity, player))) continue;
        const distance = distanceSquared(entity.location, player.location);
        if (distance < seenDistance) {
            seen = player;
            seenDistance = distance;
        }
    }

    let speed = NORMAL_SPEED;
    if (seen) {
        if (!state.playerSeen) speak(entity, state, FOUND_LINE, ctx.tick);
        state.playerSeen = true;
        if (state.targetId !== seen.id) state.nav.reset();
        state.targetId = seen.id;
        state.destination = { ...seen.location };
        state.cooldownUntil = ctx.tick + TARGET_COOLDOWN_TICKS;
        speed = RUN_SPEED;
    } else if (state.playerSeen && ctx.tick >= state.cooldownUntil) {
        // lost sight of them: back to wandering (his "lost you" line stays silent)
        state.playerSeen = false;
        wander(entity, state, ctx.tick);
    } else if ((!state.destination && ctx.tick >= state.cooldownUntil) || (state.destination && ctx.tick >= state.cooldownUntil && moved < 0.05
        && distanceSquared(entity.location, state.destination) < ARRIVE_DISTANCE_SQUARED)) {
        wander(entity, state, ctx.tick);
    }

    if (!drive(entity, state, speed) && state.nav.finished && ctx.tick >= state.cooldownUntil && !seen) {
        wander(entity, state, ctx.tick);
    }

    // hugging: only while he's on the move and not being sprayed back by a BSODA
    if (moved <= HUG_MIN_SPEED || isCharacterControlled(entity)) return;
    for (const player of players) {
        if (distanceSquared(entity.location, player.location) <= TOUCH_DISTANCE_SQUARED) hug(entity, state, player);
    }
}

function nearestPrizeInView(player) {
    try {
        const hits = player.getEntitiesFromViewDirection({ maxDistance: HAMMER_REACH, type: TYPE_ID });
        return hits[0]?.entity;
    } catch {
        return undefined;
    }
}

const prizeStates = new Map();

function hammer(entity) {
    const state = prizeStates.get(entity?.id);
    if (!state || gameTick() < state.crazyUntil) return;
    goCrazy(entity, state, gameTick());
}

// using the hammer on him (looking at him within reach, or right-clicking him)
world.afterEvents.itemUse.subscribe(({ itemStack, source }) => {
    if (itemStack.typeId !== HAMMER_ID || !source) return;
    hammer(nearestPrizeInView(source));
});

world.afterEvents.playerInteractWithEntity.subscribe(({ target, itemStack }) => {
    if (target?.typeId !== TYPE_ID || itemStack?.typeId !== HAMMER_ID) return;
    hammer(target);
});

registerCharacter({
    typeId: TYPE_ID,
    scriptEventId: TYPE_ID,
    createState(entity) {
        const state = {
            // his spots are up to 30 blocks off, so the search area reaches a bit further than the default
            nav: new Navigator({ doorHeight: 2, maxDistance: 64 }),
            sight: new SightMemo(SIGHT_CHECK_TICKS),
            yaw: entity.getRotation().y,
            destination: undefined,
            targetId: undefined,
            playerSeen: false,
            cooldownUntil: 0,
            voiceUntil: 0,
            crazyUntil: 0,
            crazyRecheckAt: 0,
            motorNextAt: 0,
            lastLocation: undefined
        };
        prizeStates.set(entity.id, state);
        return state;
    },
    tick,
    onRemove(state) {
        for (const [id, entry] of prizeStates) if (entry === state) prizeStates.delete(id);
    },
    onAction(entity, state, action) {
        if (action === "crazy") goCrazy(entity, state, gameTick());
        else if (action === "calm") state.crazyUntil = 0;
    }
});
