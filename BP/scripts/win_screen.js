import { ButtonState, HudElement, HudVisibility, InputButton, InputPermissionCategory, system, world } from "@minecraft/server";
import { holdPause, releasePause } from "./core/pause.js";
import { getScore } from "./core/scoreboard.js";
import { musicVolume, soundVolume } from "./core/settings.js";
import { isInMainMenu, openMainMenu } from "./main_menu.js";
import { isRunActive } from "./run.js";

// The original's Results scene (YouWonScript): Win.png and the victory jingle, then after 5.1 seconds
// the run time counts up from 0:00, minutes first, one step every 0.05 seconds with a tink each, and
// a "caching" when it lands (plus NEW RECORD! on a best time). Enter (Jump here) skips to the end and
// goes back to the main menu 1.1 seconds later. Drawn by RP/ui/hud_screen.json, see winScreenPayload.
const COUNT_DELAY_TICKS = 102;
const LEAVE_DELAY_TICKS = 22;
const TIMER_OBJECTIVE = "timer";
const RECORD_PROPERTY = "brr:record_time";
// the original throws out records under 30 seconds as cheated
const MIN_RECORD_SECONDS = 30;
const FROZEN_PROPERTY = "brr:win_frozen";
const W_TIME = 8;
const SOUNDS = { victory: "mus_victory", tink: "win.tink", caching: "win.caching", record: "win.newrecord" };

const screens = new Map(); // player id -> screen
const pauseHolder = {};

function play(player, sound, volume = soundVolume(player)) {
    try { player.playSound(sound, { volume }); } catch { }
}

function setFrozen(player, frozen) {
    if (frozen) player.setDynamicProperty(FROZEN_PROPERTY, true);
    else player.setDynamicProperty(FROZEN_PROPERTY, undefined);
    try {
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.LateralMovement, !frozen);
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.Camera, !frozen);
    } catch { }
}

// the custom HUD is drawn from the title, so only the vanilla crosshair has to go
function setCrosshair(player, visible) {
    try {
        player.onScreenDisplay.setHudVisibility(visible ? HudVisibility.Reset : HudVisibility.Hide, [HudElement.Crosshair]);
    } catch { }
}

export function isWinScreenActive() {
    return screens.size > 0;
}

export function hasWinScreen(player) {
    return screens.has(player.id);
}

export function showWinScreens(players) {
    for (const player of players) {
        if (screens.has(player.id)) continue;
        const time = Math.max(0, getScore(player, TIMER_OBJECTIVE));
        const best = player.getDynamicProperty(RECORD_PROPERTY);
        const record = typeof best !== "number" || best < MIN_RECORD_SECONDS || time < best;
        if (record) player.setDynamicProperty(RECORD_PROPERTY, time);
        screens.set(player.id, {
            player,
            minutes: Math.floor(time / 60),
            seconds: time % 60,
            shownMinutes: 0,
            shownSeconds: 0,
            record,
            showRecord: false,
            done: false,
            countAt: system.currentTick + COUNT_DELAY_TICKS,
            leaveAt: undefined
        });
        setFrozen(player, true);
        setCrosshair(player, false);
        play(player, SOUNDS.victory, musicVolume(player));
    }
    if (screens.size > 0) holdPause(pauseHolder);
}

function close(screen, toMenu) {
    screens.delete(screen.player.id);
    if (screens.size === 0) releasePause(pauseHolder);
    const player = screen.player;
    if (!player.isValid) return;
    setFrozen(player, false);
    setCrosshair(player, true);
    if (toMenu) openMainMenu(player);
}

function landed(screen) {
    screen.done = true;
    play(screen.player, SOUNDS.caching);
    if (screen.record) {
        screen.showRecord = true;
        play(screen.player, SOUNDS.record);
    }
}

function step(screen) {
    if (screen.shownMinutes !== screen.minutes) screen.shownMinutes++;
    else if (screen.shownSeconds !== screen.seconds) screen.shownSeconds++;
    else {
        landed(screen);
        return;
    }
    play(screen.player, SOUNDS.tink);
}

function skip(screen) {
    if (screen.leaveAt !== undefined) return;
    screen.shownMinutes = screen.minutes;
    screen.shownSeconds = screen.seconds;
    if (!screen.done) landed(screen);
    else play(screen.player, SOUNDS.caching);
    screen.leaveAt = system.currentTick + LEAVE_DELAY_TICKS;
}

function centered(text, width) {
    const left = Math.floor((width - text.length) / 2);
    return (" ".repeat(left) + text).padEnd(width, " ").slice(0, width);
}

// [123..124) "W" while shown, [124..125) "R" for NEW RECORD!, [125..126) "C" for the continue hint,
// [126..134) the counted time, centred in spaces
export function winScreenPayload(player) {
    const screen = screens.get(player.id);
    if (!screen) return "---" + " ".repeat(W_TIME);
    const time = `${screen.shownMinutes}:${String(screen.shownSeconds).padStart(2, "0")}`;
    return "W"
        + (screen.showRecord ? "R" : "-")
        + (screen.done && screen.leaveAt === undefined ? "C" : "-")
        + centered(time, W_TIME);
}

export function startWinScreens() {
    world.afterEvents.playerButtonInput.subscribe(({ player }) => {
        const screen = screens.get(player.id);
        if (screen) skip(screen);
    }, { buttons: [InputButton.Jump], state: ButtonState.Pressed });

    world.afterEvents.playerLeave.subscribe(({ playerId }) => {
        if (!screens.delete(playerId)) return;
        if (screens.size === 0) releasePause(pauseHolder);
    });

    // left mid-screen (or the script reloaded): give their movement back
    world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
        if (!initialSpawn || screens.has(player.id) || player.getDynamicProperty(FROZEN_PROPERTY) !== true) return;
        setFrozen(player, false);
        setCrosshair(player, true);
    });

    system.runInterval(() => {
        const now = system.currentTick;
        for (const [playerId, screen] of [...screens]) {
            const player = screen.player;
            if (!player.isValid) {
                screens.delete(playerId);
                if (screens.size === 0) releasePause(pauseHolder);
                continue;
            }
            // the run ended some other way (e.g. /scriptevent brr:run end)
            if (!isRunActive() || isInMainMenu(player)) {
                close(screen, false);
                continue;
            }
            if (screen.leaveAt !== undefined) {
                if (now >= screen.leaveAt) close(screen, true);
                continue;
            }
            if (!screen.done && now >= screen.countAt) step(screen);
        }
    }, 1);
}
