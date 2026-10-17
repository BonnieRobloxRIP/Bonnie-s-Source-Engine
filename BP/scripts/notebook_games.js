import { system, world } from "@minecraft/server";
import { ActionFormData, FormCancelationReason, uiManager } from "@minecraft/server-ui";
import { holdPause, releasePause } from "./core/pause.js";
import { musicVolume, soundVolume } from "./core/settings.js";

// The original's first two notebooks, each its own screen instead of a YCTP video
// (RP/ui/brr_notebook.json, made by scripts_gen/gen_notebook_ui.mjs). The game is paused while one is up.
//
//  1st, MathGameScript with notebooks == 1: the You Can Think Pad with Raldi singing; the lyrics run
//       through its screen and the keypad types into the answer box. It closes when the song ends
//       (15 s), or early with OK or the back button.
//  2nd, QuestionGame: "What's 9+10?" (21 is right, 19 kills you), then "What's Obama's last name?",
//       which can't be won: Obama flies off with a slide whistle, the rest kill you, and so does the
//       timer (the length of the music) running out. Dying shows YOU DIED.: vine thud, "you stupid"
//       0.5 s later, and 2 s after that the screen closes into spoop mode.

const MATH_TITLE = "brr:nb:math";
// brr:nb:q:<stage>:t<seconds left> while it runs, :f<seconds> once lost (the timer frozen)
const QUESTION_TITLE = "brr:nb:q:";
// measured from the Ogg sample counts
const SONG_TICKS = 300; // mus_summer_inst / mus_summer_vocals, 15.0 s
const QUESTION_TICKS = 260; // mus_learn_2, 12.976 s
const STUPID_DELAY_TICKS = 10;
const DEATH_TICKS = 50;
const BUSY_RETRY_TICKS = 5;
const BUSY_RETRIES = 20;
const SOUNDS = {
    songInst: "notebook.summer_inst",
    songVocals: "notebook.summer_vocals",
    learn: "notebook.learn_2",
    question9: "notebook.question_9_10",
    questionObama: "notebook.question_obama",
    ding: "notebook.ding",
    whistle: "notebook.slidewhistle",
    thud: "menu.vineboom",
    stupid: "notebook.question_fail"
};
// QuestionGame answers per question; index = form button
const ANSWERS = { q0: ["21", "19"], q1: ["Barack", "Obama", "Donald", "Soda"] };

// player id -> session
const sessions = new Map();

export function isInNotebookGame(player) {
    return sessions.has(player.id);
}

function play(player, sound, music = false) {
    try { player.playSound(sound, { volume: music ? musicVolume(player) : soundVolume(player) }); } catch { }
}

function stop(player, ...sounds) {
    for (const sound of sounds) {
        try { player.runCommand(`stopsound @s ${sound}`); } catch { }
    }
}

function end(session) {
    if (session.done) return;
    session.done = true;
    for (const timer of session.timers) system.clearRun(timer);
    sessions.delete(session.playerId);
    releasePause(session);
    if (session.player.isValid) {
        stop(session.player, ...Object.values(SOUNDS).filter((sound) => sound !== SOUNDS.thud && sound !== SOUNDS.stupid));
        try { uiManager.closeAllForms(session.player); } catch { }
    }
    session.onEnd?.();
}

function later(session, ticks, callback) {
    const timer = system.runTimeout(() => {
        session.timers.delete(timer);
        if (!session.done) callback();
    }, ticks);
    session.timers.add(timer);
}

function begin(player, kind, onEnd) {
    if (sessions.has(player.id)) return undefined;
    const session = { player, playerId: player.id, kind, done: false, timers: new Set(), token: 0, onEnd };
    sessions.set(player.id, session);
    holdPause(session);
    return session;
}

// shows the form for the session's current stage; any answer or close comes back through `respond`
function show(session, title, buttons, respond, attempt = 0) {
    const token = ++session.token;
    const form = new ActionFormData().title(title).body("");
    // the screen is built from the form's buttons, so there is always at least one
    for (const label of buttons.length ? buttons : [""]) form.button(label);
    form.show(session.player).then((response) => {
        if (session.done || token !== session.token) return;
        if (response.cancelationReason === FormCancelationReason.UserBusy && attempt < BUSY_RETRIES) {
            // only if nothing else has been shown since (the stage may have moved on)
            system.runTimeout(() => !session.done && token === session.token && show(session, title, buttons, respond, attempt + 1), BUSY_RETRY_TICKS);
            return;
        }
        respond(response.canceled ? undefined : response.selection);
    }).catch(() => end(session));
}

// ------------------------------------------------------------ the first notebook ----

// the keypad, in the order brr_notebook.json lays the buttons out; OK is the last button
const KEYPAD = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "C", "0", "-", "OK"];
const MAX_TYPED = 12;

// brr:nb:math:t<half seconds into the song>|<typed answer>: the screen picks up the lyrics where the
// song is, since every key press reopens it
function showMath(session) {
    const half = Math.min(29, Math.floor((system.currentTick - session.startTick) / 10));
    const title = `${MATH_TITLE}:t${String(half).padStart(2, "0")}|${session.typed}`;
    show(session, title, KEYPAD, (selection) => pressKey(session, selection));
}

// ButtonInputField: the keys type into the answer field, C clears it; OK and the back button
// leave (ExitBook). The song ending leaves too.
function pressKey(session, selection) {
    const key = KEYPAD[selection];
    if (key === undefined || key === "OK") {
        end(session);
        return;
    }
    if (key === "C") session.typed = "";
    else if (session.typed.length < MAX_TYPED) session.typed += key;
    showMath(session);
}

export function startMathNotebook(player, onEnd) {
    const session = begin(player, "math", onEnd);
    if (!session) return false;
    session.startTick = system.currentTick;
    session.typed = "";
    play(player, SOUNDS.songInst, true);
    play(player, SOUNDS.songVocals, true);
    later(session, SONG_TICKS, () => end(session));
    showMath(session);
    return true;
}

// ----------------------------------------------------------- the second notebook ----

// what the clock reads: 0:12 for the first second, down to 0:00 for the last one (brr_notebook.json)
function secondsLeft(session) {
    return Math.max(0, Math.ceil((session.deadline - system.currentTick) / 20) - 1);
}

function questionTitle(session) {
    return `${QUESTION_TITLE}${session.stage}:t${String(secondsLeft(session)).padStart(2, "0")}`;
}

function showQuestion(session) {
    const buttons = session.stage === "q0" ? ANSWERS.q0 : ANSWERS.q1;
    show(session, questionTitle(session), buttons, (selection) => answer(session, selection));
}

function startQuestion(session, stage, voice) {
    session.stage = stage;
    session.deadline = system.currentTick + QUESTION_TICKS;
    stop(session.player, SOUNDS.learn);
    play(session.player, SOUNDS.learn, true);
    play(session.player, voice);
    const timer = session.timeLimit;
    if (timer !== undefined) system.clearRun(timer);
    session.timeLimit = system.runTimeout(() => {
        if (!session.done && !session.dead) die(session);
    }, QUESTION_TICKS);
    session.timers.add(session.timeLimit);
    showQuestion(session);
}

// QuestionGame.Die: the lose screen with the timer frozen, a thud, "you stupid", then spoop mode
function die(session) {
    if (session.dead) return;
    session.dead = true;
    const frozen = String(secondsLeft(session)).padStart(2, "0");
    session.stage = { q0: "x0", q1: "x1", o1: "y1" }[session.stage] ?? "x1";
    stop(session.player, SOUNDS.learn);
    play(session.player, SOUNDS.thud);
    later(session, STUPID_DELAY_TICKS, () => play(session.player, SOUNDS.stupid));
    later(session, DEATH_TICKS, () => end(session));
    const title = `${QUESTION_TITLE}${session.stage}:f${frozen}`;
    const keepShowing = () => show(session, title, ANSWERS[session.stage === "x0" ? "q0" : "q1"], keepShowing);
    // the time limit can hit while the question is still open; its answer is ignored (token)
    session.token++;
    try { uiManager.closeAllForms(session.player); } catch { }
    keepShowing();
}

function answer(session, selection) {
    if (session.dead) return;
    // closing it doesn't get you out of it (the original disables pausing): it just comes back
    if (selection === undefined) {
        showQuestion(session);
        return;
    }
    if (session.stage === "q0") {
        if (selection === 0) {
            play(session.player, SOUNDS.ding);
            startQuestion(session, "q1", SOUNDS.questionObama);
        } else die(session);
        return;
    }
    if (session.stage === "q1" && selection === 1) {
        play(session.player, SOUNDS.whistle);
        session.stage = "o1";
        showQuestion(session);
        return;
    }
    // Obama has already flown: his slot is empty, so a stray press there changes nothing
    if (session.stage === "o1" && selection === 1) {
        showQuestion(session);
        return;
    }
    die(session);
}

export function startQuestionGame(player, onEnd) {
    const session = begin(player, "question", onEnd);
    if (!session) return false;
    session.dead = false;
    startQuestion(session, "q0", SOUNDS.question9);
    return true;
}

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    const session = sessions.get(playerId);
    if (session) end(session);
});
