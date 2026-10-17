import { InputPermissionCategory, ItemStack, system, world } from "@minecraft/server";
import { AIR, blockTypeAt, invalidateBlock, isPassableDecorType } from "../core/block_cache.js";
import { createMarkerType } from "../core/block_markers.js";
import { distanceSquared } from "../core/math.js";
import { gameTick, holdPause, isPaused, releasePause } from "../core/pause.js";
import { CREDIT_CARD_TAG } from "../core/game_state.js";
import { giveToHotbar } from "../core/hotbar.js";
import { addScore } from "../core/scoreboard.js";
import { isBigDoorType } from "../doors.js";
import { setChallengeTimer } from "../hud.js";
import { grantGlock } from "../item_functionality.js";
import { findMeme, isXmasMode, playMeme } from "../memes.js";
import { canStandAt, Navigator, pickWanderGoal, WANDER_RETRY_TICKS } from "./navigation.js";
import { hasLineOfSight, isTargetablePlayer } from "./perception.js";
import { registerCharacter } from "./registry.js";
import { SegmentedSound } from "./segmented_sound.js";
import { cancelBeastBattle, startBeastBattle } from "../beast_battle.js";
import { endMonke } from "../monke.js";

const MRBEAST_ID = "brr:mrbeast";
const CIRCLE_ID = "brr:beast_circle";
const CARD_BLOCK_ID = "brr:item_card_block";
export const CARD_SPOT_BLOCK_ID = "brr:mrbeast_card_spot";
const QUARTER_BLOCK_ID = "brr:item_quarter_block";
const BEAST_DOORS = new Set(["brr:door_beast"]);

const WANDER_SPEED = 0.2;
const CHASE_SPEED = 0.4;
const CATCH_DISTANCE_SQUARED = 1.5 * 1.5;
const ARRIVE_DISTANCE_SQUARED = 0.1;
const SIGHT_RANGE_SQUARED = 40 * 40;
const SIGHT_CHECK_INTERVAL_TICKS = 2;
const LOSE_SIGHT_TICKS = 200;
const CHASE_COOLDOWN_TICKS = 1200;

const QUARTER_INTERVAL_TICKS = 30 * 20;
const QUARTER_LIFETIME_TICKS = 600;
const QUARTERS_PROPERTY = "brr:beast_quarters";
// the lifetimes count down every second but are only written back this often (a world reload gives a
// quarter at most this much extra life); dropping or clearing one is written right away
const QUARTERS_SAVE_INTERVAL_TICKS = 200;

// 10 block wide circle
const CIRCLE_RADIUS = 5;
const CHALLENGE_TICKS = 300;
const BEAST_STAND_OFFSET = 6;
// he watches the start of the challenge, then goes back to wandering
const CHALLENGE_WATCH_TICKS = 60;
const QUARTER_REWARD = 25;
const GLOCK_ID = "brr:item_glock";
const QUARTER_ID = "brr:item_quarter";
// every item except firework, credit card, gameboy, debt card, gold quarter, phone (and the future ornament)
const REWARD_ITEMS = [
    "brr:item_alarm", "brr:item_boots", "brr:item_bsoda", "brr:item_cowmarker", "brr:item_crackpipe",
    "brr:item_energy", GLOCK_ID, "brr:item_hammer", "brr:item_jailcard", "brr:item_key", "brr:item_lock",
    "brr:item_monkenator", "brr:item_polish_milk", "brr:item_poopmeter", "brr:item_potato", QUARTER_ID,
    "brr:item_sprite_cranberry", "brr:item_squee", "brr:item_tape", "brr:item_zestybar"
];

const DOOR_VISIT_MIN_TICKS = 1200;
const DOOR_VISIT_MAX_TICKS = 2400;
const DOOR_RETRY_TICKS = 400;
const DOOR_APPROACH_TIMEOUT_TICKS = 600;
const REST_TICKS = 400;
const DOOR_SEARCH_RADIUS = 24;
const DOOR_SEARCH_INTERVAL_TICKS = 200;
// how far from his door a credit card still counts as "in his room"
const CARD_ROOM_RADIUS = 12;
const CARD_ROOM_HEIGHT = 4;
const CARD_SPOTS_PROPERTY = "brr:beast_card_spots";
const MAD_PROPERTY = "brr:beast_mad";
const SPARED_PROPERTY = "brr:beast_spared";
const DOOR_PROPERTY = "brr:beast_door";

// sound lengths in ticks
const FOUNDCARD_TICKS = 139;
const INSTRUCT_CUT_TICKS = 40;
const WAIT_TICKS = 13;
const CHALLENGECARD_TICKS = 123;
const SCREECH_TICKS = 44;
const ENCOUNTER_CUTSCENE = "cutscene/beast_encounter";
const OVANIA_TICKS = 3840;
const OVANIA_SOUND = "beast.mrbeastovania";
const XMAS_VOICES = new Set(["beast.hey", "beast.challengeinstruct"]);
const CUTSCENE_MODES = new Set(["foundcard", "cardreveal", "screech", "encounter"]);

const beastSpot = createMarkerType("brr:beast_player_tp", "brr:beast_player_spots");

export function registerBeastComponents(blockComponentRegistry) {
    blockComponentRegistry.registerCustomComponent("brr:beast_player_spot", beastSpot.component);
    registerCardSpotComponent(blockComponentRegistry);
}

// ------------------------------------------------------------ credit card ----

// every spot a credit card block has ever sat on; a spot near his door that no longer holds the card = stolen
let cardSpots;

function loadCardSpots() {
    if (cardSpots) return cardSpots;
    try { cardSpots = JSON.parse(world.getDynamicProperty(CARD_SPOTS_PROPERTY) ?? "[]"); } catch { cardSpots = []; }
    return cardSpots;
}

// called from the card block's particle tick
export function noteCreditCard(dimension, location) {
    const spots = loadCardSpots();
    if (spots.some((spot) => spot.dimensionId === dimension.id && spot.x === location.x && spot.y === location.y && spot.z === location.z)) return;
    spots.push({ dimensionId: dimension.id, x: location.x, y: location.y, z: location.z });
    world.setDynamicProperty(CARD_SPOTS_PROPERTY, JSON.stringify(spots));
}

// "none" = no card was ever in his room (or he has no door), so he can never find it missing.
// A taken card leaves an invisible card spot block behind; any other block on a remembered spot
// means a builder cleared it, so he forgets that spot entirely.
function cardStatus(dimension, door) {
    if (!door) return "none";
    const spots = loadCardSpots();
    let known = false;
    let forgot = false;
    for (let i = spots.length - 1; i >= 0; i--) {
        const spot = spots[i];
        if (spot.dimensionId !== dimension.id) continue;
        if (Math.abs(spot.x - door.x) > CARD_ROOM_RADIUS || Math.abs(spot.z - door.z) > CARD_ROOM_RADIUS || Math.abs(spot.y - door.y) > CARD_ROOM_HEIGHT) continue;
        let block;
        try { block = dimension.getBlock(spot); } catch { }
        // unloaded: give him the benefit of the doubt
        if (!block || block.typeId === CARD_BLOCK_ID) {
            if (forgot) world.setDynamicProperty(CARD_SPOTS_PROPERTY, JSON.stringify(spots));
            return "present";
        }
        if (block.typeId === CARD_SPOT_BLOCK_ID) {
            known = true;
            continue;
        }
        spots.splice(i, 1);
        forgot = true;
    }
    if (forgot) world.setDynamicProperty(CARD_SPOTS_PROPERTY, JSON.stringify(spots));
    return known ? "missing" : "none";
}

// the player gives the card back (it's a tag on them, not an item); false if they don't have it
function takeCreditCard(player) {
    if (!player.hasTag(CREDIT_CARD_TAG)) return false;
    player.removeTag(CREDIT_CARD_TAG);
    return true;
}

// putting the card back where it was taken from: he finds it present again
function returnCreditCard(block, player) {
    if (!takeCreditCard(player)) return;
    const dimension = block.dimension;
    block.setType(CARD_BLOCK_ID);
    invalidateBlock(dimension, block.location);
    noteCreditCard(dimension, block.location);
    try { dimension.playSound("drop_item", { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 }); } catch { }
}

function registerCardSpotComponent(blockComponentRegistry) {
    blockComponentRegistry.registerCustomComponent("brr:card_spot", {
        onPlace({ block, dimension }) { noteCreditCard(dimension, block.location); },
        onTick({ block, dimension }) { noteCreditCard(dimension, block.location); },
        onPlayerInteract({ block, player }) { if (player) returnCreditCard(block, player); }
    });
}

// --------------------------------------------------------------- quarters ----

let quarters;
// the JSON last written, so an unchanged list is never written again
let savedQuarters;
let quartersSavedAt = -Infinity;

function loadQuarters() {
    if (quarters) return quarters;
    try {
        savedQuarters = world.getDynamicProperty(QUARTERS_PROPERTY);
        quarters = JSON.parse(savedQuarters ?? "[]");
    } catch { quarters = []; }
    return quarters;
}

function saveQuarters(now = false) {
    const tick = system.currentTick;
    if (!now && tick - quartersSavedAt < QUARTERS_SAVE_INTERVAL_TICKS) return;
    quartersSavedAt = tick;
    const json = quarters.length > 0 ? JSON.stringify(quarters) : undefined;
    if (json === savedQuarters) return;
    savedQuarters = json;
    world.setDynamicProperty(QUARTERS_PROPERTY, json);
}

function dropQuarter(entity) {
    const location = {
        x: Math.floor(entity.location.x),
        y: Math.floor(entity.location.y) + 1,
        z: Math.floor(entity.location.z)
    };
    let block;
    try { block = entity.dimension.getBlock(location); } catch { }
    if (!block?.isAir) return;
    block.setType(QUARTER_BLOCK_ID);
    invalidateBlock(entity.dimension, location);
    loadQuarters().push({ dimensionId: entity.dimension.id, ...location, left: QUARTER_LIFETIME_TICKS });
    saveQuarters(true);
}

// dropped quarters vanish after 30 seconds unless picked up
system.runInterval(() => {
    if (isPaused()) return;
    const list = loadQuarters();
    if (list.length === 0) return;
    let removed = false;
    for (let i = list.length - 1; i >= 0; i--) {
        const quarter = list[i];
        quarter.left -= 20;
        if (quarter.left > 0) continue;
        let block;
        try { block = world.getDimension(quarter.dimensionId).getBlock(quarter); } catch { }
        if (!block) continue;
        if (block.typeId === QUARTER_BLOCK_ID) {
            block.setType(AIR);
            invalidateBlock(block.dimension, quarter);
        }
        list.splice(i, 1);
        removed = true;
    }
    saveQuarters(removed);
}, 20);

// ----------------------------------------------------------------- circle ----

const activeCircles = new Set();

function spawnCircle(dimension, center) {
    try {
        const circle = dimension.spawnEntity(CIRCLE_ID, center);
        activeCircles.add(circle.id);
        return circle;
    } catch {
        return undefined;
    }
}

function removeCircle(circle) {
    if (!circle) return;
    activeCircles.delete(circle.id);
    try { circle.remove(); } catch { }
}

// circles left over from a challenge that was running when the world closed
function removeStrayCircle(entity) {
    if (entity?.typeId !== CIRCLE_ID || activeCircles.has(entity.id)) return;
    system.run(() => { try { entity.remove(); } catch { } });
}

world.afterEvents.entityLoad.subscribe(({ entity }) => removeStrayCircle(entity));
system.run(() => {
    for (const dimensionId of ["overworld", "nether", "the_end"]) {
        try {
            for (const entity of world.getDimension(dimensionId).getEntities({ type: CIRCLE_ID })) removeStrayCircle(entity);
        } catch { }
    }
});

// ---------------------------------------------------------------- helpers ----

function randomBetween(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

function voice(sound) {
    return isXmasMode() && XMAS_VOICES.has(sound) ? `${sound}_xmas` : sound;
}

function playAt(dimension, sound, location) {
    try { dimension.playSound(sound, location); } catch { }
}

function stopSound(dimension, sound) {
    try { dimension.runCommand(`stopsound @a ${sound}`); } catch { }
}

function setFrozen(player, frozen) {
    try { player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, !frozen); } catch { }
}

function setStill(entity, state, still) {
    const value = still ? 1 : 0;
    if (state.shownStill === value) return;
    try {
        entity.setProperty("brr:still", value);
        state.shownStill = value;
    } catch { }
}

function isAlive(player) {
    if (!player?.isValid) return false;
    try { return (player.getComponent("minecraft:health")?.currentValue ?? 1) > 0; } catch { return false; }
}

function findPlayer(entity, ctx, id) {
    return id ? ctx.players(entity.dimension).find((player) => player.id === id) : undefined;
}

function blocksSight(typeId) {
    return typeId !== undefined && typeId !== AIR && !isBigDoorType(typeId) && !isPassableDecorType(typeId) && !typeId.includes("window");
}

function canSee(entity, player) {
    const from = entity.location;
    const to = player.location;
    if (distanceSquared(from, to) > SIGHT_RANGE_SQUARED) return false;
    return hasLineOfSight(
        entity.dimension,
        { x: from.x, y: from.y + 1.6, z: from.z },
        { x: to.x, y: to.y + 1.5, z: to.z },
        blocksSight
    );
}

function nearestVisiblePlayer(entity, ctx) {
    let best;
    let bestDistance = Infinity;
    for (const player of ctx.players(entity.dimension)) {
        if (!isTargetablePlayer(player) || !isAlive(player)) continue;
        const distance = distanceSquared(entity.location, player.location);
        if (distance >= bestDistance || !canSee(entity, player)) continue;
        best = player;
        bestDistance = distance;
    }
    return best;
}

function cellCenter(cell) {
    return { x: cell.x + 0.5, y: cell.y, z: cell.z + 0.5 };
}

function arrived(entity, cell) {
    const center = cellCenter(cell);
    const dx = entity.location.x - center.x;
    const dz = entity.location.z - center.z;
    return dx * dx + dz * dz < ARRIVE_DISTANCE_SQUARED;
}

function trackCell(entity, state) {
    const x = Math.floor(entity.location.x);
    const z = Math.floor(entity.location.z);
    if (state.cell && state.cell.x === x && state.cell.z === z) return;
    state.previousCell = state.cell;
    state.cell = { x, z };
}

function findBeastDoor(entity) {
    const cx = Math.floor(entity.location.x);
    const y = Math.floor(entity.location.y);
    const cz = Math.floor(entity.location.z);
    let best;
    let bestDistance = Infinity;
    for (let dx = -DOOR_SEARCH_RADIUS; dx <= DOOR_SEARCH_RADIUS; dx++) {
        for (let dz = -DOOR_SEARCH_RADIUS; dz <= DOOR_SEARCH_RADIUS; dz++) {
            const distance = dx * dx + dz * dz;
            if (distance >= bestDistance) continue;
            if (!BEAST_DOORS.has(blockTypeAt(entity.dimension, cx + dx, y, cz + dz))) continue;
            best = { x: cx + dx, y, z: cz + dz };
            bestDistance = distance;
        }
    }
    return best;
}

function setHomeDoor(entity, state, door) {
    state.homeDoor = door;
    try { entity.setDynamicProperty(DOOR_PROPERTY, door ? JSON.stringify(door) : undefined); } catch { }
}

// the remembered door, dropped once it is verifiably gone
function validHomeDoor(entity, state) {
    const door = state.homeDoor;
    if (!door) return undefined;
    const typeId = blockTypeAt(entity.dimension, door.x, door.y, door.z);
    if (typeId !== undefined && !BEAST_DOORS.has(typeId)) {
        setHomeDoor(entity, state, undefined);
        return undefined;
    }
    return door;
}

// --------------------------------------------------------------- wander ----

function toWander(state, tick) {
    state.mode = "wander";
    state.targetId = undefined;
    state.wander = undefined;
    state.insideCell = undefined;
    state.nextDoorVisitAt = tick + randomBetween(DOOR_VISIT_MIN_TICKS, DOOR_VISIT_MAX_TICKS);
    state.nav.reset();
}

// a spot he couldn't walk to (or no spot at all) is given a moment before he picks another
function wanderStep(entity, state) {
    const tick = gameTick();
    if (!state.wander) {
        if (tick < state.wanderRetryAt) return;
        state.wander = pickWanderGoal(entity, 8, 20);
        state.nav.reset();
        if (!state.wander) {
            state.wanderRetryAt = tick + WANDER_RETRY_TICKS;
            return;
        }
    }
    const moving = state.nav.glide(entity, state.wander, WANDER_SPEED);
    if (!moving || distanceSquared(entity.location, state.wander) < 1) {
        if (!moving && !state.nav.complete) state.wanderRetryAt = tick + WANDER_RETRY_TICKS;
        state.wander = undefined;
    }
}

function wanderTick(entity, state, ctx) {
    if (ctx.tick >= state.nextDoorVisitAt) {
        const door = validHomeDoor(entity, state) ?? findBeastDoor(entity);
        if (door) {
            if (!state.homeDoor) setHomeDoor(entity, state, door);
            state.mode = "door";
            state.doorGiveUpAt = ctx.tick + DOOR_APPROACH_TIMEOUT_TICKS;
            state.nav.reset();
            return;
        }
        state.nextDoorVisitAt = ctx.tick + DOOR_RETRY_TICKS;
    }
    wanderStep(entity, state);
}

// walk to his door, step through into his room, check on the card, rest, then wander again
function doorTick(entity, state, ctx) {
    if (state.mode === "rest") {
        if (ctx.tick >= state.leaveAt) toWander(state, ctx.tick);
        return;
    }
    const door = state.homeDoor;
    if (!door || ctx.tick >= state.doorGiveUpAt) {
        toWander(state, ctx.tick);
        return;
    }
    const goal = state.mode === "enter" ? state.insideCell : door;
    if (!arrived(entity, goal)) {
        if (!state.nav.glide(entity, cellCenter(goal), WANDER_SPEED) && state.nav.finished && !arrived(entity, goal)) {
            toWander(state, ctx.tick);
        }
        return;
    }
    if (state.mode === "door") {
        const from = state.previousCell;
        const dx = from ? Math.sign(door.x - from.x) : 0;
        const dz = from ? Math.sign(door.z - from.z) : 0;
        const inside = { x: door.x + dx, y: door.y, z: door.z + dz };
        if ((dx !== 0 || dz !== 0) && canStandAt(entity.dimension, inside.x, inside.y, inside.z)) {
            state.mode = "enter";
            state.insideCell = inside;
            state.nav.reset();
            return;
        }
    }
    state.mode = "rest";
    state.leaveAt = ctx.tick + REST_TICKS;
    if (!state.spared && cardStatus(entity.dimension, door) === "missing") startFoundCard(entity, state, ctx.tick);
}

// ------------------------------------------------------------ normal chase ----

function startChase(entity, state, player, tick) {
    state.mode = "chase";
    state.targetId = player.id;
    state.lastSeen = { ...player.location };
    state.lastSeenAt = tick;
    state.nav.reset();
    playAt(entity.dimension, voice("beast.hey"), entity.location);
}

function scanForPlayers(entity, state, ctx) {
    if (ctx.tick < state.cooldownUntil || ctx.tick % SIGHT_CHECK_INTERVAL_TICKS !== 0) return false;
    const player = nearestVisiblePlayer(entity, ctx);
    if (!player) return false;
    startChase(entity, state, player, ctx.tick);
    return true;
}

function chaseTick(entity, state, ctx) {
    const player = findPlayer(entity, ctx, state.targetId);
    if (!player || !isTargetablePlayer(player) || !isAlive(player)) {
        toWander(state, ctx.tick);
        return;
    }
    if (ctx.tick % SIGHT_CHECK_INTERVAL_TICKS === 0 && canSee(entity, player)) {
        state.lastSeen = { ...player.location };
        state.lastSeenAt = ctx.tick;
    }
    if (ctx.tick - state.lastSeenAt > LOSE_SIGHT_TICKS) {
        toWander(state, ctx.tick);
        return;
    }
    if (distanceSquared(entity.location, player.location) <= CATCH_DISTANCE_SQUARED) {
        catchForChallenge(entity, state, player, ctx.tick);
        return;
    }
    const destination = ctx.tick - state.lastSeenAt <= 10 ? player.location : state.lastSeen;
    state.nav.glide(entity, destination, CHASE_SPEED);
}

// ------------------------------------------------------------- challenge ----

// player onto his teleport block (or where they stand), MrBeast a few blocks off facing them
function setUpCircle(entity, state, player) {
    const dimension = entity.dimension;
    const spot = beastSpot.findNearest(dimension, entity.location);
    const center = spot
        ? { x: spot.x + 0.5, y: spot.y, z: spot.z + 0.5 }
        : { x: Math.floor(player.location.x) + 0.5, y: player.location.y, z: Math.floor(player.location.z) + 0.5 };
    let beastAt = { ...entity.location };
    for (const [dx, dz] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        const x = center.x + dx * BEAST_STAND_OFFSET;
        const z = center.z + dz * BEAST_STAND_OFFSET;
        if (!canStandAt(dimension, Math.floor(x), Math.floor(center.y), Math.floor(z))) continue;
        beastAt = { x, y: center.y, z };
        break;
    }
    try { player.teleport(center, { dimension, facingLocation: { x: beastAt.x, y: beastAt.y + 1.6, z: beastAt.z } }); } catch { }
    try { entity.teleport(beastAt, { dimension, facingLocation: center }); } catch { }
    state.nav.reset();
    return { center, circle: spawnCircle(dimension, center) };
}

function catchForChallenge(entity, state, player, tick) {
    const { center, circle } = setUpCircle(entity, state, player);
    const instruct = voice("beast.challengeinstruct");
    playAt(entity.dimension, instruct, entity.location);
    if (!state.spared && cardStatus(entity.dimension, validHomeDoor(entity, state)) === "missing") {
        state.song.stop(entity.dimension);
        state.mode = "cardreveal";
        state.reveal = { playerId: player.id, circle, instruct, startedAt: tick, stage: 0 };
        setFrozen(player, true);
        setStill(entity, state, true);
        return;
    }
    state.mode = "challenge";
    state.challenge = { playerId: player.id, center, circle, instruct, startedAt: tick, endAt: tick + CHALLENGE_TICKS };
    setChallengeTimer(player, CHALLENGE_TICKS / 20);
}

export function giveReward(player) {
    const itemId = REWARD_ITEMS[Math.floor(Math.random() * REWARD_ITEMS.length)];
    if (itemId === GLOCK_ID) {
        grantGlock(player);
    } else if (itemId === QUARTER_ID) {
        addScore(player, "money", QUARTER_REWARD, "Money");
    } else {
        // no free slot: it drops, and becomes its item block (main.js)
        if (!giveToHotbar(player, itemId)) player.dimension.spawnItem(new ItemStack(itemId, 1), player.location);
    }
    try { player.playSound("item.pickup"); } catch { }
}

function endChallenge(entity, state, won, tick) {
    const challenge = state.challenge;
    if (!challenge) return;
    state.challenge = undefined;
    removeCircle(challenge.circle);
    const player = world.getEntity(challenge.playerId);
    if (player?.isValid) {
        setChallengeTimer(player, undefined);
        if (won) {
            playAt(player.dimension, "beast.congrats", player.location);
            giveReward(player);
        } else {
            try { player.runCommand(`stopsound @s ${challenge.instruct}`); } catch { }
        }
    }
    state.cooldownUntil = tick + CHASE_COOLDOWN_TICKS;
    toWander(state, tick);
}

function challengeTick(entity, state, ctx) {
    const challenge = state.challenge;
    const player = findPlayer(entity, ctx, challenge.playerId);
    if (!player || !isAlive(player) || !isTargetablePlayer(player)) {
        endChallenge(entity, state, false, ctx.tick);
        return;
    }
    const dx = player.location.x - challenge.center.x;
    const dz = player.location.z - challenge.center.z;
    if (dx * dx + dz * dz > CIRCLE_RADIUS * CIRCLE_RADIUS) {
        endChallenge(entity, state, false, ctx.tick);
        return;
    }
    if (ctx.tick >= challenge.endAt) {
        endChallenge(entity, state, true, ctx.tick);
        return;
    }
    setChallengeTimer(player, Math.ceil((challenge.endAt - ctx.tick) / 20));
    if (ctx.tick - challenge.startedAt >= CHALLENGE_WATCH_TICKS) {
        wanderStep(entity, state);
    } else if (ctx.tick % 5 === 0) {
        try { entity.teleport(entity.location, { facingLocation: player.location }); } catch { }
    }
}

// ------------------------------------------------------------ card stolen ----

function startFoundCard(entity, state, tick) {
    state.song.stop(entity.dimension);
    state.mode = "foundcard";
    state.foundUntil = tick + FOUNDCARD_TICKS;
    setStill(entity, state, true);
    playAt(entity.dimension, "beast.foundcard", entity.location);
}

function stopOvania(dimension) {
    stopSound(dimension, OVANIA_SOUND);
}

function becomeMad(entity, state, tick, targetId) {
    if (state.spared) return;
    state.mad = true;
    try { entity.setDynamicProperty(MAD_PROPERTY, true); } catch { }
    state.song.stop(entity.dimension);
    setStill(entity, state, false);
    state.mode = "hunt";
    state.targetId = targetId;
    state.lastSeen = undefined;
    state.lastSeenAt = targetId ? tick : -Infinity;
    state.lead = undefined;
    state.wander = undefined;
    state.nextOvaniaAt = tick;
    state.nav.reset();
}

// instruct is cut 2 seconds in, then "wait...", then the card line; the player can't move throughout
function revealTick(entity, state, ctx) {
    const reveal = state.reveal;
    const elapsed = ctx.tick - reveal.startedAt;
    const dimension = entity.dimension;
    if (reveal.stage === 0 && elapsed >= INSTRUCT_CUT_TICKS) {
        stopSound(dimension, reveal.instruct);
        removeCircle(reveal.circle);
        reveal.circle = undefined;
        playAt(dimension, "beast.wait", entity.location);
        reveal.stage = 1;
    } else if (reveal.stage === 1 && elapsed >= INSTRUCT_CUT_TICKS + WAIT_TICKS + 4) {
        playAt(dimension, "beast.challengecard", entity.location);
        reveal.stage = 2;
    } else if (reveal.stage === 2 && elapsed >= INSTRUCT_CUT_TICKS + WAIT_TICKS + 4 + CHALLENGECARD_TICKS) {
        const player = world.getEntity(reveal.playerId);
        if (player?.isValid) setFrozen(player, false);
        state.reveal = undefined;
        becomeMad(entity, state, ctx.tick, player?.isValid ? player.id : undefined);
    }
}

// ---------------------------------------------------------------- mad hunt ----

function startScreech(entity, state, player, tick) {
    state.mode = "screech";
    state.screech = { playerId: player.id, until: tick + SCREECH_TICKS };
    // he takes the monke out of you
    endMonke(player, false);
    setFrozen(player, true);
    playAt(player.dimension, "beast.screech", player.location);
}

function screechTick(entity, state, ctx) {
    if (ctx.tick < state.screech.until) return;
    const player = world.getEntity(state.screech.playerId);
    state.screech = undefined;
    if (player?.isValid) {
        setFrozen(player, false);
        try { player.kill(); } catch { }
    }
    state.mode = "hunt";
    state.targetId = undefined;
    state.lastSeen = undefined;
    state.lead = undefined;
    state.nav.reset();
}

// like Raldi: chases on sight, follows door noises, otherwise roams; always at his normal chase pace
function huntTick(entity, state, ctx) {
    for (const player of ctx.players(entity.dimension)) {
        if (!isTargetablePlayer(player) || !isAlive(player)) continue;
        if (distanceSquared(entity.location, player.location) > CATCH_DISTANCE_SQUARED) continue;
        startScreech(entity, state, player, ctx.tick);
        return;
    }
    if (ctx.tick % SIGHT_CHECK_INTERVAL_TICKS === 0) {
        const player = nearestVisiblePlayer(entity, ctx);
        if (player) {
            state.targetId = player.id;
            state.lastSeen = { ...player.location };
            state.lastSeenAt = ctx.tick;
        }
    }
    const target = ctx.tick - state.lastSeenAt <= 10 ? findPlayer(entity, ctx, state.targetId) : undefined;
    const destination = target?.location ?? state.lastSeen ?? state.lead;
    if (!destination) {
        wanderStep(entity, state);
        return;
    }
    state.wander = undefined;
    const moved = state.nav.glide(entity, destination, CHASE_SPEED);
    if (!target && (!moved || distanceSquared(entity.location, destination) < 1)) {
        state.lastSeen = undefined;
        state.lead = undefined;
        state.nav.reset();
    }
}

// ------------------------------------------------------------- encounter ----

// The encounter holds its pause until the shooter has entered the battle.
function startEncounter(entity, state, shooter) {
    state.mode = "encounter";
    setStill(entity, state, true);
    stopOvania(entity.dimension);
    const holder = { name: "mrbeast_encounter" };
    holdPause(holder);
    // starts at 1 so a cutscene ending synchronously cannot finish the encounter mid-loop
    const encounter = { holder, players: world.getAllPlayers(), watching: 1, shooterId: shooter.id, movement: new Map() };
    state.encounter = encounter;
    const done = () => {
        if (--encounter.watching === 0) endEncounter(state, entity, true);
    };
    const cutscene = findMeme(ENCOUNTER_CUTSCENE);
    for (const player of encounter.players) {
        encounter.movement.set(player.id, player.inputPermissions.isPermissionCategoryEnabled(InputPermissionCategory.Movement));
        setFrozen(player, true);
        encounter.watching++;
        if (!cutscene || !playMeme(player, cutscene, done)) encounter.watching--;
    }
    done();
}

function endEncounter(state, entity, beginBattle = false) {
    const encounter = state.encounter;
    if (!encounter) return;
    state.encounter = undefined;
    for (const player of encounter.players) {
        if (player.isValid) player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, encounter.movement.get(player.id));
    }
    try {
        const shooter = world.getEntity(encounter.shooterId);
        if (beginBattle && entity?.isValid && isAlive(shooter)) {
            state.mode = "battle";
            state.battle = true;
            setStill(entity, state, false);
            startBeastBattle(entity, shooter, (result) => {
                state.battle = false;
                if (!entity.isValid) return;
                if (result === "defeated") {
                    entity.remove();
                } else if (result === "spared") {
                    state.spared = true;
                    entity.setDynamicProperty(SPARED_PROPERTY, true);
                    calm(entity, state, gameTick());
                } else {
                    becomeMad(entity, state, gameTick(), shooter.isValid ? shooter.id : undefined);
                }
            });
        } else if (entity?.isValid && state.active) {
            becomeMad(entity, state, gameTick());
        }
    } catch (error) {
        state.battle = false;
        console.error(`[mrbeast] Encounter-to-battle transition failed: ${error}`);
        if (entity?.isValid) becomeMad(entity, state, gameTick());
    } finally {
        releasePause(encounter.holder);
    }
}

function onHit(entity, state, kind, source) {
    if (kind !== "glock" || !state.mad || state.mode === "encounter" || state.battle || isPaused()) return false;
    const shooter = source?.playerId ? world.getEntity(source.playerId) : undefined;
    if (!isAlive(shooter)) {
        console.warn("[mrbeast] Ignoring an unowned Glock projectile: no live shooter for the battle.");
        return false;
    }
    if (state.screech) {
        const player = world.getEntity(state.screech.playerId);
        if (player?.isValid) setFrozen(player, false);
        state.screech = undefined;
    }
    startEncounter(entity, state, shooter);
    return true;
}

// ------------------------------------------------------------------ tick ----

function tick(entity, state, ctx) {
    if (!state.active || state.mode === "encounter" || state.battle) return;
    trackCell(entity, state);

    if (state.mad) {
        if (ctx.tick >= state.nextOvaniaAt) {
            for (const player of ctx.players(entity.dimension)) {
                try { player.playSound(OVANIA_SOUND); } catch { }
            }
            state.nextOvaniaAt = ctx.tick + OVANIA_TICKS;
        }
    } else {
        state.song.update(entity, ctx.tick);
    }
    if (ctx.tick >= state.nextQuarterAt && !CUTSCENE_MODES.has(state.mode)) {
        dropQuarter(entity);
        state.nextQuarterAt = ctx.tick + QUARTER_INTERVAL_TICKS;
    }
    if (!state.homeDoor && ctx.tick >= state.nextDoorSearchAt) {
        const door = findBeastDoor(entity);
        if (door) setHomeDoor(entity, state, door);
        state.nextDoorSearchAt = ctx.tick + DOOR_SEARCH_INTERVAL_TICKS;
    }

    switch (state.mode) {
        case "foundcard":
            if (ctx.tick >= state.foundUntil) becomeMad(entity, state, ctx.tick);
            return;
        case "cardreveal": revealTick(entity, state, ctx); return;
        case "screech": screechTick(entity, state, ctx); return;
        case "hunt": huntTick(entity, state, ctx); return;
        case "challenge": challengeTick(entity, state, ctx); return;
        case "chase": chaseTick(entity, state, ctx); return;
    }
    if (scanForPlayers(entity, state, ctx)) return;
    if (state.mode === "wander") wanderTick(entity, state, ctx);
    else doorTick(entity, state, ctx);
}

function onSound(entity, state, { location }) {
    if (!state.mad || state.mode !== "hunt") return;
    state.lead = { ...location };
    state.wander = undefined;
    state.nav.reset();
}

// drops everything in flight: circle, HUD, frozen players
function cleanUp(state) {
    if (state.battle) {
        state.battle = false;
        cancelBeastBattle(state.entityId);
    }
    endEncounter(state);
    const dimension = state.dimension;
    state.song.stop(dimension);
    if (state.challenge) {
        removeCircle(state.challenge.circle);
        const player = world.getEntity(state.challenge.playerId);
        if (player?.isValid) setChallengeTimer(player, undefined);
        state.challenge = undefined;
    }
    for (const pending of [state.reveal, state.screech]) {
        if (!pending) continue;
        removeCircle(pending.circle);
        const player = world.getEntity(pending.playerId);
        if (player?.isValid) setFrozen(player, false);
    }
    state.reveal = undefined;
    state.screech = undefined;
    if (state.mad) stopOvania(dimension);
}

function calm(entity, state, tick) {
    cleanUp(state);
    state.mad = false;
    try { entity.setDynamicProperty(MAD_PROPERTY, undefined); } catch { }
    setStill(entity, state, false);
    state.cooldownUntil = 0;
    state.song.start(tick);
    toWander(state, tick);
}

// `/scriptevent brr:mrbeast stop|start|reset|mad|visit`
function onAction(entity, state, action) {
    const now = gameTick();
    switch (action) {
        case "stop": cleanUp(state); state.active = false; toWander(state, now); setStill(entity, state, false); break;
        case "start":
            state.active = true;
            if (state.mad) becomeMad(entity, state, now);
            else state.song.start(now);
            break;
        case "reset":
            state.spared = false;
            entity.setDynamicProperty(SPARED_PROPERTY, undefined);
            calm(entity, state, now);
            break;
        case "mad": if (!state.spared) { cleanUp(state); becomeMad(entity, state, now); } break;
        case "visit": if (!state.mad) state.nextDoorVisitAt = now; break;
    }
}

function createState(entity) {
    const now = gameTick();
    let homeDoor;
    try { homeDoor = JSON.parse(entity.getDynamicProperty(DOOR_PROPERTY) ?? "null") ?? undefined; } catch { }
    const spared = entity.getDynamicProperty(SPARED_PROPERTY) === true;
    const mad = !spared && entity.getDynamicProperty(MAD_PROPERTY) === true;
    const state = {
        entityId: entity.id,
        active: true,
        dimension: entity.dimension,
        mode: mad ? "hunt" : "wander",
        mad,
        spared,
        battle: false,
        nav: new Navigator({ doorHeight: 2 }),
        song: new SegmentedSound("beast.la", true),
        homeDoor,
        nextDoorSearchAt: now,
        nextDoorVisitAt: now + randomBetween(DOOR_VISIT_MIN_TICKS, DOOR_VISIT_MAX_TICKS),
        doorGiveUpAt: 0,
        insideCell: undefined,
        leaveAt: 0,
        cell: undefined,
        previousCell: undefined,
        wander: undefined,
        wanderRetryAt: 0,
        targetId: undefined,
        lastSeen: undefined,
        lastSeenAt: -Infinity,
        lead: undefined,
        cooldownUntil: 0,
        nextQuarterAt: now + QUARTER_INTERVAL_TICKS,
        nextOvaniaAt: now,
        foundUntil: 0,
        challenge: undefined,
        reveal: undefined,
        screech: undefined,
        encounter: undefined,
        shownStill: undefined
    };
    setStill(entity, state, false);
    if (!mad) state.song.start(now);
    return state;
}

registerCharacter({
    typeId: MRBEAST_ID,
    scriptEventId: "brr:mrbeast",
    createState,
    tick,
    onHit,
    onSound,
    onAction,
    onRemove(state) {
        cleanUp(state);
        endEncounter(state);
    }
});
