import { BlockPermutation, BlockVolume, system, world } from "@minecraft/server";
import { invalidateBlock } from "./core/block_cache.js";
import { ESCAPE_STAGE, EXIT_GOAL, NOTEBOOK_GOAL, escapeBlackout, escapeStage, isExitPhase, setEscapeStage, setExitPhase } from "./core/game_state.js";
import { isPaused } from "./core/pause.js";
import { highestScore } from "./core/scoreboard.js";
import { musicVolume, soundVolume } from "./core/settings.js";
import { resetExits } from "./exits.js";
import { MAP_BOUNDS, isMapLoading } from "./map.js";
import { isParticipant } from "./run.js";
import { awardTrophy } from "./trophies.js";
import { showWinScreens } from "./win_screen.js";

// Raldi's all-notebooks speech ends after 12.2 seconds.
const TRANSFORM_TICKS = 245;
// The countdown runs in memory; the properties only carry it across a world reload, so the
// remaining ticks are saved once a second and whenever the game pauses.
const REMAINING_PROPERTY = "brr:escape_transform_remaining";
const REMAINING_SAVE_TICKS = 20;
const INTRO_STARTED_PROPERTY = "brr:escape_intro_started";
let remaining; // undefined until read back from REMAINING_PROPERTY
let savedRemaining;
let introStarted; // INTRO_STARTED_PROPERTY, read once
const MUSIC = {
    [ESCAPE_STAGE.intro]: "mus_escapeintro",
    [ESCAPE_STAGE.loop]: "mus_escapeloop",
    [ESCAPE_STAGE.rev]: "machine_rev",
    [ESCAPE_STAGE.machine]: "machine_loop"
};
// Measured from the Ogg sample counts; sound playback uses explicit replay deadlines.
const LOOP_TICKS = { mus_escapeloop: 2711, machine_rev: 228, machine_loop: 228 };
const playerMusic = new Map();
const RALDI_ID = "brr:raldi";
const RALDI_CHECK_TICKS = 10;
let raldiPresent = false;
let raldiCheckedAt = -Infinity;

function introHasStarted() {
    introStarted ??= world.getDynamicProperty(INTRO_STARTED_PROPERTY) === true;
    return introStarted;
}

function setIntroStarted(value) {
    introStarted = value === true;
    world.setDynamicProperty(INTRO_STARTED_PROPERTY, value);
}

function setRemaining(value) {
    remaining = value;
    savedRemaining = value;
    world.setDynamicProperty(REMAINING_PROPERTY, value);
}

function saveRemaining() {
    if (remaining === undefined || remaining === savedRemaining) return;
    savedRemaining = remaining;
    world.setDynamicProperty(REMAINING_PROPERTY, remaining);
}

// one tick of the transformation; true once it's over
function countDown() {
    if (remaining === undefined) {
        savedRemaining = world.getDynamicProperty(REMAINING_PROPERTY);
        remaining = savedRemaining ?? TRANSFORM_TICKS;
    }
    remaining--;
    if (remaining <= 0) return true;
    if (remaining % REMAINING_SAVE_TICKS === 0) saveRemaining();
    return false;
}

// the drip transform and its music belong to Raldi; without him in the world neither happens
function isRaldiPresent() {
    if (system.currentTick - raldiCheckedAt < RALDI_CHECK_TICKS) return raldiPresent;
    raldiCheckedAt = system.currentTick;
    raldiPresent = false;
    for (const id of ["overworld", "nether", "the_end"]) {
        try {
            if (world.getDimension(id).getEntities({ type: RALDI_ID }).length > 0) { raldiPresent = true; break; }
        } catch { }
    }
    return raldiPresent;
}

function syncMusic(players, stage) {
    const waitingForMeme = stage === ESCAPE_STAGE.intro && !introHasStarted();
    const sound = waitingForMeme || !isRaldiPresent() ? undefined : MUSIC[stage];
    const present = new Set();
    for (const player of players) {
        present.add(player.id);
        const playing = playerMusic.get(player.id);
        const changed = playing?.sound !== sound;
        if (!changed && (!sound || system.currentTick < playing.loopAt)) continue;
        try {
            if (changed) {
                player.stopMusic();
                if (playing) player.runCommand(`stopsound @s ${playing.sound}`);
            }
            if (sound) {
                player.playSound(sound, { volume: musicVolume(player) });
                playerMusic.set(player.id, {
                    sound,
                    loopAt: LOOP_TICKS[sound] === undefined ? Infinity : system.currentTick + LOOP_TICKS[sound]
                });
            }
            else playerMusic.delete(player.id);
        } catch (error) {
            console.warn(`[escape] Music update failed for ${player.name}: ${error}`);
        }
    }
    for (const id of playerMusic.keys()) {
        if (!present.has(id)) playerMusic.delete(id);
    }
}

function startIntro(players) {
    setIntroStarted(true);
    syncMusic(players, ESCAPE_STAGE.intro);
    for (const player of players) {
        try { player.playSound("raldi.allnotebooks", { volume: soundVolume(player) }); }
        catch (error) { console.warn(`[escape] All-notebooks speech failed for ${player.name}: ${error}`); }
    }
}

export function beginEscape() {
    if (escapeStage() !== ESCAPE_STAGE.idle || isExitPhase()) return;
    setEscapeStage(ESCAPE_STAGE.intro);
    setRemaining(TRANSFORM_TICKS);
    setIntroStarted(false);
    // The notebook meme holds a gameplay pause; speech and music wait for its release.
    if (!isPaused()) startIntro(world.getAllPlayers());
}

export function resetEscape() {
    raldiCheckedAt = -Infinity;
    setExitPhase(false);
    setEscapeStage(ESCAPE_STAGE.idle);
    resetExits();
    setRemaining(undefined);
    setIntroStarted(undefined);
    // a reset that reloads the map gets its ceilings back from the structures; any other reset
    // (`/scriptevent brr:raldi reset`) leaves switching them back on to the sweep
    if (isMapLoading()) forgetSweep(false);
    syncMusic(world.getAllPlayers(), ESCAPE_STAGE.idle);
}

// A ceiling put down during the blackout (by a builder or a command) goes dark straight away, and
// an escape-owned dark one put down after it comes back on. The map's own ceilings are switched by
// the sweep below: they have no block tick.
export function registerEscapeComponents(blockComponentRegistry) {
    blockComponentRegistry.registerCustomComponent("brr:escape_ceiling", {
        onPlace({ block }) {
            if (block.typeId === "brr:ceiling01" && escapeBlackout()) {
                block.setPermutation(sweepSwaps()[0].off);
                invalidateBlock(block.dimension, block.location);
            } else if (block.typeId === "brr:ceiling01_off" && !escapeBlackout()
                && block.permutation.getState("brr:escape_blackout") === true) {
                block.setType("brr:ceiling01");
                invalidateBlock(block.dimension, block.location);
            }
        }
    });
}

// Ceilings and invisible ceiling lights have no block tick (blocks loaded from the map structures
// never get one anyway). When the blackout starts, the area around every player and then the whole
// map is swept: each 16-block cube is swapped in one native fill that only touches ceilings. When it
// ends, exactly the cubes it swept are swapped back. Nearest cubes first, a few per tick, and nothing
// at all once the sweep is done, apart from noticing a player moving into another cube.
const SWEEP_RADIUS_CHUNKS = 4;
const SWEEP_LAYERS = 1; // 16-block layers above and below the player's
// the player's own layer first, then upward before downward: ceilings are overhead
const LAYER_ORDER = [0];
for (let layer = 1; layer <= SWEEP_LAYERS; layer++) LAYER_ORDER.push(layer, -layer);
const SWEEPS_PER_TICK = 8;
// a cube that couldn't be swept (usually not loaded yet) is tried again this much later
const SWEEP_RETRY_TICKS = 20;
let swaps;
// lit -> blacked out. The off ceiling is its own block; the invisible light just stops emitting.
// Only blocks the blackout switched off (brr:escape_blackout) are switched back on.
function sweepSwaps() {
    swaps ??= [
        {
            on: BlockPermutation.resolve("brr:ceiling01"),
            off: BlockPermutation.resolve("brr:ceiling01_off", { "brr:escape_blackout": true })
        },
        {
            on: BlockPermutation.resolve("brr:invisible_ceiling_light", { "brr:escape_blackout": false }),
            off: BlockPermutation.resolve("brr:invisible_ceiling_light", { "brr:escape_blackout": true })
        }
    ];
    return swaps;
}
let sweptFor = false; // the blackout state the cubes in `swept` were brought to
const swept = new Set(); // keys of the cubes brought to sweptFor
const darkened = new Map(); // key -> cube, every cube the blackout swept: the ones to switch back on
let queue = []; // cubes still to sweep toward sweptFor, nearest first
let deferred = []; // cubes that failed, queued again at retryAt
let retryAt = 0;
const playerCubes = new Map(); // player id -> key of the cube the area around them was queued from
let sweepWarned = false;

const cubeKey = (dimensionId, cx, cy, cz) => `${dimensionId}|${cx},${cy},${cz}`;

function cubeAt(dimension, cx, cy, cz) {
    return { dimension, cx, cy, cz, key: cubeKey(dimension.id, cx, cy, cz) };
}

// drops all sweep work, as if the ceilings already matched `blackout`
function forgetSweep(blackout) {
    sweptFor = blackout;
    swept.clear();
    darkened.clear();
    playerCubes.clear();
    queue = [];
    deferred = [];
}

function sweepCube({ dimension, cx, cy, cz }, blackout) {
    const range = dimension.heightRange;
    const minY = Math.max(range.min, cy * 16);
    const maxY = Math.min(range.max - 1, cy * 16 + 15);
    if (minY > maxY) return true;
    const volume = new BlockVolume({ x: cx * 16, y: minY, z: cz * 16 }, { x: cx * 16 + 15, y: maxY, z: cz * 16 + 15 });
    try {
        for (const swap of sweepSwaps()) {
            const [from, to] = blackout ? [swap.on, swap.off] : [swap.off, swap.on];
            dimension.fillBlocks(volume, to, { blockFilter: { includePermutations: [from] } });
        }
        return true;
    } catch (error) {
        // usually not loaded yet, tried again later; anything else is worth one warning
        if (!sweepWarned && !/unloaded/i.test(String(error))) {
            sweepWarned = true;
            console.warn(`[escape] Ceiling sweep failed: ${error}`);
        }
        return false;
    }
}

// the cubes within SWEEP_RADIUS_CHUNKS of a cube, ring by ring outward
function cubesAround(dimension, px, py, pz, into) {
    for (let ring = 0; ring <= SWEEP_RADIUS_CHUNKS; ring++) {
        for (let dx = -ring; dx <= ring; dx++) {
            for (let dz = -ring; dz <= ring; dz++) {
                if (Math.max(Math.abs(dx), Math.abs(dz)) !== ring) continue;
                for (const dy of LAYER_ORDER) into.push(cubeAt(dimension, px + dx, py + dy, pz + dz));
            }
        }
    }
}

// every cube the map touches, the ones nearest to a player first
function mapCubes(players) {
    let dimension;
    try { dimension = world.getDimension("overworld"); } catch { return []; }
    const cubes = [];
    for (let cx = Math.floor(MAP_BOUNDS.min.x / 16); cx <= Math.floor(MAP_BOUNDS.max.x / 16); cx++) {
        for (let cy = Math.floor(MAP_BOUNDS.min.y / 16); cy <= Math.floor(MAP_BOUNDS.max.y / 16); cy++) {
            for (let cz = Math.floor(MAP_BOUNDS.min.z / 16); cz <= Math.floor(MAP_BOUNDS.max.z / 16); cz++) {
                cubes.push(cubeAt(dimension, cx, cy, cz));
            }
        }
    }
    const spots = [];
    for (const player of players) {
        try {
            if (player.dimension.id !== dimension.id) continue;
            spots.push({ x: player.location.x / 16, y: player.location.y / 16, z: player.location.z / 16 });
        } catch { }
    }
    if (spots.length === 0) return cubes;
    const distance = (cube) => Math.min(...spots.map((spot) =>
        (cube.cx + 0.5 - spot.x) ** 2 + (cube.cy + 0.5 - spot.y) ** 2 + (cube.cz + 0.5 - spot.z) ** 2));
    return cubes.map((cube) => ({ cube, distance: distance(cube) }))
        .sort((a, b) => a.distance - b.distance)
        .map(({ cube }) => cube);
}

function sweepCeilings(players) {
    const blackout = escapeBlackout();
    if (sweptFor !== blackout) {
        // a blackout over a switch back that hadn't finished still has those cubes to switch back later
        if (blackout) for (const cube of [...queue, ...deferred]) darkened.set(cube.key, cube);
        sweptFor = blackout;
        swept.clear();
        playerCubes.clear();
        deferred = [];
        if (blackout) queue = mapCubes(players);
        else {
            queue = [...darkened.values()];
            darkened.clear();
        }
    }
    if (blackout) {
        // a player in a cube they weren't in before: the area around them goes first
        const near = [];
        for (const player of players) {
            let dimension;
            let location;
            try {
                dimension = player.dimension;
                location = player.location;
            } catch { continue; }
            if (!dimension || !location) continue;
            const px = Math.floor(location.x / 16);
            const py = Math.floor(location.y / 16);
            const pz = Math.floor(location.z / 16);
            const key = cubeKey(dimension.id, px, py, pz);
            if (playerCubes.get(player.id) === key) continue;
            playerCubes.set(player.id, key);
            cubesAround(dimension, px, py, pz, near);
        }
        if (near.length > 0) queue = near.filter((cube) => !swept.has(cube.key)).concat(queue);
    }
    if (queue.length === 0) {
        if (deferred.length === 0 || system.currentTick < retryAt) return;
        queue = deferred;
        deferred = [];
    }
    let budget = SWEEPS_PER_TICK;
    while (budget > 0 && queue.length > 0) {
        const cube = queue.shift();
        if (swept.has(cube.key)) continue;
        budget--;
        if (sweepCube(cube, blackout)) {
            swept.add(cube.key);
            if (blackout) darkened.set(cube.key, cube);
        } else {
            if (deferred.length === 0) retryAt = system.currentTick + SWEEP_RETRY_TICKS;
            deferred.push(cube);
        }
    }
}

export function startEscape() {
    system.runInterval(() => {
        const players = world.getAllPlayers();
        if (isPaused()) saveRemaining();
        else sweepCeilings(players);
        if (!isPaused()) {
            let stage = escapeStage();
            if (stage === ESCAPE_STAGE.idle && highestScore(players, "notebooks") >= NOTEBOOK_GOAL && isRaldiPresent()) {
                beginEscape();
            } else if (stage === ESCAPE_STAGE.intro && isRaldiPresent()) {
                if (!introHasStarted()) {
                    startIntro(players);
                } else if (countDown()) {
                    setExitPhase(true);
                    setEscapeStage(ESCAPE_STAGE.loop);
                    setRemaining(undefined);
                    setIntroStarted(undefined);
                }
            }
            stage = escapeStage();
            if (isExitPhase() && stage !== ESCAPE_STAGE.won) {
                const exits = highestScore(players, "exits");
                if (exits >= EXIT_GOAL) {
                    setEscapeStage(ESCAPE_STAGE.won);
                    // everyone in the run, caught or not, gets the Results screen
                    const winners = players.filter(isParticipant);
                    showWinScreens(winners);
                    for (const player of winners) {
                        try {
                            awardTrophy(player, "story_mode");
                        } catch (error) {
                            console.warn(`[escape] Story mode trophy failed for ${player.name}: ${error}`);
                        }
                    }
                } else if (exits >= 3 && stage < ESCAPE_STAGE.machine) {
                    setEscapeStage(ESCAPE_STAGE.machine);
                } else if (exits >= 2 && stage < ESCAPE_STAGE.rev) {
                    setEscapeStage(ESCAPE_STAGE.rev);
                }
            }
        }
        syncMusic(players, escapeStage());
    }, 1);
}
