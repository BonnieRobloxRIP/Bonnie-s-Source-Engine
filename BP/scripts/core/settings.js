// Per-player options chosen in the main menu (BP/scripts/main_menu.js), stored as dynamic properties.
export const VOLUME_STEPS = 10;

const DEFAULTS = {
    music_volume: VOLUME_STEPS,
    sound_volume: VOLUME_STEPS,
    no_licensed_audio: false,
    no_fart_sounds: false,
    memes: true,
    // skips the content warning when joining ("Dont Show Warning", WarningDisable1 in the original)
    skip_warning: false
};

export function getSetting(player, key) {
    try {
        const value = player.getDynamicProperty(`brr:setting_${key}`);
        if (value !== undefined) return value;
    } catch { }
    return DEFAULTS[key];
}

export function setSetting(player, key, value) {
    player.setDynamicProperty(`brr:setting_${key}`, value === DEFAULTS[key] ? undefined : value);
}

export function resetSetting(player, key) {
    player.setDynamicProperty(`brr:setting_${key}`, undefined);
}

// 0..1, for playSound volume
export function musicVolume(player) {
    return getSetting(player, "music_volume") / VOLUME_STEPS;
}

export function soundVolume(player) {
    return getSetting(player, "sound_volume") / VOLUME_STEPS;
}

export function memesEnabled(player) {
    return getSetting(player, "memes") === true;
}
