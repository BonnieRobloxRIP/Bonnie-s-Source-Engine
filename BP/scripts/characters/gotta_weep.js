import { system } from "@minecraft/server";
import { distanceSquared } from "../core/math.js";
import { gameTick } from "../core/pause.js";
import { setSpeedFactor } from "../core/player_speed.js";
import { Navigator, pickWanderGoal } from "./navigation.js";
import { isTargetablePlayer } from "./perception.js";
import { registerCharacter, trackedCharacters } from "./registry.js";

// Gotta Weep (SweepScript.cs). He waits at home for 2-3 minutes, announces himself and sweeps through
// the hallways, then heads home and waits again. Anyone he runs into (players and characters alike) is
// carried along with him; a swept player keeps only 30% of their own walking.
// Speeds are blocks per tick; 10 Unity units = 3 blocks.

const TYPE_ID = "brr:gotta_weep";
const HOME_PROPERTY = "brr:home";
// agent speed is an inspector value in the original
const SPEED = 0.4;
// waitTime = Random.Range(120, 180)
const WAIT_MIN_TICKS = 2400;
const WAIT_MAX_TICKS = 3600;
// he heads home as soon as he picks his 5th spot
const WANDERS_PER_OUTING = 5;
const WANDER_COOLDOWN_TICKS = 20;
const STOPPED_SPEED = 0.005;
const TOUCH_DISTANCE_SQUARED = 1.2 * 1.2;
// moveDirection * 0.3 while being swept
const SWEPT_SPEED_FACTOR = 0.3;
// sweepingFailsave: a swept player stays slowed a second after the last contact
const SWEPT_GRACE_TICKS = 20;

// player id -> { player, until } for everyone currently slowed by a sweep
const swept = new Map();

function randomBetween(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}


function homeOf(entity) {
    let home;
    try { home = JSON.parse(entity.getDynamicProperty(HOME_PROPERTY) ?? "null"); } catch { }
    if (home) return home;
    home = { x: entity.location.x, y: entity.location.y, z: entity.location.z };
    try { entity.setDynamicProperty(HOME_PROPERTY, JSON.stringify(home)); } catch { }
    return home;
}

// a floor spot 10-35 blocks off; if none turns up he stands, and the cooldown paces the next try
function wander(entity, state, tick) {
    state.destination = pickWanderGoal(entity, 10, 35);
    state.nav.reset();
    state.cooldownUntil = tick + WANDER_COOLDOWN_TICKS;
    state.wanders++;
}

function goHome(state, tick) {
    state.destination = state.home;
    state.nav.reset();
    state.waitUntil = tick + randomBetween(WAIT_MIN_TICKS, WAIT_MAX_TICKS);
    state.wanders = 0;
    state.active = false;
}

function slowSwept(player, tick) {
    if (!swept.has(player.id)) setSpeedFactor(player, "sweep", SWEPT_SPEED_FACTOR);
    swept.set(player.id, { player, until: tick + SWEPT_GRACE_TICKS });
}

// runs on its own so nobody stays slowed if he unloads mid-sweep
function releaseSwept() {
    const tick = gameTick();
    for (const [id, entry] of swept) {
        if (entry.until > tick && entry.player.isValid) continue;
        if (entry.player.isValid) setSpeedFactor(entry.player, "sweep", undefined);
        swept.delete(id);
    }
}

// everyone he touches moves with him; a new contact gets his "gotta sweep" line
function sweep(entity, state, ctx, delta) {
    const touching = new Set();
    for (const player of ctx.players(entity.dimension)) {
        if (!isTargetablePlayer(player) || distanceSquared(entity.location, player.location) > TOUCH_DISTANCE_SQUARED) continue;
        touching.add(player.id);
        slowSwept(player, ctx.tick);
        if (delta) {
            const { x, y, z } = player.location;
            try { player.teleport({ x: x + delta.x, y, z: z + delta.z }, { keepVelocity: true }); } catch { }
        }
    }
    for (const other of trackedCharacters(entity.dimension, TYPE_ID)) {
        if (distanceSquared(entity.location, other.location) > TOUCH_DISTANCE_SQUARED) continue;
        touching.add(other.id);
        if (delta) {
            const { x, y, z } = other.location;
            try { other.teleport({ x: x + delta.x, y, z: z + delta.z }); } catch { }
        }
    }
    for (const id of touching) {
        if (state.touching.has(id)) continue;
        try { entity.dimension.playSound("weep.sweep", entity.location); } catch { }
        break;
    }
    state.touching = touching;
}

function tick(entity, state, ctx) {
    const before = { ...entity.location };

    if (!state.active && ctx.tick >= state.waitUntil) {
        state.active = true;
        state.wanders = 0;
        wander(entity, state, ctx.tick);
        try { entity.dimension.playSound("weep.intro", entity.location); } catch { }
    }

    if (state.destination) {
        const moving = state.nav.glide(entity, state.destination, SPEED);
        if (!moving && !state.active && state.destination === state.home) state.destination = undefined;
    }

    const delta = { x: entity.location.x - before.x, z: entity.location.z - before.z };
    const stopped = Math.hypot(delta.x, delta.z) <= STOPPED_SPEED;
    if (state.active) {
        if (state.wanders >= WANDERS_PER_OUTING) goHome(state, ctx.tick);
        else if (stopped && ctx.tick >= state.cooldownUntil) wander(entity, state, ctx.tick);
    }

    sweep(entity, state, ctx, stopped ? undefined : delta);
}

registerCharacter({
    typeId: TYPE_ID,
    scriptEventId: TYPE_ID,
    createState(entity) {
        return {
            // his spots are up to 35 blocks off, so the search area reaches a bit further than the default
            nav: new Navigator({ doorHeight: 2, maxDistance: 64 }),
            home: homeOf(entity),
            active: false,
            wanders: 0,
            destination: undefined,
            cooldownUntil: 0,
            waitUntil: gameTick() + randomBetween(WAIT_MIN_TICKS, WAIT_MAX_TICKS),
            touching: new Set()
        };
    },
    tick,
    onAction(entity, state, action) {
        const now = gameTick();
        if (action === "start") state.waitUntil = now;
        else if (action === "home") goHome(state, now);
    }
});

system.runInterval(releaseSwept, 5);
