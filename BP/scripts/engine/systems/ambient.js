import { system } from "@minecraft/server";
import {
    getEntitiesOfClass,
    getEntityById,
    getRegistryRevision,
    markEntityDirty,
    onEntityDataUpdated,
    onEntityDisabledChanged
} from "../registry.js";
import { registerInputHandlers } from "../io.js";
import { getEngineSettings, safeGetDimension } from "../runtime.js";
import { getSoundVolume } from "../../handler/core/player_settings.js";

// SECTION: ambient_generic
// Plays a sound from the block (or for every player with Play everywhere). Every player in the
// dimension gets their own SoundInstance, played at their own volume setting, so a looping sound
// loops by itself and Volume, Pitch, FadeIn and FadeOut change the sound while it plays.
//
// A looping sound stops as soon as its last SoundInstance is dropped, so the instances are kept
// here until the sound stops. Players who join or enter the dimension while it loops get their
// own instance on the next pass.
//
// Without Start silent the sound starts by itself when the world loads (looped) or plays once
// (not looped), like Source. Whether a looped sound is playing is saved with the world.

const AMBIENT = "brr:ambient_generic_block";
const PASS_INTERVAL_TICKS = 2;
// Same check as the Sound ID field in the block form.
const SOUND_ID_PATTERN = /^[a-z0-9_.:-]+$/i;
// SoundInstance.setVolume / setPitch bounds.
const MAX_VOLUME = 10;
const MIN_PITCH = 0.01;
const MAX_PITCH = 10;

// entity id -> Map(player id -> { instance, volume }): the sounds this block is playing.
// A one-shot only keeps its newest play, so StopSound and FadeOut reach that one.
const voices = new Map();
// entity id -> { endTick, stopAtEnd }: a running fade. Volume is left alone until it ends, and
// a FadeOut stops the sound when it does.
const fades = new Map();

function toNumber(value, fallback) {
    const parsed = Number.parseFloat(`${value ?? ""}`);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function toBool(value) {
    if (typeof value === "boolean") return value;
    return /^(1|true|yes|on)$/i.test(`${value ?? ""}`.trim());
}

function getSoundId(entity) {
    const id = `${entity.data.soundId ?? ""}`.trim();
    return SOUND_ID_PATTERN.test(id) ? id : "";
}

function getRuntime(entity) {
    if (!entity.data.runtime || typeof entity.data.runtime !== "object") entity.data.runtime = {};
    return entity.data.runtime;
}

function setPlaying(entity, playing) {
    const runtime = getRuntime(entity);
    if (runtime.playing === playing) return;
    runtime.playing = playing;
    markEntityDirty(entity);
}

function getPitch(entity) {
    return Math.min(MAX_PITCH, Math.max(MIN_PITCH, toNumber(entity.data.pitch, 1)));
}

function getPlayerVolume(entity, player) {
    return Math.max(0, toNumber(entity.data.volume, 1)) * getSoundVolume(player);
}

function getPlayers(entity) {
    try {
        return safeGetDimension(entity.dimension)?.getPlayers() ?? [];
    } catch {
        return [];
    }
}

function fadeTicks(seconds) {
    return Math.max(1, Math.ceil(seconds * 20));
}

// SECTION: Playback
function stopInstance(voice) {
    try {
        voice.instance?.stop();
    } catch { }
}

function stopVoices(id) {
    const playing = voices.get(id);
    if (playing) for (const voice of playing.values()) stopInstance(voice);
    voices.delete(id);
    fades.delete(id);
}

function applyVolume(entity, voice, player) {
    const volume = getPlayerVolume(entity, player);
    if (volume === voice.volume) return;
    voice.volume = volume;
    try {
        voice.instance?.setVolume(Math.min(MAX_VOLUME, volume));
    } catch { }
}

// Starts the sound for each of `players` who is not hearing it yet. False when the sound could not
// be played, e.g. an unknown Sound ID.
function startForPlayers(entity, players, fadeSeconds = 0) {
    const soundId = getSoundId(entity);
    if (!soundId) return false;

    if (!voices.has(entity.id)) voices.set(entity.id, new Map());
    const playing = voices.get(entity.id);
    const options = { pitch: getPitch(entity), loopCount: toBool(entity.data.loop) ? -1 : 0 };
    if (!toBool(entity.data.playEverywhere)) options.location = entity.center;

    try {
        for (const player of players) {
            const volume = getPlayerVolume(entity, player);
            if (playing.has(player.id) || volume <= 0) continue;

            const instance = player.playSound(soundId, { ...options, volume });
            if (fadeSeconds > 0) {
                instance?.setVolume(0);
                instance?.fade(fadeSeconds, Math.min(MAX_VOLUME, volume));
            }
            playing.set(player.id, { instance, volume });
        }
    } catch (error) {
        console.warn(`[BSE] ambient_generic could not play '${soundId}': ${error}`);
        return false;
    }
    return true;
}

// Keeps a looping sound going for exactly the players in its dimension, at their current volume.
function syncLoop(entity) {
    const players = getPlayers(entity);
    const playing = voices.get(entity.id);
    if (playing) {
        const present = new Map(players.map(player => [player.id, player]));
        const fading = fades.has(entity.id);
        for (const [id, voice] of playing) {
            const player = present.get(id);
            if (!player) {
                stopInstance(voice);
                playing.delete(id);
            } else if (!fading) {
                applyVolume(entity, voice, player);
            }
        }
    }
    if (!startForPlayers(entity, players)) stop(entity);
}

function play(entity, fadeSeconds = 0) {
    if (entity.disabled || !getSoundId(entity)) return;
    const looped = toBool(entity.data.loop);

    // PlaySound restarts a looping sound, like Source. One-shots may overlap, so the older play is
    // left to finish rather than cut off.
    if (looped) stopVoices(entity.id);
    else {
        voices.delete(entity.id);
        fades.delete(entity.id);
    }

    if (!startForPlayers(entity, getPlayers(entity), fadeSeconds)) {
        if (looped) stop(entity);
        return;
    }
    if (fadeSeconds > 0) fades.set(entity.id, { endTick: system.currentTick + fadeTicks(fadeSeconds), stopAtEnd: false });
    if (looped) setPlaying(entity, true);
}

function stop(entity) {
    setPlaying(entity, false);
    stopVoices(entity.id);
}

function fadeOut(entity, seconds) {
    const playing = voices.get(entity.id);
    if (!(seconds > 0) || !playing?.size) {
        stop(entity);
        return;
    }
    // Saved as stopped right away, so a world reload during the fade does not restart the loop.
    setPlaying(entity, false);
    for (const voice of playing.values()) {
        try {
            voice.instance?.fade(seconds, 0);
        } catch { }
    }
    fades.set(entity.id, { endTick: system.currentTick + fadeTicks(seconds), stopAtEnd: true });
}

function isPlaying(entity) {
    return getRuntime(entity).playing === true;
}

// SECTION: Inputs
registerInputHandlers(AMBIENT, {
    PlaySound: entity => play(entity),
    StopSound: entity => stop(entity),
    ToggleSound: entity => (isPlaying(entity) ? stop(entity) : play(entity)),
    FadeIn: (entity, param) => play(entity, Math.max(0, toNumber(param, 0))),
    FadeOut: (entity, param) => fadeOut(entity, Math.max(0, toNumber(param, 0))),
    Volume: (entity, param) => {
        const volume = toNumber(param, NaN);
        if (!Number.isFinite(volume) || volume < 0) return;
        entity.data.volume = `${volume}`;
        markEntityDirty(entity);

        // A FadeOut keeps fading to silence; anything else takes the new volume now.
        if (fades.get(entity.id)?.stopAtEnd) return;
        fades.delete(entity.id);
        const playing = voices.get(entity.id);
        if (!playing) return;
        for (const player of getPlayers(entity)) {
            const voice = playing.get(player.id);
            if (voice) applyVolume(entity, voice, player);
        }
    },
    Pitch: (entity, param) => {
        const pitch = toNumber(param, NaN);
        if (!Number.isFinite(pitch) || pitch <= 0) return;
        entity.data.pitch = `${pitch}`;
        markEntityDirty(entity);

        for (const voice of voices.get(entity.id)?.values() ?? []) {
            try {
                voice.instance?.setPitch(getPitch(entity));
            } catch { }
        }
    }
});

onEntityDisabledChanged(entity => {
    if (entity.typeId === AMBIENT && entity.disabled) stop(entity);
});

// A form save clears the runtime state; stop the old sound so the new settings start cleanly.
onEntityDataUpdated(entity => {
    if (entity.typeId !== AMBIENT || entity.data.runtime) return;
    stopVoices(entity.id);
});

// SECTION: Loop Pass
let prunedAtRevision = -1;
// Ambient entities that already had their world-load start this session (not saved).
const startedThisSession = new Set();

function runAmbientPass() {
    if (!getEngineSettings().toolsEnabled) {
        // Silence everything but keep which loops were playing, so they come back with the tools.
        for (const id of [...voices.keys()]) stopVoices(id);
        return;
    }
    const now = system.currentTick;

    if (getRegistryRevision() !== prunedAtRevision) {
        prunedAtRevision = getRegistryRevision();
        for (const id of [...voices.keys()]) if (!getEntityById(id)) stopVoices(id);
    }

    for (const entity of getEntitiesOfClass(AMBIENT)) {
        if (entity.disabled) {
            startedThisSession.add(entity.id); // disabled at load: no auto-play when enabled later
            continue;
        }
        const runtime = getRuntime(entity);

        // First pass after the block is placed or the form is saved: apply Start silent.
        if (runtime.playing === undefined) {
            runtime.playing = false;
            markEntityDirty(entity);
            startedThisSession.add(entity.id);
            if (!toBool(entity.data.startSilent)) play(entity);
            continue;
        }

        // After a world load runtime is already saved, so a one-shot without Start silent is
        // played from here, once someone is in the dimension to hear it. Loops resume below.
        if (!startedThisSession.has(entity.id) && !toBool(entity.data.loop)) {
            if (getPlayers(entity).length === 0) continue;
            startedThisSession.add(entity.id);
            if (!toBool(entity.data.startSilent)) play(entity);
            continue;
        }

        const fade = fades.get(entity.id);
        if (fade && now >= fade.endTick) {
            fades.delete(entity.id);
            if (fade.stopAtEnd) stopVoices(entity.id);
        }

        if (runtime.playing && toBool(entity.data.loop)) syncLoop(entity);
    }
}

export function startAmbientSystem() {
    system.runInterval(runAmbientPass, PASS_INTERVAL_TICKS);
}
