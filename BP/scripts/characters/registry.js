import { system, world } from "@minecraft/server";
import { onDoorOpened } from "../doors.js";
import { gameTick, isPaused } from "../core/pause.js";

// A character definition:
// {
//   typeId, scriptEventId?,
//   createState(entity),
//   tick(entity, state, ctx),            every game tick
//   onAction?(entity, state, action),    `/scriptevent <scriptEventId> <action>`
//   onSound?(entity, state, { location, source })
//   onEvent?(entity, state, name, payload)  see emitEvent
//   onRemove?(state)
//   wanted?(entity, state, ctx)          true while Chipfloke should go after this character
//   catchDistance?                       how close Chipfloke must get to apprehend it (default 1.5)
//   chaseSound?                          sound Chipfloke plays when he starts chasing it
//   onPursued?(entity, state, chaser)    Chipfloke started chasing it
//   onPursuitEnded?(entity, state)       Chipfloke gave up
//   onApprehended?(entity, state, chaser)  Chipfloke caught it
// }
// ctx: { tick, players(dimension) }; players are fetched once per dimension per tick and shared.

const DIMENSIONS = ["overworld", "nether", "the_end"];
const RESYNC_INTERVAL_TICKS = 100;

const definitions = new Map();
const definitionsByEvent = new Map();
const tracked = new Map();
const controls = new Map();

export function registerCharacter(definition) {
    definitions.set(definition.typeId, definition);
    if (definition.scriptEventId) definitionsByEvent.set(definition.scriptEventId, definition);
}

function track(entity) {
    const existing = tracked.get(entity.id);
    if (existing?.entity.isValid) return existing;
    // a reloaded entity gets a fresh state; let the stale one clean up (e.g. Raldi's drip light)
    if (existing) {
        try { existing.definition.onRemove?.(existing.state); } catch { }
    }
    const definition = definitions.get(entity.typeId);
    if (!definition) return undefined;
    const entry = { entity, definition, state: definition.createState(entity) };
    tracked.set(entity.id, entry);
    return entry;
}

function tryTrack(entity) {
    if (!entity?.isValid || !definitions.has(entity.typeId)) return;
    try { track(entity); } catch { }
}

// players and dropped items are never characters; leaving them out keeps the one query per dimension small
const RESYNC_QUERY = { excludeTypes: ["minecraft:player", "minecraft:item"] };

// safety net for entities whose spawn/load events were missed: one query per dimension, not one per type
function resync() {
    for (const dimensionId of DIMENSIONS) {
        let entities;
        try { entities = world.getDimension(dimensionId).getEntities(RESYNC_QUERY); } catch { continue; }
        for (const entity of entities) {
            if (tracked.get(entity.id)?.entity.isValid) continue;
            tryTrack(entity);
        }
    }
}

function createContext(tick) {
    const players = new Map();
    return {
        tick,
        players(dimension) {
            let list = players.get(dimension.id);
            if (!list) {
                list = dimension.getPlayers();
                players.set(dimension.id, list);
            }
            return list;
        }
    };
}

export function emitSound(dimension, location, source) {
    for (const entry of tracked.values()) {
        const { entity, definition, state } = entry;
        if (!definition.onSound || !entity.isValid || entity.dimension.id !== dimension.id) continue;
        try { definition.onSound(entity, state, { location, source }); } catch { }
    }
}

export function emitEvent(dimension, name, payload) {
    for (const entry of tracked.values()) {
        const { entity, definition, state } = entry;
        if (!definition.onEvent || !entity.isValid || entity.dimension.id !== dimension.id) continue;
        try { definition.onEvent(entity, state, name, payload); } catch { }
    }
}

// live character entities in the dimension, optionally skipping one type (usually the caller's own)
export function trackedCharacters(dimension, exceptTypeId) {
    const list = [];
    for (const entry of tracked.values()) {
        const entity = entry.entity;
        if (!entity.isValid || entity.dimension.id !== dimension.id) continue;
        if (entity.typeId === exceptTypeId) continue;
        list.push(entity);
    }
    return list;
}

export function setCharacterControl(entity, owner, tick) {
    controls.set(entity.id, { owner, tick });
}

// true while something else (a BSODA spray) is moving the character
export function isCharacterControlled(entity) {
    return controls.has(entity.id);
}

// characters in the dimension that currently want arresting: [{ entity, catchDistance }]
export function wantedCharacters(dimension, ctx) {
    const list = [];
    for (const { entity, definition, state } of tracked.values()) {
        if (!definition.wanted || !entity.isValid || entity.dimension.id !== dimension.id) continue;
        let wanted = false;
        try { wanted = definition.wanted(entity, state, ctx) === true; } catch { }
        if (wanted) list.push({ entity, catchDistance: definition.catchDistance ?? 1.5, chaseSound: definition.chaseSound });
    }
    return list;
}

export function isCharacterWanted(entity, ctx) {
    const entry = tracked.get(entity.id);
    if (!entry?.definition.wanted || !entity.isValid) return false;
    try { return entry.definition.wanted(entity, entry.state, ctx) === true; } catch { return false; }
}

// calls one of the pursuit hooks (onPursued, onPursuitEnded, onApprehended) on a tracked character
export function notifyCharacter(entity, hook, ...args) {
    const entry = tracked.get(entity.id);
    if (!entry || typeof entry.definition[hook] !== "function") return;
    try { entry.definition[hook](entity, entry.state, ...args); } catch { }
}

export function clearCharacterControl(entityId, owner) {
    if (controls.get(entityId)?.owner === owner) controls.delete(entityId);
}

export function hitCharacter(entity, kind, source) {
    const entry = tracked.get(entity.id);
    if (!entry || !entry.definition.onHit) return false;
    try { return entry.definition.onHit(entity, entry.state, kind, source, gameTick()) !== false; } catch { return false; }
}

function runAction(entity, action) {
    const entry = track(entity);
    if (entry) entry.definition.onAction?.(entity, entry.state, action);
}

// the same as `/scriptevent <character id> <action>` run as that one character
export function sendCharacterAction(entity, action) {
    runAction(entity, action);
}

export function startCharacters() {
    world.afterEvents.entitySpawn.subscribe(({ entity }) => tryTrack(entity));
    world.afterEvents.entityLoad.subscribe(({ entity }) => tryTrack(entity));
    world.afterEvents.entityRemove.subscribe(({ removedEntityId }) => {
        const entry = tracked.get(removedEntityId);
        try { entry?.definition.onRemove?.(entry.state); } catch { }
        tracked.delete(removedEntityId);
    });

    onDoorOpened(({ player, dimension, location }) => emitSound(dimension, location, player));

    system.afterEvents.scriptEventReceive.subscribe((event) => {
        const definition = definitionsByEvent.get(event.id);
        if (!definition) return;
        const action = event.message.trim().toLowerCase();
        const source = event.sourceEntity;
        if (source?.typeId === definition.typeId) {
            runAction(source, action);
            return;
        }
        const dimension = source?.dimension ?? world.getDimension("overworld");
        for (const entity of dimension.getEntities({ type: definition.typeId })) runAction(entity, action);
    });

    system.run(resync);
    system.runInterval(resync, RESYNC_INTERVAL_TICKS);

    system.runInterval(() => {
        if (tracked.size === 0 || isPaused()) return;
        const ctx = createContext(gameTick());
        for (const [id, entry] of tracked) {
            if (!entry.entity.isValid) {
                try { entry.definition.onRemove?.(entry.state); } catch { }
                controls.delete(id);
                tracked.delete(id);
                continue;
            }
            const control = controls.get(id);
            if (control) {
                let controlled = false;
                try { controlled = control.tick(entry.entity, ctx) === true; } catch { }
                if (controlled) continue;
                controls.delete(id);
            }
            try { entry.definition.tick(entry.entity, entry.state, ctx); } catch { }
        }
    }, 1);
}
