import { ButtonState, InputButton, InputPermissionCategory, system, world } from "@minecraft/server";
import { getObjective, getScore, highestScore } from "./core/scoreboard.js";
import { invalidateBlock } from "./core/block_cache.js";
import { isExitPhase } from "./core/game_state.js";
import { distanceSquared } from "./core/math.js";
import { gameTick, isPaused } from "./core/pause.js";
import { setSpeedFactor } from "./core/player_speed.js";
import { getSetting, musicVolume, soundVolume } from "./core/settings.js";
import { setStatusDisplay } from "./core/status_displays.js";
import { Navigator } from "./characters/navigation.js";
import { isTargetablePlayer } from "./characters/perception.js";
import { setUnwashed } from "./characters/chipfloke.js";
import { consumeSelected } from "./item_functionality.js";
import { isMonke } from "./monke.js";

// The original game's poop cycle (PlayerScript, ToiletScript, SinkScript):
// - once Raldi is out, a 150 second timer counts down; under 30 seconds the player farts now and
//   then, and the toilet already works ("you can poop before the indicator")
// - at zero the player has to poop: a warning shows, they fart a lot and slow down more and more
// - holding it in until the slowdown reaches 3x sets off diarrhea, which runs the player into Raldi
// - pooping makes the hands dirty until they're washed at a sink: 5 seconds, faster by spamming jump

const POOP_OBJECTIVE = "poop_timer";
const POOP_COOLDOWN_SECONDS = 150;
// the toilet works and warning farts start below this
const WARNING_SECONDS = 30;
// a monke just goes where it stands, and sooner
const MONKE_COOLDOWN_SECONDS = 30;
// The original rolls these every frame at ~60fps (1/500 and 1/100) and grows the slowdown by
// 0.0001 a frame; here they are per second.
const WARNING_FART_CHANCE = 0.12;
const URGENT_FART_CHANCE = 0.6;
const SLOWDOWN_PER_SECOND = 0.006;
const DIARRHEA_SLOWDOWN = 3;
const NOTEBOOKS_FOR_RALDI = 2;
const NOTEBOOK_OBJECTIVE = "notebooks";

const WASH_SECONDS = 5;
const WASH_JUMP_BONUS = 0.1;
const WASH_BAR_LENGTH = 20;
const SINK_ID = "brr:sink";
const WASH_SOUND = "block.washhands";
const SOUND_RANGE = 24;

const METER_TICKS = 100;

// HUD status modes (RP/ui/hud_screen.json brr_status_poop / brr_status_meter)
const STATUS_HAS_TO_POOP = "P";
const STATUS_METER = "M";
const STATUS_METER_NOW = "N";

// ticks from the start of a diarrhea attack (WaitTime2 in PlayerScript)
const DIARRHEA_BOOMS = [0, 20, 40];
const DIARRHEA_RISING_TICK = 40;
const DIARRHEA_MUSIC_TICK = 116;
const DIARRHEA_SCREAM_TICK = 127;
const DIARRHEA_RUN_TICK = 138;
const DIARRHEA_GIVE_UP_TICKS = 138 + 600;
const DIARRHEA_RUN_SPEED = 0.45;
const DIARRHEA_FART_INTERVAL_TICKS = 2;
const DIARRHEA_MUSIC = "mus_diarrhea";
const RALDI_ID = "brr:raldi";
const CATCH_DISTANCE_SQUARED = 2.25;

// player id -> { slowdown, washing, meterUntil, diarrhea, frozen: Set<InputPermissionCategory> }
const states = new Map();

function stateFor(player) {
    let state = states.get(player.id);
    if (!state) {
        state = { slowdown: 1, washing: undefined, meterUntil: 0, diarrhea: undefined, frozen: new Set() };
        states.set(player.id, state);
    }
    return state;
}

function poopObjective() {
    return getObjective(POOP_OBJECTIVE, "Poop Timer");
}

function secondsLeft(player) {
    return getScore(player, POOP_OBJECTIVE, POOP_COOLDOWN_SECONDS);
}

function setSecondsLeft(player, seconds) {
    try { poopObjective().setScore(player, seconds); } catch { }
}

function hasToPoop(player) {
    return secondsLeft(player) <= 0;
}

function center(block) {
    return { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 };
}

// ---------------------------------------------------------------- sounds ----

function nearbyListeners(dimension, location) {
    return dimension.getPlayers({ location, maxDistance: SOUND_RANGE });
}

// everyone nearby hears it, except players who turned farts off in the settings
function playFart(dimension, location) {
    for (const listener of nearbyListeners(dimension, location)) {
        if (getSetting(listener, "no_fart_sounds")) continue;
        try { listener.playSound("player.fart", { location, volume: soundVolume(listener) }); } catch { }
    }
}

function playNearby(dimension, location, soundId) {
    for (const listener of nearbyListeners(dimension, location)) {
        try { listener.playSound(soundId, { location, volume: soundVolume(listener) }); } catch { }
    }
}

function stopSoundNear(dimension, location, soundId) {
    const { x, y, z } = location;
    try { dimension.runCommand(`stopsound @a[x=${x},y=${y},z=${z},r=${SOUND_RANGE}] ${soundId}`); } catch { }
}

// --------------------------------------------------------------- freezing ----

function setFrozen(player, category, frozen) {
    const state = stateFor(player);
    if (frozen) state.frozen.add(category);
    else state.frozen.delete(category);
    try { player.inputPermissions.setPermissionCategory(category, !frozen); } catch { }
}

function unfreezeAll(player) {
    const state = states.get(player.id);
    if (!state) return;
    for (const category of [...state.frozen]) setFrozen(player, category, false);
}

// ----------------------------------------------------------------- toilet ----

function setSlowdown(player, slowdown) {
    stateFor(player).slowdown = slowdown;
    setSpeedFactor(player, "poop", 1 / slowdown);
}

function relieved(player, cooldown) {
    setSecondsLeft(player, cooldown);
    setSlowdown(player, 1);
    setStatusDisplay(player, STATUS_HAS_TO_POOP, undefined);
}

function useToilet(block, player) {
    const state = stateFor(player);
    if (state.diarrhea || state.washing) return;
    if (secondsLeft(player) >= WARNING_SECONDS) return;
    relieved(player, POOP_COOLDOWN_SECONDS);
    setUnwashed(player, true);
    const location = center(block);
    playFart(block.dimension, location);
    block.dimension.playSound("mus_congrats", location);
}

// a monke doesn't bother with toilets
function monkePoop(player) {
    relieved(player, MONKE_COOLDOWN_SECONDS);
    setUnwashed(player, false);
    playFart(player.dimension, player.location);
    playFart(player.dimension, player.location);
    playNearby(player.dimension, player.location, "player.monke_poop");
}

// ------------------------------------------------------------------- sink ----

// both halves of a multi-block sink, bottom first
function sinkParts(block) {
    const part = block.permutation.getState("minecraft:multi_block_part");
    const other = part === 0 ? block.above() : block.below();
    const parts = [block];
    if (other?.typeId === SINK_ID) parts.push(other);
    return parts;
}

function setSinkOn(dimension, locations, on) {
    for (const location of locations) {
        try {
            const part = dimension.getBlock(location);
            if (part?.typeId !== SINK_ID) continue;
            part.setPermutation(part.permutation.withState("brr:on", on));
            invalidateBlock(dimension, location);
        } catch { }
    }
}

function startWashing(block, player) {
    const state = stateFor(player);
    if (state.washing || state.diarrhea || block.permutation.getState("brr:on")) return;
    const parts = sinkParts(block);
    state.washing = {
        progress: 0,
        dimension: block.dimension,
        locations: parts.map((part) => part.location),
        soundAt: center(block)
    };
    // jumping stays allowed so it can be spammed
    setFrozen(player, InputPermissionCategory.LateralMovement, true);
    setSinkOn(block.dimension, state.washing.locations, true);
    block.dimension.playSound(WASH_SOUND, state.washing.soundAt);
    showWashing(player, 0);
}

function showWashing(player, progress) {
    const filled = Math.min(WASH_BAR_LENGTH, Math.floor(progress / WASH_SECONDS * WASH_BAR_LENGTH));
    const bar = `§b${"|".repeat(filled)}§8${"|".repeat(WASH_BAR_LENGTH - filled)}`;
    try { player.onScreenDisplay.setActionBar(`Washing Hands... ${Math.round(progress)}/${WASH_SECONDS}\n${bar}`); } catch { }
}

// `washed` false when cut short (caught, left), which leaves the hands dirty
function stopWashing(player, washed) {
    const state = states.get(player.id);
    const washing = state?.washing;
    if (!washing) return;
    state.washing = undefined;
    stopSoundNear(washing.dimension, washing.soundAt, WASH_SOUND);
    setSinkOn(washing.dimension, washing.locations, false);
    if (!player.isValid) return;
    setFrozen(player, InputPermissionCategory.LateralMovement, false);
    if (washed) setUnwashed(player, false);
    try { player.onScreenDisplay.setActionBar(""); } catch { }
}

function updateWashing(player, state) {
    const washing = state.washing;
    washing.progress += 1 / 20;
    if (washing.progress >= WASH_SECONDS) stopWashing(player, true);
    else showWashing(player, washing.progress);
}

function onJump(player) {
    const washing = states.get(player.id)?.washing;
    if (!washing || isPaused()) return;
    washing.progress += WASH_JUMP_BONUS;
    showWashing(player, washing.progress);
}

// ------------------------------------------------------------- poop meter ----

function usePoopMeter(player) {
    const state = stateFor(player);
    if (state.meterUntil > gameTick()) return false;
    state.meterUntil = gameTick() + METER_TICKS;
    showMeter(player);
    return true;
}

// cleared and set again each time so it stays the newest status, above "You need to poop!"
function showMeter(player) {
    setStatusDisplay(player, STATUS_METER, undefined);
    setStatusDisplay(player, STATUS_METER_NOW, undefined);
    if (hasToPoop(player)) setStatusDisplay(player, STATUS_METER_NOW, 0);
    else setStatusDisplay(player, STATUS_METER, secondsLeft(player));
}

function hideMeter(player, state) {
    state.meterUntil = 0;
    setStatusDisplay(player, STATUS_METER, undefined);
    setStatusDisplay(player, STATUS_METER_NOW, undefined);
}

// --------------------------------------------------------------- diarrhea ----

// PoopText hides the warning once the attack starts
function startDiarrhea(player, state) {
    stopWashing(player, false);
    setStatusDisplay(player, STATUS_HAS_TO_POOP, undefined);
    hideMeter(player, state);
    state.diarrhea = { ticks: 0, nav: new Navigator({ doorHeight: 3 }) };
    setFrozen(player, InputPermissionCategory.Movement, true);
}

function updateDiarrhea(player, state) {
    const diarrhea = state.diarrhea;
    const tick = diarrhea.ticks++;
    const volume = soundVolume(player);
    if (DIARRHEA_BOOMS.includes(tick)) try { player.playSound("menu.vineboom", { volume }); } catch { }
    if (tick === DIARRHEA_RISING_TICK) try { player.playSound("poop.rising", { volume }); } catch { }
    if (tick === DIARRHEA_MUSIC_TICK) try { player.playSound(DIARRHEA_MUSIC, { volume: musicVolume(player) }); } catch { }
    if (tick === DIARRHEA_SCREAM_TICK) try { player.playSound("poop.scream", { volume }); } catch { }
    if (tick < DIARRHEA_RUN_TICK) {
        try { player.onScreenDisplay.setActionBar("§cYou couldn't hold it in!"); } catch { }
        return;
    }

    // the player's legs run them straight to Raldi
    if (tick % DIARRHEA_FART_INTERVAL_TICKS === 0) playFart(player.dimension, player.location);
    const raldi = player.dimension.getEntities({ type: RALDI_ID, location: player.location, closest: 1 })[0];
    if (!raldi || tick >= DIARRHEA_GIVE_UP_TICKS || distanceSquared(raldi.location, player.location) <= CATCH_DISTANCE_SQUARED) {
        player.kill();
        return;
    }
    let moving = false;
    try { moving = diarrhea.nav.glide(player, raldi.location, DIARRHEA_RUN_SPEED); } catch { }
    // no way to reach him (off the navmesh in the original) is a game over too
    if (!moving) player.kill();
}

function stopDiarrhea(player) {
    const state = states.get(player.id);
    if (!state?.diarrhea) return;
    state.diarrhea = undefined;
    try { player.runCommand(`stopsound @s ${DIARRHEA_MUSIC}`); } catch { }
}

// ----------------------------------------------------------------- timer ----

// the timer only runs while Raldi is out, like the original's "spoop mode"
function raldiIsOut() {
    return isExitPhase() || highestScore(world.getAllPlayers(), NOTEBOOK_OBJECTIVE) >= NOTEBOOKS_FOR_RALDI;
}

function updateSecond(player, state) {
    // washing hands holds the timer like every other "in notebook" moment in the original
    if (state.washing || state.diarrhea) return;
    const seconds = secondsLeft(player);
    if (seconds > 0) {
        setSecondsLeft(player, seconds - 1);
        if (seconds - 1 < WARNING_SECONDS && Math.random() < WARNING_FART_CHANCE) playFart(player.dimension, player.location);
        return;
    }

    if (isMonke(player)) {
        monkePoop(player);
        return;
    }
    if (Math.random() < URGENT_FART_CHANCE) playFart(player.dimension, player.location);
    setSlowdown(player, state.slowdown + SLOWDOWN_PER_SECOND);
    if (state.slowdown > DIARRHEA_SLOWDOWN) {
        startDiarrhea(player, state);
        return;
    }
    setStatusDisplay(player, STATUS_HAS_TO_POOP, 0);
}

// --------------------------------------------------------------- lifecycle ----

// a fresh run (run.js) or getting caught: clean hands, full timer, no slowdown, nothing frozen
export function resetPoopTimer(player) {
    stopWashing(player, false);
    stopDiarrhea(player);
    unfreezeAll(player);
    relieved(player, POOP_COOLDOWN_SECONDS);
    setUnwashed(player, false);
    const state = states.get(player.id);
    if (state) hideMeter(player, state);
}

export function registerBathroomComponents(blockComponentRegistry) {
    blockComponentRegistry.registerCustomComponent("brr:toilet", {
        onPlayerInteract({ block, player }) {
            if (player) useToilet(block, player);
        }
    });

    blockComponentRegistry.registerCustomComponent("brr:sink", {
        onPlayerInteract({ block, player }) {
            if (player) startWashing(block, player);
        }
    });
}

world.afterEvents.playerButtonInput.subscribe(({ player }) => onJump(player), {
    buttons: [InputButton.Jump],
    state: ButtonState.Pressed
});

world.afterEvents.itemUse.subscribe(({ itemStack, source }) => {
    if (itemStack.typeId === "brr:item_poopmeter" && usePoopMeter(source)) consumeSelected(source);
});

world.afterEvents.entityDie.subscribe(({ deadEntity }) => resetPoopTimer(deadEntity), { entityTypes: ["minecraft:player"] });

// a relog or respawn mid-wash or mid-attack would otherwise leave the player stuck
world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    stopWashing(player, false);
    stopDiarrhea(player);
    if (states.has(player.id)) {
        unfreezeAll(player);
    } else if (initialSpawn) {
        // a script reload mid-wash forgets who was frozen; only the sink and the van hold this one
        try { player.inputPermissions.setPermissionCategory(InputPermissionCategory.LateralMovement, true); } catch { }
    }
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    const washing = states.get(playerId)?.washing;
    if (washing) {
        stopSoundNear(washing.dimension, washing.soundAt, WASH_SOUND);
        setSinkOn(washing.dimension, washing.locations, false);
    }
    // the frozen categories are kept so the next spawn can undo them
    const state = states.get(playerId);
    if (state) {
        state.washing = undefined;
        state.diarrhea = undefined;
        state.meterUntil = 0;
    }
});

// washing, a diarrhea attack or a shown poop meter need the per-tick update; the timer only needs a second
function hasTickWork() {
    for (const state of states.values()) {
        if (state.washing || state.diarrhea || state.meterUntil) return true;
    }
    return false;
}

system.runInterval(() => {
    const everySecond = system.currentTick % 20 === 0;
    if ((!everySecond && !hasTickWork()) || isPaused()) return;
    const raldiOut = everySecond && raldiIsOut();
    for (const player of world.getAllPlayers()) {
        const state = states.get(player.id);
        if (state?.washing) updateWashing(player, state);
        if (state?.diarrhea) {
            try { updateDiarrhea(player, state); }
            catch (error) { console.warn(`[bathroom] Diarrhea update failed for ${player.name}: ${error}`); }
        }
        if (state?.meterUntil) {
            if (state.meterUntil <= gameTick()) hideMeter(player, state);
            else if (system.currentTick % 10 === 0) showMeter(player);
        }
        if (raldiOut && isTargetablePlayer(player)) updateSecond(player, stateFor(player));
    }
}, 1);
