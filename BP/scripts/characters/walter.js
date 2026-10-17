import { BlockVolume } from "@minecraft/server";
import { invalidateBlock, floorTypeUnder } from "../core/block_cache.js";
import { gameTick } from "../core/pause.js";
import { addScore, getScore } from "../core/scoreboard.js";
import { isXmasMode } from "../memes.js";
import { isTargetablePlayer } from "./perception.js";
import { registerCharacter } from "./registry.js";

// Walter (WaltuhScript.cs + walterMethStationScript.cs). He stays in his meth lab. The first time
// someone walks in he introduces himself and cooks a crackpipe; after that a fresh one is ready every
// meth timer (5:00) whenever the old one has been taken and someone is in the lab. His countdown shows
// on the lab's timer walls (WalterTimerWall), and the meth station ("compooper") shows its level, timer
// and upgrade price on its screen; it halves the timer for a price, up to level 10. All three are blocks
// found around him (scripts_gen/gen_walter_lab.mjs makes their displays).

const TYPE_ID = "brr:walter";
const ROOM_FLOOR = "brr:walterfloor";
const PICKUP_ID = "brr:item_crackpipe_block";
const PICKUP_SPOT_PROPERTY = "brr:pickup_spot";
const PICKUP_SPOT_ID = "brr:walter_pickup_spot";
const STATION_ID = "brr:walter_meth_station";
const TIMER_WALL_ID = "brr:poster_timer_wall";
// how far from Walter his lab blocks can be, and how often a missing one is looked for again
const LAB_RADIUS = 16;
const LAB_RESCAN_TICKS = 100;
// the timer walls show M:SS up to 5:59 (brr:timer_minutes 0-5)
const MAX_SHOWN_SECONDS = 359;
const JOLLY_PROPERTY = "brr:jolly";
const MONEY_OBJECTIVE = "money";
// GameControllerScript.methTimer / methPrice
const METH_TIMER_TICKS = 300 * 20;
const METH_PRICE_CENTS = 25;
const METH_PRICE_STEP_CENTS = 50;
const MAX_STATION_LEVEL = 10;
const STATION_SEARCH_DISTANCE = 48;
// clip lengths in ticks, so lines wait for each other like his AudioSource did
const LINES = {
    hi: { id: "walter.hi", ticks: 50 },
    want: { id: "walter.want", ticks: 56 },
    wantXmas: { id: "walter.want_xmas", ticks: 56 },
    here: { id: "walter.here", ticks: 47 },
    helloHere: { id: "walter.hellohere", ticks: 26 },
    notReady: { id: "walter.notready", ticks: 38 },
    takeAWhile: { id: "walter.notfinished", ticks: 80 },
    stickAround: { id: "walter.stickaround", ticks: 43 }
};

// entity id -> { entity, state }, so the meth station can find the Walter it belongs to
const walters = new Map();

function say(entity, state, line, tick) {
    try { entity.dimension.playSound(line.id, entity.location); } catch { }
    state.audioUntil = tick + line.ticks;
}

// ------------------------------------------------------------------- the lab ----

function findAround(dimension, center, typeId, radius) {
    const found = [];
    try {
        const from = { x: Math.floor(center.x) - radius, y: Math.floor(center.y) - 4, z: Math.floor(center.z) - radius };
        const to = { x: Math.floor(center.x) + radius, y: Math.floor(center.y) + 6, z: Math.floor(center.z) + radius };
        const list = dimension.getBlocks(new BlockVolume(from, to), { includeTypes: [typeId] }, true);
        for (const location of list.getBlockLocationIterator()) found.push({ x: location.x, y: location.y, z: location.z });
    } catch { }
    return found;
}

function nearest(locations, center) {
    let best;
    let bestDistance = Infinity;
    for (const location of locations) {
        const distance = (location.x - center.x) ** 2 + (location.y - center.y) ** 2 + (location.z - center.z) ** 2;
        if (distance < bestDistance) {
            best = location;
            bestDistance = distance;
        }
    }
    return best;
}

function blockAt(entity, location) {
    try { return location && entity.dimension.getBlock(location); } catch { return undefined; }
}

function labIntact(entity, known) {
    return blockAt(entity, known.station)?.typeId === STATION_ID
        && known.timers.length > 0
        && known.timers.every((location) => blockAt(entity, location)?.typeId === TIMER_WALL_ID);
}

// his timer walls and meth station, looked up around him; every few seconds he checks they're
// still there, and looks again if one is missing (not loaded yet, or a builder moved it)
function lab(entity, state, tick) {
    const known = state.lab;
    if (known && tick < known.scannedAt + LAB_RESCAN_TICKS) return known;
    if (known && labIntact(entity, known)) {
        known.scannedAt = tick;
        return known;
    }
    state.lab = {
        scannedAt: tick,
        timers: findAround(entity.dimension, entity.location, TIMER_WALL_ID, LAB_RADIUS),
        station: nearest(findAround(entity.dimension, entity.location, STATION_ID, LAB_RADIUS), entity.location)
    };
    state.shownSeconds = undefined;
    return state.lab;
}

// the station's level is a block state, like walterMethStationScript.level
function stationLevel(entity, state) {
    const block = blockAt(entity, state.lab?.station);
    if (block?.typeId !== STATION_ID) return 1;
    try { return block.permutation.getState("brr:level") ?? 1; } catch { return 1; }
}

function timerForLevel(level) {
    return Math.round(METH_TIMER_TICKS / 2 ** (level - 1));
}

function priceForLevel(level) {
    return METH_PRICE_CENTS + METH_PRICE_STEP_CENTS * (level - 1);
}

function methTimer(entity, state) {
    return timerForLevel(stationLevel(entity, state));
}

function setBlockState(block, name, value) {
    try {
        if (block.permutation.getState(name) !== value) block.setPermutation(block.permutation.withState(name, value));
    } catch { }
}

// both timer walls show the countdown like the original's left and right TextMeshPro, floored to M:SS
function showTimer(entity, state) {
    const seconds = Math.min(MAX_SHOWN_SECONDS, Math.floor(Math.max(0, state.methLeft) / 20));
    if (state.shownSeconds === seconds) return;
    state.shownSeconds = seconds;
    for (const location of state.lab?.timers ?? []) {
        const block = blockAt(entity, location);
        if (block?.typeId !== TIMER_WALL_ID) continue;
        try {
            block.setPermutation(block.permutation
                .withState("brr:timer_minutes", Math.floor(seconds / 60))
                .withState("brr:timer_tens", Math.floor((seconds % 60) / 10))
                .withState("brr:timer_ones", seconds % 10));
        } catch { }
    }
}

// the screen says "Candy Cane" at Christmas
function showStationKind(entity, state) {
    const block = blockAt(entity, state.lab?.station);
    if (block?.typeId === STATION_ID) setBlockState(block, "brr:candy", isXmasMode());
}

// the crackpipe goes where the walter_pickup_spot marker was, remembered once found (the marker is
// replaced by the crackpipe, and taking that leaves air); kept in the state too, so the per-tick
// check doesn't parse the property every time
function pickupSpot(entity, state) {
    if (state?.pickupSpot) return state.pickupSpot;
    let spot;
    try { spot = JSON.parse(entity.getDynamicProperty(PICKUP_SPOT_PROPERTY) ?? "null"); } catch { }
    if (!spot) {
        spot = nearest(findAround(entity.dimension, entity.location, PICKUP_SPOT_ID, LAB_RADIUS), entity.location);
        if (!spot) return undefined;
        try { entity.setDynamicProperty(PICKUP_SPOT_PROPERTY, JSON.stringify(spot)); } catch { }
    }
    if (state) state.pickupSpot = spot;
    return spot;
}

function pickupPresent(entity, state) {
    const spot = pickupSpot(entity, state);
    if (!spot) return true;
    try { return entity.dimension.getBlock(spot)?.typeId === PICKUP_ID; } catch { return true; }
}

function respawnPickup(entity, state, tick) {
    const spot = pickupSpot(entity, state);
    if (!spot) {
        if (tick >= state.nextWarningAt) {
            console.warn("[walter] Place a walter_pickup_spot block in his lab for the crackpipe to appear on");
            state.nextWarningAt = tick + 1200;
        }
        return;
    }
    try {
        entity.dimension.getBlock(spot)?.setType(PICKUP_ID);
        invalidateBlock(entity.dimension, spot);
    } catch { }
}

// ---------------------------------------------------------------------- walter ----

function updateIntro(entity, state, tick) {
    const intro = state.intro;
    if (!intro || tick < state.audioUntil) return;
    const xmas = isXmasMode();
    const steps = [LINES.hi, xmas ? LINES.wantXmas : LINES.want, LINES.here];
    if (intro.step < steps.length) {
        say(entity, state, steps[intro.step], tick);
        intro.step++;
        if (intro.step < steps.length) return;
    }
    state.intro = undefined;
    state.met = true;
    state.methLeft = methTimer(entity, state);
    respawnPickup(entity, state, tick);
}

function onPlayerEnter(entity, state, tick) {
    if (state.methLeft > 0) say(entity, state, LINES.notReady, tick);
    if (!state.met) state.intro = { step: 0 };
}

function tick(entity, state, ctx) {
    lab(entity, state, ctx.tick);
    // the countdown used to float above him as a name tag, which shows through walls
    if (!state.nameCleared) {
        try { entity.nameTag = ""; } catch { }
        state.nameCleared = true;
    }

    const inRoom = ctx.players(entity.dimension).some((player) => isTargetablePlayer(player) && floorTypeUnder(player) === ROOM_FLOOR);
    const wasInRoom = state.inRoom;
    state.inRoom = inRoom;

    const jolly = isXmasMode() ? 1 : 0;
    if (state.jolly !== jolly) {
        try { entity.setProperty(JOLLY_PROPERTY, jolly); state.jolly = jolly; } catch { }
        showStationKind(entity, state);
    }

    if (state.methLeft > 0) {
        state.methLeft--;
        if (state.methLeft <= 0) state.stuckAround = inRoom;
    } else if (state.met && inRoom && !pickupPresent(entity, state)) {
        state.methLeft = methTimer(entity, state);
        say(entity, state, state.stuckAround ? LINES.stickAround : LINES.helloHere, ctx.tick);
        respawnPickup(entity, state, ctx.tick);
        state.stuckAround = false;
    }
    showTimer(entity, state);

    // walking out cuts his introduction short (StopAllCoroutines)
    if (inRoom && !wasInRoom) onPlayerEnter(entity, state, ctx.tick);
    else if (!inRoom && wasInRoom) state.intro = undefined;

    if (inRoom && state.met && !state.gaveExplanation && ctx.tick >= state.audioUntil && state.methLeft > 0) {
        say(entity, state, LINES.takeAWhile, ctx.tick);
        state.gaveExplanation = true;
    }
    updateIntro(entity, state, ctx.tick);
}

// --------------------------------------------------------------- meth station ----

function nearestWalter(block) {
    const walter = block.dimension.getEntities({
        type: TYPE_ID, location: block.location, maxDistance: STATION_SEARCH_DISTANCE, closest: 1
    })[0];
    return walter && walters.get(walter.id);
}

// interacting buys the next level outright if you can afford it (walterMethStationScript.OnInteract);
// the screen updates itself from the block's level
function useStation(block, player) {
    let level = 1;
    try { level = block.permutation.getState("brr:level") ?? 1; } catch { }
    if (level >= MAX_STATION_LEVEL) return;
    const price = priceForLevel(level);
    if (getScore(player, MONEY_OBJECTIVE) < price) return;
    addScore(player, MONEY_OBJECTIVE, -price, "Money");
    setBlockState(block, "brr:level", level + 1);
    try { block.dimension.playSound("coin_drop", block.location); } catch { }
    // a running cook never takes longer than the new timer
    const walter = nearestWalter(block);
    const timer = timerForLevel(level + 1);
    if (walter && walter.state.methLeft > timer) walter.state.methLeft = timer;
}

// where resetWalterLabs found each lab block type last time: "dimension|bounds|typeId" -> locations.
// The map is the same every run, so the whole-map scan only has to happen once per session.
const labBlockCache = new Map();

// every block of the type within bounds: the remembered spots while they all still hold one, else a scan
function labBlocks(dimension, bounds, typeId) {
    const key = `${dimension.id}|${bounds.min.x},${bounds.min.y},${bounds.min.z}|${bounds.max.x},${bounds.max.y},${bounds.max.z}|${typeId}`;
    const cached = labBlockCache.get(key);
    if (cached) {
        const blocks = [];
        for (const location of cached) {
            let block;
            try { block = dimension.getBlock(location); } catch { }
            if (block?.typeId !== typeId) {
                blocks.length = 0;
                break;
            }
            blocks.push(block);
        }
        if (blocks.length === cached.length) return blocks;
        labBlockCache.delete(key);
    }
    let list;
    try { list = dimension.getBlocks(new BlockVolume(bounds.min, bounds.max), { includeTypes: [typeId] }, true); }
    catch (error) {
        console.warn(`[walter] Resetting ${typeId} failed: ${error}`);
        return [];
    }
    const locations = [];
    const blocks = [];
    for (const location of list.getBlockLocationIterator()) {
        let block;
        try { block = dimension.getBlock(location); } catch { }
        if (block?.typeId !== typeId) continue;
        locations.push({ x: location.x, y: location.y, z: location.z });
        blocks.push(block);
    }
    // nothing found may just mean nothing loaded yet: scan again next time
    if (locations.length > 0) labBlockCache.set(key, locations);
    return blocks;
}

// a new run: every meth station back to level I and every timer wall to 0:00, whatever the map was
// saved with (the level is a block state, so a map saved after a test would otherwise keep it)
export function resetWalterLabs(dimension, bounds) {
    const reset = [
        [STATION_ID, (permutation) => permutation.withState("brr:level", 1)],
        [TIMER_WALL_ID, (permutation) => permutation.withState("brr:timer_minutes", 0).withState("brr:timer_tens", 0).withState("brr:timer_ones", 0)]
    ];
    for (const [typeId, fresh] of reset) {
        for (const block of labBlocks(dimension, bounds, typeId)) {
            try { block.setPermutation(fresh(block.permutation)); } catch { }
        }
    }
}

export function registerWalterComponents(registry) {
    registry.registerCustomComponent("brr:walter_meth_station", {
        onPlayerInteract({ block, player }) {
            if (player) useStation(block, player);
        }
    });
}

registerCharacter({
    typeId: TYPE_ID,
    scriptEventId: TYPE_ID,
    createState(entity) {
        const state = {
            inRoom: false,
            met: false,
            gaveExplanation: false,
            stuckAround: false,
            methLeft: 0,
            intro: undefined,
            audioUntil: 0,
            jolly: undefined,
            nextWarningAt: 0,
            lab: undefined,
            pickupSpot: undefined,
            shownSeconds: undefined,
            nameCleared: false
        };
        walters.set(entity.id, { entity, state });
        return state;
    },
    tick,
    onRemove(state) {
        for (const [id, entry] of walters) if (entry.state === state) walters.delete(id);
    },
    onAction(entity, state, action) {
        const now = gameTick();
        if (action === "ready") state.methLeft = 1;
        else if (action === "reset") {
            Object.assign(state, { met: false, gaveExplanation: false, stuckAround: false, methLeft: 0, intro: undefined });
            const station = blockAt(entity, lab(entity, state, now).station);
            if (station?.typeId === STATION_ID) setBlockState(station, "brr:level", 1);
            state.audioUntil = now;
        }
    }
});
