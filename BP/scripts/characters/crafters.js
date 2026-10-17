import { world } from "@minecraft/server";
import { AIR, blockTypeAt, isPassableDecorType } from "../core/block_cache.js";
import { createMarkerType } from "../core/block_markers.js";
import { distanceSquared } from "../core/math.js";
import { isBigDoorType } from "../doors.js";
import { setScreenFilter } from "../hud.js";
import { Animator } from "./animator.js";
import { canStandAt, lineClear, Navigator, pickWanderGoal } from "./navigation.js";
import { hasLineOfSight, isTargetablePlayer } from "./perception.js";
import { registerCharacter, trackedCharacters } from "./registry.js";

const CRAFTERS_ID = "brr:arts_mexicano_crafters";
const RALDI_ID = "brr:raldi";
const FIESTA_SOUND = "crafters.fiesta";
// mus_fiesta.ogg is 27.48s; replay just under that so the loop has no gap
const FIESTA_LOOP_TICKS = 545;

// he is shy for his first minute of (visible) existence; hiding pauses that budget
const SHY_BUDGET_TICKS = 1200;
const HIDE_TICKS = 400;
const HIDDEN_PLAYER_AVOID_DISTANCE_SQUARED = 24 * 24;
const HIDDEN_PLAYER_CLEARANCE_SQUARED = 12 * 12;
const FREEZE_TICKS = 30;
const CIRCLE_CHANCE = 0.02;
const CIRCLE_TICKS = 100;
const CIRCLE_RADIUS = 0.8;
const RETREAT_START_SPEED = 0.02;
const RETREAT_MAX_SPEED = 0.4;
const RETREAT_TIMEOUT_TICKS = 600;
const RETREAT_FALLBACK_DISTANCE = 16;
const RETREAT_ARRIVAL_DISTANCE_SQUARED = 0.75 * 0.75;
const RETREAT_PATH_NODES = 3000;
const RETREAT_PATH_DISTANCE = 128;
const SWING_DOOR_SEARCH_RADIUS = 32;
const SWING_DOOR_SCAN_WIDTH = SWING_DOOR_SEARCH_RADIUS * 2 + 1;
const SWING_DOOR_SCAN_PER_TICK = 192;

const WANDER_SPEED = 0.08;
const NORMAL_PATH_NODES = 800;
const NORMAL_PATH_DISTANCE = 96;
const STALK_SPEED = 0.16;
const STALK_CREEP_SPEED = 0.05;
const STALK_CREEP_DISTANCE_SQUARED = 12 * 12;
const STALK_CREEP_WAIT_TICKS = 80;
const STALK_SIGHT_RANGE_SQUARED = 96 * 96;

const SIGHT_RANGE_SQUARED = 48 * 48;
// cos of the half angle that still counts as "looking at him"
const LOOK_DOT = 0.9;
const STARE_TRIGGER_TICKS = 40;
const SHY_LOOK_TICKS = 10;
const NOTICE_TICKS = 10;

const CHASE_START_SPEED = 0.01;
const CHASE_MAX_SPEED = 0.8;
// both the chase and the shy retreat double their speed once a second
const ACCELERATION_INTERVAL_TICKS = 20;
const CATCH_DISTANCE_SQUARED = 1.5 * 1.5;

const CLIPS = {
    idle: { visual: 0 },
    chase: { visual: 1, frames: 12, interval: 1 },
    hidden: { visual: 2 }
};

// modes that belong to the shy phase, including the reaction to being looked at
const SHY_MODES = new Set(["wander", "freeze", "circle", "retreat", "hidden"]);

const playerSpot = createMarkerType("brr:arts_mexicano_crafters_player_tp", "brr:crafters_player_spots");
const raldiSpot = createMarkerType("brr:arts_mexicano_crafters_raldi_tp", "brr:crafters_raldi_spots");

export function registerCrafterComponents(blockComponentRegistry) {
    blockComponentRegistry.registerCustomComponent("brr:crafters_player_spot", playerSpot.component);
    blockComponentRegistry.registerCustomComponent("brr:crafters_raldi_spot", raldiSpot.component);
}

function blocksSight(typeId) {
    return typeId !== undefined && typeId !== AIR && !isBigDoorType(typeId) && !isPassableDecorType(typeId);
}

function canSee(entity, player, rangeSquared = SIGHT_RANGE_SQUARED) {
    const from = entity.location;
    const to = player.location;
    if (distanceSquared(from, to) > rangeSquared) return false;
    return hasLineOfSight(
        entity.dimension,
        { x: from.x, y: from.y + 1.4, z: from.z },
        { x: to.x, y: to.y + 1.5, z: to.z },
        blocksSight
    );
}

function isLookingAt(player, entity) {
    const view = player.getViewDirection();
    const dx = entity.location.x - player.location.x;
    const dy = entity.location.y + 1 - (player.location.y + 1.62);
    const dz = entity.location.z - player.location.z;
    const length = Math.hypot(dx, dy, dz);
    if (length < 0.001) return true;
    return (view.x * dx + view.y * dy + view.z * dz) / length >= LOOK_DOT;
}

// nearest player who is both looking at him and has a clear line to him
function watcherOf(entity, ctx) {
    let best;
    let bestDistance = Infinity;
    for (const player of ctx.players(entity.dimension)) {
        if (!isTargetablePlayer(player) || !isLookingAt(player, entity) || !canSee(entity, player)) continue;
        const distance = distanceSquared(entity.location, player.location);
        if (distance >= bestDistance) continue;
        best = player;
        bestDistance = distance;
    }
    return best;
}

function nearestPlayer(entity, ctx) {
    let best;
    let bestDistance = Infinity;
    for (const player of ctx.players(entity.dimension)) {
        if (!isTargetablePlayer(player)) continue;
        const distance = distanceSquared(entity.location, player.location);
        if (distance >= bestDistance) continue;
        best = player;
        bestDistance = distance;
    }
    return best;
}

function rememberSwingDoors(entity, state) {
    const { x: cx, y, z: cz } = state.swingDoorOrigin;
    const total = SWING_DOOR_SCAN_WIDTH * SWING_DOOR_SCAN_WIDTH;
    const end = Math.min(total, state.swingDoorScan + SWING_DOOR_SCAN_PER_TICK);
    for (; state.swingDoorScan < end; state.swingDoorScan++) {
        const dx = Math.floor(state.swingDoorScan / SWING_DOOR_SCAN_WIDTH) - SWING_DOOR_SEARCH_RADIUS;
        const dz = state.swingDoorScan % SWING_DOOR_SCAN_WIDTH - SWING_DOOR_SEARCH_RADIUS;
        if (dx * dx + dz * dz > SWING_DOOR_SEARCH_RADIUS * SWING_DOOR_SEARCH_RADIUS) continue;
        if (isBigDoorType(blockTypeAt(entity.dimension, cx + dx, y, cz + dz))) {
            state.swingDoors.push({ x: cx + dx, y, z: cz + dz });
        }
    }
}

function findSwingDoor(entity, doors, rejected) {
    let best;
    let bestDistance = SWING_DOOR_SEARCH_RADIUS * SWING_DOOR_SEARCH_RADIUS;
    for (const door of doors) {
        if (rejected.has(door)) continue;
        const dx = door.x - Math.floor(entity.location.x);
        const dz = door.z - Math.floor(entity.location.z);
        const distance = dx * dx + dz * dz;
        if (distance >= bestDistance || !isBigDoorType(blockTypeAt(entity.dimension, door.x, door.y, door.z))) continue;
        best = door;
        bestDistance = distance;
    }
    return best;
}

// a point straight back from `from`, used when no swing door is in range to flee to
function awayFrom(entity, from) {
    const dx = entity.location.x - from.location.x;
    const dz = entity.location.z - from.location.z;
    const length = Math.hypot(dx, dz);
    const scale = length > 0.001 ? RETREAT_FALLBACK_DISTANCE / length : 0;
    return {
        x: entity.location.x + dx * scale,
        y: entity.location.y,
        z: entity.location.z + dz * scale
    };
}

// speed doubles every second since `startedAt`
function accelerate(startSpeed, maxSpeed, startedAt, tick) {
    const doublings = Math.floor((tick - startedAt) / ACCELERATION_INTERVAL_TICKS);
    return Math.min(maxSpeed, startSpeed * Math.pow(2, doublings));
}

// ------------------------------------------------------------- the chase ----

function play(state, name) {
    if (state.animator.name === name) return;
    state.animator.play(name);
}

// every live Crafters' state, so a run reset can reach them (forgetCraftersDespawns)
const crafterStates = new Set();

// removes every other character in the dimension, remembering where to put them back
function despawnOthers(entity) {
    const saved = [];
    for (const other of trackedCharacters(entity.dimension, CRAFTERS_ID)) {
        saved.push({ typeId: other.typeId, location: { ...other.location } });
        try { other.remove(); } catch { }
    }
    return saved;
}

function respawnOthers(dimension, saved, raldiLocation) {
    for (const entry of saved) {
        const location = entry.typeId === RALDI_ID && raldiLocation ? raldiLocation : entry.location;
        try { dimension.spawnEntity(entry.typeId, location); } catch { }
    }
}

function playFiesta(player) {
    try { player.playSound(FIESTA_SOUND); } catch { }
}

function stopFiesta(player) {
    try { player.runCommand(`stopsound @s ${FIESTA_SOUND}`); } catch { }
}

function startChase(entity, state, player, tick) {
    state.mode = "chase";
    state.nav.doorFilter = undefined;
    state.targetId = player.id;
    state.chaseStartedAt = tick;
    state.nextFiestaAt = tick;
    state.despawned = despawnOthers(entity);
    state.nav.reset();
    play(state, "chase");
    setScreenFilter(player, true);
}

function endChase(entity, state, raldiLocation) {
    const player = state.targetId ? world.getEntity(state.targetId) : undefined;
    if (player) {
        setScreenFilter(player, false);
        stopFiesta(player);
    }
    respawnOthers(entity.dimension, state.despawned ?? [], raldiLocation);
    state.despawned = undefined;
    state.targetId = undefined;
    state.stare = 0;
    state.wander = undefined;
    state.circle = undefined;
    state.retreat = undefined;
    state.retreatDoor = undefined;
    state.rejectedDoors = undefined;
    state.nav.doorFilter = isBigDoorType;
    state.nav.maxNodes = NORMAL_PATH_NODES;
    state.nav.maxDistance = NORMAL_PATH_DISTANCE;
    state.nav.reset();
    play(state, "idle");
    // catching someone satisfies him: he drops straight back into the shy phase
    state.shyTicksLeft = SHY_BUDGET_TICKS;
    state.mode = "wander";
}

function catchPlayer(entity, state, player) {
    const dimension = entity.dimension;
    const spot = playerSpot.findNearest(dimension, entity.location);
    if (spot) {
        try { player.teleport({ x: spot.x + 0.5, y: spot.y, z: spot.z + 0.5 }, { dimension }); } catch { }
    }
    const raldi = raldiSpot.findNearest(dimension, entity.location);
    endChase(entity, state, raldi ? { x: raldi.x + 0.5, y: raldi.y, z: raldi.z + 0.5 } : undefined);
}

function chaseTick(entity, state, ctx) {
    const player = ctx.players(entity.dimension).find((candidate) => candidate.id === state.targetId);
    if (!player || !isTargetablePlayer(player)) {
        endChase(entity, state);
        return;
    }
    if (ctx.tick >= state.nextFiestaAt) {
        playFiesta(player);
        state.nextFiestaAt = ctx.tick + FIESTA_LOOP_TICKS;
    }
    if (distanceSquared(entity.location, player.location) <= CATCH_DISTANCE_SQUARED) {
        catchPlayer(entity, state, player);
        return;
    }
    state.nav.glide(entity, player.location, accelerate(CHASE_START_SPEED, CHASE_MAX_SPEED, state.chaseStartedAt, ctx.tick));
}

// ------------------------------------------------------------ shy phase ----

function wanderTick(entity, state, ctx, hidden = false) {
    const player = hidden ? nearestPlayer(entity, ctx) : undefined;
    const avoidPlayer = player && distanceSquared(entity.location, player.location) < HIDDEN_PLAYER_AVOID_DISTANCE_SQUARED;
    if (avoidPlayer && state.wander && (
        distanceSquared(state.wander, player.location) < HIDDEN_PLAYER_CLEARANCE_SQUARED
        || (state.wander.x - entity.location.x) * (player.location.x - entity.location.x)
            + (state.wander.z - entity.location.z) * (player.location.z - entity.location.z) > 0
    )) {
        state.wander = undefined;
        state.nav.reset();
    }
    if (state.wander) {
        const moving = state.nav.glide(entity, state.wander, WANDER_SPEED);
        // still on a full path, or waiting for its search
        if (moving && (state.nav.complete || state.nav.pending)) return;
        state.wander = undefined;
        state.nav.reset();
        if (moving) state.wanderRetryAt = ctx.tick + 10;
    }
    if (ctx.tick < state.wanderRetryAt) return;

    // a floor spot 8-20 blocks off, away from the player he's hiding from
    state.wander = pickWanderGoal(entity, 8, 20, {
        angle: avoidPlayer ? Math.atan2(entity.location.z - player.location.z, entity.location.x - player.location.x) : undefined,
        spread: 2,
        doorFilter: isBigDoorType
    });
    if (!state.wander || (avoidPlayer && distanceSquared(state.wander, player.location) < HIDDEN_PLAYER_CLEARANCE_SQUARED)) {
        state.wander = undefined;
        state.wanderRetryAt = ctx.tick + 1;
        return;
    }
    state.nav.reset();
    // a search waiting for its turn is picked up by the glide above next tick
    const planned = state.nav.plan(entity, state.wander);
    if (!planned && state.nav.pending) return;
    if (!planned || !state.nav.complete) {
        state.wander = undefined;
        state.nav.reset();
        state.wanderRetryAt = ctx.tick + 10;
    }
}

function chooseRetreatGoal(entity, state) {
    const watcher = state.watcherId ? world.getEntity(state.watcherId) : undefined;
    const door = findSwingDoor(entity, state.swingDoors, state.rejectedDoors);
    state.retreatDoor = door;
    state.retreat = door
        ? { x: door.x + 0.5, y: door.y, z: door.z + 0.5 }
        : watcher ? awayFrom(entity, watcher) : undefined;
    state.nav.reset();
}

function startRetreat(entity, state, tick, startedAt = tick) {
    state.mode = "retreat";
    state.rejectedDoors = new Set();
    state.nav.doorFilter = undefined;
    state.nav.maxNodes = RETREAT_PATH_NODES;
    state.nav.maxDistance = RETREAT_PATH_DISTANCE;
    chooseRetreatGoal(entity, state);
    state.retreatStartedAt = startedAt;
    state.retreatGiveUpAt = tick + RETREAT_TIMEOUT_TICKS;
    state.circle = undefined;
}

function shyTick(entity, state, ctx) {
    if (state.mode === "hidden") {
        if (ctx.tick >= state.hiddenUntil) {
            play(state, "idle");
            state.mode = "wander";
            state.wander = undefined;
            state.nav.reset();
        } else {
            wanderTick(entity, state, ctx, true);
        }
        return;
    }
    if (state.mode === "freeze") {
        if (ctx.tick < state.freezeUntil) return;
        startRetreat(entity, state, ctx.tick);
        return;
    }
    if (state.mode === "circle") {
        const circle = state.circle;
        if (ctx.tick - circle.startedAt >= CIRCLE_TICKS) {
            startRetreat(entity, state, ctx.tick, circle.startedAt);
            return;
        }
        const angle = circle.angle + accelerate(RETREAT_START_SPEED, RETREAT_MAX_SPEED, circle.startedAt, ctx.tick) / CIRCLE_RADIUS;
        const destination = {
            x: circle.center.x + Math.cos(angle) * CIRCLE_RADIUS,
            y: entity.location.y,
            z: circle.center.z + Math.sin(angle) * CIRCLE_RADIUS
        };
        const walkable = (x, z) => canStandAt(entity.dimension, x, Math.floor(destination.y), z, isBigDoorType);
        if (!lineClear(entity.location.x, entity.location.z, destination.x, destination.z, state.nav.radius, walkable)) {
            startRetreat(entity, state, ctx.tick, circle.startedAt);
            return;
        }
        try {
            entity.teleport(destination, { facingLocation: {
                x: circle.center.x + Math.cos(angle + 0.2) * CIRCLE_RADIUS,
                y: destination.y,
                z: circle.center.z + Math.sin(angle + 0.2) * CIRCLE_RADIUS
            } });
        } catch {
            startRetreat(entity, state, ctx.tick, circle.startedAt);
            return;
        }
        circle.angle = angle;
        return;
    }
    if (state.mode === "retreat") {
        if (state.retreat && ctx.tick < state.retreatGiveUpAt) {
            const speed = accelerate(RETREAT_START_SPEED, RETREAT_MAX_SPEED, state.retreatStartedAt, ctx.tick);
            state.nav.glide(entity, state.retreat, speed);
            if (!state.nav.complete && !state.nav.pending) {
                if (state.retreatDoor) {
                    state.rejectedDoors.add(state.retreatDoor);
                    chooseRetreatGoal(entity, state);
                } else {
                    state.retreat = undefined;
                }
                return;
            }
        }
        const arrived = state.retreat && distanceSquared(entity.location, state.retreat) <= RETREAT_ARRIVAL_DISTANCE_SQUARED;
        if (arrived || !state.retreat || ctx.tick >= state.retreatGiveUpAt) {
            state.mode = arrived ? "hidden" : "wander";
            if (arrived) state.hiddenUntil = ctx.tick + HIDE_TICKS;
            state.retreat = undefined;
            state.retreatDoor = undefined;
            state.rejectedDoors = undefined;
            state.wander = undefined;
            state.nav.doorFilter = isBigDoorType;
            state.nav.maxNodes = NORMAL_PATH_NODES;
            state.nav.maxDistance = NORMAL_PATH_DISTANCE;
            state.nav.reset();
            if (arrived) play(state, "hidden");
        }
        return;
    }

    const watcher = watcherOf(entity, ctx);
    state.stare = watcher ? state.stare + 1 : 0;
    if (state.stare >= SHY_LOOK_TICKS) {
        state.stare = 0;
        state.watcherId = watcher.id;
        if (Math.random() < CIRCLE_CHANCE) {
            const angle = Math.random() * Math.PI * 2;
            state.circle = {
                center: {
                    x: entity.location.x - Math.cos(angle) * CIRCLE_RADIUS,
                    z: entity.location.z - Math.sin(angle) * CIRCLE_RADIUS
                },
                angle,
                startedAt: ctx.tick
            };
            state.mode = "circle";
        } else {
            state.mode = "freeze";
            state.freezeUntil = ctx.tick + FREEZE_TICKS;
        }
        state.wander = undefined;
        state.nav.reset();
        return;
    }
    wanderTick(entity, state, ctx);
}

// ----------------------------------------------------- aggressive phase ----

// the shy phase is over but nobody has noticed him yet; one look and he starts shadowing
function dormantTick(entity, state, ctx) {
    state.stare = watcherOf(entity, ctx) ? state.stare + 1 : 0;
    if (state.stare >= NOTICE_TICKS) {
        state.stare = 0;
        state.mode = "stalk";
        state.wander = undefined;
        state.nav.reset();
        return;
    }
    wanderTick(entity, state, ctx);
}

function stalkTick(entity, state, ctx) {
    const watcher = watcherOf(entity, ctx);
    state.stare = watcher ? state.stare + 1 : 0;
    if (state.stare >= STARE_TRIGGER_TICKS) {
        startChase(entity, state, watcher, ctx.tick);
        return;
    }

    const player = nearestPlayer(entity, ctx);
    if (!player) {
        state.stalkVisibleSince = undefined;
        state.stalkCreeping = false;
        wanderTick(entity, state, ctx);
        return;
    }
    const visible = watcher?.id === player.id || canSee(entity, player, STALK_SIGHT_RANGE_SQUARED);
    if (!visible) {
        state.stalkVisibleSince = undefined;
        state.stalkCreeping = false;
        state.nav.glide(entity, player.location, STALK_SPEED);
        return;
    }
    if (state.stalkVisibleSince === undefined) {
        state.stalkVisibleSince = ctx.tick;
        state.nav.reset();
    }
    const distance = distanceSquared(entity.location, player.location);
    if (distance <= STALK_CREEP_DISTANCE_SQUARED) state.stalkCreeping = false;
    if (!state.stalkCreeping && distance > STALK_CREEP_DISTANCE_SQUARED
        && ctx.tick - state.stalkVisibleSince >= STALK_CREEP_WAIT_TICKS
        && ctx.tick % 20 === 0 && Math.random() < 0.1) state.stalkCreeping = true;
    if (state.stalkCreeping) {
        state.nav.glide(entity, player.location, STALK_CREEP_SPEED);
    } else if (ctx.tick % 5 === 0) {
        try { entity.teleport(entity.location, { facingLocation: player.location }); } catch { }
    }
}

// ----------------------------------------------------------------------------

function tick(entity, state, ctx) {
    if (!state.active) return;
    if (state.swingDoorScan < SWING_DOOR_SCAN_WIDTH * SWING_DOOR_SCAN_WIDTH) rememberSwingDoors(entity, state);

    const next = state.animator.update(ctx.tick);
    if (next) play(state, next);

    if (state.mode === "chase") {
        chaseTick(entity, state, ctx);
        return;
    }
    if (SHY_MODES.has(state.mode)) {
        // hiding pauses the shy budget, so the shy phase resumes where it left off
        if (state.mode !== "hidden") state.shyTicksLeft--;
        // a reaction already under way always runs to its end, even if the budget expires mid-way
        if (state.shyTicksLeft > 0 || state.mode !== "wander") {
            shyTick(entity, state, ctx);
            return;
        }
        state.mode = "dormant";
        state.stare = 0;
        state.wander = undefined;
        state.nav.reset();
    }
    if (state.mode === "dormant") {
        dormantTick(entity, state, ctx);
        return;
    }
    stalkTick(entity, state, ctx);
}

function onAction(entity, state, action) {
    switch (action) {
        case "stop": state.active = false; endChase(entity, state); break;
        case "start": state.active = true; break;
        case "reset": endChase(entity, state); break;
        case "aggressive":
            state.shyTicksLeft = 0;
            state.circle = undefined;
            state.retreat = undefined;
            state.retreatDoor = undefined;
            state.rejectedDoors = undefined;
            state.nav.doorFilter = isBigDoorType;
            state.nav.maxNodes = NORMAL_PATH_NODES;
            state.nav.maxDistance = NORMAL_PATH_DISTANCE;
            state.nav.reset();
            state.mode = "dormant";
            break;
    }
}

function onRemove(state) {
    crafterStates.delete(state);
    // don't leave the world one character short if he is killed mid-chase
    if (state.despawned && state.dimension) respawnOthers(state.dimension, state.despawned);
    state.despawned = undefined;
}

// For the run reset (main_menu.js resetGame), right before it removes every character: whoever a
// Crafters chase despawned stays gone, instead of his onRemove spawning them all back into the
// cleared map. Also lifts the chase's red screen filter and fiesta music from the chased player.
export function forgetCraftersDespawns() {
    for (const state of crafterStates) {
        state.despawned = undefined;
        if (state.mode !== "chase" || !state.targetId) continue;
        try {
            const player = world.getEntity(state.targetId);
            if (player?.isValid) {
                setScreenFilter(player, false);
                stopFiesta(player);
            }
        } catch { }
    }
}

function createState(entity) {
    const state = {
        active: true,
        mode: "wander",
        dimension: entity.dimension,
        animator: new Animator(entity, CLIPS),
        nav: new Navigator({ maxNodes: NORMAL_PATH_NODES, maxDistance: NORMAL_PATH_DISTANCE, maxAgeTicks: 60, clearanceCheckTicks: 5, doorFilter: isBigDoorType, doorHeight: 2 }),
        swingDoors: [],
        swingDoorScan: 0,
        swingDoorOrigin: {
            x: Math.floor(entity.location.x),
            y: Math.floor(entity.location.y),
            z: Math.floor(entity.location.z)
        },
        shyTicksLeft: SHY_BUDGET_TICKS,
        stare: 0,
        wander: undefined,
        wanderRetryAt: 0,
        stalkVisibleSince: undefined,
        stalkCreeping: false,
        watcherId: undefined,
        circle: undefined,
        retreat: undefined,
        retreatDoor: undefined,
        rejectedDoors: undefined,
        retreatStartedAt: 0,
        retreatGiveUpAt: 0,
        freezeUntil: 0,
        hiddenUntil: 0,
        targetId: undefined,
        chaseStartedAt: 0,
        nextFiestaAt: 0,
        despawned: undefined
    };
    state.animator.play("idle");
    crafterStates.add(state);
    return state;
}

registerCharacter({
    typeId: CRAFTERS_ID,
    scriptEventId: "brr:crafters",
    createState,
    tick,
    onAction,
    onRemove
});
