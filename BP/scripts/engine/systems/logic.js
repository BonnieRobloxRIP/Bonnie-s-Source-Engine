import { system, world } from "@minecraft/server";
import { evaluateCondition } from "../../handler/core/condition_executer.js";
import {
    getEntitiesOfClass,
    getEntityById,
    getRegistryRevision,
    markEntityDirty,
    onEntityDisabledChanged
} from "../registry.js";
import { fireConnectionsByLabel, fireOutput, registerInputHandlers, runEntityCommand } from "../io.js";
import { entityOrigin, resolveSelectorPlayers } from "../selectors.js";
import { getDimensionPlayers as getPlayersIn, getEngineSettings, safeGetDimension } from "../runtime.js";
import { fireRelaySpawnOutputs } from "./relay.js";

// SECTION: Logic Entities
// Point entities that think on a timer. All timing uses system.currentTick, so a delay of N
// ticks is N game ticks no matter how often the think pass runs.

const AUTO = "brr:logic_auto_block";
const BRANCH = "brr:logic_branch_block";
const CASE = "brr:logic_case_block";
const COMPARE = "brr:logic_compare_block";
const COOP = "brr:logic_coop_manager_block";
const RANDOM = "brr:logic_random_outputs_block";
const TIMER = "brr:logic_timer_block";
const THINK_INTERVAL_TICKS = 2;

// Runtime state per entity id (not persisted, like Source's think state).
const states = new Map();
let mapSpawnDone = false;

function getState(entity, create) {
    let state = states.get(entity.id);
    if (!state) states.set(entity.id, state = create());
    return state;
}

function toBool(value) {
    if (typeof value === "boolean") return value;
    return /^(1|true|yes|on)$/i.test(`${value ?? ""}`.trim());
}

function toInt(value, fallback) {
    const parsed = Number.parseInt(`${value ?? ""}`, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

// Runs an entity's command and fires its "Run output" connection label, then the named output.
// A connection picked as the "Run output" that also listens to outputName fires only once.
function fireAction(entity, command, runOutputLabel, outputName, activator) {
    runEntityCommand(entity, command);
    const fired = runOutputLabel ? fireConnectionsByLabel(entity, runOutputLabel, activator) : undefined;
    if (outputName) fireOutput(entity, outputName, activator, entity, { skip: fired });
}

function getDimensionPlayers(entity) {
    return getPlayersIn(entity.dimension);
}

function evaluateForEntity(conditionData, entity) {
    const condition = conditionData.executeCondition || "noCondition";
    if (condition === "noCondition") return true;

    const players = getDimensionPlayers(entity);
    if (players.length === 0) return false;
    if (condition.startsWith("ifPlayer")) return players.some(player => evaluateCondition(conditionData, player, world));
    return evaluateCondition(conditionData, players[0], world);
}

// SECTION: logic_auto
function thinkAuto(entity, now) {
    const state = getState(entity, () => ({ entries: [] }));
    const automations = Array.isArray(entity.data.automations) ? entity.data.automations : [];

    for (let i = 0; i < automations.length; i++) {
        const auto = automations[i];
        const entry = state.entries[i] ??= { hasFired: false, lastFireTick: now };
        if (auto.runOnce && entry.hasFired) continue;

        let shouldFire = !mapSpawnDone && auto.onWorldLoad && !entry.hasFired;
        if (auto.runPeriodically && now - entry.lastFireTick >= Math.max(1, toInt(auto.tickDelay, 20))) {
            shouldFire = true;
        }
        if (!shouldFire) continue;

        entry.hasFired = true;
        entry.lastFireTick = now;
        fireAction(entity, auto.runCommand, auto.runOutput, "OnAutoFire");
    }
}

// SECTION: logic_branch
function getBranchCondition(entity) {
    return {
        executeCondition: entity.data.executeCondition || "noCondition",
        conditionValue1: entity.data.conditionValue1 || "",
        conditionValue2: entity.data.conditionValue2 || "",
        conditionValue3: entity.data.conditionValue3 || ""
    };
}

function fireBranch(entity, result, activator) {
    if (result) fireAction(entity, entity.data.ifTrueRunCommand, entity.data.ifTrueRunOutput, "OnTrue", activator);
    else fireAction(entity, entity.data.ifFalseRunCommand, entity.data.ifFalseRunOutput, "OnFalse", activator);
}

function thinkBranch(entity, now) {
    const state = getState(entity, () => ({ lastResult: null, lastFireTick: -Infinity, hasFired: false }));
    const result = evaluateForEntity(getBranchCondition(entity), entity);
    const changed = result !== state.lastResult;
    state.lastResult = result;

    const runOnce = toBool(entity.data.runOnce);
    if (runOnce && state.hasFired) return;

    const interval = toInt(entity.data.runInterval, 0);
    const shouldFire = changed || (!runOnce && interval > 0 && now - state.lastFireTick >= interval);
    if (!shouldFire) return;

    state.lastFireTick = now;
    state.hasFired = true;
    fireBranch(entity, result);
}

// SECTION: logic_case
function thinkCase(entity) {
    const cases = Array.isArray(entity.data.cases) ? entity.data.cases : [];
    if (cases.length === 0) return;

    const state = getState(entity, () => ({ lastMatched: null }));
    const matchedIndex = cases.findIndex(entry => evaluateForEntity({
        executeCondition: entry.condition || "noCondition",
        conditionValue1: entry.conditionValue1 || "",
        conditionValue2: entry.conditionValue2 || "",
        conditionValue3: entry.conditionValue3 || ""
    }, entity));

    if (matchedIndex === state.lastMatched) return;
    state.lastMatched = matchedIndex;

    if (matchedIndex === -1) {
        fireOutput(entity, "OnDefault");
        return;
    }
    const matched = cases[matchedIndex];
    fireAction(entity, matched.runCommand, matched.runOutput, `OnCase${String(matchedIndex + 1).padStart(2, "0")}`);
}

// SECTION: logic_compare
// Scoreboard participants are looked up once per objective per think pass.
function getScoreLookup(objectiveName, cache) {
    if (cache.has(objectiveName)) return cache.get(objectiveName);

    const scores = new Map();
    try {
        const objective = world.scoreboard.getObjective(objectiveName);
        for (const participant of objective?.getParticipants() ?? []) {
            const name = `${participant.displayName ?? ""}`.trim();
            if (name && !scores.has(name)) scores.set(name, objective.getScore(participant));
        }
    } catch { }

    cache.set(objectiveName, scores);
    return scores;
}

function thinkCompare(entity, scoreCache) {
    const comparisons = Array.isArray(entity.data.comparisons) ? entity.data.comparisons : [];
    if (comparisons.length === 0) return;

    const state = getState(entity, () => ({ lastResults: [] }));
    for (let i = 0; i < comparisons.length; i++) {
        const comparison = comparisons[i];
        const score = getScoreLookup(comparison.objective || "", scoreCache).get(`${comparison.entity ?? ""}`.trim());
        const value = toInt(comparison.initialValue, 0);

        let matched = false;
        if (Number.isFinite(score)) {
            switch (comparison.comparingFor) {
                case "OnLessThan": matched = score < value; break;
                case "OnEqualTo": matched = score === value; break;
                case "OnNotEqualTo": matched = score !== value; break;
                case "OnGreaterThan": matched = score > value; break;
            }
        }

        if (matched === state.lastResults[i]) continue;
        state.lastResults[i] = matched;
        if (matched) fireAction(entity, comparison.runCommand, comparison.runOutput, comparison.comparingFor);
    }
}

// SECTION: logic_coop_manager
function thinkCoop(entity) {
    const origin = entityOrigin(entity);
    const selectorA = `${entity.data.playerASelector ?? ""}`.trim();
    const selectorB = `${entity.data.playerBSelector ?? ""}`.trim();
    const stateA = selectorA ? resolveSelectorPlayers(selectorA, origin).length > 0 : toBool(entity.data.playerAState);
    const stateB = selectorB ? resolveSelectorPlayers(selectorB, origin).length > 0 : toBool(entity.data.playerBState);

    const state = getState(entity, () => ({ lastA: null, lastB: null }));
    const prevA = state.lastA;
    const prevB = state.lastB;
    if (stateA === prevA && stateB === prevB) return;
    state.lastA = stateA;
    state.lastB = stateB;

    if (stateA && stateB && !(prevA === true && prevB === true)) fireOutput(entity, "OnChangeToAllTrue");
    if ((stateA || stateB) && !(prevA === true || prevB === true)) fireOutput(entity, "OnChangeToAnyTrue");
    if (!stateA && !stateB && !(prevA === false && prevB === false)) fireOutput(entity, "OnChangeToAllFalse");
    if ((!stateA || !stateB) && !(prevA === false || prevB === false)) fireOutput(entity, "OnChangeToAnyFalse");
}

function setCoopState(entity, key, value) {
    const next = value === "toggle" ? !toBool(entity.data[key]) : value;
    if (entity.data[key] === next) return;
    entity.data[key] = next;
    markEntityDirty(entity);
}

// SECTION: logic_random_outputs
function pickRandom(entity, activator) {
    const state = getState(entity, () => ({ lastFireTick: system.currentTick, hasFired: false, lastRandom: -1 }));
    const range = Math.max(1, Math.min(10, toInt(entity.data.randomChanceRange, 2)));

    let value = Math.floor(Math.random() * range) + 1;
    if (toBool(entity.data.rerunSelection) && range > 1) {
        while (value === state.lastRandom) value = Math.floor(Math.random() * range) + 1;
    }

    state.lastRandom = value;
    state.lastFireTick = system.currentTick;
    state.hasFired = true;

    const slot = Array.isArray(entity.data.randomSlots) ? entity.data.randomSlots[value - 1] : undefined;
    fireAction(entity, slot?.runCommand, slot?.runOutput, `OnTrigger${value}`, activator);
}

function thinkRandom(entity, now) {
    if (toBool(entity.data.runOnInput)) return;

    const state = getState(entity, () => ({ lastFireTick: now, hasFired: false, lastRandom: -1 }));
    if (toBool(entity.data.runOnce)) {
        if (!state.hasFired) pickRandom(entity);
        return;
    }
    if (now - state.lastFireTick >= Math.max(1, toInt(entity.data.randomnessInterval, 20))) pickRandom(entity);
}

// SECTION: logic_timer
function getTimerState(entity) {
    return getState(entity, () => ({ lastFireTick: system.currentTick }));
}

function fireTimer(entity, activator) {
    getTimerState(entity).lastFireTick = system.currentTick;
    fireAction(entity, entity.data.runCommand, entity.data.runOutput, "OnTimer", activator);
}

function thinkTimer(entity, now) {
    const state = getTimerState(entity);
    if (now - state.lastFireTick >= Math.max(1, toInt(entity.data.timer, 20))) fireTimer(entity);
}

// The timer block shows its enabled state through a block state.
function syncTimerBlockState(entity) {
    if (entity.typeId !== TIMER) return;
    const cell = entity.cells[0];
    try {
        const block = safeGetDimension(entity.dimension)?.getBlock(cell);
        if (block?.typeId !== TIMER) return;
        block.setPermutation(block.permutation.withState("brr:start_disabled", entity.disabled ? 1 : 0));
    } catch { }
}

// SECTION: Inputs
registerInputHandlers(BRANCH, {
    Test: (entity, param, context) => fireBranch(entity, evaluateForEntity(getBranchCondition(entity), entity), context.activator)
});

registerInputHandlers(COOP, {
    SetStateATrue: entity => setCoopState(entity, "playerAState", true),
    SetStateAFalse: entity => setCoopState(entity, "playerAState", false),
    ToggleStateA: entity => setCoopState(entity, "playerAState", "toggle"),
    SetStateBTrue: entity => setCoopState(entity, "playerBState", true),
    SetStateBFalse: entity => setCoopState(entity, "playerBState", false),
    ToggleStateB: entity => setCoopState(entity, "playerBState", "toggle")
});

registerInputHandlers(RANDOM, {
    PickRandom: (entity, param, context) => {
        if (!entity.disabled) pickRandom(entity, context.activator);
    }
});

registerInputHandlers(TIMER, {
    RefireTime: (entity, param) => {
        const ticks = toInt(param, NaN);
        if (Number.isFinite(ticks) && ticks >= 1) {
            entity.data.timer = `${ticks}`;
            markEntityDirty(entity);
        }
    },
    ResetTimer: entity => {
        getTimerState(entity).lastFireTick = system.currentTick;
    },
    FireTimer: (entity, param, context) => fireTimer(entity, context.activator)
});

onEntityDisabledChanged(entity => {
    if (entity.typeId !== TIMER) return;
    // Enabling restarts the countdown, as in Source.
    if (!entity.disabled) getTimerState(entity).lastFireTick = system.currentTick;
    system.run(() => syncTimerBlockState(entity));
});

// SECTION: Think Pass
let prunedAtRevision = -1;

function pruneStates() {
    const revision = getRegistryRevision();
    if (revision === prunedAtRevision) return;
    prunedAtRevision = revision;
    for (const id of states.keys()) {
        if (!getEntityById(id)) states.delete(id);
    }
}

function forEachEnabled(typeId, think) {
    for (const entity of getEntitiesOfClass(typeId)) {
        if (!entity.disabled) think(entity);
    }
}

function runThinkPass() {
    if (!getEngineSettings().toolsEnabled) return;
    pruneStates();

    const now = system.currentTick;
    const scoreCache = new Map();

    if (!mapSpawnDone) {
        forEachEnabled(AUTO, entity => fireOutput(entity, "OnMapSpawn"));
        fireRelaySpawnOutputs();
    }
    forEachEnabled(AUTO, entity => thinkAuto(entity, now));
    forEachEnabled(BRANCH, entity => thinkBranch(entity, now));
    forEachEnabled(CASE, entity => thinkCase(entity));
    forEachEnabled(COMPARE, entity => thinkCompare(entity, scoreCache));
    forEachEnabled(COOP, entity => thinkCoop(entity));
    forEachEnabled(RANDOM, entity => thinkRandom(entity, now));
    forEachEnabled(TIMER, entity => thinkTimer(entity, now));
    mapSpawnDone = true;
}

export function startLogicSystem() {
    system.runInterval(runThinkPass, THINK_INTERVAL_TICKS);
}

export function syncEntityBlockState(entity) {
    syncTimerBlockState(entity);
}
