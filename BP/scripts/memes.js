import { system, world } from "@minecraft/server";
import { ActionFormData, FormCancelationReason, uiManager } from "@minecraft/server-ui";
import { MEMES } from "./memes_data.js";
import { holdPause, releasePause } from "./core/pause.js";
import { soundVolume } from "./core/settings.js";

// RP/ui/server_form.json swaps the action form for the meme player when the title starts with this
const TITLE_PREFIX = "brr:meme:";
// memes split over several sheets announce each extra part as "_p2", "_p3", ... after the id
const PART_MARKER = "_p";
const BUSY_RETRY_TICKS = 5;
const BUSY_RETRIES = 20;
const END_GRACE_TICKS = 4;
const XMAS_MODE_PROPERTY = "brr:xmas_memes";
const SEEN_MEMES_PROPERTY = "brr:seen_memes_";

// player id -> { player, meme, endTimer, done, onEnd }
const sessions = new Map();

export function isXmasMode() {
    return world.getDynamicProperty(XMAS_MODE_PROPERTY) === true;
}

export function setXmasMode(on) {
    world.setDynamicProperty(XMAS_MODE_PROPERTY, on ? true : undefined);
}

function pickMeme(player) {
    const poolName = isXmasMode() ? "xmas" : "normal";
    const pool = MEMES[poolName];
    if (!pool?.length) return;
    const property = SEEN_MEMES_PROPERTY + poolName;
    let seen;
    try { seen = new Set(JSON.parse(player.getDynamicProperty(property) ?? "[]")); }
    catch { seen = new Set(); }
    let available = pool.filter((meme) => !seen.has(meme.id));
    if (!available.length) {
        seen.clear();
        available = pool;
    }
    return { meme: available[Math.floor(Math.random() * available.length)], property, seen };
}

export function isWatchingMeme(player) {
    return sessions.has(player.id);
}

// id is "<pool>/<slug>", e.g. "cutscene/beast_encounter"
export function findMeme(id) {
    return MEMES[id.split("/")[0]]?.find((meme) => meme.id === id);
}

function stopAudio(session) {
    if (session.endTimer !== undefined) system.clearRun(session.endTimer);
    session.endTimer = undefined;
    if (!session.meme.sound || !session.player.isValid) return;
    try { session.player.runCommand(`stopsound @s ${session.meme.sound}`); } catch { }
}

function finish(playerId, session) {
    if (session.done) return;
    session.done = true;
    stopAudio(session);
    sessions.delete(playerId);
    releasePause(session);
    session.onEnd?.();
}

function memeTitle(meme) {
    if (meme.formTitle) return meme.formTitle;
    let title = TITLE_PREFIX + meme.id;
    for (let part = 2; part <= (meme.parts ?? 1); part++) title += PART_MARKER + part;
    return title;
}

function open(session, attempt) {
    const player = session.player;
    if (!player.isValid) {
        finish(session.playerId, session);
        return;
    }
    if (session.meme.sound) {
        try { player.playSound(session.meme.sound, { volume: soundVolume(player) }); } catch { }
    }
    session.endTimer = system.runTimeout(() => {
        session.endTimer = undefined;
        if (player.isValid) uiManager.closeAllForms(player);
    }, session.meme.ticks + END_GRACE_TICKS);

    new ActionFormData()
        .title(memeTitle(session.meme))
        .body("")
        .show(player)
        .then((response) => {
            if (session.done) return;
            if (response.cancelationReason === FormCancelationReason.UserBusy && attempt < BUSY_RETRIES) {
                stopAudio(session);
                system.runTimeout(() => open(session, attempt + 1), BUSY_RETRY_TICKS);
                return;
            }
            finish(session.playerId, session);
        })
        .catch(() => finish(session.playerId, session));
}

// shows a meme full screen; the whole game stays paused until it ends or is closed, then onEnd runs.
// Returns false (and never calls onEnd) if the player is already watching one.
export function playMeme(player, meme, onEnd) {
    if (sessions.has(player.id)) return false;
    const session = { player, playerId: player.id, meme, endTimer: undefined, done: false, onEnd };
    sessions.set(player.id, session);
    holdPause(session);
    open(session, 0);
    return true;
}

export function playRandomMeme(player) {
    if (sessions.has(player.id)) return;
    const choice = pickMeme(player);
    if (choice && playMeme(player, choice.meme)) {
        choice.seen.add(choice.meme.id);
        player.setDynamicProperty(choice.property, JSON.stringify([...choice.seen]));
    }
}

// `/scriptevent brr:memes xmas|normal|toggle`
system.afterEvents.scriptEventReceive.subscribe(({ id, message, sourceEntity }) => {
    if (id !== "brr:memes") return;
    const action = message.trim().toLowerCase();
    if (action === "xmas") setXmasMode(true);
    else if (action === "normal") setXmasMode(false);
    else if (action === "toggle" || action === "") setXmasMode(!isXmasMode());
    else return;
    const text = `Meme mode: ${isXmasMode() ? "xmas" : "normal"}`;
    if (sourceEntity?.typeId === "minecraft:player") sourceEntity.sendMessage(text);
    else world.sendMessage(text);
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    const session = sessions.get(playerId);
    if (session) finish(playerId, session);
});
