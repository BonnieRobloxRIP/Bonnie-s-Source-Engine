import { system, world } from "@minecraft/server";
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
import { playWorldSound, scaleSoundOptions } from "../../handler/core/player_settings.js";

// SECTION: ambient_generic
// Plays a sound from the block (or for every player with Play everywhere). Bedrock sounds cannot
// loop on their own and scripts cannot tell how long a sound is, so a looping ambient_generic
// replays its sound every Loop length ticks while it is playing.
//
// Without Start silent the sound starts by itself when the world loads (looped) or plays once
// (not looped), like Source. Whether a looped sound is playing is saved with the world.

const AMBIENT = "brr:ambient_generic_block";
const PASS_INTERVAL_TICKS = 2;
// Sound ids are only ever used in /stopsound, so keep them to characters a sound id can contain.
const SOUND_ID_PATTERN = /^[a-z0-9_.:-]+$/i;

// entity id -> tick when a looping sound plays next.
const nextPlayTick = new Map();

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

// SECTION: Playback
function playOnce(entity) {
    const soundId = getSoundId(entity);
    const dimension = safeGetDimension(entity.dimension);
    if (!soundId || !dimension) return;

    const options = {
        volume: Math.max(0, toNumber(entity.data.volume, 1)),
        pitch: Math.max(0.01, toNumber(entity.data.pitch, 1))
    };

    try {
        if (toBool(entity.data.playEverywhere)) {
            for (const player of dimension.getPlayers()) player.playSound(soundId, scaleSoundOptions(player, options));
        } else {
            if (!playWorldSound(dimension, soundId, entity.center, options)) dimension.playSound(soundId, entity.center, options);
        }
    } catch (error) {
        console.warn(`[BSE] ambient_generic could not play '${soundId}': ${error}`);
    }
}

function stopSound(entity) {
    const soundId = getSoundId(entity);
    const dimension = safeGetDimension(entity.dimension);
    if (!soundId || !dimension) return;
    try {
        dimension.runCommand(`stopsound @a ${soundId}`);
    } catch { }
}

function play(entity) {
    if (entity.disabled || !getSoundId(entity)) return;
    if (toBool(entity.data.loop)) {
        setPlaying(entity, true);
        nextPlayTick.set(entity.id, system.currentTick);
        return;
    }
    playOnce(entity);
}

function stop(entity) {
    setPlaying(entity, false);
    nextPlayTick.delete(entity.id);
    stopSound(entity);
}

function isPlaying(entity) {
    return getRuntime(entity).playing === true;
}

// SECTION: Inputs
registerInputHandlers(AMBIENT, {
    PlaySound: entity => play(entity),
    StopSound: entity => stop(entity),
    ToggleSound: entity => (isPlaying(entity) ? stop(entity) : play(entity)),
    Volume: (entity, param) => {
        const volume = toNumber(param, NaN);
        if (!Number.isFinite(volume) || volume < 0) return;
        entity.data.volume = `${volume}`;
        markEntityDirty(entity);
    },
    Pitch: (entity, param) => {
        const pitch = toNumber(param, NaN);
        if (!Number.isFinite(pitch) || pitch <= 0) return;
        entity.data.pitch = `${pitch}`;
        markEntityDirty(entity);
    }
});

onEntityDisabledChanged(entity => {
    if (entity.typeId === AMBIENT && entity.disabled) stop(entity);
});

// A form save clears the runtime state; stop the old sound so the new settings start cleanly.
onEntityDataUpdated(entity => {
    if (entity.typeId !== AMBIENT || entity.data.runtime) return;
    nextPlayTick.delete(entity.id);
    stopSound(entity);
});

// SECTION: Loop Pass
let prunedAtRevision = -1;

function runAmbientPass() {
    if (!getEngineSettings().toolsEnabled) return;
    const now = system.currentTick;

    if (getRegistryRevision() !== prunedAtRevision) {
        prunedAtRevision = getRegistryRevision();
        for (const id of nextPlayTick.keys()) if (!getEntityById(id)) nextPlayTick.delete(id);
    }

    for (const entity of getEntitiesOfClass(AMBIENT)) {
        if (entity.disabled) continue;
        const runtime = getRuntime(entity);

        // First pass after the world loads or the form is saved: apply Start silent.
        if (runtime.playing === undefined) {
            runtime.playing = false;
            markEntityDirty(entity);
            if (!toBool(entity.data.startSilent)) play(entity);
            continue;
        }

        if (!runtime.playing || !toBool(entity.data.loop)) continue;
        if (now < (nextPlayTick.get(entity.id) ?? now)) continue;

        // Nobody can hear it: skip the replay, but keep the loop going.
        if (world.getPlayers().length > 0) playOnce(entity);
        nextPlayTick.set(entity.id, now + Math.max(1, Math.round(toNumber(entity.data.loopLength, 40))));
    }
}

export function startAmbientSystem() {
    system.runInterval(runAmbientPass, PASS_INTERVAL_TICKS);
}
