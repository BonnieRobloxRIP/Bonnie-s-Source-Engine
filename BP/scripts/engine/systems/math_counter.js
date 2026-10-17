import { world } from "@minecraft/server";
import { getEntitiesOfClass, markEntityDirty, onEntityDataUpdated } from "../registry.js";
import { fireOutput, registerInputHandlers } from "../io.js";

// SECTION: math_counter
// Holds a number, changed through inputs, with Source's semantics: when Minimum or Maximum is not 0
// the value is clamped, OnHitMin / OnHitMax fire when it reaches a limit and OnChangedFromMin /
// OnChangedFromMax when it leaves one; OutValue fires with the new value after every change.
//
// Bedrock addition: the value can be mirrored into a scoreboard objective so commands
// (/execute if score, /scoreboard players test...) can read it.
//
// The current value lives in data.runtime and is saved with the world; saving the form resets it
// to the Initial value.

const MATH_COUNTER = "brr:math_counter_block";

function toNumber(value, fallback) {
    const parsed = Number.parseFloat(`${value ?? ""}`);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function getLimits(entity) {
    const min = toNumber(entity.data.min, 0);
    const max = toNumber(entity.data.max, 0);
    return { min, max, bounded: min !== 0 || max !== 0 };
}

// Like Source's Spawn: the initial value is clamped into the limits; the hit flags start false.
function getRuntime(entity) {
    if (!entity.data.runtime || typeof entity.data.runtime !== "object") {
        const { min, max, bounded } = getLimits(entity);
        const start = toNumber(entity.data.startValue, 0);
        entity.data.runtime = { value: bounded ? Math.min(max, Math.max(min, start)) : start, hitMin: false, hitMax: false };
    }
    return entity.data.runtime;
}

export function getCounterValue(entity) {
    return getRuntime(entity).value;
}

// SECTION: Scoreboard Mirror
function syncScoreboard(entity) {
    const objectiveName = `${entity.data.scoreObjective ?? ""}`.trim();
    if (!objectiveName) return;
    const holder = `${entity.data.scoreHolder ?? ""}`.trim() || `${entity.data.name ?? ""}`.trim();
    if (!holder) return;

    try {
        const objective = world.scoreboard.getObjective(objectiveName)
            ?? world.scoreboard.addObjective(objectiveName, objectiveName);
        objective.setScore(holder, Math.round(getCounterValue(entity)));
    } catch (error) {
        console.warn(`[BSE] math_counter could not set score ${objectiveName}/${holder}: ${error}`);
    }
}

// SECTION: Value Updates
function store(entity, value) {
    getRuntime(entity).value = value;
    markEntityDirty(entity);
    syncScoreboard(entity);
}

// Source's UpdateOutValue: clamp, fire limit outputs on the edges, then OutValue.
function updateValue(entity, value, activator) {
    const runtime = getRuntime(entity);
    const { min, max, bounded } = getLimits(entity);
    let next = value;

    if (bounded) {
        if (next >= max) {
            next = max;
            if (!runtime.hitMax) {
                runtime.hitMax = true;
                fireOutput(entity, "OnHitMax", activator, entity);
            }
        } else if (runtime.hitMax) {
            runtime.hitMax = false;
            fireOutput(entity, "OnChangedFromMax", activator, entity);
        }

        if (next <= min) {
            next = min;
            if (!runtime.hitMin) {
                runtime.hitMin = true;
                fireOutput(entity, "OnHitMin", activator, entity);
            }
        } else if (runtime.hitMin) {
            runtime.hitMin = false;
            fireOutput(entity, "OnChangedFromMin", activator, entity);
        }
    }

    store(entity, next);
    fireOutput(entity, "OutValue", activator, entity, { value: next });
}

function setValueNoFire(entity, value) {
    const { min, max, bounded } = getLimits(entity);
    store(entity, bounded ? Math.min(max, Math.max(min, value)) : value);
}

function setLimit(entity, key, value) {
    entity.data[key] = `${value}`;
    // Keep min <= max, as Source does.
    const { min, max } = getLimits(entity);
    if (key === "max" && max < min) entity.data.min = `${max}`;
    if (key === "min" && min > max) entity.data.max = `${min}`;
    markEntityDirty(entity);
}

// Wraps an input that changes the value: ignored while disabled or with a non-numeric parameter.
function numericInput(apply) {
    return (entity, param, context) => {
        if (entity.disabled) return;
        const amount = toNumber(param, NaN);
        if (!Number.isFinite(amount)) {
            console.warn(`[BSE] math_counter '${entity.data.name ?? entity.id}' ignored non-numeric parameter '${param}'.`);
            return;
        }
        apply(entity, amount, context.activator);
    };
}

registerInputHandlers(MATH_COUNTER, {
    Add: numericInput((entity, amount, activator) => updateValue(entity, getCounterValue(entity) + amount, activator)),
    Subtract: numericInput((entity, amount, activator) => updateValue(entity, getCounterValue(entity) - amount, activator)),
    Multiply: numericInput((entity, amount, activator) => updateValue(entity, getCounterValue(entity) * amount, activator)),
    Divide: numericInput((entity, amount, activator) => {
        if (amount === 0) {
            console.warn(`[BSE] math_counter '${entity.data.name ?? entity.id}' ignored Divide by zero.`);
            return;
        }
        updateValue(entity, getCounterValue(entity) / amount, activator);
    }),
    SetValue: numericInput((entity, amount, activator) => updateValue(entity, amount, activator)),
    SetValueNoFire: numericInput((entity, amount) => setValueNoFire(entity, amount)),
    SetHitMin: numericInput((entity, amount, activator) => {
        setLimit(entity, "min", amount);
        updateValue(entity, getCounterValue(entity), activator);
    }),
    SetHitMax: numericInput((entity, amount, activator) => {
        setLimit(entity, "max", amount);
        updateValue(entity, getCounterValue(entity), activator);
    }),
    SetMinValueNoFire: numericInput((entity, amount) => setLimit(entity, "min", amount)),
    SetMaxValueNoFire: numericInput((entity, amount) => setLimit(entity, "max", amount)),
    GetValue: (entity, param, context) => {
        fireOutput(entity, "OnGetValue", context.activator, entity, { value: getCounterValue(entity) });
    }
});

// SECTION: Startup & Edits
onEntityDataUpdated(entity => {
    if (entity.typeId === MATH_COUNTER) syncScoreboard(entity);
});

// Called once after the registry loads, so scoreboards match the saved values.
export function syncAllCounters() {
    for (const entity of getEntitiesOfClass(MATH_COUNTER)) syncScoreboard(entity);
}
