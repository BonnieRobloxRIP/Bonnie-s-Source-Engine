import { system, world } from "@minecraft/server";
import { classAcceptsInput } from "./classes.js";
import {
    findEntitiesByName,
    getEntityById,
    markEntityDirty,
    setEntityDisabled,
    updateEntityData
} from "./registry.js";
import { getNearest } from "./selectors.js";
import { safeGetDimension } from "./runtime.js";

// SECTION: Entity I/O
// Source-style input/output. An entity's `data.outputs` holds connections:
//   { label, output, target, input, param, delay (seconds), times (-1 = unlimited), remaining }
// Firing an output schedules every matching connection on an in-memory event queue; when an
// event comes due its target is resolved (by name, case-insensitive, trailing '*' wildcard, or
// !self / !activator / !caller / !player) and the input is dispatched to it.

const TICKS_PER_SECOND = 20;
// Zero-delay chains are processed in the same tick (as in Source); this cap stops a loop of
// connections from hanging the server and defers the rest to the next tick.
const MAX_EVENTS_PER_TICK = 1000;

const queue = [];
let sequence = 0;
let clock = () => system.currentTick;
const inputHandlers = new Map();

export function setIoClockForTests(nextClock) {
    clock = nextClock;
}

export function clearEventQueue() {
    queue.length = 0;
}

export function getQueuedEventCount() {
    return queue.length;
}

// SECTION: Shared Helpers
export function isBlockedCommand(command) {
    const normalized = `${command ?? ""}`.trim().replace(/^\/+/, "").trim().toLowerCase();
    return /^(minecraft:)?(op|deop)(\s|$)/.test(normalized);
}

export function runEntityCommand(entity, command) {
    const text = `${command ?? ""}`.trim().replace(/^\/+/, "");
    if (!text || isBlockedCommand(text)) return;
    try {
        safeGetDimension(entity.dimension).runCommand(text);
    } catch { }
}

function toNumber(value, fallback) {
    const parsed = Number.parseFloat(`${value ?? ""}`);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function isValidActor(actor) {
    try {
        return Boolean(actor) && actor.isValid !== false;
    } catch {
        return false;
    }
}

// SECTION: Input Handler Registry
// handlers: { InputName: (entity, param, context) => void }, context = { activator, caller }.
export function registerInputHandlers(typeId, handlers) {
    let byInput = inputHandlers.get(typeId);
    if (!byInput) inputHandlers.set(typeId, byInput = new Map());
    for (const [inputName, handler] of Object.entries(handlers)) {
        byInput.set(inputName.toLowerCase(), handler);
    }
}

// SECTION: Firing Outputs
// `value`: what the output carries (e.g. math_counter's OutValue). As in Source, it becomes the
// input parameter whenever the connection leaves Parameter blank.
function scheduleConnection(entity, connection, activator, caller, value) {
    const times = Math.trunc(toNumber(connection.times, -1));
    if (connection.remaining === undefined || connection.remaining === null) {
        connection.remaining = times;
    }
    if (connection.remaining === 0) return;
    if (connection.remaining > 0) {
        connection.remaining--;
        markEntityDirty(entity);
    }

    const delayTicks = Math.max(0, Math.round(toNumber(connection.delay, 0) * TICKS_PER_SECOND));
    enqueue({
        at: clock() + delayTicks,
        order: sequence++,
        selfId: entity.id,
        callerId: caller?.id ?? entity.id,
        output: `${connection.output ?? ""}`.toLowerCase(),
        activator,
        target: `${connection.target ?? ""}`.trim(),
        input: `${connection.input ?? ""}`.trim(),
        param: `${connection.param ?? ""}` || (value === undefined ? "" : `${value}`)
    });
}

// Fires an input at every entity matching `target` after `delaySeconds`, as if an output had
// fired it (Source's ent_fire). There is no !self / !caller here; !activator is `activator`.
export function fireInputAt(target, input, param, delaySeconds, activator) {
    enqueue({
        at: clock() + Math.max(0, Math.round(toNumber(delaySeconds, 0) * TICKS_PER_SECOND)),
        order: sequence++,
        selfId: undefined,
        callerId: undefined,
        output: "",
        activator,
        target: `${target ?? ""}`.trim(),
        input: `${input ?? ""}`.trim(),
        param: `${param ?? ""}`
    });
}

function enqueue(event) {
    // Keep the queue sorted by due tick; equal ticks stay in firing order.
    let low = 0;
    let high = queue.length;
    while (low < high) {
        const mid = (low + high) >> 1;
        if (queue[mid].at <= event.at) low = mid + 1;
        else high = mid;
    }
    queue.splice(low, 0, event);
}

// options.skip: connections already fired this time (by label) that must not fire twice.
// options.value: the value this output carries (see scheduleConnection).
export function fireOutput(entity, outputName, activator, caller, options = {}) {
    const { skip, value } = options;
    const outputs = entity?.data?.outputs;
    if (!Array.isArray(outputs) || outputs.length === 0) return;

    const wanted = `${outputName ?? ""}`.toLowerCase();
    for (const connection of outputs) {
        if (`${connection?.output ?? ""}`.toLowerCase() !== wanted || skip?.has(connection)) continue;
        scheduleConnection(entity, connection, activator, caller, value);
    }
}

// Fires connections by their label, used by the "Run output" fields of logic entities.
// Returns the connections it fired.
export function fireConnectionsByLabel(entity, label, activator) {
    const fired = new Set();
    const outputs = entity?.data?.outputs;
    const wanted = `${label ?? ""}`.trim();
    if (!Array.isArray(outputs) || !wanted) return fired;

    for (const connection of outputs) {
        if (`${connection?.label ?? ""}`.trim() !== wanted) continue;
        scheduleConnection(entity, connection, activator);
        fired.add(connection);
    }
    return fired;
}

// SECTION: Pending Events
// Whether an entity still has queued events from one output (any output when outputName is blank).
export function hasPendingEvents(entity, outputName) {
    const wanted = `${outputName ?? ""}`.toLowerCase();
    return queue.some(event => event.selfId === entity.id && (!wanted || event.output === wanted));
}

// Drops every queued event an entity fired that has not come due yet. Returns how many.
export function cancelPendingEvents(entity) {
    const before = queue.length;
    let kept = 0;
    for (const event of queue) {
        if (event.selfId !== entity.id) queue[kept++] = event;
    }
    queue.length = kept;
    return before - kept;
}

// SECTION: Event Processing
export function processEventQueue() {
    const now = clock();
    let processed = 0;

    while (queue.length > 0 && queue[0].at <= now && processed < MAX_EVENTS_PER_TICK) {
        const event = queue.shift();
        processed++;
        try {
            dispatchEvent(event);
        } catch (error) {
            console.warn(`[BSE] I/O event ${event.input} -> ${event.target} failed: ${error}`);
        }
    }
}

function resolveTargets(event) {
    const self = getEntityById(event.selfId);
    switch (event.target.toLowerCase()) {
        case "!self":
            return self ? [{ entity: self }] : [];
        case "!caller": {
            const caller = getEntityById(event.callerId);
            return caller ? [{ entity: caller }] : [];
        }
        case "!activator":
            return isValidActor(event.activator) ? [{ actor: event.activator }] : [];
        case "!player": {
            const players = world.getPlayers();
            const nearest = self ? getNearest(players.filter(player => player.dimension?.id === self.dimension), self.center) : undefined;
            const target = nearest ?? players[0];
            return target ? [{ actor: target }] : [];
        }
        default:
            return findEntitiesByName(event.target).map(entity => ({ entity }));
    }
}

function dispatchEvent(event) {
    const context = { activator: event.activator, caller: getEntityById(event.selfId) };
    for (const target of resolveTargets(event)) {
        if (target.entity) dispatchInput(target.entity, event.input, event.param, context);
        else dispatchActorInput(target.actor, event.input, event.param);
    }
}

// SECTION: Input Dispatch
export function dispatchInput(entity, inputName, param, context = {}) {
    const input = `${inputName ?? ""}`.toLowerCase();
    const userOutput = input.match(/^fireuser([1-4])$/);

    if (userOutput) {
        fireOutput(entity, `OnUser${userOutput[1]}`, context.activator, entity);
        return;
    }

    switch (input) {
        case "enable":
            setEntityDisabled(entity, false);
            return;
        case "disable":
            setEntityDisabled(entity, true);
            return;
        case "toggle":
            setEntityDisabled(entity, !entity.disabled);
            return;
        case "addoutput":
            applyAddOutput(entity, param);
            return;
        case "runcommand":
            runEntityCommand(entity, param);
            return;
    }

    if (!classAcceptsInput(entity.typeId, inputName)) return;
    const handler = inputHandlers.get(entity.typeId)?.get(input);
    handler?.(entity, `${param ?? ""}`, context);
}

function dispatchActorInput(actor, inputName, param) {
    if (`${inputName ?? ""}`.toLowerCase() !== "runcommand") return;
    const command = `${param ?? ""}`.trim().replace(/^\/+/, "");
    if (!command || isBlockedCommand(command)) return;
    try {
        actor.runCommand(command);
    } catch { }
}

// "AddOutput <key> <value>" sets a keyvalue, matching Source's keyvalue form of AddOutput.
// Booleans stay booleans so toggled fields keep working after an I/O edit.
const PROTECTED_KEYS = new Set(["outputs", "runtime"]);

function applyAddOutput(entity, param) {
    const text = `${param ?? ""}`.trim();
    const split = text.search(/\s/);
    const key = split === -1 ? text : text.slice(0, split);
    const rawValue = split === -1 ? "" : text.slice(split + 1).trim();
    if (!key || PROTECTED_KEYS.has(key) || key.startsWith("__")) return;

    let value = rawValue;
    if (typeof entity.data?.[key] === "boolean") {
        value = /^(1|true|yes|on)$/i.test(rawValue);
    }
    updateEntityData(entity, { ...entity.data, [key]: value });
}
