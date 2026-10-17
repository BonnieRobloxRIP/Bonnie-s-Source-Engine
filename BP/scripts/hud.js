import { system, world } from "@minecraft/server";
import { CREDIT_CARD_TAG, escapeFilterPayload, EXIT_GOAL, NOTEBOOK_GOAL } from "./core/game_state.js";
import { isBeastBattleActive } from "./beast_battle.js";
import { gameTick } from "./core/pause.js";
import { clearStatusDisplays, setStatusDisplay, statusDisplayPayload } from "./core/status_displays.js";
import { getJail } from "./jail.js";
import { raldiRespawnSeconds } from "./characters/raldi.js";
import { isTrophyPopupAnimating, trophyPopupPayload } from "./trophies.js";
import { hasWinScreen, winScreenPayload } from "./win_screen.js";

// Feeds RP/ui/hud_screen.json. Every field is a fixed byte-width slice of one
// string pushed through the vanilla title binding, because JSON UI can only cut
// a string by byte offset. Widths must stay in sync with hud_screen.json.
const MARKER = "HUD:";
const W_TIMER = 10;
const W_MONEY = 12;
const W_ETHEREUM = 10;
const W_STAMINA = 7;
const W_COUNT = 8;
const W_AMMO = 6;
const OVERFLOW_MARKER = "#";
// [52..53) fiesta filter; [77..79) escape color and opacity (see game_state.js).
const FILTER_ON = "F";
const FILTER_OFF = "-";

const UPDATE_INTERVAL_TICKS = 4;
// The HUD lives in the hud_title_text factory control, which is torn down when the title expires,
// so an unchanged payload is still re-sent this often and every title outlasts that gap. The
// refresh also repairs the HUD after another title (run.js "You got caught!") overwrote it.
const REFRESH_INTERVAL_TICKS = 40;
const TITLE_STAY_TICKS = REFRESH_INTERVAL_TICKS * 3;
// how often the card scan runs without inventory change events (or as their safety net)

// Scoreboard objectives the HUD reads. All optional: a missing objective or an
// unscored player just renders as a zero.
const OBJ_TIME = "timer";              // seconds elapsed this session
const OBJ_MONEY = "money";              // whole cents
const OBJ_ETHEREUM = "etherium";
const OBJ_STAMINA = "stamina";          // 0-100
const OBJ_COLLECTED = "notebooks";
const OBJ_EXITS = "exits";
const OBJ_GLOCK_AMMO = "glock_ammo";
const GLOCK_ITEM = "brr:item_glock";
const ETHEREUM_VISIBLE_PROPERTY = "brr:ethereum_visible";

// player ids currently seeing the yellow fiesta overlay
const filtered = new Set();
// player id -> seconds left in MrBeast's circle challenge
const challengeTimers = new Map();
const W_CHALLENGE = 6;
// "<player id>:<name>" -> system tick the overlay started
const phoneOverlays = new Map();
// noisescalling sheet: one full 26-frame spin, one frame per tick (the HUD's fastest refresh)
const NOISE_FRAMES = 26;
const itemExplosions = new Map();
// player id -> jump rope frame 0..15 (Rope01..Rope16)
const ropeFrames = new Map();
// player id -> { payload, at }: the last title sent, so an unchanged HUD isn't pushed again
const sentTitles = new Map();
// player id -> { has, at }: the last card scan; dropped when the inventory changes
let hiddenForBattle = false;

export function setRopeFrame(player, frame) {
    if (frame === undefined) ropeFrames.delete(player.id);
    else ropeFrames.set(player.id, frame);
}

function ropeFrame(player) {
    const frame = ropeFrames.get(player.id);
    return frame === undefined ? "-" : String.fromCharCode(97 + frame);
}

export function setItemExplosion(player, startedAt, slots = []) {
    if (startedAt === undefined) itemExplosions.delete(player.id);
    else itemExplosions.set(player.id, { startedAt, slots });
}

function explosionFrame(player) {
    const start = itemExplosions.get(player.id)?.startedAt;
    const frame = system.currentTick - start;
    return start === undefined || frame >= 16 ? "-" : String.fromCharCode(97 + frame);
}

function explosionSlots(player) {
    const slots = itemExplosions.get(player.id)?.slots ?? [];
    const frame = explosionFrame(player);
    return Array.from({ length: 5 }, (_, slot) => slots.includes(slot) ? frame : "-").join("");
}

export function setPhoneOverlay(player, name, on) {
    const key = `${player.id}:${name}`;
    if (on) phoneOverlays.set(key, system.currentTick);
    else phoneOverlays.delete(key);
}

function noiseFrame(player) {
    const start = phoneOverlays.get(`${player.id}:noise`);
    if (start === undefined) return "-";
    const frame = (system.currentTick - start) % NOISE_FRAMES;
    return String.fromCharCode(97 + frame);
}

export function setScreenFilter(player, on) {
    if (on) filtered.add(player.id);
    else filtered.delete(player.id);
}

export function setChallengeTimer(player, seconds) {
    if (seconds === undefined) challengeTimers.delete(player.id);
    else challengeTimers.set(player.id, seconds);
    setStatusDisplay(player, "C", seconds);
}

export function setRopeProgress(player, jumps) {
    setStatusDisplay(player, "V", jumps);
}

export function setKidnapTimer(player, seconds) {
    setStatusDisplay(player, "K", seconds);
}

function byteLength(text) {
    let length = 0;
    for (const character of text) {
        const codePoint = character.codePointAt(0);
        length += codePoint < 0x80 ? 1 : codePoint < 0x800 ? 2 : codePoint < 0x10000 ? 3 : 4;
    }
    return length;
}

function padRight(text, width) {
    const length = byteLength(text);
    if (length > width) return OVERFLOW_MARKER.repeat(width);
    return text + " ".repeat(width - length);
}

function padLeft(text, width) {
    const length = byteLength(text);
    if (length > width) return OVERFLOW_MARKER.repeat(width);
    return " ".repeat(width - length) + text;
}

function score(player, objective, fallback = 0) {
    if (!objective) return fallback;
    try {
        return objective.getScore(player) ?? fallback;
    } catch {
        return fallback;
    }
}

function glockAmmo(player, objectives) {
    let objective = objectives.glockAmmo;
    if (!objective) {
        objective = world.scoreboard.getObjective(OBJ_GLOCK_AMMO);
        if (!objective) objective = world.scoreboard.addObjective(OBJ_GLOCK_AMMO, "Glock Ammo");
        objectives.glockAmmo = objective;
    }
    try {
        const ammo = objective.getScore(player);
        if (ammo !== undefined) return ammo;
    } catch { }
    try { objective.setScore(player, 3); } catch { }
    return 3;
}

function formatClock(totalSeconds) {
    const seconds = Math.max(0, totalSeconds);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
        return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatMoney(cents) {
    const sign = cents < 0 ? "-" : "";
    const absolute = Math.abs(cents);
    return `${sign}$${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

function getHudObjectives() {
    return {
        time: world.scoreboard.getObjective(OBJ_TIME),
        money: world.scoreboard.getObjective(OBJ_MONEY),
        ethereum: world.scoreboard.getObjective(OBJ_ETHEREUM),
        stamina: world.scoreboard.getObjective(OBJ_STAMINA),
        collected: world.scoreboard.getObjective(OBJ_COLLECTED),
        exits: world.scoreboard.getObjective(OBJ_EXITS),
        glockAmmo: world.scoreboard.getObjective(OBJ_GLOCK_AMMO)
    };
}

// a player who took MrBeast's credit card (a tag, main.js) gets the shaking card and its warning
function carriesCard(player) {
    return player.hasTag(CREDIT_CARD_TAG);
}

// forget the sent title so the next update pushes the HUD again, e.g. after another title replaced it
export function refreshHud(player) {
    sentTitles.delete(player.id);
}

function buildHudPayload(player, objectives) {
    const exits = score(player, objectives.exits);
    const showExits = exits >= 1;
    const goal = showExits ? EXIT_GOAL : NOTEBOOK_GOAL;
    const count = showExits ? exits : Math.min(NOTEBOOK_GOAL, score(player, objectives.collected));

    const heldItem = player.getComponent("minecraft:inventory")?.container?.getItem(player.selectedSlotIndex);
    const ammo = heldItem?.typeId === GLOCK_ITEM ? glockAmmo(player, objectives) : undefined;
    const ammoField = ammo === undefined ? "-".repeat(W_AMMO + 1) : `G${padLeft(`§r${Math.max(0, Math.min(999, ammo))}`, W_AMMO)}`;
    const challenge = challengeTimers.get(player.id);
    const jail = getJail(player);
    setStatusDisplay(player, "J", jail ? Math.ceil((jail.until - gameTick()) / 20) : undefined);
    const timedMode = jail ? "J" : challenge === undefined ? "-" : "C";
    const timedSeconds = jail ? Math.ceil((jail.until - gameTick()) / 20) : challenge;
    const respawnSeconds = raldiRespawnSeconds(player.dimension);

    return MARKER
        + padRight(`§r${formatClock(score(player, objectives.time))}`, W_TIMER)
        + padLeft(formatMoney(score(player, objectives.money)), W_MONEY)
        + padLeft(`§r${score(player, objectives.ethereum)}`, W_ETHEREUM)
        + padRight(`§r${score(player, objectives.stamina, 100)}%`, W_STAMINA)
        + (showExits ? "E" : "N")
        + padLeft(`§r${count}/${goal}`, W_COUNT)
        + (filtered.has(player.id) ? FILTER_ON : FILTER_OFF)
        + ammoField
        + (player.getDynamicProperty(ETHEREUM_VISIBLE_PROPERTY) === true ? "V" : "-")
        + (timedMode === "-"
            ? "-".repeat(W_CHALLENGE + 1)
            : `${timedMode}${padRight(`§r${Math.max(0, Math.min(99, timedSeconds))}`, W_CHALLENGE)}`)
        + (respawnSeconds === undefined
            ? "-".repeat(W_CHALLENGE + 1)
            : `R${padRight(`§r${respawnSeconds}`, W_CHALLENGE)}`)
        + (phoneOverlays.has(`${player.id}:hitman`) ? "H" : "-")
        + noiseFrame(player)
        + escapeFilterPayload()
        + explosionSlots(player)
        + ropeFrame(player)
        + statusDisplayPayload(player)
        + trophyPopupPayload(player)
        + (carriesCard(player) ? "C" : "-")
        + winScreenPayload(player);
}

export function startHud() {
    world.afterEvents.playerLeave.subscribe(({ playerId }) => {
        clearStatusDisplays(playerId);
        challengeTimers.delete(playerId);
        ropeFrames.delete(playerId);
        sentTitles.delete(playerId);
    });
    // a respawn or relog may have dropped the title, and the inventory may be a different one
    world.afterEvents.playerSpawn.subscribe(({ player }) => {
        sentTitles.delete(player.id);
    });
    system.afterEvents.scriptEventReceive.subscribe(({ id, message, sourceEntity }) => {
        if (id !== "brr:ethereum" || sourceEntity?.typeId !== "minecraft:player") return;
        const action = message.trim().toLowerCase();
        if (action === "show" || action === "hide") {
            sourceEntity.setDynamicProperty(ETHEREUM_VISIBLE_PROPERTY, action === "show");
        } else if (action === "toggle") {
            sourceEntity.setDynamicProperty(ETHEREUM_VISIBLE_PROPERTY, sourceEntity.getDynamicProperty(ETHEREUM_VISIBLE_PROPERTY) !== true);
        }
    });

    // Rebuilt every tick while a sprite overlay animates, otherwise every UPDATE_INTERVAL_TICKS, and
    // only sent when it changed or the REFRESH_INTERVAL_TICKS safety refresh is due.
    system.runInterval(() => {
        const now = system.currentTick;
        // the MrBeast battle has every player on its stage: no HUD there (each new battle page used
        // to bring it back for a moment); it's sent fresh once the battle is over
        if (isBeastBattleActive()) {
            if (!hiddenForBattle) {
                hiddenForBattle = true;
                for (const player of world.getAllPlayers()) {
                    try { player.onScreenDisplay.clearTitle(); } catch { }
                }
            }
            sentTitles.clear();
            return;
        }
        hiddenForBattle = false;
        const regular = now % UPDATE_INTERVAL_TICKS === 0;
        let objectives;
        for (const player of world.getAllPlayers()) {
            if (!regular && !phoneOverlays.has(`${player.id}:noise`) && !itemExplosions.has(player.id)
                && !ropeFrames.has(player.id) && !isTrophyPopupAnimating(player) && !hasWinScreen(player)) continue;
            objectives ??= getHudObjectives();
            const payload = buildHudPayload(player, objectives);
            const sent = sentTitles.get(player.id);
            if (sent && sent.payload === payload && now - sent.at < REFRESH_INTERVAL_TICKS) continue;
            player.onScreenDisplay.setTitle(payload, {
                fadeInDuration: 0,
                stayDuration: TITLE_STAY_TICKS,
                fadeOutDuration: 0
            });
            sentTitles.set(player.id, { payload, at: now });
        }
    }, 1);
}
