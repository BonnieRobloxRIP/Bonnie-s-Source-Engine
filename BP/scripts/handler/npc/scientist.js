import { system, world } from "@minecraft/server";
import { playWorldSound } from "../core/player_settings.js";
import { showSubtitle } from "../core/action_bar.js";
import { SCIENTIST_LINES } from "./scientist_lines.js";

// Black Mesa scientist reactions (rules from Black Mesa's scripts/talker/npc_human_scientist.txt):
//   - hello: the player is really near (128 units ~ 3.25 blocks) AND looking at him, and he isn't provoked
//   - bumped: the player walks into him while facing him -> apology, startle, step aside (respeakdelay 5 s)
//   - hit by a player: "No! / I'm on your side!" -> "Stop it, Freeman!" -> "Good God!" and he's provoked
//     (keeps away from players, no more greetings) for a while
//   - hurt by anything else: pain line
//   - idle chatter: with a player within earshot (512 units ~ 13 blocks), a calm scientist asks a calm colleague
//     nearby a question and gets an answer; they stop wandering, face each other and gesture while talking
// Everything said is subtitled in the action bar of players nearby (Black Mesa's closed captions).
// Animations are played client-side: the script bumps brr:react_n with the reaction in brr:react
// (tools/bm_anim/npc_entity.mjs builds the controller that reads them).

// SECTION: Constants
const SCIENTIST_TYPE = "brr:scientist_01";
const DIMENSIONS = ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"];
const TICK_INTERVAL = 4;
const VOICE_RANGE = 24;
const SUBTITLE_RANGE = 14;
const SUBTITLE_LINGER_TICKS = 20;

const HELLO_DISTANCE = 3.25;
const HELLO_CLOSE_DISTANCE = 2.0;
const HELLO_REPEAT_TICKS = 120 * 20; // per player
const HELLO_GAP_TICKS = 8 * 20; // between any two greetings
const STILL_SPEED = 0.03; // blocks/tick: only greets while standing

const BUMP_DISTANCE = 0.95; // centre to centre; the boxes touch at ~0.7
const BUMP_APPROACH_SPEED = 0.04; // blocks/tick toward him
const BUMP_REPEAT_TICKS = 5 * 20;
const STEP_ASIDE_IMPULSE = 0.45;

const STRIKE_MEMORY_TICKS = 30 * 20; // hits further apart than this start over
const PROVOKED_TICKS = 5 * 60 * 20;
const PROVOKED_UNTIL = "brr:provoked_until";
const CALM_CHECK_TICKS = 100;
const PAIN_CHANCE = 0.7;

const CHAT_EARSHOT = 13; // a player has to be this close for them to chat (NearPlayer)
const CHAT_PARTNER_DISTANCE = 5;
const CHAT_SPACING = 12; // no two conversations closer than this
const CHAT_FIRST_DELAY_TICKS = [10 * 20, 30 * 20];
const CHAT_REPEAT_TICKS = [45 * 20, 120 * 20];
const CHAT_PAUSE_TICKS = [6, 16]; // between question and answer
const CHAT_TIMEOUT_TICKS = 30 * 20;
const CALM_AFTER_COMBAT_TICKS = 10 * 20; // NoRecentCombat

// matches the client controller (tools/bm_anim/npc_entity.mjs)
export const SCIENTIST_REACT = { WAVE: 1, WAVE_CLOSE: 2, BUMPED: 3, ASK: 4, ANSWER: 5 };

const stateByScientist = new Map();
const conversations = new Set();

// SECTION: Helpers
function randomBetween([low, high]) {
    return low + Math.floor(Math.random() * (high - low + 1));
}

function getState(entity) {
    let state = stateByScientist.get(entity.id);
    if (!state) {
        state = {
            speakingUntil: 0, lastLine: new Map(), helloByPlayer: new Map(), lastHello: -Infinity, lastBump: -Infinity,
            strikes: 0, lastStrike: -Infinity, lastHurt: -Infinity,
            nextChat: system.currentTick + randomBetween(CHAT_FIRST_DELAY_TICKS), conversation: undefined
        };
        stateByScientist.set(entity.id, state);
        // scientists spawned before wandering became a component group need it added (no-op otherwise)
        try {
            entity.triggerEvent("brr:stop_talking");
        } catch { }
    }
    return state;
}

function horizontal(a, b) {
    return { x: b.x - a.x, z: b.z - a.z };
}

function isProvoked(entity) {
    try {
        return entity.getProperty("brr:provoked") === true;
    } catch {
        return false;
    }
}

/**
 * Says a random line for the reaction (never the same one twice in a row) and subtitles it for players nearby.
 * Skipped while he's still talking unless `interrupt`. Returns the line's length in ticks (0: nothing said).
 */
function speak(entity, reaction, { interrupt = false } = {}) {
    const state = getState(entity);
    const tick = system.currentTick;
    if (!interrupt && tick < state.speakingUntil) return 0;

    const lines = SCIENTIST_LINES[reaction];
    if (!lines?.length) return 0;
    const last = state.lastLine.get(reaction);
    const pool = lines.length > 1 ? lines.filter((line) => line.id !== last) : lines;
    const line = pool[Math.floor(Math.random() * pool.length)];
    const ticks = Math.ceil(line.seconds * 20);

    let head;
    try {
        head = entity.getHeadLocation();
        playWorldSound(entity.dimension, line.id, head, {}, VOICE_RANGE);
    } catch {
        return 0;
    }
    state.lastLine.set(reaction, line.id);
    state.speakingUntil = tick + ticks + 10;

    if (line.text) {
        const name = entity.nameTag || "Scientist";
        try {
            for (const player of entity.dimension.getPlayers({ location: head, maxDistance: SUBTITLE_RANGE })) {
                showSubtitle(player, `§7${name}: §f${line.text}`, ticks + SUBTITLE_LINGER_TICKS, tick);
            }
        } catch { }
    }
    return ticks;
}

/** Plays a reaction animation on every client. */
function react(entity, kind) {
    try {
        const n = Number(entity.getProperty("brr:react_n")) || 0;
        entity.setProperty("brr:react", kind);
        entity.setProperty("brr:react_n", (n + 1) % 16);
    } catch { }
}

function provoke(entity) {
    try {
        entity.setDynamicProperty(PROVOKED_UNTIL, world.getAbsoluteTime() + PROVOKED_TICKS);
        if (!isProvoked(entity)) entity.triggerEvent("brr:become_provoked");
    } catch { }
}

function calmDownIfDue(entity) {
    if (!isProvoked(entity)) return;
    try {
        const until = Number(entity.getDynamicProperty(PROVOKED_UNTIL)) || 0;
        if (world.getAbsoluteTime() < until) return;
        entity.triggerEvent("brr:calm_down");
        getState(entity).strikes = 0;
    } catch { }
}

// SECTION: Greeting
function tryGreet(scientist, player, distance, tick) {
    if (distance > HELLO_DISTANCE || isProvoked(scientist)) return false;
    const state = getState(scientist);
    if (state.conversation) return false;
    if (tick - state.lastHello < HELLO_GAP_TICKS) return false;
    if (tick - (state.helloByPlayer.get(player.id) ?? -Infinity) < HELLO_REPEAT_TICKS) return false;

    const velocity = scientist.getVelocity();
    if (Math.hypot(velocity.x, velocity.z) > STILL_SPEED) return false;

    // "SeenByPlayer": the player's view ray actually lands on him (walls block it)
    let looking = false;
    try {
        looking = player.getEntitiesFromViewDirection({ maxDistance: HELLO_DISTANCE + 0.5 }).some((hit) => hit.entity?.id === scientist.id);
    } catch { }
    if (!looking) return false;

    if (!speak(scientist, "hello")) return false;
    react(scientist, distance < HELLO_CLOSE_DISTANCE ? SCIENTIST_REACT.WAVE_CLOSE : SCIENTIST_REACT.WAVE);
    state.lastHello = tick;
    state.helloByPlayer.set(player.id, tick);
    return true;
}

// SECTION: Bumping
function tryBump(scientist, player, tick) {
    const state = getState(scientist);
    if (tick - state.lastBump < BUMP_REPEAT_TICKS) return false;

    const offset = horizontal(player.location, scientist.location);
    const distance = Math.hypot(offset.x, offset.z);
    if (distance > BUMP_DISTANCE || distance < 1e-3) return false;
    const toward = { x: offset.x / distance, z: offset.z / distance };

    const velocity = player.getVelocity();
    if (velocity.x * toward.x + velocity.z * toward.z < BUMP_APPROACH_SPEED) return false;

    // he only takes it as a bump if the player was facing him
    const view = player.getViewDirection();
    const viewLength = Math.hypot(view.x, view.z) || 1;
    if ((view.x * toward.x + view.z * toward.z) / viewLength < 0.3) return false;

    state.lastBump = tick;
    speak(scientist, "bumped", { interrupt: true });
    react(scientist, SCIENTIST_REACT.BUMPED);

    // step aside: sideways off the player's path, plus a little along it
    const speed = Math.hypot(velocity.x, velocity.z) || 1;
    const along = { x: velocity.x / speed, z: velocity.z / speed };
    let side = { x: -along.z, z: along.x };
    const sideSign = side.x * offset.x + side.z * offset.z;
    if (sideSign < 0 || (Math.abs(sideSign) < 0.05 && Math.random() < 0.5)) side = { x: -side.x, z: -side.z };
    try {
        scientist.applyImpulse({
            x: side.x * STEP_ASIDE_IMPULSE + along.x * 0.15,
            y: 0,
            z: side.z * STEP_ASIDE_IMPULSE + along.z * 0.15
        });
    } catch { }
    return true;
}

// SECTION: Getting hurt
function getAttackingPlayer(damageSource) {
    let attacker = damageSource?.damagingEntity;
    if (!attacker) {
        try {
            attacker = damageSource?.damagingProjectile?.getComponent?.("minecraft:projectile")?.owner;
        } catch { }
    }
    return attacker?.typeId === "minecraft:player" ? attacker : undefined;
}

world.afterEvents.entityHurt.subscribe((event) => {
    const scientist = event.hurtEntity;
    if (!scientist?.isValid) return;
    let alive = true;
    try {
        alive = (scientist.getComponent("minecraft:health")?.currentValue ?? 1) > 0;
    } catch { }
    if (!alive) return;

    const tick = system.currentTick;
    const state = getState(scientist);
    state.lastHurt = tick;
    const player = getAttackingPlayer(event.damageSource);
    if (!player) {
        if (Math.random() < PAIN_CHANCE) speak(scientist, "pain", { interrupt: tick - state.lastStrike > 20 });
        return;
    }

    state.strikes = tick - state.lastStrike > STRIKE_MEMORY_TICKS ? 1 : state.strikes + 1;
    state.lastStrike = tick;
    if (state.strikes === 1 && !isProvoked(scientist)) {
        speak(scientist, "hit_1", { interrupt: true });
    } else if (state.strikes === 2 && !isProvoked(scientist)) {
        speak(scientist, "hit_2", { interrupt: true });
    } else {
        speak(scientist, isProvoked(scientist) ? "pain" : "betrayed", { interrupt: true });
        provoke(scientist);
    }
}, { entityTypes: [SCIENTIST_TYPE] });

world.afterEvents.entityDie.subscribe((event) => {
    stateByScientist.delete(event.deadEntity?.id);
}, { entityTypes: [SCIENTIST_TYPE] });

// SECTION: Idle chatter
function isCalm(scientist, state, tick) {
    return !state.conversation && !isProvoked(scientist) && tick >= state.speakingUntil && tick - state.lastHurt > CALM_AFTER_COMBAT_TICKS;
}

function distanceBetween(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function canSee(dimension, from, to) {
    const distance = distanceBetween(from, to);
    try {
        const direction = { x: (to.x - from.x) / distance, y: (to.y - from.y) / distance, z: (to.z - from.z) / distance };
        return !dimension.getBlockFromRay(from, direction, { maxDistance: distance, includePassableBlocks: false });
    } catch {
        return true;
    }
}

/** Turns the body toward a point (the client plays a step-turn for big changes). */
function face(entity, target) {
    try {
        const dx = target.x - entity.location.x, dz = target.z - entity.location.z;
        entity.setRotation({ x: 0, y: (Math.atan2(-dx, dz) * 180) / Math.PI });
    } catch { }
}

function tryStartChat(asker, tick) {
    const state = getState(asker);
    if (tick < state.nextChat || !isCalm(asker, state, tick)) return false;
    // the next attempt waits a bit whether or not this one works out
    state.nextChat = tick + randomBetween(CHAT_FIRST_DELAY_TICKS);

    const askerHead = asker.getHeadLocation();
    for (const other of conversations) {
        if (other.asker.isValid && distanceBetween(other.asker.location, asker.location) < CHAT_SPACING) return false;
    }
    let partners;
    try {
        partners = asker.dimension.getEntities({ type: SCIENTIST_TYPE, location: asker.location, maxDistance: CHAT_PARTNER_DISTANCE, closest: 4 });
    } catch {
        return false;
    }
    const answerer = partners.find((other) => other.id !== asker.id && other.isValid && isCalm(other, getState(other), tick) && canSee(asker.dimension, askerHead, other.getHeadLocation()));
    if (!answerer) return false;

    const questionTicks = speak(asker, "question");
    if (!questionTicks) return false;
    react(asker, SCIENTIST_REACT.ASK);
    for (const [entity, other] of [[asker, answerer], [answerer, asker]]) {
        try {
            entity.triggerEvent("brr:start_talking");
        } catch { }
        face(entity, other.location);
    }
    const conversation = { asker, answerer, start: tick, answerAt: tick + questionTicks + randomBetween(CHAT_PAUSE_TICKS), endAt: undefined };
    state.conversation = conversation;
    getState(answerer).conversation = conversation;
    conversations.add(conversation);
    return true;
}

function endChat(conversation, tick) {
    conversations.delete(conversation);
    for (const entity of [conversation.asker, conversation.answerer]) {
        const state = stateByScientist.get(entity.id);
        if (state) {
            state.conversation = undefined;
            state.nextChat = tick + randomBetween(CHAT_REPEAT_TICKS);
        }
        if (!entity.isValid) continue;
        try {
            entity.triggerEvent("brr:stop_talking");
        } catch { }
    }
}

function updateChat(conversation, tick) {
    const { asker, answerer, start } = conversation;
    // anything happening to either of them (hit, bumped, provoked, gone) breaks it off
    const broken = [asker, answerer].some((entity) => {
        if (!entity.isValid) return true;
        const state = stateByScientist.get(entity.id);
        return !state || state.lastHurt >= start || state.lastBump >= start || isProvoked(entity);
    });
    if (broken || tick - start > CHAT_TIMEOUT_TICKS) {
        endChat(conversation, tick);
        return;
    }
    if (conversation.endAt === undefined) {
        if (tick < conversation.answerAt) return;
        const answerTicks = speak(answerer, "answer");
        if (!answerTicks) {
            endChat(conversation, tick);
            return;
        }
        react(answerer, SCIENTIST_REACT.ANSWER);
        conversation.endAt = tick + answerTicks + 20;
        return;
    }
    if (tick >= conversation.endAt) endChat(conversation, tick);
}

// SECTION: Runtime Tick
system.runInterval(() => {
    const tick = system.currentTick;
    const seen = new Set();
    for (const dimensionId of DIMENSIONS) {
        let dimension, players;
        try {
            dimension = world.getDimension(dimensionId);
            players = dimension.getPlayers();
        } catch {
            continue;
        }
        const withinEarshot = new Map();
        for (const player of players) {
            let scientists;
            try {
                scientists = dimension.getEntities({ type: SCIENTIST_TYPE, location: player.location, maxDistance: CHAT_EARSHOT });
            } catch {
                continue;
            }
            const eye = player.getHeadLocation();
            for (const scientist of scientists) {
                if (!scientist.isValid) continue;
                seen.add(scientist.id);
                withinEarshot.set(scientist.id, scientist);
                try {
                    if (tryBump(scientist, player, tick)) continue;
                    const head = scientist.getHeadLocation();
                    tryGreet(scientist, player, distanceBetween(head, eye), tick);
                } catch { }
            }
        }
        for (const scientist of withinEarshot.values()) {
            try {
                tryStartChat(scientist, tick);
            } catch { }
        }
    }
    for (const conversation of [...conversations]) {
        try {
            updateChat(conversation, tick);
        } catch {
            endChat(conversation, tick);
        }
    }
    // provoked ones keep away from players, so the calm-down check sweeps every loaded scientist (slowly)
    if (tick % CALM_CHECK_TICKS < TICK_INTERVAL) {
        for (const dimensionId of DIMENSIONS) {
            try {
                for (const scientist of world.getDimension(dimensionId).getEntities({ type: SCIENTIST_TYPE })) {
                    getState(scientist);
                    calmDownIfDue(scientist);
                }
            } catch { }
        }
    }
    // forget scientists that unloaded
    if (tick % 1200 < TICK_INTERVAL) {
        for (const id of stateByScientist.keys()) {
            if (!seen.has(id) && !world.getEntity(id)) stateByScientist.delete(id);
        }
    }
}, TICK_INTERVAL);
