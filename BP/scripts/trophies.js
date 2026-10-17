import { system, world } from "@minecraft/server";
import { soundVolume } from "./core/settings.js";

// Every trophy the game can award. The order is the order of the trophy menu, and the
// position is the id the HUD popup uses (RP/ui/hud_screen.json, one icon control per entry).
export const TROPHIES = [
    {
        id: "story_mode",
        name: "Crackhouse Escapist",
        description: "Beat STORY MODE.",
        tier: "SILVER",
        icon: "textures/ui/badges/ggs_storymode"
    },
    {
        id: "beasticide",
        name: "BEASTICIDE",
        description: "Complete the genocide route in the MRBEAST boss fight.",
        tier: "SILVER",
        icon: "textures/ui/badges/ggs_beasticide"
    },
    {
        id: "pacibeast",
        name: "PACIBEAST",
        description: "Complete the pacifist route in the MRBEAST boss fight.",
        tier: "SILVER",
        icon: "textures/ui/badges/ggs_pacibeast"
    }
];

const PROPERTY = "brr:trophies";
const NOTIFY_SOUND = "achievement";

// popup timeline in ticks; RP/ui/hud_screen.json has one control per slide/fade frame
export const POPUP_SLIDE_FRAMES = 8;
const POPUP_HOLD_TICKS = 80;
export const POPUP_FADE_FRAMES = 10;
const POPUP_TOTAL = POPUP_SLIDE_FRAMES + POPUP_HOLD_TICKS + POPUP_FADE_FRAMES;

// player id -> { queue: trophy indexes, startedAt: tick the front entry appeared }
const popups = new Map();

function unlockedIds(player) {
    try {
        const raw = player.getDynamicProperty(PROPERTY);
        const ids = typeof raw === "string" ? JSON.parse(raw) : [];
        return Array.isArray(ids) ? ids : [];
    } catch {
        return [];
    }
}

export function hasTrophy(player, id) {
    return unlockedIds(player).includes(id);
}

// the trophy menu's RESET LOCAL TROPHIES
export function resetTrophies(player) {
    try { player.setDynamicProperty(PROPERTY, undefined); } catch { }
    popups.delete(player.id);
}

export function unlockedCount(player) {
    const ids = unlockedIds(player);
    return TROPHIES.filter((trophy) => ids.includes(trophy.id)).length;
}

// Returns true when the trophy was newly unlocked. `popup: false` skips the HUD toast (for
// screens that draw their own).
export function awardTrophy(player, id, { popup: showPopup = true } = {}) {
    const index = TROPHIES.findIndex((trophy) => trophy.id === id);
    if (index < 0 || !player?.isValid) return false;
    const ids = unlockedIds(player);
    if (ids.includes(id)) return false;
    ids.push(id);
    try {
        player.setDynamicProperty(PROPERTY, JSON.stringify(ids));
    } catch {
        return false;
    }
    if (!showPopup) return true;

    let popup = popups.get(player.id);
    if (!popup) {
        popup = { queue: [], startedAt: system.currentTick };
        popups.set(player.id, popup);
    }
    popup.queue.push(index);
    if (popup.queue.length === 1) {
        popup.startedAt = system.currentTick;
        playNotifySound(player);
    }
    return true;
}

function playNotifySound(player) {
    try { player.playSound(NOTIFY_SOUND, { volume: soundVolume(player) }); } catch { }
}

// Advances the queue; false once nothing is left to show.
function currentPopup(player) {
    const popup = popups.get(player.id);
    if (!popup) return undefined;
    while (system.currentTick - popup.startedAt >= POPUP_TOTAL) {
        popup.queue.shift();
        if (!popup.queue.length) {
            popups.delete(player.id);
            return undefined;
        }
        popup.startedAt += POPUP_TOTAL;
        if (system.currentTick - popup.startedAt < POPUP_TOTAL) playNotifySound(player);
    }
    return { index: popup.queue[0], elapsed: system.currentTick - popup.startedAt };
}

export function isTrophyPopupAnimating(player) {
    const popup = currentPopup(player);
    if (!popup) return false;
    return popup.elapsed < POPUP_SLIDE_FRAMES || popup.elapsed >= POPUP_SLIDE_FRAMES + POPUP_HOLD_TICKS;
}

// Two HUD bytes: frame letter ("a".."h" slide in, "i" hold, "j".."s" fade out, "-" hidden)
// and the trophy index as a letter ("a" = TROPHIES[0]).
export function trophyPopupPayload(player) {
    const popup = currentPopup(player);
    if (!popup) return "--";
    const { index, elapsed } = popup;
    let frame;
    if (elapsed < POPUP_SLIDE_FRAMES) frame = elapsed;
    else if (elapsed < POPUP_SLIDE_FRAMES + POPUP_HOLD_TICKS) frame = POPUP_SLIDE_FRAMES;
    else frame = POPUP_SLIDE_FRAMES + 1 + (elapsed - POPUP_SLIDE_FRAMES - POPUP_HOLD_TICKS);
    return String.fromCharCode(97 + frame) + String.fromCharCode(97 + index);
}

export function startTrophies() {
    world.afterEvents.playerLeave.subscribe(({ playerId }) => popups.delete(playerId));

    // `/scriptevent brr:trophy <id>` awards a trophy, `/scriptevent brr:trophy reset` clears them (testing)
    system.afterEvents.scriptEventReceive.subscribe(({ id, message, sourceEntity }) => {
        if (id !== "brr:trophy" || sourceEntity?.typeId !== "minecraft:player") return;
        const arg = message.trim();
        if (arg === "reset") {
            resetTrophies(sourceEntity);
            return;
        }
        if (!awardTrophy(sourceEntity, arg)) sourceEntity.sendMessage(`Unknown or already unlocked trophy: ${arg}`);
    });
}
