import { BlockVolume, EquipmentSlot, GameMode, HudVisibility, system, world } from "@minecraft/server";
import { ActionFormData, FormCancelationReason, uiManager } from "@minecraft/server-ui";
import { resetPoopTimer } from "./bathroom.js";
import { ESCAPE_STAGE, escapeStage } from "./core/game_state.js";
import { holdPause, isPaused, releasePause } from "./core/pause.js";
import { addScore } from "./core/scoreboard.js";
import { refreshHud } from "./hud.js";
import { soundVolume } from "./core/settings.js";
import { IN_MENU_PROPERTY, exitMenu, isInMainMenu, openMainMenu, refreshMenu, resetGame, showMenu } from "./main_menu.js";
import { MAP_BOUNDS, isMapLoading, markMapUsed, stopLoaderTrip } from "./map.js";
import { LOADING_TIPS } from "./run_data.js";
import { isWinScreenActive } from "./win_screen.js";

// A run is one game on the shared map. It's picked on the play screen (voted on when more than
// one player is online), loads behind the bus loading screen, and ends when someone escapes or
// every player in it has been caught, which sends everyone back to the main menu.
// Players in a run have IN_MENU_PROPERTY === false.

// play screen card order (RP/ui/brr_menu.json "modes"); unavailable modes show "Coming soon!"
export const MODES = [
    { id: "story", available: true },
    // flip on once Endless Mode has its own rules
    { id: "endless", available: false }
];

const RUN_MODE_PROPERTY = "brr:run_mode";
const OUT_PROPERTY = "brr:run_out";
const SAVED_GAME_MODE_PROPERTY = "brr:run_saved_game_mode";
const VOTE_TICKS = 600;
// matches the 5 second loading_* animations in RP/ui/brr_menu.json
const LOAD_TICKS = 100;
// the loading screen opens before the map reload stalls the server
const RESET_DELAY_TICKS = 5;
// longest the loading screen waits on the map: past map.js's worst case (every part timing out)
const MAP_WAIT_STEP_TICKS = 5;
const MAP_WAIT_MAX_TICKS = 640;
const LOADING_BACKGROUNDS = 4;
const END_FADE_TICKS = 30;
const UNSET_SPAWN_Y = 32767;
// the game clock (the "timer" scoreboard, read by the HUD and the win screen): a second for every 20
// unpaused ticks, for each player in the game who hasn't been caught
const TIMER_OBJECTIVE = "timer";
const TICKS_PER_SECOND = 20;
// where a run starts: the brr:player_spawn marker in the map, facing the way it was placed
const SPAWN_BLOCK = "brr:player_spawn";
const FACING_YAW = { south: 0, west: 90, north: 180, east: -90 };
const BLACK = { red: 0, green: 0, blue: 0 };
const ARMOR_SLOTS = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet, EquipmentSlot.Offhand];

const startListeners = [];
let vote; // { endsAt, votes: Map<playerId, modeId> }
let loading; // { mode, holder, background, tip, players: Set<playerId> }
let ending = false;
let clockTicks = 0; // unpaused ticks towards the next second
let spawnPoint; // the map's spawn marker, found once and kept while it's still there

// listener(player) runs for every player entering a run, at its start or when joining one in progress
export function onRunStart(listener) {
    startListeners.push(listener);
}

export function activeRunMode() {
    return world.getDynamicProperty(RUN_MODE_PROPERTY);
}

export function isRunActive() {
    return activeRunMode() !== undefined;
}

export function isParticipant(player) {
    return player.getDynamicProperty(IN_MENU_PROPERTY) === false;
}

function isOut(player) {
    return player.getDynamicProperty(OUT_PROPERTY) === true;
}

// in the run and not caught
export function isPlayingRun(player) {
    return isParticipant(player) && !isOut(player);
}

function livingParticipants() {
    return world.getAllPlayers().filter(isPlayingRun);
}

// the menu pauses the game, but not while someone else is in the middle of a run
export function othersPlaying(player) {
    return isRunActive() && livingParticipants().some((other) => other.id !== player.id);
}

function fade(player, fadeIn, hold, fadeOut) {
    try {
        player.camera.fade({ fadeTime: { fadeInTime: fadeIn, holdTime: hold, fadeOutTime: fadeOut }, fadeColor: BLACK });
    } catch { }
}

// ------------------------------------------------------------- play screen ----

function secondsLeft() {
    return Math.max(0, Math.ceil((vote.endsAt - system.currentTick) / 20));
}

// body and card texts for the play screen; a card is "<state>|<status>" (see mode_card_face)
export function playScreen(player) {
    const running = activeRunMode();
    let banner = "";
    if (running) banner = "A game is in progress. Pick its mode to join!";
    else if (vote) banner = `Pick a mode to vote! Voting ends in ${secondsLeft()}s`;
    const cards = MODES.map((mode) => {
        if (!mode.available) return "l|Coming soon!";
        if (running) return mode.id === running ? "o|In progress - click to join!" : "l|";
        if (!vote) return "o|";
        let count = 0;
        for (const id of vote.votes.values()) if (id === mode.id) count++;
        return `${vote.votes.get(player.id) === mode.id ? "v" : "o"}|Votes: ${count}`;
    });
    return { banner, cards };
}

// a card was picked; returns the menu screen to show next, or undefined once the player has left the menu
export function chooseMode(player, modeId) {
    const mode = MODES.find((entry) => entry.id === modeId);
    if (!mode?.available) return "play";
    const running = activeRunMode();
    if (running) {
        if (running !== modeId) return "play";
        joinRun(player);
        return undefined;
    }
    const online = world.getAllPlayers();
    if (online.length <= 1 || MODES.filter((entry) => entry.available).length <= 1) {
        startRun(modeId);
        return undefined;
    }
    castVote(player, modeId, online);
    return isRunActive() ? undefined : "play";
}

// ------------------------------------------------------------------- vote ----

function castVote(player, modeId, online) {
    if (!vote) {
        vote = { endsAt: system.currentTick + VOTE_TICKS, votes: new Map() };
        // everyone else in the menu is brought to the play screen to vote
        for (const other of online) {
            if (other.id !== player.id && isInMainMenu(other)) showMenu(other, "play");
        }
    }
    vote.votes.set(player.id, modeId);
    if (online.every((other) => vote.votes.has(other.id))) {
        finishVote();
        return;
    }
    for (const other of online) {
        if (other.id !== player.id) refreshMenu(other, "play");
    }
}

function finishVote() {
    const ended = vote;
    vote = undefined;
    const online = new Set(world.getAllPlayers().map((player) => player.id));
    const tally = new Map();
    for (const [playerId, modeId] of ended.votes) {
        if (online.has(playerId)) tally.set(modeId, (tally.get(modeId) ?? 0) + 1);
    }
    const best = Math.max(0, ...tally.values());
    const winners = [...tally].filter(([, count]) => count === best && best > 0).map(([modeId]) => modeId);
    if (winners.length === 0) {
        for (const player of world.getAllPlayers()) refreshMenu(player, "play");
        return;
    }
    // a tie is a coin flip
    startRun(winners[Math.floor(Math.random() * winners.length)]);
}

// ---------------------------------------------------------------- loading ----

function startRun(modeId) {
    vote = undefined;
    clockTicks = 0;
    world.setDynamicProperty(RUN_MODE_PROPERTY, modeId);
    // getting caught goes straight to spectating instead of the death screen
    try { world.gameRules.doImmediateRespawn = true; } catch { }
    const holder = {};
    holdPause(holder);
    const current = {
        mode: modeId,
        holder,
        background: 1 + Math.floor(Math.random() * LOADING_BACKGROUNDS),
        tip: LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)],
        players: new Set()
    };
    loading = current;
    for (const player of world.getAllPlayers()) addToLoading(player);
    system.runTimeout(() => {
        try { resetGame({ onlyIfUsed: true }); }
        catch (error) { console.warn(`[run] Map reset failed: ${error}`); }
    }, RESET_DELAY_TICKS);
    system.runTimeout(() => finishLoading(current), LOAD_TICKS);
}

function addToLoading(player) {
    const current = loading;
    if (!current || current.players.has(player.id)) return;
    current.players.add(player.id);
    exitMenu(player);
    prepare(player);
    try { player.onScreenDisplay.setHudVisibility(HudVisibility.Hide); } catch { }
    try { uiManager.closeAllForms(player); } catch { }
    try { player.playSound("menu.bus", { volume: soundVolume(player) }); } catch { }
    system.run(() => showLoading(player, current));
}

function showLoading(player, current) {
    if (loading !== current || !player.isValid) return;
    // the tip rides at the end of the title, which the loading screen reads its layout from anyway
    new ActionFormData()
        .title(`brr:menu:loading|bg${current.background}|tip:${current.tip}`)
        .body("")
        .show(player)
        .then((response) => {
            // the loading screen can't be closed
            if (loading !== current) return;
            const delay = response.cancelationReason === FormCancelationReason.UserBusy ? 5 : 1;
            system.runTimeout(() => showLoading(player, current), delay);
        })
        .catch(() => system.runTimeout(() => showLoading(player, current), 20));
}

// the loading screen stays up until the map is fully placed (map.js may be fetching far parts)
function finishLoading(current, waited = 0) {
    if (loading !== current) return;
    if (isMapLoading() && waited < MAP_WAIT_MAX_TICKS) {
        system.runTimeout(() => finishLoading(current, waited + MAP_WAIT_STEP_TICKS), MAP_WAIT_STEP_TICKS);
        return;
    }
    loading = undefined;
    // out of time with the loader still hovering over the map: it mustn't carry them off mid-run
    stopLoaderTrip();
    markMapUsed();
    for (const player of world.getAllPlayers()) {
        if (current.players.has(player.id)) enterRun(player);
    }
    releasePause(current.holder);
}

// ------------------------------------------------------------ in the run ----

// a fresh start for one player: empty hands, full health, and every module's per-run state reset
function prepare(player) {
    player.setDynamicProperty(OUT_PROPERTY, undefined);
    restoreGameMode(player);
    try { player.getComponent("minecraft:inventory")?.container?.clearAll(); } catch { }
    const equipment = player.getComponent("minecraft:equippable");
    for (const slot of ARMOR_SLOTS) {
        try { equipment?.setEquipment(slot); } catch { }
    }
    for (const effect of player.getEffects()) {
        try { player.removeEffect(effect.typeId); } catch { }
    }
    try { player.getComponent("minecraft:health")?.resetToMaxValue(); } catch { }
    resetPoopTimer(player);
    for (const listener of startListeners) {
        try { listener(player); }
        catch (error) { console.warn(`[run] Run start listener failed: ${error}`); }
    }
}

// everyone plays in adventure mode: they can use the school, not break or build it
function makeAdventurer(player) {
    try { if (player.getGameMode() !== GameMode.Adventure) player.setGameMode(GameMode.Adventure); } catch { }
}

// at the start of a game, or joining one in progress
function enterRun(player) {
    player.setDynamicProperty(IN_MENU_PROPERTY, false);
    makeAdventurer(player);
    try { uiManager.closeAllForms(player); } catch { }
    try { player.onScreenDisplay.setHudVisibility(HudVisibility.Reset); } catch { }
    fade(player, 0, 0.2, 0.6);
    teleportToSpawn(player);
}

function joinRun(player) {
    if (loading) {
        addToLoading(player);
        return;
    }
    exitMenu(player);
    prepare(player);
    enterRun(player);
}

function findSpawnBlock() {
    const dimension = world.getDimension("overworld");
    try {
        const found = dimension.getBlocks(new BlockVolume(MAP_BOUNDS.min, MAP_BOUNDS.max), { includeTypes: [SPAWN_BLOCK] }, true);
        for (const at of found.getBlockLocationIterator()) {
            const facing = dimension.getBlock(at)?.permutation.getState("minecraft:cardinal_direction");
            return {
                block: { x: at.x, y: at.y, z: at.z },
                location: { x: at.x + 0.5, y: at.y, z: at.z + 0.5 },
                dimension,
                rotation: { x: 0, y: FACING_YAW[facing] ?? FACING_YAW.north }
            };
        }
    } catch (error) {
        console.warn(`[run] Searching the map for ${SPAWN_BLOCK} failed: ${error}`);
    }
    return undefined;
}

// the map's brr:player_spawn; without one, wherever the player's (or the world's) spawn point is
function spawnLocation(player) {
    let still = false;
    try { still = spawnPoint?.dimension.getBlock(spawnPoint.block)?.typeId === SPAWN_BLOCK; } catch { }
    if (!still) spawnPoint = undefined;
    spawnPoint ??= findSpawnBlock();
    if (spawnPoint) return spawnPoint;
    let point;
    try { point = player.getSpawnPoint(); } catch { }
    const location = point ?? world.getDefaultSpawnLocation();
    if (!point && location.y === UNSET_SPAWN_Y) return undefined;
    return {
        location: { x: Math.floor(location.x) + 0.5, y: location.y, z: Math.floor(location.z) + 0.5 },
        dimension: point?.dimension ?? world.getDimension("overworld")
    };
}

function teleportToSpawn(player) {
    const spawn = spawnLocation(player);
    if (!spawn) {
        player.sendMessage("§eThere is no Player Spawn block in the map, so you start where you are.");
        return;
    }
    try {
        player.teleport(spawn.location, { dimension: spawn.dimension, rotation: spawn.rotation });
        // anything that respawns them mid-run brings them back here too
        player.setSpawnPoint({ ...spawn.location, dimension: spawn.dimension });
    } catch (error) { console.warn(`[run] Teleport to spawn failed for ${player.name}: ${error}`); }
}

function spectate(player) {
    try {
        const mode = player.getGameMode();
        if (mode !== GameMode.Spectator) {
            player.setDynamicProperty(SAVED_GAME_MODE_PROPERTY, mode);
            player.setGameMode(GameMode.Spectator);
        }
    } catch { }
    teleportToSpawn(player);
    try {
        player.onScreenDisplay.setTitle("§cYou got caught!", {
            subtitle: "Spectating until the game ends",
            fadeInDuration: 10, stayDuration: 60, fadeOutDuration: 20
        });
    } catch { }
    // that title replaced the HUD's own: send the HUD again as soon as it's done
    refreshHud(player);
}

function restoreGameMode(player) {
    const saved = player.getDynamicProperty(SAVED_GAME_MODE_PROPERTY);
    if (saved === undefined) return;
    player.setDynamicProperty(SAVED_GAME_MODE_PROPERTY, undefined);
    try { player.setGameMode(saved); } catch { }
}

// fade out, reset the map and bring every player back to the main menu
export function endRun() {
    if (ending) return;
    ending = true;
    vote = undefined;
    if (loading) {
        releasePause(loading.holder);
        loading = undefined;
    }
    for (const player of world.getAllPlayers()) {
        if (isParticipant(player)) fade(player, 0.5, 1.5, 0.5);
    }
    system.runTimeout(() => {
        world.setDynamicProperty(RUN_MODE_PROPERTY, undefined);
        try { resetGame({ unload: true }); }
        catch (error) { console.warn(`[run] Map reset failed: ${error}`); }
        for (const player of world.getAllPlayers()) {
            player.setDynamicProperty(OUT_PROPERTY, undefined);
            restoreGameMode(player);
            if (!isInMainMenu(player)) openMainMenu(player);
        }
        ending = false;
    }, END_FADE_TICKS);
}

// nobody left playing (the last one was caught or left): the run is over
function endIfEmpty() {
    if (!isRunActive() || ending || loading) return;
    if (livingParticipants().length > 0) return;
    if (world.getAllPlayers().length > 0) endRun();
}

// counted tick by tick so a pause (a notebook, a meme, the menu) stops the clock without losing time
function tickClock() {
    if (!isRunActive() || ending || loading || isPaused()) return;
    if (++clockTicks < TICKS_PER_SECOND) return;
    clockTicks = 0;
    for (const player of livingParticipants()) {
        try { addScore(player, TIMER_OBJECTIVE, 1, "Timer"); } catch { }
    }
}

export function startRuns() {
    system.runInterval(tickClock, 1);
    // every way of dying in a run (Raldi, MrBeast, the battle) counts as getting caught
    world.afterEvents.entityDie.subscribe(({ deadEntity }) => {
        if (!isRunActive() || ending || !isParticipant(deadEntity) || isOut(deadEntity)) return;
        deadEntity.setDynamicProperty(OUT_PROPERTY, true);
        endIfEmpty();
    }, { entityTypes: ["minecraft:player"] });

    world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
        if (initialSpawn) {
            // left while spectating and the run ended meanwhile
            if (!isRunActive()) {
                player.setDynamicProperty(OUT_PROPERTY, undefined);
                restoreGameMode(player);
            }
            // reconnecting to a game still going (they skip the menu): back in adventure, unless spectating
            else if (isParticipant(player) && !isOut(player)) makeAdventurer(player);
            system.run(endIfEmpty);
            return;
        }
        if (isRunActive() && !ending && isParticipant(player) && isOut(player)) system.run(() => spectate(player));
    });

    world.afterEvents.playerLeave.subscribe(({ playerId }) => {
        system.run(() => {
            if (vote) {
                vote.votes.delete(playerId);
                const online = world.getAllPlayers();
                if (online.length > 0 && vote.votes.size > 0 && online.every((player) => vote.votes.has(player.id))) finishVote();
            }
            endIfEmpty();
        });
    });

    // `/scriptevent brr:run end` sends everyone back to the menu
    system.afterEvents.scriptEventReceive.subscribe(({ id, message }) => {
        if (id !== "brr:run") return;
        if (message.trim().toLowerCase() === "end" && isRunActive()) endRun();
    });

    system.runInterval(() => {
        if (vote) {
            if (system.currentTick >= vote.endsAt) finishVote();
            else for (const player of world.getAllPlayers()) refreshMenu(player, "play");
        }
        if (!isRunActive() || ending || loading) return;
        // everyone has left the Win screen (win_screen.js) for the main menu
        if (escapeStage() === ESCAPE_STAGE.won && !isWinScreenActive()) endRun();
    }, 20);
}
