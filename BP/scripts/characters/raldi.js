import { system, world } from "@minecraft/server";
import { AIR, invalidateBlock, isPassableDecorType } from "../core/block_cache.js";
import { ESCAPE_STAGE, escapeStage, isExitPhase, NOTEBOOK_GOAL } from "../core/game_state.js";
import { resetEscape } from "../escape.js";
import { distanceSquared } from "../core/math.js";
import { gameTick } from "../core/pause.js";
import { highestScore } from "../core/scoreboard.js";
import { claimLight, releaseLight } from "../core/light_registry.js";
import { isRaldiDanceCued } from "../beginning.js";
import { isBigDoorType } from "../doors.js";
import { Animator } from "./animator.js";
import { farthestReachableFrom, LONG_RANGE, Navigator, pickWanderGoal, WANDER_RETRY_TICKS } from "./navigation.js";
import { createMemo, hasLineOfSight, isNearBlockType, isTargetablePlayer, SightMemo } from "./perception.js";
import { registerCharacter } from "./registry.js";
import { isMonke } from "../monke.js";

const RALDI_ID = "brr:raldi";
const DRIP_LIGHT_ID = "brr:raldi_drip_light";
const NOTEBOOK_OBJECTIVE = "notebooks";
const EXIT_OBJECTIVE = "exits";
const CRACKPIPE_ID = "brr:item_crackpipe";
const SLAP_SOUND = "raldi.slap";
const SEE_PLAYER_SOUND = "raldi.seeplayer";
const CRACK_SOUND = "raldi.crack";
const HIGH_SOUND = "raldi.high";
const STYLE_SOUND = "raldi.style";
const BONK_SOUND = "raldi.bonk";
const SCREAM_SOUND = "raldi.scream";
// knocked out this long by a monke (Kill(5f) in the original)
const MONKE_BONK_TICKS = 100;
// sound lengths in ticks: ral_crack 1.89s, ral_high 5.87s, mus_style 14.54s
const CRACK_TICKS = 38;
const HIGH_TICKS = 118;
const STYLE_TICKS = 291;
// a player out of sight this long gets the "spotted" FOV punch again
const SPOT_RESET_TICKS = 100;
// seconds between freeroam steps, by notebook count
const MOVE_INTERVAL_SECONDS = {
    2: 2,
    3: 1.7,
    4: 1.4,
    5: 1.2,
    6: 1,
    7: 0.7,
    8: 0.5,
    9: 0.35,
    10: 0.25
};
// irregular offset around the base interval: 2s -> 1.9..2.2s, scaled for every other value
const INTERVAL_JITTER_MIN = 0.95;
const INTERVAL_JITTER_MAX = 1.1;
// drip glide speed in blocks per tick, by notebook count and (after the transform) by exit count
const DRIP_NOTEBOOK_SPEED = {
    2: 0.01,
    3: 0.02,
    4: 0.05,
    5: 0.07,
    6: 0.10,
    7: 0.13,
    8: 0.16,
    9: 0.20,
    10: 0.23
};
const DRIP_EXIT_SPEED = [0.1, 0.2, 0.3, 0.4];
const TOILET_BLOCKS = new Set(["brr:toilet", "brr:toilet_block"]);
const PRIVACY_RADIUS = 3;
const PRIVACY_CACHE_TICKS = 10;
const DOOR_LEAD_FORGET_CHANCE = 0.2;
const CATCH_DISTANCE_SQUARED = 2.25;
// his sight is unlimited (a raycast across the whole school, like the original); while he looks
// every tick (drip) each player is re-checked every other tick instead
const SIGHT_CHECK_TICKS = 2;
const ARRIVE_DISTANCE_SQUARED = 0.35 * 0.35;
const TAPE_DURATION_TICKS = 600;
const activeTapes = new Map();
const raldiStates = new Map();

export function raldiRespawnSeconds(dimension) {
    const tick = gameTick();
    let remaining = Infinity;
    for (const { entity, state } of raldiStates.values()) {
        if (!entity.isValid || entity.dimension.id !== dimension.id || state.deadUntil <= tick) continue;
        remaining = Math.min(remaining, state.deadUntil - tick);
    }
    return remaining === Infinity ? undefined : Math.ceil(remaining / 20);
}

export function isMysteryTapePlaying(dimension, location) {
    const key = `${location.x},${location.y},${location.z}`;
    const tape = activeTapes.get(dimension.id)?.get(key);
    return tape !== undefined && gameTick() < tape.expireAt;
}

export function finishMysteryTape(dimension, location) {
    const key = `${location.x},${location.y},${location.z}`;
    const tapes = activeTapes.get(dimension.id);
    const tape = tapes?.get(key);
    if (!tape || gameTick() < tape.expireAt) return;
    try {
        const block = dimension.getBlock(location);
        if (!block) return;
        if (block.typeId === "brr:2d_tapeplayer_block") {
            block.setType("brr:2d_tapeplayer_open_block");
            invalidateBlock(dimension, location);
        }
        tapes.delete(key);
        if (tapes.size === 0) activeTapes.delete(dimension.id);
    } catch { }
}

export function playMysteryTape(dimension, location) {
    const key = `${location.x},${location.y},${location.z}`;
    let tapes = activeTapes.get(dimension.id);
    if (!tapes) {
        tapes = new Map();
        activeTapes.set(dimension.id, tapes);
    }
    const tape = { location: { x: location.x + 0.5, y: location.y, z: location.z + 0.5 }, expireAt: gameTick() + TAPE_DURATION_TICKS };
    tapes.set(key, tape);
    system.runTimeout(() => {
        if (activeTapes.get(dimension.id)?.get(key) === tape) finishMysteryTape(dimension, location);
    }, TAPE_DURATION_TICKS);
}

function nearestActiveTape(raldi, tick) {
    const tapes = activeTapes.get(raldi.dimension.id);
    if (!tapes) return;
    let nearest;
    let best = Infinity;
    for (const [key, tape] of tapes) {
        if (tick >= tape.expireAt) continue;
        const distance = distanceSquared(raldi.location, tape.location);
        if (distance < best) {
            nearest = { ...tape, key };
            best = distance;
        }
    }
    return nearest;
}

const CLIPS = {
    shake: { visual: 0 },
    dance: { visual: 1, frames: 187 },
    wave: { visual: 2, frames: 31, loops: 4, then: "idleWave" },
    idleWave: { visual: 3 },
    move: { visual: 4, frames: 5, interval: 3, hold: true },
    crackpipe: { visual: 5 },
    drip: { visual: 6 },
    dead: { visual: 7 }
};
const STATIONARY_MODES = new Set(["dance", "wave", "idleWave"]);

// shared by every Raldi, so several of them near one player cost one scan
const privacyMemo = createMemo(PRIVACY_CACHE_TICKS);

function nextInterval(notebooks) {
    const base = MOVE_INTERVAL_SECONDS[notebooks] * 20;
    return base * (INTERVAL_JITTER_MIN + Math.random() * (INTERVAL_JITTER_MAX - INTERVAL_JITTER_MIN));
}

function isPrivate(player, tick) {
    return privacyMemo(player.id, tick, () => isNearBlockType(player.dimension, player.location, PRIVACY_RADIUS, TOILET_BLOCKS));
}

// big doors, windows and wall cutouts are see-through; unloaded blocks don't block
function blocksSight(typeId) {
    return typeId !== undefined && typeId !== AIR && !isBigDoorType(typeId) && !isPassableDecorType(typeId) && !typeId.includes("window");
}

function canSee(raldi, player) {
    const from = raldi.location;
    const to = player.location;
    return hasLineOfSight(
        raldi.dimension,
        { x: from.x, y: from.y + 1.5, z: from.z },
        { x: to.x, y: to.y + 1.4, z: to.z },
        blocksSight
    );
}

function clearDripLight(state) {
    const light = state.dripLight;
    if (!light) return;
    releaseLight(light.dimension, light.location);
    try {
        const block = light.dimension.getBlock(light.location);
        if (block?.typeId === DRIP_LIGHT_ID) {
            block.setType(AIR);
            invalidateBlock(light.dimension, light.location);
        }
    } catch { }
    state.dripLight = undefined;
}

function syncDripLight(entity, state) {
    const location = {
        x: Math.floor(entity.location.x),
        y: Math.floor(entity.location.y) + 2,
        z: Math.floor(entity.location.z)
    };
    const previous = state.dripLight;
    if (previous?.dimension.id === entity.dimension.id
        && previous.location.x === location.x
        && previous.location.y === location.y
        && previous.location.z === location.z) return;

    clearDripLight(state);
    try {
        const block = entity.dimension.getBlock(location);
        if (!block || block.typeId !== AIR) return;
        block.setType(DRIP_LIGHT_ID);
        claimLight(entity.dimension, location, entity.id);
        invalidateBlock(entity.dimension, location);
        state.dripLight = { dimension: entity.dimension, location };
    } catch { }
}

function setMode(state, mode) {
    if (state.mode === "dance" && mode !== "dance") stopStyle(state);
    state.mode = mode;
    state.anim.play(mode);
    if (mode === "dead") {
        try { state.anim.entity.clearVelocity(); } catch { }
    }
    if (mode === "drip") syncDripLight(state.anim.entity, state);
    else clearDripLight(state);
}

function playAt(entity, sound) {
    try { entity.dimension.playSound(sound, entity.location); } catch { }
}

function stopStyle(state) {
    state.styleNextAt = 0;
    try { world.getDimension("overworld").runCommand(`stopsound @a ${STYLE_SOUND}`); } catch { }
}

// the crackpipe sprite lasts exactly as long as ral_crack; ral_high follows in tick()
function startCrackpipe(entity, state, tick) {
    state.crackUntil = tick + CRACK_TICKS;
    state.highUntil = 0;
    setMode(state, "crackpipe");
    playAt(entity, CRACK_SOUND);
}

// max FOV for a moment, then ease back, and ral_seeplayer at the spotted player
function spotPlayer(player) {
    try { player.playSound(SEE_PLAYER_SOUND); } catch { }
    try { player.runCommand("camera @s fov_set 110"); } catch { }
    system.runTimeout(() => {
        if (!player.isValid) return;
        try { player.runCommand("camera @s fov_clear ease 0.6 out_sine"); } catch { }
    }, 3);
}

function takeCrackpipe(player) {
    const inventory = player.getComponent("minecraft:inventory");
    if (!inventory?.container) return false;
    const selectedSlot = player.selectedSlotIndex;
    for (let slot = 0; slot < 9; slot++) {
        const item = inventory.container.getItem(slot);
        if (item?.typeId !== CRACKPIPE_ID) continue;
        if (item.amount > 1) {
            item.amount--;
            inventory.container.setItem(slot, item);
        } else {
            inventory.container.setItem(slot);
        }
        if (slot === selectedSlot) player.onScreenDisplay.setActionBar("Raldi took your crackpipe.");
        return true;
    }
    return false;
}

function startRepel(raldi, state, player) {
    const x = raldi.location.x - player.location.x;
    const z = raldi.location.z - player.location.z;
    const length = Math.hypot(x, z) || 1;
    state.repelDirection = { x: x / length, z: z / length };
    state.repelSteps = 20;
    state.lead = undefined;
    state.lastSeen = undefined;
    state.targetPlayerId = undefined;
    state.wander = undefined;
}

function chooseTarget(raldi, state, ctx) {
    const players = ctx.players(raldi.dimension);
    if (state.targetPlayerId) {
        const tracked = players.find((player) => player.id === state.targetPlayerId);
        if (!tracked || !isTargetablePlayer(tracked)) {
            state.targetPlayerId = undefined;
            state.lastSeen = undefined;
        }
    }
    let nearest;
    let nearestDistance = Infinity;
    for (const player of players) {
        if (!isTargetablePlayer(player) || !state.sight.check(player.id, ctx.tick, () => canSee(raldi, player))) continue;
        const lastVisible = state.visibleAt.get(player.id);
        if (lastVisible === undefined || ctx.tick - lastVisible > SPOT_RESET_TICKS) spotPlayer(player);
        state.visibleAt.set(player.id, ctx.tick);
        const distance = distanceSquared(raldi.location, player.location);
        if (distance < nearestDistance) {
            nearest = player;
            nearestDistance = distance;
        }
    }
    if (nearest) {
        if (isPrivate(nearest, ctx.tick)) {
            startRepel(raldi, state, nearest);
            return undefined;
        }
        state.lastSeen = { ...nearest.location };
        state.targetPlayerId = nearest.id;
        return { location: nearest.location, player: nearest };
    }
    if (state.lastSeen) return { location: state.lastSeen };
    if (state.lead) return { location: state.lead };
    if (!state.wander || distanceSquared(raldi.location, state.wander) < 2) {
        state.wander = ctx.tick >= state.wanderRetryAt ? pickWanderGoal(raldi, 8, 20) : undefined;
        if (!state.wander) {
            if (ctx.tick >= state.wanderRetryAt) state.wanderRetryAt = ctx.tick + WANDER_RETRY_TICKS;
            return undefined;
        }
    }
    return { location: state.wander };
}

function completeDestination(state, destination) {
    if (state.lastSeen === destination) {
        state.lastSeen = undefined;
        state.targetPlayerId = undefined;
    }
    if (state.lead === destination) state.lead = undefined;
    if (state.wander === destination) state.wander = undefined;
}

// a finished path (even a partial one that got as close as the map allows) ends the destination;
// a wander spot he couldn't walk to at all is given a moment before he picks another.
// Returns false while waiting for a path search (state.nav.pending), which callers retry next tick.
function travel(raldi, state, destination, move, tick) {
    if (distanceSquared(raldi.location, destination) < ARRIVE_DISTANCE_SQUARED) {
        completeDestination(state, destination);
        return false;
    }
    const moved = move();
    if (state.nav.finished) {
        if (!moved && destination === state.wander) state.wanderRetryAt = tick + WANDER_RETRY_TICKS;
        completeDestination(state, destination);
    }
    return moved && !state.nav.pending;
}

function tick(raldi, state, ctx) {
    if (escapeStage() === ESCAPE_STAGE.won) return;
    const next = state.anim.update(ctx.tick);
    if (next) setMode(state, next);
    if (state.deadUntil > ctx.tick) return;
    if (state.deadUntil) {
        state.deadUntil = 0;
        setMode(state, state.resumeMode ?? "shake");
    }
    const exitPhase = isExitPhase();
    if (exitPhase) {
        state.freeroam = true;
        if (!state.exitPhaseApplied) {
            state.exitPhaseApplied = true;
            state.crackUntil = 0;
            state.highUntil = 0;
            setMode(state, "drip");
        }
    } else {
        state.exitPhaseApplied = false;
        const notebooks = Math.min(NOTEBOOK_GOAL, highestScore(ctx.players(raldi.dimension), NOTEBOOK_OBJECTIVE));
        if (notebooks === 1) {
            state.freeroam = false;
            // he keeps waving until the players are back in the hall with him (beginning.js)
            if (state.mode !== "dance" && isRaldiDanceCued()) setMode(state, "dance");
        } else if (notebooks >= 2) {
            state.freeroam = true;
            if (["dance", "wave", "idleWave"].includes(state.mode)) setMode(state, "shake");
        }
    }
    if (state.mode === "dance" && ctx.tick >= state.styleNextAt) {
        playAt(raldi, STYLE_SOUND);
        state.styleNextAt = ctx.tick + STYLE_TICKS;
    }
    if (!state.freeroam || STATIONARY_MODES.has(state.mode)) return;

    if (state.mode === "crackpipe") {
        if (ctx.tick < state.crackUntil) return;
        setMode(state, "shake");
        state.highUntil = ctx.tick + HIGH_TICKS;
        playAt(raldi, HIGH_SOUND);
        return;
    }
    if (state.highUntil) {
        if (ctx.tick < state.highUntil) return;
        state.highUntil = 0;
        state.burstSteps = 30;
    }

    if (exitPhase && state.mode !== "drip") setMode(state, "drip");

    if (exitPhase || highestScore(ctx.players(raldi.dimension), NOTEBOOK_OBJECTIVE) >= 2) {
        const touching = touchingPlayer(raldi, ctx);
        if (touching && !(state.repelSteps > 0 && isPrivate(touching, ctx.tick))) {
            catchPlayer(raldi, state, touching, ctx.tick);
            if (state.mode === "crackpipe" || state.deadUntil > ctx.tick) return;
        }
    }

    const tape = nearestActiveTape(raldi, ctx.tick);
    if (tape) {
        if (!state.avoidingTape) {
            state.avoidingTape = true;
            state.nextStep = ctx.tick;
            state.lead = undefined;
            state.lastSeen = undefined;
            state.targetPlayerId = undefined;
            state.wander = undefined;
            state.repelSteps = 0;
            state.nav.reset();
        }
        if (state.tapeKey !== tape.key || ctx.tick >= state.nextTapeGoal) {
            state.tapeKey = tape.key;
            state.tapeGoal = farthestReachableFrom(raldi.dimension, raldi.location, tape.location);
            state.nextTapeGoal = ctx.tick + 40;
            state.nav.reset();
        }
        if (ctx.tick < state.nextStep) return;
        const destination = state.tapeGoal;
        if (state.mode === "drip") {
            const players = ctx.players(raldi.dimension);
            const notebooks = Math.min(NOTEBOOK_GOAL, highestScore(players, NOTEBOOK_OBJECTIVE));
            const exits = exitPhase ? highestScore(players, EXIT_OBJECTIVE) : 0;
            const speed = exitPhase ? DRIP_EXIT_SPEED[Math.min(DRIP_EXIT_SPEED.length - 1, Math.max(0, exits))] : (DRIP_NOTEBOOK_SPEED[notebooks] ?? DRIP_NOTEBOOK_SPEED[2]);
            state.nav.glide(raldi, destination, speed);
            syncDripLight(raldi, state);
            state.nextStep = ctx.tick + 1;
        } else {
            state.nav.step(raldi, destination, 3);
            // still waiting for his path search: try again next tick
            if (state.nav.pending) return;
            setMode(state, "move");
            state.nextStep = ctx.tick + 5;
        }
        return;
    }
    if (state.avoidingTape) {
        state.avoidingTape = false;
        state.tapeKey = undefined;
        state.tapeGoal = undefined;
        state.nav.reset();
        state.nextStep = ctx.tick;
    }

    if (ctx.tick < state.nextStep) return;
    const players = ctx.players(raldi.dimension);
    const notebooks = Math.min(NOTEBOOK_GOAL, highestScore(players, NOTEBOOK_OBJECTIVE));
    const exits = exitPhase ? highestScore(players, EXIT_OBJECTIVE) : 0;
    if (!exitPhase && notebooks < 2) return;

    if (state.repelSteps > 0 && state.repelDirection) {
        const strength = 0.5 + 2.5 * state.repelSteps / 20;
        const destination = {
            x: raldi.location.x + state.repelDirection.x * strength,
            y: raldi.location.y,
            z: raldi.location.z + state.repelDirection.z * strength
        };
        travel(raldi, state, destination, () => state.nav.step(raldi, destination, Math.max(1, Math.floor(strength))), ctx.tick);
        if (state.nav.pending) return;
        state.repelSteps--;
        state.nextStep = ctx.tick + Math.max(2, 22 - state.repelSteps);
        return;
    }

    const target = chooseTarget(raldi, state, ctx);
    if (!target) return;
    if (target.player && distanceSquared(raldi.location, target.player.location) <= CATCH_DISTANCE_SQUARED) {
        catchPlayer(raldi, state, target.player, ctx.tick);
        return;
    }

    if (state.mode === "drip") {
        const speed = exitPhase
            ? DRIP_EXIT_SPEED[Math.min(DRIP_EXIT_SPEED.length - 1, Math.max(0, exits))]
            : DRIP_NOTEBOOK_SPEED[notebooks];
        travel(raldi, state, target.location, () => state.nav.glide(raldi, target.location, speed), ctx.tick);
        syncDripLight(raldi, state);
        state.nextStep = ctx.tick + 1;
        return;
    }

    const burstRatio = state.burstSteps / 30;
    const distance = Math.max(1, Math.floor(2.5 + burstRatio * 1.5));
    if (travel(raldi, state, target.location, () => state.nav.step(raldi, target.location, distance), ctx.tick)) {
        setMode(state, "move");
        try { raldi.dimension.playSound(SLAP_SOUND, raldi.location); } catch { }
    }
    // still waiting for his path search: the step happens next tick instead
    if (state.nav.pending) return;
    if (state.burstSteps > 0) state.burstSteps--;
    const normalDelay = nextInterval(notebooks);
    state.nextStep = ctx.tick + Math.max(1, Math.round(normalDelay * (1 - burstRatio * 0.8)));
}

// Raldi reached a player, or they ran into him: a private player pushes him off, a monke knocks him
// out, a crackpipe gets him high, and anyone else is dead
function catchPlayer(raldi, state, player, tick) {
    if (isPrivate(player, tick)) {
        startRepel(raldi, state, player);
    } else if (isMonke(player)) {
        onHit(raldi, state, "monke", player, tick);
        state.lastSeen = undefined;
        state.targetPlayerId = undefined;
    } else if (takeCrackpipe(player)) {
        state.lead = undefined;
        state.lastSeen = undefined;
        startCrackpipe(raldi, state, tick);
    } else {
        player.kill();
        state.lastSeen = undefined;
        state.targetPlayerId = undefined;
    }
}

// a player close enough to touch him (his collider in the original: no waiting for his next step)
function touchingPlayer(raldi, ctx) {
    const at = raldi.location;
    for (const player of ctx.players(raldi.dimension)) {
        if (distanceSquared(at, player.location) > CATCH_DISTANCE_SQUARED) continue;
        if (isTargetablePlayer(player)) return player;
    }
    return undefined;
}

// every death counts toward timesKilled, which sets how many bullets the next glock kill takes
function die(state, tick, ticks) {
    state.timesKilled++;
    state.resumeMode = state.mode;
    state.deadUntil = tick + ticks;
    setMode(state, "dead");
}

function onHit(entity, state, kind, source, tick) {
    if (state.deadUntil > tick) return false;
    // a Monkenator'd player bonks him on contact
    if (kind === "monke") {
        die(state, tick, MONKE_BONK_TICKS);
        try { entity.dimension.playSound(BONK_SOUND, entity.location); } catch { }
        try { entity.dimension.playSound(SCREAM_SOUND, entity.location); } catch { }
        return true;
    }
    if (kind === "firework" || kind === "hitman") {
        die(state, tick, 300);
        return true;
    }
    if (kind !== "glock" && kind !== "pinto") return false;
    state.glockHits++;
    if (state.glockHits < state.glockHitsRequired) return true;

    // 2 bullets the first time, then twice his death count (hp = timesKilled * 2 in the original)
    die(state, tick, 200);
    state.glockHits = 0;
    state.glockHitsRequired = state.timesKilled * 2;
    return true;
}

function onAction(entity, state, action) {
    state.nav.reset();
    switch (action) {
        case "dance": state.freeroam = false; setMode(state, "dance"); break;
        case "wave": state.freeroam = false; setMode(state, "wave"); break;
        case "freeroam": state.freeroam = true; setMode(state, "shake"); break;
        case "drip": state.freeroam = true; setMode(state, "drip"); break;
        case "shake": state.freeroam = false; setMode(state, "shake"); break;
        case "crackpipe": state.freeroam = true; startCrackpipe(entity, state, gameTick()); break;
        case "idle_wave": state.freeroam = false; setMode(state, "idleWave"); break;
        // back to the notebook phase (testing / new round)
        case "reset": state.freeroam = true; setMode(state, "shake"); break;
        default: return;
    }
    saveMode(entity, state);
}

const SAVED_MODE_PROPERTY = "brr:saved_mode";
const SAVABLE_MODES = new Set(["dance", "idleWave", "shake", "drip"]);

// transient modes (move, crackpipe, dead) resume as their base mode; a finished wave is idle-waving
function saveMode(entity, state) {
    let mode = state.mode === "wave" ? "idleWave" : state.mode;
    if (!SAVABLE_MODES.has(mode)) mode = "shake";
    try { entity.setDynamicProperty(SAVED_MODE_PROPERTY, `${state.freeroam ? 1 : 0}:${mode}`); } catch { }
}

function loadMode(entity) {
    let saved;
    try { saved = entity.getDynamicProperty(SAVED_MODE_PROPERTY); } catch { }
    if (typeof saved !== "string") return undefined;
    const [freeroam, mode] = saved.split(":");
    if (!SAVABLE_MODES.has(mode)) return undefined;
    return { freeroam: freeroam === "1", mode };
}

// Chipfloke jailed someone: head straight for the jail, no forget roll
function onEvent(entity, state, name, { location }) {
    if (!state.freeroam) return;
    // an exit was reached (exits.js): like the original's Hear(exit, 8), he always goes to check
    if (name === "exit") {
        if (state.mode === "crackpipe" || state.avoidingTape) return;
        state.lead = { ...location };
        state.wander = undefined;
        state.nav.reset();
        return;
    }
    if (name !== "jail") return;
    state.lead = { ...location };
    state.lastSeen = undefined;
    state.targetPlayerId = undefined;
    state.wander = undefined;
    state.nav.reset();
}

function onSound(entity, state, { location, source }) {
    if (!state.freeroam || state.mode === "crackpipe" || state.avoidingTape) return;
    // a ringing alarm clock is a guaranteed distraction, door noises only sometimes lead him
    if (source?.typeId !== "brr:alarm_clock" && Math.random() < DOOR_LEAD_FORGET_CHANCE) return;
    state.lead = { ...location };
    state.wander = undefined;
    state.nav.reset();
}

function createState(entity) {
    const state = {
        mode: "wave",
        anim: new Animator(entity, CLIPS),
        // he goes after players, noises and jailings anywhere in the school
        nav: new Navigator({ doorHeight: 3, ...LONG_RANGE }),
        sight: new SightMemo(SIGHT_CHECK_TICKS),
        freeroam: false,
        exitPhaseApplied: false,
        nextStep: 0,
        lead: undefined,
        lastSeen: undefined,
        wander: undefined,
        wanderRetryAt: 0,
        crackUntil: 0,
        highUntil: 0,
        styleNextAt: 0,
        visibleAt: new Map(),
        burstSteps: 0,
        repelSteps: 0,
        repelDirection: undefined,
        avoidingTape: false,
        tapeKey: undefined,
        tapeGoal: undefined,
        nextTapeGoal: 0,
        targetPlayerId: undefined,
        dripLight: undefined,
        glockHits: 0,
        glockHitsRequired: 2,
        timesKilled: 1,
        deadUntil: 0,
        resumeMode: undefined
    };
    raldiStates.set(entity.id, { entity, state });
    const saved = loadMode(entity);
    if (saved) {
        state.freeroam = saved.freeroam;
        setMode(state, saved.mode);
    } else {
        setMode(state, "wave");
    }
    return state;
}

// the escape reset is world state, so it must work even when no Raldi is summoned
system.afterEvents.scriptEventReceive.subscribe(({ id, message }) => {
    if (id !== "brr:raldi" || message.trim().toLowerCase() !== "reset") return;
    resetEscape();
});

registerCharacter({
    typeId: RALDI_ID,
    scriptEventId: "brr:raldi",
    createState,
    tick,
    onHit,
    onAction,
    onSound,
    onEvent,
    onRemove(state) {
        raldiStates.delete(state.anim.entity.id);
        clearDripLight(state);
        if (state.mode === "dance") stopStyle(state);
    }
});
