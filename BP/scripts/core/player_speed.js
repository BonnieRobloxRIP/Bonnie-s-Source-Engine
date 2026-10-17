import { system, world } from "@minecraft/server";

// A player's walk speed is the stamina system's speed (main.js swaps it through component groups)
// scaled by every active factor, so separate effects (Pinto Beans, holding in a poop, the
// Monkenator) stack instead of overwriting each other.
// player id -> { player, factors: Map<key, factor>, product, base, applied, movement }
const states = new Map();
const EPSILON = 0.000001;

function product(state) {
    let value = 1;
    for (const factor of state.factors.values()) value *= factor;
    return value;
}

// a value we didn't write means a stamina group swap reset the attribute: that's the new base.
// The component handle and the factor product are kept between ticks, so an unchanged speed
// costs one attribute read and no write.
function apply(state) {
    if (!state.movement?.isValid) state.movement = state.player.getComponent("minecraft:movement");
    const movement = state.movement;
    if (!movement) return;
    const current = movement.currentValue;
    if (state.applied === undefined || Math.abs(current - state.applied) > EPSILON) state.base = current;
    state.applied = state.base * state.product;
    if (Math.abs(current - state.applied) > EPSILON) movement.setCurrentValue(state.applied);
}

// factor undefined (or 1) removes the effect under `key`
export function setSpeedFactor(player, key, factor) {
    let state = states.get(player.id);
    if (factor === undefined || factor === 1) {
        if (!state?.factors.delete(key)) return;
    } else {
        if (!state) {
            state = { player, factors: new Map(), product: 1, base: undefined, applied: undefined, movement: undefined };
            states.set(player.id, state);
        }
        state.factors.set(key, factor);
    }
    state.product = product(state);
    if (state.player !== player) state.movement = undefined;
    state.player = player;
    try { apply(state); } catch { }
    if (state.factors.size === 0) states.delete(player.id);
}

// respawning resets the attribute, so the factors are put back
world.afterEvents.playerSpawn.subscribe(({ player }) => {
    const state = states.get(player.id);
    if (!state) return;
    state.player = player;
    state.applied = undefined;
    state.movement = undefined;
    try { apply(state); } catch { }
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => states.delete(playerId));

// every tick: a stamina group swap resets the attribute and the factors must go back on at once
system.runInterval(() => {
    if (states.size === 0) return;
    for (const [id, state] of states) {
        if (!state.player.isValid) continue;
        try { apply(state); }
        catch { states.delete(id); }
    }
}, 1);
