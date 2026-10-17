import { world } from "@minecraft/server";
import { gameTick } from "./pause.js";

// After 10 notebooks Raldi turns drip and progression uses exits; notebook pickups still award points.
const EXIT_PHASE_PROPERTY = "brr:exit_phase";
export const NOTEBOOK_GOAL = 10;
// the original's spoop mode: barred swing doors open up and the exits wall over
export const SPOOP_NOTEBOOKS = 2;
export const EXIT_GOAL = 4;
const ESCAPE_STAGE_PROPERTY = "brr:escape_stage";
export const ESCAPE_STAGE = { idle: 0, intro: 1, loop: 2, rev: 3, machine: 4, won: 5 };
let fadeStartedAt;

// Both are read all over the game every tick, so they live in memory; the world properties only
// carry them across a world reload. Only the setters below write them.
let loaded = false;
let storedStage;
let exitPhase = false;

function load() {
    if (loaded) return;
    storedStage = world.getDynamicProperty(ESCAPE_STAGE_PROPERTY);
    exitPhase = world.getDynamicProperty(EXIT_PHASE_PROPERTY) === true;
    loaded = true;
}

export function escapeStage() {
    load();
    return storedStage ?? (exitPhase ? ESCAPE_STAGE.loop : ESCAPE_STAGE.idle);
}

export function setEscapeStage(stage) {
    if (stage === ESCAPE_STAGE.rev && escapeStage() < ESCAPE_STAGE.rev) fadeStartedAt = gameTick();
    if (stage === ESCAPE_STAGE.idle) fadeStartedAt = undefined;
    load();
    storedStage = stage;
    world.setDynamicProperty(ESCAPE_STAGE_PROPERTY, stage);
}

export function escapeBlackout() {
    return escapeStage() >= ESCAPE_STAGE.rev;
}

// Appended HUD bytes: color (R/D/-), then a..z opacity steps over a five-second fade.
// Winning shows the Win screen instead (win_screen.js).
export function escapeFilterPayload() {
    const stage = escapeStage();
    if (stage !== ESCAPE_STAGE.rev && stage !== ESCAPE_STAGE.machine) return "--";
    const step = fadeStartedAt === undefined ? 25 : Math.min(25, Math.floor((gameTick() - fadeStartedAt) / 4));
    return (stage === ESCAPE_STAGE.machine ? "D" : "R") + String.fromCharCode(97 + step);
}

export function isExitPhase() {
    load();
    return exitPhase;
}

export function setExitPhase(active) {
    load();
    exitPhase = !!active;
    world.setDynamicProperty(EXIT_PHASE_PROPERTY, active ? true : undefined);
}

// MrBeast's credit card isn't an item in the original: a player who took it carries this tag
export const CREDIT_CARD_TAG = "brr_mrbeast_card";
