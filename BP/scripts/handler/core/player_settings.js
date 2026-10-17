import { world } from "@minecraft/server";

// Per-player settings chosen in the Black Mesa menu (handler/ui/bm_settings.js defines them),
// plus the sound helpers that apply the volume settings. Kept dependency-free so engine systems can use it.

// SECTION: Storage
const PLAYER_SETTINGS_PROPERTY = "brr_bm_settings";
const cache = new Map();

export function loadPlayerSettings(player) {
    const cached = cache.get(player.id);
    if (cached) return cached;

    let stored = {};
    try {
        const raw = player.getDynamicProperty(PLAYER_SETTINGS_PROPERTY);
        if (typeof raw === "string" && raw.length > 0) stored = JSON.parse(raw) ?? {};
    } catch {
        // Corrupt data falls back to defaults.
    }

    cache.set(player.id, stored);
    return stored;
}

export function savePlayerSettings(player, stored) {
    cache.set(player.id, stored);
    try {
        player.setDynamicProperty(PLAYER_SETTINGS_PROPERTY, JSON.stringify(stored));
    } catch { }
}

world.afterEvents?.playerLeave?.subscribe(({ playerId }) => cache.delete(playerId));

// SECTION: Sound Volume
function percent(value) {
    return typeof value === "number" && value >= 0 && value <= 100 ? value / 100 : 1;
}

// Multiplier (0..1) for sounds the pack plays to this player: master volume x sound effect volume.
export function getSoundVolume(player) {
    if (!player?.id) return 1;
    try {
        const stored = loadPlayerSettings(player);
        return percent(stored.master_volume) * percent(stored.sfx_volume);
    } catch {
        return 1;
    }
}

export function scaleSoundOptions(player, options = {}) {
    return { ...options, volume: (options.volume ?? 1) * getSoundVolume(player) };
}

// Positional sound played to each player in the dimension (or within `range` blocks) at their own volume.
// Returns false when there was no one to play it to, so callers can fall back to dimension.playSound.
export function playWorldSound(dimension, soundId, location, options = {}, range) {
    let players;
    try {
        players = range > 0 ? dimension.getPlayers({ location, maxDistance: range }) : dimension.getPlayers();
    } catch {
        return false;
    }
    if (!players?.length) return false;

    for (const player of players) {
        const scaled = scaleSoundOptions(player, options);
        if (scaled.volume <= 0) continue;
        try {
            player.playSound(soundId, { ...scaled, location });
        } catch { }
    }
    return true;
}
