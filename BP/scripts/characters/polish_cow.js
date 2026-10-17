import { AIR, isPassableDecorType } from "../core/block_cache.js";
import { createMarkerType } from "../core/block_markers.js";
import { distanceSquared } from "../core/math.js";
import { gameTick } from "../core/pause.js";
import { isBigDoorType } from "../doors.js";
import { consumePolishMarker, oldestPolishMarker } from "../polish_marker.js";
import { Animator } from "./animator.js";
import { Navigator, pickWanderGoal, WANDER_RETRY_TICKS } from "./navigation.js";
import { hasLineOfSight, isTargetablePlayer } from "./perception.js";
import { registerCharacter } from "./registry.js";
import { SegmentedSound } from "./segmented_sound.js";

const COOLDOWN_TICKS = 1200;
const COOLDOWN_PROPERTY = "brr:cow_cooldown";
const destinations = createMarkerType("brr:polish_cow_player_tp", "brr:polish_cow_spots");

export function registerPolishCowComponents(registry) {
    registry.registerCustomComponent("brr:polish_cow_player_spot", destinations.component);
}

// sends the player to a random Polish Cow player teleport block, like being caught by the cow. returns success
export function teleportToRandomCowSpot(player) {
    const dimension = player.dimension;
    const spot = destinations.findRandom(dimension);
    if (!spot) {
        player.sendMessage({ translate: "brr.polish_cow.no_destination" });
        return false;
    }
    try {
        player.teleport({ x: spot.x + 0.5, y: spot.y, z: spot.z + 0.5 }, { dimension });
    } catch (error) {
        console.warn(`[polish_cow] Teleport failed: ${error}`);
        player.sendMessage({ translate: "brr.polish_cow.teleport_failed" });
        return false;
    }
    try { dimension.playSound("cow_teleport", { x: spot.x + 0.5, y: spot.y, z: spot.z + 0.5 }); } catch { }
    return true;
}

function blocksSight(typeId) {
    return typeId !== undefined && typeId !== AIR && !isBigDoorType(typeId)
        && !isPassableDecorType(typeId) && !typeId.includes("window");
}

function canSee(entity, player) {
    const from = entity.location;
    const to = player.location;
    return distanceSquared(from, to) <= 40 * 40
        && hasLineOfSight(entity.dimension,
            { x: from.x, y: from.y + 1.4, z: from.z },
            { x: to.x, y: to.y + 1.5, z: to.z },
            blocksSight);
}

function endChase(state) {
    state.targetId = undefined;
    state.wander = undefined;
    state.nav.reset();
}

function catchPlayer(entity, state, player, tick) {
    const marker = oldestPolishMarker(entity.dimension);
    const spot = marker ?? destinations.findRandom(entity.dimension);
    if (!spot) {
        if (tick >= state.nextWarningAt) {
            console.warn("[polish_cow] No Polish Cow teleport destination in this dimension");
            player.sendMessage({ translate: "brr.polish_cow.no_destination" });
            state.nextWarningAt = tick + 200;
        }
        return;
    }
    try {
        player.teleport({ x: spot.x + 0.5, y: spot.y, z: spot.z + 0.5 }, { dimension: entity.dimension });
    } catch (error) {
        if (tick >= state.nextWarningAt) {
            console.warn(`[polish_cow] Teleport failed: ${error}`);
            player.sendMessage({ translate: "brr.polish_cow.teleport_failed" });
            state.nextWarningAt = tick + 200;
        }
        return;
    }
    state.cooldownUntil = tick + COOLDOWN_TICKS;
    entity.setDynamicProperty(COOLDOWN_PROPERTY, COOLDOWN_TICKS);
    endChase(state);
    if (marker) consumePolishMarker(entity.dimension, marker);
    try { player.dimension.playSound("cow_teleport", player.location); }
    catch (error) { console.warn(`[polish_cow] Teleport sound failed: ${error}`); }
}

// a spot she couldn't walk to (or no spot at all) is given a moment before she picks another
function wander(entity, state, tick) {
    if (!state.wander) {
        if (tick < state.wanderRetryAt) return;
        state.wander = pickWanderGoal(entity, 8, 20);
        state.nav.reset();
        if (!state.wander) {
            state.wanderRetryAt = tick + WANDER_RETRY_TICKS;
            return;
        }
    }
    if (!state.nav.glide(entity, state.wander, 0.2)) {
        if (!state.nav.complete) state.wanderRetryAt = tick + WANDER_RETRY_TICKS;
        state.wander = undefined;
    }
}

registerCharacter({
    typeId: "brr:polish_cow",
    scriptEventId: "brr:polish_cow",
    createState(entity) {
        const now = gameTick();
        const animator = new Animator(entity, { dance: { visual: 0, frames: 21, interval: 2 } });
        animator.play("dance");
        const theme = new SegmentedSound("mus_cow", true);
        theme.start(now);
        return {
            animator, theme, nav: new Navigator({ doorHeight: 2 }),
            cooldownUntil: now + (entity.getDynamicProperty(COOLDOWN_PROPERTY) ?? 0),
            nextWarningAt: 0, targetId: undefined, wander: undefined, wanderRetryAt: 0, active: true,
            savedCooldown: undefined
        };
    },
    tick(entity, state, ctx) {
        try {
            state.animator.update(ctx.tick);
            state.theme.update(entity, ctx.tick);
            // written once a second while it counts down; a finished cooldown (0) only once
            if (ctx.tick % 20 === 0) {
                const cooldown = Math.max(0, state.cooldownUntil - ctx.tick);
                if (cooldown !== state.savedCooldown) {
                    entity.setDynamicProperty(COOLDOWN_PROPERTY, cooldown);
                    state.savedCooldown = cooldown;
                }
            }
            if (!state.active) return;
            if (ctx.tick < state.cooldownUntil) {
                wander(entity, state, ctx.tick);
                return;
            }
            const players = ctx.players(entity.dimension);
            let target = players.find((player) => player.id === state.targetId && isTargetablePlayer(player));
            if (state.targetId && !target) endChase(state);
            if (!target && ctx.tick % 2 === 0) {
                target = players.find((player) => isTargetablePlayer(player) && canSee(entity, player));
                if (target) {
                    state.targetId = target.id;
                    state.wander = undefined;
                    state.nav.reset();
                }
            }
            if (!target) {
                wander(entity, state, ctx.tick);
                return;
            }
            if (distanceSquared(entity.location, target.location) <= 1.5 * 1.5) {
                catchPlayer(entity, state, target, ctx.tick);
            } else {
                state.nav.glide(entity, target.location, 0.25);
            }
        } catch (error) {
            console.warn(`[polish_cow] Update failed for ${entity.id}: ${error}`);
        }
    },
    onAction(entity, state, action) {
        if (action === "stop") { state.active = false; endChase(state); }
        else if (action === "start") state.active = true;
        else if (action === "reset") {
            endChase(state);
            state.cooldownUntil = gameTick();
            entity.setDynamicProperty(COOLDOWN_PROPERTY, 0);
        }
    }
});
