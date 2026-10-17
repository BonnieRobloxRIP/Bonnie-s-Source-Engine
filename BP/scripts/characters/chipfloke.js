import { system, world } from "@minecraft/server";
import { AIR, floorTypeUnder, isPassableDecorType } from "../core/block_cache.js";
import { distanceSquared } from "../core/math.js";
import { gameTick, isPaused } from "../core/pause.js";
import { isBigDoorType } from "../doors.js";
import { findJailSpot, getJail, jailPlayer } from "../jail.js";
import { LONG_RANGE, Navigator, pickWanderGoal, WANDER_RETRY_TICKS } from "./navigation.js";
import { hasLineOfSight, isTargetablePlayer } from "./perception.js";
import { emitEvent, isCharacterWanted, notifyCharacter, registerCharacter, wantedCharacters } from "./registry.js";
import { SegmentedSound } from "./segmented_sound.js";

// Chipfloke (ChipflokeScript.cs). Rule breaks work like the original's guilt: every offence sets a
// guilt type and a few ticks of guilt (the newest offence wins if it lasts at least as long), and he
// only reacts once he has watched a guilty player for half a second. Then he chases until he catches
// them; anyone else he sees misbehaving meanwhile waits in his punish queue.

const CHIPFLOKE_ID = "brr:chipfloke";
const WANDER_SPEED = 0.15;
const CHASE_SPEED = 0.33;
const CATCH_DISTANCE_SQUARED = 1.5 * 1.5;
// his raycast is unlimited in the original; this only bounds the line-of-sight walk
const SIGHT_RANGE_SQUARED = 128 * 128;
const RULE_CHECK_INTERVAL_TICKS = 2;
// a rule break has to stay in sight this long before he reacts (timeSeenRuleBreak > 0.5)
const REACT_TICKS = 10;
// chip_whistle.ogg is 11.31 s, then 15-35 s of quiet; 15 s after a catch
const WHISTLE_LENGTH_TICKS = 226;
const WHISTLE_PAUSE_MIN_TICKS = 300;
const WHISTLE_PAUSE_MAX_TICKS = 700;
const WHISTLE_AFTER_CATCH_TICKS = 300;
// he stands at the jail this long after locking someone up (coolDown = 5)
const CATCH_REST_TICKS = 100;
// chip_jailtime.ogg is ~0.94s, the scold follows right after
const SCOLD_DELAY_TICKS = 22;
const MOVING_SPEED_THRESHOLD = 0.02;
const GRASS_BLOCK = "brr:grass";
const FACULTY_FLOOR = "brr:carpet_checker";
// standing on these counts as still being in the bathroom, where not having washed yet is fine
const BATHROOM_FLOORS = new Set(["brr:bathroom_tile", "brr:bathroom_tile2", "brr:beastbathroom_carpet", "brr:beastbathroom_carpet2"]);
const BSODA_ID = "brr:item_bsoda";
const CRANBERRY_ID = "brr:item_sprite_cranberry";

// guilt each offence leaves, in ticks (ResetGuilt amounts in the original)
const GUILT_TICKS = {
    running: 2,
    shit: 2,
    faculty: 20,
    drinking: 20
};

const RULES = {
    running: { seconds: 10, sound: "chip.running" },
    faculty: { seconds: 20, sound: "chip.faculty" },
    shit: { seconds: 10, sound: "chip.shit" },
    escape: { seconds: 45, sound: "chip.escape" },
    drinking: { seconds: 15, sound: "chip.drinking" }
};

// player id -> { guilt (ticks left), guiltType, unwashed }
const playerFlags = new Map();

function flagsFor(player) {
    let flags = playerFlags.get(player.id);
    if (!flags) {
        flags = { guilt: 0, guiltType: undefined, unwashed: false };
        playerFlags.set(player.id, flags);
    }
    return flags;
}

function resetGuilt(player, type) {
    const flags = flagsFor(player);
    const ticks = GUILT_TICKS[type];
    if (ticks < flags.guilt) return;
    flags.guilt = ticks;
    flags.guiltType = type;
}

// set by the toilet and cleared by the sink (bathroom.js): rule 3 applies once an unwashed player leaves the bathroom
export function setUnwashed(player, unwashed) {
    flagsFor(player).unwashed = unwashed;
}

world.afterEvents.itemUse.subscribe(({ itemStack, source }) => {
    if (itemStack.typeId === BSODA_ID || itemStack.typeId === CRANBERRY_ID) resetGuilt(source, "drinking");
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => playerFlags.delete(playerId));

// `/scriptevent brr:hygiene dirty|clean` from a player, for testing
system.afterEvents.scriptEventReceive.subscribe(({ id, message, sourceEntity }) => {
    if (id !== "brr:hygiene" || sourceEntity?.typeId !== "minecraft:player") return;
    setUnwashed(sourceEntity, message.trim().toLowerCase() !== "clean");
});

function isRunning(player) {
    if (!player.isSprinting) return false;
    const velocity = player.getVelocity();
    return Math.hypot(velocity.x, velocity.z) > MOVING_SPEED_THRESHOLD;
}

// the ongoing offences refresh their guilt every tick they last, and all guilt wears off
system.runInterval(() => {
    if (isPaused()) return;
    for (const player of world.getAllPlayers()) {
        if (!isTargetablePlayer(player)) continue;
        const flags = flagsFor(player);
        if (flags.guilt > 0) flags.guilt--;
        const floor = floorTypeUnder(player);
        if (isRunning(player)) resetGuilt(player, "running");
        if (flags.unwashed && !BATHROOM_FLOORS.has(floor)) resetGuilt(player, "shit");
        if (floor === FACULTY_FLOOR) resetGuilt(player, "faculty");
    }
}, 1);

// he looks the other way for everything outdoors
function isOutside(player) {
    return floorTypeUnder(player) === GRASS_BLOCK;
}

// the rule a player is breaking right now, if any
function brokenRule(player) {
    if (isOutside(player)) return undefined;
    const jail = getJail(player);
    // locked up is out of reach; out of the cell before the time is up is a jailbreak
    if (jail) return jail.escaped ? "escape" : undefined;
    const flags = flagsFor(player);
    return flags.guilt > 0 ? flags.guiltType : undefined;
}

// the rule he goes after them for: the latest one, even if it already wore off (GuiltType)
function chargeFor(player) {
    if (getJail(player)?.escaped) return "escape";
    return flagsFor(player).guiltType ?? "running";
}

function blocksSight(typeId) {
    return typeId !== undefined && typeId !== AIR && !isBigDoorType(typeId) && !isPassableDecorType(typeId) && !typeId.includes("window");
}

function canSee(chip, target) {
    const from = chip.location;
    const to = target.location;
    if (distanceSquared(from, to) > SIGHT_RANGE_SQUARED) return false;
    return hasLineOfSight(
        chip.dimension,
        { x: from.x, y: from.y + 1.4, z: from.z },
        { x: to.x, y: to.y + 1.5, z: to.z },
        blocksSight
    );
}

function randomBetween(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

function setChasing(entity, state, chasing) {
    const value = chasing ? 1 : 0;
    if (state.shownChasing === value) return;
    try {
        entity.setProperty("brr:chasing", value);
        state.shownChasing = value;
    } catch { }
}

function playAt(dimension, soundId, location) {
    try { dimension.playSound(soundId, location); } catch { }
}

function enqueue(state, kind, id) {
    if (state.queue.some((entry) => entry.id === id)) return;
    state.queue.push({ kind, id });
}

function startChase(entity, state, player, tick) {
    state.mode = "chase";
    state.targetKind = "player";
    state.targetId = player.id;
    state.rule = chargeFor(player);
    state.nav.reset();
    setChasing(entity, state, true);
    playAt(entity.dimension, RULES[state.rule].sound, entity.location);
}

// other characters misbehaving (Van Man kidnapping, the British Bloke shaking a player down)
function startSuspectChase(entity, state, suspect, tick) {
    state.mode = "chase";
    state.targetKind = "character";
    state.targetId = suspect.entity.id;
    state.catchDistanceSquared = suspect.catchDistance * suspect.catchDistance;
    state.rule = undefined;
    state.nav.reset();
    setChasing(entity, state, true);
    if (suspect.chaseSound) playAt(entity.dimension, suspect.chaseSound, entity.location);
    notifyCharacter(suspect.entity, "onPursued", entity);
}

// the current target is done with (caught or gone); the next one in the queue is up
function endChase(entity, state, tick) {
    if (state.targetKind === "character" && state.targetId) {
        const suspect = world.getEntity(state.targetId);
        if (suspect?.isValid) notifyCharacter(suspect, "onPursuitEnded");
    }
    state.queue = state.queue.filter((entry) => entry.id !== state.targetId);
    state.targetKind = undefined;
    state.targetId = undefined;
    state.rule = undefined;
    state.mode = "wander";
    state.wander = undefined;
    state.nav.reset();
    setChasing(entity, state, false);
}

function catchPlayer(entity, state, player, tick) {
    const rule = RULES[state.rule];
    const dimension = entity.dimension;
    const spot = findJailSpot(dimension, entity.location);
    let chipLocation = entity.location;
    let jailLocation;
    if (spot) {
        jailLocation = { x: spot.x + 0.5, y: spot.y, z: spot.z + 0.5 };
        chipLocation = { x: jailLocation.x, y: jailLocation.y, z: jailLocation.z + 2 };
        try {
            player.teleport(jailLocation, { dimension, facingLocation: { x: chipLocation.x, y: chipLocation.y + 1.2, z: chipLocation.z } });
            entity.teleport(chipLocation, { dimension, facingLocation: jailLocation });
        } catch { }
    }

    jailPlayer(player, rule.seconds, spot);
    // getting locked up counts as having washed up
    const flags = flagsFor(player);
    flags.unwashed = false;
    flags.guilt = 0;

    playAt(dimension, "chip.jailtime", chipLocation);
    state.scoldAt = tick + SCOLD_DELAY_TICKS;
    state.restUntil = tick + CATCH_REST_TICKS;
    state.nextWhistleAt = tick + WHISTLE_AFTER_CATCH_TICKS;
    if (jailLocation) emitEvent(dimension, "jail", { location: jailLocation, player });
    endChase(entity, state, tick);
}

// another character just gets sent off; no jail speech for them
function catchSuspect(entity, state, suspect, tick) {
    // the suspect counts as caught, so endChase must not report a give-up
    state.targetKind = undefined;
    notifyCharacter(suspect, "onApprehended", entity);
    endChase(entity, state, tick);
}

// watches for guilty players (half a second in view) and wanted characters (on sight)
function scanRules(entity, state, ctx) {
    for (const player of ctx.players(entity.dimension)) {
        if (!isTargetablePlayer(player) || state.targetId === player.id) {
            state.watching.delete(player.id);
            continue;
        }
        if (!brokenRule(player) || !canSee(entity, player)) {
            state.watching.delete(player.id);
            continue;
        }
        const seen = (state.watching.get(player.id) ?? 0) + RULE_CHECK_INTERVAL_TICKS;
        if (seen >= REACT_TICKS) {
            state.watching.delete(player.id);
            enqueue(state, "player", player.id);
        } else {
            state.watching.set(player.id, seen);
        }
    }
    for (const suspect of wantedCharacters(entity.dimension, ctx)) {
        if (suspect.entity.id === state.targetId || !canSee(entity, suspect.entity)) continue;
        enqueue(state, "character", suspect.entity.id);
    }
}

// takes the front of the queue once he's free, skipping anyone no longer around
function pursueNext(entity, state, ctx) {
    while (state.queue.length) {
        const next = state.queue[0];
        if (next.kind === "player") {
            const player = ctx.players(entity.dimension).find((candidate) => candidate.id === next.id);
            if (player && isTargetablePlayer(player) && !(getJail(player) && !getJail(player).escaped)) {
                startChase(entity, state, player, ctx.tick);
                return true;
            }
        } else {
            const suspect = wantedCharacters(entity.dimension, ctx).find((entry) => entry.entity.id === next.id);
            if (suspect) {
                startSuspectChase(entity, state, suspect, ctx.tick);
                return true;
            }
        }
        state.queue.shift();
    }
    return false;
}

function chaseSuspectTick(entity, state, ctx) {
    const suspect = world.getEntity(state.targetId);
    if (!suspect?.isValid || suspect.dimension.id !== entity.dimension.id || !isCharacterWanted(suspect, ctx)) {
        endChase(entity, state, ctx.tick);
        return;
    }
    if (distanceSquared(entity.location, suspect.location) <= state.catchDistanceSquared) {
        catchSuspect(entity, state, suspect, ctx.tick);
        return;
    }
    state.nav.glide(entity, suspect.location, CHASE_SPEED);
}

// no giving up: he only stops once they're caught, gone, or already locked up
function chaseTick(entity, state, ctx) {
    if (state.targetKind === "character") {
        chaseSuspectTick(entity, state, ctx);
        return;
    }
    const player = ctx.players(entity.dimension).find((candidate) => candidate.id === state.targetId);
    const jail = player && getJail(player);
    if (!player || !isTargetablePlayer(player) || (jail && !jail.escaped)) {
        endChase(entity, state, ctx.tick);
        return;
    }
    if (distanceSquared(entity.location, player.location) <= CATCH_DISTANCE_SQUARED) {
        catchPlayer(entity, state, player, ctx.tick);
        return;
    }
    state.nav.glide(entity, player.location, CHASE_SPEED);
}

// arriving goes straight on to the next spot; one he couldn't reach is given a moment first
function wanderTick(entity, state, ctx) {
    if (ctx.tick < state.restUntil || ctx.tick < state.wanderRetryAt) return;
    if (!state.wander) {
        state.wander = pickWanderGoal(entity, 8, 20);
        state.nav.reset();
        if (!state.wander) {
            state.wanderRetryAt = ctx.tick + WANDER_RETRY_TICKS;
            return;
        }
    }
    if (!state.nav.glide(entity, state.wander, WANDER_SPEED)) {
        if (!state.nav.complete) state.wanderRetryAt = ctx.tick + WANDER_RETRY_TICKS;
        state.wander = undefined;
    }
}

function tick(entity, state, ctx) {
    if (!state.active) return;

    // he only whistles while he isn't after anyone
    if (ctx.tick >= state.nextWhistleAt) {
        if (state.mode !== "chase") state.whistle.start(ctx.tick);
        state.nextWhistleAt = ctx.tick + WHISTLE_LENGTH_TICKS + randomBetween(WHISTLE_PAUSE_MIN_TICKS, WHISTLE_PAUSE_MAX_TICKS);
    }
    state.whistle.update(entity, ctx.tick);
    if (state.scoldAt !== undefined && ctx.tick >= state.scoldAt) {
        state.scoldAt = undefined;
        playAt(entity.dimension, "chip.scold", entity.location);
    }

    if (ctx.tick % RULE_CHECK_INTERVAL_TICKS === 0) scanRules(entity, state, ctx);
    if (state.mode !== "chase" && !pursueNext(entity, state, ctx)) {
        wanderTick(entity, state, ctx);
        return;
    }
    chaseTick(entity, state, ctx);
}

function onAction(entity, state, action) {
    const now = gameTick();
    switch (action) {
        case "stop": state.active = false; state.queue = []; endChase(entity, state, now); break;
        case "start": state.active = true; break;
        case "reset": state.queue = []; endChase(entity, state, now); break;
    }
}

function createState(entity) {
    const now = gameTick();
    const state = {
        active: true,
        mode: "wander",
        // he chases until he catches them, wherever they run
        nav: new Navigator({ doorHeight: 2, skipOpenDoor: (typeId) => typeId === "brr:door_jail", ...LONG_RANGE }),
        wander: undefined,
        wanderRetryAt: 0,
        queue: [],
        // player id -> ticks a rule break has been in view
        watching: new Map(),
        targetKind: undefined,
        targetId: undefined,
        catchDistanceSquared: CATCH_DISTANCE_SQUARED,
        rule: undefined,
        whistle: new SegmentedSound("chip.whistle_seg"),
        nextWhistleAt: now + randomBetween(WHISTLE_PAUSE_MIN_TICKS, WHISTLE_PAUSE_MAX_TICKS),
        restUntil: 0,
        scoldAt: undefined,
        shownChasing: undefined
    };
    setChasing(entity, state, false);
    return state;
}

registerCharacter({
    typeId: CHIPFLOKE_ID,
    scriptEventId: "brr:chipfloke",
    createState,
    tick,
    onAction
});
