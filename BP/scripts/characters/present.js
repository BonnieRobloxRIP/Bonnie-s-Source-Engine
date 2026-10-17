import { distanceSquared } from "../core/math.js";
import { gameTick } from "../core/pause.js";
import { isBigDoorType } from "../doors.js";
import { giveReward } from "./mrbeast.js";
import { Navigator, pickWanderGoal, WANDER_RETRY_TICKS } from "./navigation.js";
import { registerCharacter } from "./registry.js";

const PRESENT_ID = "brr:present";
const HIDDEN_TICKS_PROPERTY = "brr:present_hidden_ticks";
const RETURN_TICKS = 60 * 20;
const CONTACT_DISTANCE_SQUARED = 1.5 * 1.5;

function chooseWanderTarget(entity, state) {
    state.wander = pickWanderGoal(entity, 8, 20, { doorFilter: isBigDoorType });
    state.nav.reset();
}

// a spot it couldn't get to (or no spot at all) is given a moment before it picks another
function wander(entity, state, tick) {
    if (!state.wander) {
        if (tick < state.wanderRetryAt) return;
        chooseWanderTarget(entity, state);
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

function hide(entity, player, state, tick) {
    player.playSound("present");
    giveReward(player);
    state.hiddenUntil = tick + RETURN_TICKS;
    state.wander = undefined;
    state.nav.reset();
    entity.setDynamicProperty(HIDDEN_TICKS_PROPERTY, RETURN_TICKS);
    entity.triggerEvent("brr:present_hide");
}

registerCharacter({
    typeId: PRESENT_ID,
    createState(entity) {
        const now = gameTick();
        const hiddenTicks = Math.max(0, entity.getDynamicProperty(HIDDEN_TICKS_PROPERTY) ?? 0);
        const hiddenUntil = hiddenTicks > 0 ? now + hiddenTicks : 0;
        if (hiddenUntil > 0) entity.triggerEvent("brr:present_hide");
        else if (entity.getProperty("brr:hidden") === 1) entity.triggerEvent("brr:present_show");
        return {
            nav: new Navigator({ doorFilter: isBigDoorType, doorHeight: 3 }),
            wander: undefined,
            wanderRetryAt: 0,
            hiddenUntil,
            touchingPlayers: new Set()
        };
    },
    tick(entity, state, ctx) {
        if (state.hiddenUntil > 0 && ctx.tick >= state.hiddenUntil) {
            state.hiddenUntil = 0;
            entity.setDynamicProperty(HIDDEN_TICKS_PROPERTY, 0);
            entity.triggerEvent("brr:present_show");
        } else if (state.hiddenUntil > 0 && ctx.tick % 20 === 0) {
            entity.setDynamicProperty(HIDDEN_TICKS_PROPERTY, state.hiddenUntil - ctx.tick);
        }

        wander(entity, state, ctx.tick);
        const nearbyPlayers = ctx.players(entity.dimension).filter(
            (candidate) => distanceSquared(entity.location, candidate.location) <= CONTACT_DISTANCE_SQUARED
        );
        const player = state.hiddenUntil > 0
            ? undefined
            : nearbyPlayers.find((candidate) => !state.touchingPlayers.has(candidate.id));
        state.touchingPlayers = new Set(nearbyPlayers.map((candidate) => candidate.id));
        if (player) hide(entity, player, state, ctx.tick);
    }
});
