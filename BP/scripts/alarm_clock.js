import { system, world } from "@minecraft/server";
import { emitSound } from "./characters/registry.js";
import { isPaused } from "./core/pause.js";

export const ALARM_ITEM_ID = "brr:item_alarm";
const ALARM_ENTITY_ID = "brr:alarm_clock";
const REMAINING_KEY = "brr:alarm_remaining";
const STEP_TICKS = 15 * 20;
const STEPS = 4;
const RING_TICKS = 60;
const RING_SOUND_INTERVAL = 20;

// entity id -> { entity, remaining } ; remaining <= 0 means ringing, counting down to -RING_TICKS
const clocks = new Map();

function stepOf(remaining) {
    return Math.min(STEPS, Math.max(1, Math.ceil(remaining / STEP_TICKS)));
}

function showFrame(entity, remaining) {
    const frame = stepOf(remaining) - 1;
    try {
        if (entity.getProperty("brr:frame") !== frame) entity.setProperty("brr:frame", frame);
    } catch { }
}

function track(entity, remaining) {
    clocks.set(entity.id, { entity, remaining });
    showFrame(entity, remaining);
}

export function placeAlarmClock(player) {
    const { x, y, z } = player.location;
    let entity;
    try {
        entity = player.dimension.spawnEntity(ALARM_ENTITY_ID, { x, y, z });
    } catch {
        return false;
    }
    entity.setDynamicProperty(REMAINING_KEY, STEP_TICKS);
    track(entity, STEP_TICKS);
    player.dimension.playSound("item.alarm_wind", entity.location);
    return true;
}

function windClock(entity) {
    let state = clocks.get(entity.id);
    if (!state) {
        state = { entity, remaining: entity.getDynamicProperty(REMAINING_KEY) ?? STEP_TICKS };
        clocks.set(entity.id, state);
    }
    // a ringing clock wraps to the first step again
    const current = state.remaining > 0 ? stepOf(state.remaining) : STEPS;
    state.remaining = (current % STEPS + 1) * STEP_TICKS;
    entity.setDynamicProperty(REMAINING_KEY, state.remaining);
    showFrame(entity, state.remaining);
    entity.dimension.playSound("item.alarm_wind", entity.location);
}

function tickClocks() {
    if (clocks.size === 0 || isPaused()) return;
    for (const [id, state] of clocks) {
        const { entity } = state;
        if (!entity.isValid) {
            clocks.delete(id);
            continue;
        }
        state.remaining--;
        if (state.remaining > 0) {
            if (state.remaining % 20 === 0) {
                entity.dimension.playSound("item.alarm_tick", entity.location);
                entity.setDynamicProperty(REMAINING_KEY, state.remaining);
                showFrame(entity, state.remaining);
            }
            continue;
        }
        const ringing = -state.remaining;
        if (ringing % RING_SOUND_INTERVAL === 0) {
            if (ringing === 0) entity.dimension.playSound("item.alarm_bell", entity.location);
            emitSound(entity.dimension, entity.location, entity);
        }
        if (ringing >= RING_TICKS) {
            clocks.delete(id);
            try { entity.remove(); } catch { }
        }
    }
}

function rediscover() {
    for (const dimensionId of ["overworld", "nether", "the_end"]) {
        let entities = [];
        try { entities = world.getDimension(dimensionId).getEntities({ type: ALARM_ENTITY_ID }); } catch { }
        for (const entity of entities) {
            if (clocks.has(entity.id)) continue;
            track(entity, entity.getDynamicProperty(REMAINING_KEY) ?? STEP_TICKS);
        }
    }
}

export function startAlarmClocks() {
    world.afterEvents.playerInteractWithEntity.subscribe(({ target }) => {
        if (target?.typeId === ALARM_ENTITY_ID && target.isValid) windClock(target);
    });
    world.afterEvents.entityLoad?.subscribe(({ entity }) => {
        if (entity?.typeId === ALARM_ENTITY_ID && !clocks.has(entity.id)) {
            track(entity, entity.getDynamicProperty(REMAINING_KEY) ?? STEP_TICKS);
        }
    });
    system.runTimeout(rediscover, 1);
    system.runInterval(tickClocks, 1);
}
