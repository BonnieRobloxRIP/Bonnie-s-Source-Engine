import { AIR, blockTypeAt, isPassableDecorType } from "../core/block_cache.js";
import { distanceSquared } from "../core/math.js";
import { gameTick } from "../core/pause.js";
import { isBigDoorType } from "../doors.js";
import { canStandAt } from "./navigation.js";
import { hasLineOfSight, isTargetablePlayer } from "./perception.js";
import { registerCharacter } from "./registry.js";

// The British Bloke (BullyScript.cs, "Its a Bully"). He stays away for a while, then turns up standing
// in a hallway and blocks it: walking into him costs an item (an energy first), or you get turned away.
// He leaves once paid, sent off by Chipfloke, or after 3 minutes with nobody near.
// Distances use 10 Unity units = 3 blocks (a wall / his sprite height).

const TYPE_ID = "brr:british_bloke";
const ENERGY_ID = "brr:item_energy";
const VISIBLE_PROPERTY = "brr:visible";
// Reset(): away 60-120 s, or 120-240 s after he got paid
const AWAY_MIN_TICKS = 1200;
const AWAY_MAX_TICKS = 2400;
const PAID_AWAY_MIN_TICKS = 2400;
const PAID_AWAY_MAX_TICKS = 4800;
// leaves by himself after 180 s once nobody is within 120 units
const STAY_TICKS = 3600;
const LEAVE_DISTANCE_SQUARED = 36 * 36;
// turns up at least 20 units from the player
const MIN_SPAWN_DISTANCE = 6;
const SPAWN_SEARCH_RADIUS = 40;
// sees players within 30 units: taunts once, and Chipfloke wants him for 10 s after
const SIGHT_RANGE_SQUARED = 9 * 9;
const GUILT_TICKS = 200;
const BLOCK_RADIUS_SQUARED = 1.6 * 1.6;
const SPOT_ATTEMPTS = 80;
const RETRY_TICKS = 20;
// blo_chance.ogg runs ~7.5 s; walking into him again during it doesn't restart it
const CHANCE_LINE_TICKS = 155;

function sound(entity, id) {
    try { entity.dimension.playSound(id, entity.location); } catch { }
}

function setVisible(entity, state, value) {
    if (state.visible === value) return;
    try {
        entity.setProperty(VISIBLE_PROPERTY, value ? 1 : 0);
        state.visible = value;
    } catch { }
}

function randomBetween(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

// hallways and outdoors only: a clear 3x3 around him and a 5-long open line through him
function openEnough(dimension, x, y, z) {
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            if (!canStandAt(dimension, x + dx, y, z + dz, isBigDoorType)) return false;
            if (blockTypeAt(dimension, x + dx, y, z + dz)?.startsWith("brr:door")) return false;
        }
    }
    return [[1, 0], [0, 1]].some(([dx, dz]) => {
        for (let offset = -2; offset <= 2; offset++) {
            if (!canStandAt(dimension, x + dx * offset, y, z + dz * offset, isBigDoorType)) return false;
        }
        return true;
    });
}

// a hallway spot somewhere around the players, but not right next to any of them
function findSpawnSpot(dimension, players) {
    if (!players.length) return undefined;
    const minSquared = MIN_SPAWN_DISTANCE * MIN_SPAWN_DISTANCE;
    for (let attempt = 0; attempt < SPOT_ATTEMPTS; attempt++) {
        const anchor = players[Math.floor(Math.random() * players.length)].location;
        const angle = Math.random() * Math.PI * 2;
        const radius = MIN_SPAWN_DISTANCE + Math.random() * (SPAWN_SEARCH_RADIUS - MIN_SPAWN_DISTANCE);
        const x = Math.floor(anchor.x + Math.cos(angle) * radius);
        const y = Math.floor(anchor.y);
        const z = Math.floor(anchor.z + Math.sin(angle) * radius);
        const spot = { x: x + 0.5, y, z: z + 0.5 };
        if (players.some((player) => distanceSquared(spot, player.location) < minSquared)) continue;
        if (openEnough(dimension, x, y, z)) return spot;
    }
    return undefined;
}

// GetItemList + the pick: an energy goes first and quietly, otherwise any one item at random
function takeItem(player) {
    const inventory = player.getComponent("minecraft:inventory")?.container;
    if (!inventory) return undefined;
    const items = [];
    for (let slot = 0; slot < inventory.size; slot++) {
        const item = inventory.getItem(slot);
        if (item) items.push({ slot, item });
    }
    const choice = items.find(({ item }) => item.typeId === ENERGY_ID)
        ?? items[Math.floor(Math.random() * items.length)];
    if (!choice) return undefined;
    if (choice.item.amount > 1) {
        choice.item.amount--;
        inventory.setItem(choice.slot, choice.item);
    } else {
        inventory.setItem(choice.slot);
    }
    return choice.item.typeId;
}

// acts like a wall: the player is put back on their own side
function pushBack(player, bloke, previous) {
    const dx = previous.x - bloke.location.x;
    const dz = previous.z - bloke.location.z;
    const length = Math.hypot(dx, dz);
    const destination = length > 0.1
        ? { x: previous.x + dx / length * 0.35, y: previous.y, z: previous.z + dz / length * 0.35 }
        : { x: bloke.location.x + 1, y: bloke.location.y, z: bloke.location.z };
    try { player.teleport(destination, { dimension: bloke.dimension }); } catch { }
}

function blocksSight(typeId) {
    return typeId !== undefined && typeId !== AIR && !isBigDoorType(typeId) && !isPassableDecorType(typeId) && !typeId.includes("window");
}

function sees(entity, player) {
    const from = entity.location;
    const to = player.location;
    if (distanceSquared(from, to) > SIGHT_RANGE_SQUARED) return false;
    return hasLineOfSight(
        entity.dimension,
        { x: from.x, y: from.y + 1.4, z: from.z },
        { x: to.x, y: to.y + 1.5, z: to.z },
        blocksSight
    );
}

// Reset(pickedup): out of sight until it's time to turn up again
function goAway(entity, state, tick, paid) {
    setVisible(entity, state, false);
    state.mode = "away";
    state.returnAt = tick + (paid
        ? randomBetween(PAID_AWAY_MIN_TICKS, PAID_AWAY_MAX_TICKS)
        : randomBetween(AWAY_MIN_TICKS, AWAY_MAX_TICKS));
    state.guiltUntil = 0;
    state.pursued = false;
    state.spoken = false;
    state.deniedUntil.clear();
    state.lastPositions.clear();
}

function awayTick(entity, state, ctx) {
    if (ctx.tick < state.returnAt) return;
    const players = ctx.players(entity.dimension).filter(isTargetablePlayer);
    const spot = findSpawnSpot(entity.dimension, players);
    if (!spot) {
        state.returnAt = ctx.tick + RETRY_TICKS;
        return;
    }
    try { entity.teleport(spot, { dimension: entity.dimension }); } catch { return; }
    state.mode = "standing";
    state.activeSince = ctx.tick;
    setVisible(entity, state, true);
}

function handleTouch(entity, state, player, tick) {
    pushBack(player, entity, state.lastPositions.get(player.id) ?? player.location);
    if ((state.deniedUntil.get(player.id) ?? 0) > tick) return;
    const taken = takeItem(player);
    if (taken === undefined) {
        sound(entity, "blo_chance");
        state.deniedUntil.set(player.id, tick + CHANCE_LINE_TICKS);
        return;
    }
    if (taken !== ENERGY_ID) sound(entity, "blo_thanks");
    goAway(entity, state, tick, true);
}

function standTick(entity, state, ctx) {
    const players = ctx.players(entity.dimension).filter(isTargetablePlayer);
    if (ctx.tick - state.activeSince >= STAY_TICKS
        && players.every((player) => distanceSquared(entity.location, player.location) >= LEAVE_DISTANCE_SQUARED)) {
        goAway(entity, state, ctx.tick, false);
        return;
    }

    if (players.some((player) => sees(entity, player))) {
        if (!state.spoken) {
            sound(entity, "blo_sweet");
            state.spoken = true;
        }
        state.guiltUntil = ctx.tick + GUILT_TICKS;
    }

    for (const player of players) {
        const distance = distanceSquared(entity.location, player.location);
        if (distance > BLOCK_RADIUS_SQUARED) {
            state.lastPositions.set(player.id, { ...player.location });
            continue;
        }
        const velocity = player.getVelocity();
        const toward = (entity.location.x - player.location.x) * velocity.x
            + (entity.location.z - player.location.z) * velocity.z;
        const movingToward = toward > 0 && Math.hypot(velocity.x, velocity.z) >= 0.02;
        if (!movingToward && distance > 0.85 * 0.85) continue;
        handleTouch(entity, state, player, ctx.tick);
        if (state.mode !== "standing") return;
    }
    for (const id of state.lastPositions.keys()) {
        if (!players.some((player) => player.id === id)) state.lastPositions.delete(id);
    }
}

registerCharacter({
    typeId: TYPE_ID,
    scriptEventId: TYPE_ID,
    catchDistance: 1.5,
    chaseSound: "chip.bullying",
    createState(entity) {
        const state = {
            mode: "away",
            visible: undefined,
            returnAt: 0,
            activeSince: 0,
            guiltUntil: 0,
            spoken: false,
            pursued: false,
            deniedUntil: new Map(),
            lastPositions: new Map()
        };
        // he starts the game away, like Start() in the original
        goAway(entity, state, gameTick(), false);
        return state;
    },
    tick(entity, state, ctx) {
        if (state.mode === "standing") standTick(entity, state, ctx);
        else awayTick(entity, state, ctx);
    },
    // Chipfloke comes for him for 10 s after he's been seen eyeing a player, and keeps at it once started
    wanted(entity, state, ctx) {
        if (state.mode !== "standing") return false;
        return state.pursued || state.guiltUntil > ctx.tick;
    },
    onPursued(entity, state) {
        state.pursued = true;
    },
    onPursuitEnded(entity, state) {
        state.pursued = false;
    },
    // Chipfloke just sends him away
    onApprehended(entity, state) {
        goAway(entity, state, gameTick(), false);
    },
    onAction(entity, state, action) {
        const now = gameTick();
        if (action === "show" || action === "spawn") state.returnAt = now;
        else if (action === "hide" || action === "reset") goAway(entity, state, now, false);
    }
});
