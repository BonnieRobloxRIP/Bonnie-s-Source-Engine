import { AIR, isPassableDecorType } from "../core/block_cache.js";
import { NOTEBOOK_GOAL } from "../core/game_state.js";
import { distanceSquared } from "../core/math.js";
import { gameTick } from "../core/pause.js";
import { highestScore } from "../core/scoreboard.js";
import { smashTouchedWindows } from "../core/windows.js";
import { isBigDoorType } from "../doors.js";
import { LONG_RANGE, Navigator, pickWanderGoal, WANDER_RETRY_TICKS } from "./navigation.js";
import { hasLineOfSight, isTargetablePlayer } from "./perception.js";
import { registerCharacter } from "./registry.js";

// Neil, notebook-collecting phase only (neil mode's BaldiScript in Neil's pose; the boss fight isn't
// ported). He moves in Raldi's bursts: a short dash, then a wait that shrinks as he gets angrier, and
// his anger grows with every notebook. He chases anyone he sees and follows noises, bathrooms
// included, and touching him is the end: no crackpipe or monke saves you. Two glock bullets (then 4,
// 6, ...) knock him out for 10 s. Spawn egg only for now; he's active as soon as he exists.
// 10 Unity units = 3 blocks.

const TYPE_ID = "brr:neil";
const DEAD_PROPERTY = "brr:dead";
const NOTEBOOK_OBJECTIVE = "notebooks";
// Move(): `speed` (100 in neil mode) for 10 FixedUpdates = 20 units, spread over 4 ticks
const DASH_TICKS = 4;
const DASH_SPEED = 1.5;
// anger starts at 1 (GetAngry(1)) and every closed Neil book adds 1.5
const BASE_ANGER = 1;
const ANGER_PER_NOTEBOOK = 1.5;
// baldiSpeedScale is an inspector value; 1 gives his wait 2 s at the start, ~0.36 s at 10 books
const SPEED_SCALE = 1;
const CATCH_DISTANCE_SQUARED = 1.5 * 1.5;
const ARRIVE_DISTANCE_SQUARED = 1;
const WANDER_MIN = 8;
const WANDER_MAX = 30;
// Kill(10f) after a glock kill
const GLOCK_DEAD_TICKS = 200;
const EXPLODE_DEAD_TICKS = 300;
// NeilVoicelineCheck: a random line every 60-120 s
const VOICE_MIN_TICKS = 1200;
const VOICE_MAX_TICKS = 2400;
// Hear() priorities
const DOOR_PRIORITY = 1;
const LOUD_PRIORITY = 8;

function randomBetween(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

function blocksSight(typeId) {
    return typeId !== undefined && typeId !== AIR && !isBigDoorType(typeId) && !isPassableDecorType(typeId) && !typeId.includes("window");
}

// unlimited range like the original's raycast; he looks every other tick (lookForPlayers)
function canSee(entity, player) {
    const from = entity.location;
    const to = player.location;
    return hasLineOfSight(
        entity.dimension,
        { x: from.x, y: from.y + 0.6, z: from.z },
        { x: to.x, y: to.y + 1.4, z: to.z },
        blocksSight
    );
}

function setDead(entity, state, dead) {
    const value = dead ? 1 : 0;
    if (state.shownDead === value) return;
    try { entity.setProperty(DEAD_PROPERTY, value); state.shownDead = value; } catch { }
}

// baldiWait = -3 * anger / (anger + 2 / baldiSpeedScale) + 3, divided by Random.Range(1, 2)
function waitTicks(ctx, entity) {
    const notebooks = Math.min(NOTEBOOK_GOAL, highestScore(ctx.players(entity.dimension), NOTEBOOK_OBJECTIVE));
    const anger = BASE_ANGER + ANGER_PER_NOTEBOOK * notebooks;
    const wait = -3 * anger / (anger + 2 / SPEED_SCALE) + 3;
    return Math.max(1, Math.round(wait / (1 + Math.random()) * 20));
}

// TargetPlayer: chases the nearest player he can see, and forgets any noise he was following
function lookForPlayers(entity, state, ctx) {
    let nearest;
    let nearestDistance = Infinity;
    for (const player of ctx.players(entity.dimension)) {
        if (!isTargetablePlayer(player) || !canSee(entity, player)) continue;
        const distance = distanceSquared(entity.location, player.location);
        if (distance < nearestDistance) {
            nearest = player;
            nearestDistance = distance;
        }
    }
    if (!nearest) return;
    state.destination = { ...nearest.location };
    state.destinationKind = "player";
    state.leadPriority = 0;
}


function catchPlayers(entity, ctx) {
    for (const player of ctx.players(entity.dimension)) {
        if (!isTargetablePlayer(player) || distanceSquared(entity.location, player.location) > CATCH_DISTANCE_SQUARED) continue;
        try { player.playSound("neil.death"); } catch { }
        player.kill();
    }
}

function arrived(entity, state) {
    if (state.destinationKind === "lead") state.leadPriority = 0;
    state.destination = undefined;
    state.destinationKind = undefined;
}

function tick(entity, state, ctx) {
    if (state.deadUntil > ctx.tick) return;
    if (state.deadUntil) {
        state.deadUntil = 0;
        setDead(entity, state, false);
    }

    if (ctx.tick >= state.voiceAt) {
        try { entity.dimension.playSound("neil.random", entity.location); } catch { }
        state.voiceAt = ctx.tick + randomBetween(VOICE_MIN_TICKS, VOICE_MAX_TICKS);
    }

    catchPlayers(entity, ctx);
    if (ctx.tick % 2 === 0) lookForPlayers(entity, state, ctx);

    if (state.dashLeft > 0) {
        if (!state.destination && ctx.tick >= state.wanderRetryAt) {
            state.destination = pickWanderGoal(entity, WANDER_MIN, WANDER_MAX);
            state.destinationKind = state.destination && "wander";
            state.nav.reset();
            if (!state.destination) state.wanderRetryAt = ctx.tick + WANDER_RETRY_TICKS;
        }
        if (state.destination) {
            const moved = state.nav.glide(entity, state.destination, DASH_SPEED);
            smashTouchedWindows(entity, 0.6);
            // a wander spot he couldn't get to at all is given a moment before he picks another
            if (!moved && state.destinationKind === "wander" && !state.nav.complete) state.wanderRetryAt = ctx.tick + WANDER_RETRY_TICKS;
            if (!moved || distanceSquared(entity.location, state.destination) < ARRIVE_DISTANCE_SQUARED) arrived(entity, state);
        }
        state.dashLeft--;
        return;
    }
    if (ctx.tick >= state.nextDashAt) {
        state.dashLeft = DASH_TICKS;
        state.nextDashAt = ctx.tick + DASH_TICKS + waitTicks(ctx, entity);
    }
}

function onHit(entity, state, kind, source, tick) {
    if (state.deadUntil > tick) return false;
    if (kind === "firework") {
        die(entity, state, tick, EXPLODE_DEAD_TICKS);
        return true;
    }
    if (kind !== "glock") return false;
    state.hits++;
    if (state.hits < state.hitsRequired) return true;
    die(entity, state, tick, GLOCK_DEAD_TICKS);
    state.hits = 0;
    state.hitsRequired = state.timesKilled * 2;
    return true;
}

function die(entity, state, tick, ticks) {
    state.timesKilled++;
    state.deadUntil = tick + ticks;
    state.dashLeft = 0;
    state.destination = undefined;
    state.nav.reset();
    setDead(entity, state, true);
}

// Hear(): a noise only pulls him if it's at least as loud as the one he's already following
// (spotting a player resets that to 0, and sight wins again on his next look)
function hear(entity, state, location, priority) {
    if (priority < state.leadPriority) return;
    state.destination = { ...location };
    state.destinationKind = "lead";
    state.leadPriority = priority;
    state.nav.reset();
}

registerCharacter({
    typeId: TYPE_ID,
    scriptEventId: TYPE_ID,
    createState(entity) {
        const state = {
            // he follows noises and players anywhere in the school
            nav: new Navigator({ doorHeight: 3, ...LONG_RANGE }),
            destination: undefined,
            wanderRetryAt: 0,
            destinationKind: undefined,
            leadPriority: 0,
            dashLeft: 0,
            nextDashAt: 0,
            deadUntil: 0,
            hits: 0,
            hitsRequired: 2,
            timesKilled: 1,
            voiceAt: gameTick() + randomBetween(VOICE_MIN_TICKS, VOICE_MAX_TICKS),
            shownDead: undefined
        };
        setDead(entity, state, false);
        return state;
    },
    tick,
    onHit,
    onSound(entity, state, { location, source }) {
        hear(entity, state, location, source?.typeId === "brr:alarm_clock" ? LOUD_PRIORITY : DOOR_PRIORITY);
    },
    onEvent(entity, state, name, { location }) {
        if (name === "jail") hear(entity, state, location, LOUD_PRIORITY);
    },
    onAction(entity, state, action) {
        if (action === "revive" && state.deadUntil) state.deadUntil = gameTick();
    }
});
