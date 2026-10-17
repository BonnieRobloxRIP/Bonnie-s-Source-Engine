import { Difficulty, PlayerPermissionLevel, system, world } from "@minecraft/server";
import { getDynamicLightsEnabled, setDynamicLightsEnabled } from "../core/dynamic_lighting.js";
import { SLIDER_STEPS, TEX } from "./bm_layout.js";
import { loadPlayerSettings, savePlayerSettings } from "../core/player_settings.js";

export { getSoundVolume, playWorldSound, scaleSoundOptions } from "../core/player_settings.js";

// SECTION: Setting Definitions
// scope "world" settings change the world for everyone and need operator permission;
// scope "player" settings are saved per player. Sliders must have SLIDER_STEPS + 1 values.
const range = (from, step) => Array.from({ length: SLIDER_STEPS + 1 }, (_, i) => from + step * i);

const DIFFICULTY_BY_VALUE = { EASY: Difficulty.Easy, NORMAL: Difficulty.Normal, HARD: Difficulty.Hard };

export const SETTINGS = [
    {
        id: "difficulty", tab: "GAME", scope: "world", kind: "choice", values: ["EASY", "NORMAL", "HARD"],
        read: () => Object.keys(DIFFICULTY_BY_VALUE).find((key) => DIFFICULTY_BY_VALUE[key] === world.getDifficulty()) ?? "EASY",
        write: (value) => world.setDifficulty(DIFFICULTY_BY_VALUE[value])
    },
    {
        id: "friendly_fire", tab: "GAME", scope: "world", kind: "choice", values: ["OFF", "ON"],
        read: () => (world.gameRules.pvp ? "ON" : "OFF"),
        write: (value) => { world.gameRules.pvp = value === "ON"; }
    },
    {
        id: "fov", tab: "VIDEO", scope: "player", kind: "slider", values: range(60, 5), default: 70,
        apply: (player, value) => player.camera.setFov({ fov: value })
    },
    {
        id: "dynamic_lights", tab: "VIDEO", scope: "world", kind: "choice", values: ["OFF", "ON"],
        read: () => (getDynamicLightsEnabled() ? "ON" : "OFF"),
        write: (value) => setDynamicLightsEnabled(value === "ON")
    },
    { id: "master_volume", tab: "AUDIO", scope: "player", kind: "slider", values: range(0, 10), default: 100 },
    { id: "sfx_volume", tab: "AUDIO", scope: "player", kind: "slider", values: range(0, 10), default: 100 }
];

const SETTINGS_BY_ID = new Map(SETTINGS.map((setting) => [setting.id, setting]));

// SECTION: Public API
export function getSettingsForTab(tab) {
    return SETTINGS.filter((setting) => setting.tab === tab);
}

export function getSettingValue(player, id) {
    const setting = SETTINGS_BY_ID.get(id);
    if (!setting) return undefined;

    if (setting.scope === "world") {
        try {
            return setting.read();
        } catch {
            return setting.values[0];
        }
    }

    const value = loadPlayerSettings(player)[id];
    return setting.values.includes(value) ? value : setting.default;
}

export function canEditSetting(player, setting) {
    if (setting.scope !== "world") return true;
    try {
        return player.playerPermissionLevel === PlayerPermissionLevel.Operator;
    } catch {
        return false;
    }
}

// Applies { id: value } changes the player is allowed to make. Returns the ids that were applied.
export function applySettings(player, changes) {
    const applied = [];
    const stored = { ...loadPlayerSettings(player) };
    let playerChanged = false;

    for (const [id, value] of Object.entries(changes ?? {})) {
        const setting = SETTINGS_BY_ID.get(id);
        if (!setting || !setting.values.includes(value) || !canEditSetting(player, setting)) continue;

        try {
            if (setting.scope === "world") {
                setting.write(value);
            } else {
                stored[id] = value;
                playerChanged = true;
                setting.apply?.(player, value);
            }
            applied.push(id);
        } catch { }
    }

    if (playerChanged) savePlayerSettings(player, stored);
    return applied;
}

// state: "" | "sel" (highlighted row) | "lock" (no permission)
export function settingLabelTexture(setting, state) {
    return `${TEX}/text/opt_${setting.id}${state ? `_${state}` : ""}`;
}

export function settingValueTexture(setting, value, state) {
    if (setting.kind === "slider") return `${TEX}/text/num_${value}${state ? `_${state}` : ""}`;
    return `${TEX}/text/val_${`${value}`.toLowerCase()}${state === "lock" ? "_lock" : ""}`;
}

// SECTION: Lifecycle
world.afterEvents.playerSpawn.subscribe(({ player }) => {
    const fov = loadPlayerSettings(player).fov;
    if (fov === undefined) return;

    system.runTimeout(() => {
        if (!player.isValid) return;
        try {
            SETTINGS_BY_ID.get("fov").apply(player, fov);
        } catch { }
    }, 2);
});
