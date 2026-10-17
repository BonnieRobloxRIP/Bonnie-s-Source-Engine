import { system, world } from "@minecraft/server";
import { isSpoopMode } from "./character_spawns.js";
import { isPaused } from "./core/pause.js";
import { getScore } from "./core/scoreboard.js";
import { musicVolume } from "./core/settings.js";
import { isBigDoorType, onDoorOpened } from "./doors.js";
import { isWatchingMeme } from "./memes.js";
import { isInNotebookGame } from "./notebook_games.js";
import { activeRunMode, isParticipant } from "./run.js";

// The start of a Story run, like the original's School scene before spoop mode, cued by doors so it
// happens where the players are:
//  - TutorRaldi waits inside, waving, until a player opens the big swing doors he stands behind (the
//    only big doors that open at the start). Then he sings his "Hi" (ral_hi) with his lyrics up in the
//    talk area beside him; the first notebook cuts the lyrics off (TalkAreaHidden).
//  - The crackhouse music (mus_crackhouse) loops for everyone from the start of the run; like the
//    original's schoolMusic.Pause() in TutorRaldi.Awake it stops while he sings (Bedrock can't pause a
//    sound, so it starts over after him, or at the first notebook, TalkAreaHidden).
//  - After the first notebook he waits for a player with a notebook to open one of the blue doors on
//    the way back to the hall: then the music stops for good and he dances there (raldi.js).

const STORY = "story";
const MUSIC = "mus_crackhouse";
const MUSIC_LOOP_TICKS = 1801; // mus_crackhouse, 90.044 s
const NOTEBOOK_OBJECTIVE = "notebooks";
const HI_SOUND = "raldi.hi";
const HI_TICKS = 197; // ral_hi, 9.848 s
// how far the run's beginning has got; a world property, so a reload mid-run doesn't replay it
const STAGE_PROPERTY = "brr:beginning_stage";
const STAGE = { hi: "hi", dance: "dance" }; // unset: waiting at the big doors
// the blue classroom doors (one block or two-block tall versions)
const BLUE_DOOR_PREFIX = "brr:door_small";
// TutorBaldi/CaptionArea/TalkArea in the School scene
const LYRICS = [
    "Ah-rah, de",
    "Soo guh-goo-gee-goo-gee",
    "Goo-guh fi goo gee goo",
    "Guh fi-goo, ga-goo-buh-dee",
    "Cuh, guh-goo-bee",
    "Ooh guh guh guh tree",
    "Fli goo gee go",
    "A-fliguh woo wa mama Lucifer!"
].join("\n");
// the talk area is a sign beside him: shown to whoever is close enough to read it
const CAPTION_DISTANCE = 20;
const CAPTION_REFRESH_TICKS = 20;

let tutor; // { entity, until, captionHidden }
const music = new Map(); // player id -> tick the loop restarts at

function stage() {
    return world.getDynamicProperty(STAGE_PROPERTY);
}

function setStage(value) {
    world.setDynamicProperty(STAGE_PROPERTY, value);
}

// a new run: back to waiting at the big doors (resetGame)
export function resetBeginning() {
    tutor = undefined;
    setStage(undefined);
}

// TutorRaldi.Awake: the run's tutor is in place, waiting for the players to come in
export function meetTutor(raldi) {
    tutor = { entity: raldi, until: undefined, captionHidden: false };
}

// raldi.js: at one notebook he only dances once the players are back with him
export function isRaldiDanceCued() {
    return stage() === STAGE.dance;
}

function singHi() {
    setStage(STAGE.hi);
    if (!tutor?.entity?.isValid) return;
    tutor.until = system.currentTick + HI_TICKS;
    try { tutor.entity.dimension.playSound(HI_SOUND, tutor.entity.location); } catch { }
}

function onDoor({ player, typeId }) {
    if (activeRunMode() !== STORY || !isParticipant(player)) return;
    const current = stage();
    if (current === undefined && isBigDoorType(typeId)) {
        singHi();
        return;
    }
    if (current !== STAGE.dance && typeId.startsWith(BLUE_DOOR_PREFIX) && getScore(player, NOTEBOOK_OBJECTIVE) >= 1) {
        setStage(STAGE.dance);
    }
}

// TutorRaldi.TalkAreaHidden: the first notebook
export function hideTutorCaption() {
    if (!tutor || tutor.captionHidden) return;
    tutor.captionHidden = true;
    for (const player of world.getAllPlayers()) {
        try { player.onScreenDisplay.setActionBar(""); } catch { }
    }
}

function tutorTalking() {
    return tutor?.until !== undefined && !tutor.captionHidden && system.currentTick < tutor.until;
}

function nearTutor(player) {
    try {
        if (!tutor.entity.isValid || tutor.entity.dimension.id !== player.dimension.id) return false;
        const a = tutor.entity.location;
        const b = player.location;
        return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2 <= CAPTION_DISTANCE ** 2;
    } catch { return false; }
}

// from the start of the run until the dance (or spoop mode), except while he sings
function wantsMusic(player, story, current) {
    return story && current !== STAGE.dance && isParticipant(player) && !isPaused() && !isSpoopMode() && !tutorTalking()
        && !isInNotebookGame(player) && !isWatchingMeme(player);
}

// everything around the player was just silenced (a notebook pickup): the loop starts over when it can
export function noteSoundsStopped(player) {
    music.delete(player.id);
}

function stopMusic(player) {
    if (!music.delete(player.id)) return;
    try { player.runCommand(`stopsound @s ${MUSIC}`); } catch { }
}

export function startBeginning() {
    world.afterEvents.playerLeave.subscribe(({ playerId }) => music.delete(playerId));
    onDoorOpened(onDoor);
    system.runInterval(() => {
        const now = system.currentTick;
        const story = activeRunMode() === STORY;
        if (!story) tutor = undefined;
        const current = story ? stage() : undefined;
        const caption = tutorTalking() && now % CAPTION_REFRESH_TICKS === 0;
        for (const player of world.getAllPlayers()) {
            if (caption && nearTutor(player)) {
                try { player.onScreenDisplay.setActionBar(LYRICS); } catch { }
            }
            if (!wantsMusic(player, story, current)) {
                stopMusic(player);
                continue;
            }
            const loopAt = music.get(player.id);
            if (loopAt !== undefined && now < loopAt) continue;
            try { player.playSound(MUSIC, { volume: musicVolume(player) }); } catch { }
            music.set(player.id, now + MUSIC_LOOP_TICKS);
        }
    }, 1);
}
