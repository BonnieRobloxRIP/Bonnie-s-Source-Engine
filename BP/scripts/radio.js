import { system } from "@minecraft/server";

const RADIO_RANGE = 24;
const STATIC_SOUND = "radio.static";
const SWITCH_STATIC_TICKS = 20;
// track length in ticks, so each one can be replayed as a loop
const TRACKS = {
    "radio.01": 5363,
    "radio.02": 4382,
    "radio.03": 407,
    "radio.04": 313,
    "radio.05": 814,
    "radio.06": 2872,
    "radio.07": 1163,
    "radio.08": 724,
    "radio.09": 1272,
    "radio.10": 204,
    [STATIC_SOUND]: 1219
};
const TRACK_IDS = Object.keys(TRACKS);

// "dimension:x,y,z" -> { dimension, location, sound, loopAt, switchUntil, heard }
const radios = new Map();

function keyOf(dimension, location) {
    return `${dimension.id}:${location.x},${location.y},${location.z}`;
}

function center(location) {
    return { x: location.x + 0.5, y: location.y + 0.5, z: location.z + 0.5 };
}

function pickTrack(exclude) {
    const options = TRACK_IDS.filter((id) => id !== exclude);
    return options[Math.floor(Math.random() * options.length)];
}

function playFor(radio, sound, player) {
    try { player.playSound(sound, { location: center(radio.location) }); } catch { }
}

// players who walk into range later still get the track, but only once per loop
function syncListeners(radio, sound) {
    let players = [];
    try { players = radio.dimension.getPlayers({ location: center(radio.location), maxDistance: RADIO_RANGE }); } catch { }
    for (const player of players) {
        if (radio.heard.has(player.id)) continue;
        radio.heard.add(player.id);
        playFor(radio, sound, player);
    }
}

function startTrack(radio, sound) {
    radio.sound = sound;
    radio.loopAt = system.currentTick + TRACKS[sound];
    radio.heard = new Set();
    syncListeners(radio, sound);
}

// stopsound is global, so other radios on the same track are restarted afterwards
function stopSound(dimension, sound, exceptKey) {
    try { dimension.runCommand(`stopsound @a ${sound}`); } catch { }
    for (const [key, radio] of radios) {
        if (key === exceptKey || radio.dimension.id !== dimension.id) continue;
        const playing = radio.switchUntil ? STATIC_SOUND : radio.sound;
        if (playing !== sound) continue;
        if (radio.switchUntil) radio.heard = new Set();
        else startTrack(radio, radio.sound);
    }
}

function createRadio(dimension, location) {
    const radio = { dimension, location: { ...location }, sound: undefined, loopAt: 0, switchUntil: 0, heard: new Set() };
    radios.set(keyOf(dimension, location), radio);
    startTrack(radio, pickTrack());
    return radio;
}

function switchTrack(key, radio) {
    if (radio.switchUntil) return;
    stopSound(radio.dimension, radio.sound, key);
    radio.switchUntil = system.currentTick + SWITCH_STATIC_TICKS;
    radio.heard = new Set();
    syncListeners(radio, STATIC_SOUND);
}

function tickRadio(dimension, location) {
    const key = keyOf(dimension, location);
    const radio = radios.get(key) ?? createRadio(dimension, location);
    const now = system.currentTick;

    if (radio.switchUntil) {
        if (now < radio.switchUntil) {
            syncListeners(radio, STATIC_SOUND);
            return;
        }
        radio.switchUntil = 0;
        stopSound(dimension, STATIC_SOUND, key);
        startTrack(radio, pickTrack(radio.sound));
        return;
    }
    if (now >= radio.loopAt) startTrack(radio, radio.sound);
    else syncListeners(radio, radio.sound);
}

export function registerRadioComponents(blockComponentRegistry) {
    blockComponentRegistry.registerCustomComponent("brr:radio", {
        onPlace({ block, dimension }) {
            const key = keyOf(dimension, block.location);
            if (!radios.has(key)) createRadio(dimension, block.location);
        },
        onTick({ block, dimension }) {
            tickRadio(dimension, block.location);
        },
        onPlayerInteract({ block, dimension }) {
            const key = keyOf(dimension, block.location);
            const radio = radios.get(key) ?? createRadio(dimension, block.location);
            switchTrack(key, radio);
        },
        onPlayerBreak({ block, dimension }) {
            const key = keyOf(dimension, block.location);
            const radio = radios.get(key);
            if (!radio) return;
            radios.delete(key);
            stopSound(dimension, radio.switchUntil ? STATIC_SOUND : radio.sound, key);
        }
    });
}
