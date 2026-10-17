import { world } from "@minecraft/server";
import { AIR, isPassableDecorType } from "../core/block_cache.js";
import { distanceSquared } from "../core/math.js";
import { gameTick } from "../core/pause.js";
import { isBigDoorType } from "../doors.js";
import { firePintoShot } from "../item_functionality.js";
import { Animator } from "./animator.js";
import { Navigator, pickWanderGoal, WANDER_RETRY_TICKS } from "./navigation.js";
import { hasLineOfSight, isTargetablePlayer } from "./perception.js";
import { registerCharacter } from "./registry.js";

const TYPE_ID = "brr:pinto_beans";
const WANDER_SPEED = 0.13;
const SIGHT_RANGE_SQUARED = 36 * 36;
const SCAN_INTERVAL_TICKS = 2;
const WATCH_TICKS = 4 * 20;
// reload.ogg is ~1.22 s; the shot goes off once he's done racking it
const RELOAD_TICKS = 25;
const COOLDOWN_TICKS = 30 * 20;

function play(entity, id) {
    try { entity.dimension.playSound(id, entity.location); } catch { }
}

function blocksSight(typeId) {
    return typeId !== undefined && typeId !== AIR && !isBigDoorType(typeId)
        && !isPassableDecorType(typeId) && !typeId.includes("window");
}

function canSee(entity, player) {
    const from = entity.location;
    const to = player.location;
    if (distanceSquared(from, to) > SIGHT_RANGE_SQUARED) return false;
    return hasLineOfSight(entity.dimension,
        { x: from.x, y: from.y + 1.4, z: from.z },
        { x: to.x, y: to.y + 1.5, z: to.z },
        blocksSight);
}

// only ever players; Raldi just happens to get in the way of the bullet sometimes
function findTarget(entity, state, ctx) {
    for (const player of ctx.players(entity.dimension)) {
        if (!isTargetablePlayer(player) || (state.cooldowns.get(player.id) ?? 0) > ctx.tick) continue;
        if (canSee(entity, player)) return player;
    }
    return undefined;
}

function animate(state, name) {
    if (state.animator.name !== name) state.animator.play(name);
}

function toWander(state) {
    state.mode = "wander";
    state.targetId = undefined;
    state.lastKnown = undefined;
    state.wander = undefined;
    state.nav.reset();
}

// a spot he couldn't walk to (or no spot at all) is given a moment before he picks another
function wanderTick(entity, state, tick) {
    animate(state, "walk");
    if (!state.wander) {
        if (tick < state.wanderRetryAt) return;
        state.wander = pickWanderGoal(entity, 8, 20);
        state.nav.reset();
        if (!state.wander) {
            state.wanderRetryAt = tick + WANDER_RETRY_TICKS;
            return;
        }
    }
    if (!state.nav.glide(entity, state.wander, WANDER_SPEED)) {
        if (!state.nav.complete) state.wanderRetryAt = tick + WANDER_RETRY_TICKS;
        state.wander = undefined;
    }
}

function startWatch(entity, state, player, tick) {
    state.mode = "watch";
    state.targetId = player.id;
    state.lastKnown = { ...player.location };
    state.reloadAt = tick + WATCH_TICKS;
    state.nav.reset();
    animate(state, "idle");
    play(entity, "pinto_watch");
}

function currentTarget(entity, state) {
    const player = state.targetId ? world.getEntity(state.targetId) : undefined;
    if (player?.isValid && player.dimension.id === entity.dimension.id) {
        state.lastKnown = { ...player.location };
        return player;
    }
    return undefined;
}

function aimTick(entity, state, ctx) {
    animate(state, "idle");
    const player = currentTarget(entity, state);
    if (state.mode === "watch") {
        if (ctx.tick < state.reloadAt) return;
        state.mode = "reload";
        state.fireAt = ctx.tick + RELOAD_TICKS;
        play(entity, "reload");
        return;
    }
    if (ctx.tick < state.fireAt) return;
    firePintoShot(entity, player ?? { location: state.lastKnown });
    if (state.targetId) state.cooldowns.set(state.targetId, ctx.tick + COOLDOWN_TICKS);
    toWander(state);
}

registerCharacter({
    typeId: TYPE_ID,
    scriptEventId: TYPE_ID,
    createState(entity) {
        // sheet frame 0 is his standing pose, frames 1..7 the walk cycle (offset in the render controller)
        const animator = new Animator(entity, {
            idle: { visual: 0 },
            walk: { visual: 1, frames: 7, interval: 2 }
        });
        animator.play("idle");
        return {
            animator,
            nav: new Navigator({ doorHeight: 2 }),
            mode: "wander",
            wander: undefined,
            wanderRetryAt: 0,
            targetId: undefined,
            lastKnown: undefined,
            reloadAt: 0,
            fireAt: 0,
            cooldowns: new Map()
        };
    },
    tick(entity, state, ctx) {
        state.animator.update(ctx.tick);
        if (state.mode === "watch" || state.mode === "reload") {
            aimTick(entity, state, ctx);
            return;
        }
        if (ctx.tick % SCAN_INTERVAL_TICKS === 0) {
            const player = findTarget(entity, state, ctx);
            if (player) {
                startWatch(entity, state, player, ctx.tick);
                return;
            }
        }
        wanderTick(entity, state, ctx.tick);
    },
    onAction(entity, state, action) {
        if (action === "reset") toWander(state);
    }
});
