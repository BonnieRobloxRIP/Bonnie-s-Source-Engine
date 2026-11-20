import { system } from "@minecraft/server";
import { TEX } from "./bm_layout.js";
import { ACHIEVEMENT_LIST } from "./bm_achievement_list.js";

// SECTION: Registry
// Black Mesa's 50 achievements (bm_achievement_list.js); none are triggered by gameplay yet.
// goal > 1 shows a "progress / goal" counter on the card.
export const PLACEHOLDER_ICON = `${TEX}/shapes/ach_placeholder`;

export const ACHIEVEMENTS = ACHIEVEMENT_LIST;

// Pixel-art icons made from Black Mesa's by tools/bm_menu/ach_icons.mjs: <id>.png, and <id>_locked.png in grey.
const ICON_DIR = "textures/ui/black_mesa/achievements";
export function achievementIcon(achievement, unlocked) {
    return achievement.icon ?? `${ICON_DIR}/${achievement.id}${unlocked ? "" : "_locked"}`;
}

const ACHIEVEMENTS_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
const goalOf = (achievement) => Math.max(1, achievement.goal ?? 1);

// SECTION: Storage
const PROGRESS_PROPERTY = "brr_bm_achievements";

function loadProgress(player) {
    try {
        const raw = player.getDynamicProperty(PROGRESS_PROPERTY);
        if (typeof raw === "string" && raw.length > 0) return JSON.parse(raw) ?? {};
    } catch { }
    return {};
}

function saveProgress(player, progress) {
    try {
        player.setDynamicProperty(PROGRESS_PROPERTY, JSON.stringify(progress));
    } catch { }
}

// SECTION: Public API
export function getAchievementState(player, achievement) {
    const goal = goalOf(achievement);
    const progress = Math.min(goal, Math.max(0, Number(loadProgress(player)[achievement.id]) || 0));
    return { progress, goal, unlocked: progress >= goal };
}

export function getAchievementSummary(player) {
    const progress = loadProgress(player);
    const done = ACHIEVEMENTS.filter((a) => (Number(progress[a.id]) || 0) >= goalOf(a)).length;
    return { done, total: ACHIEVEMENTS.length };
}

// Sets progress (clamped to the goal). Returns true if this call unlocked the achievement.
export function setAchievementProgress(player, id, value) {
    const achievement = ACHIEVEMENTS_BY_ID.get(id);
    if (!achievement || !player?.isValid) return false;

    const progress = loadProgress(player);
    const goal = goalOf(achievement);
    const before = Number(progress[id]) || 0;
    const after = Math.min(goal, Math.max(0, Math.floor(Number(value) || 0)));
    if (after === before) return false;

    if (after > 0) progress[id] = after;
    else delete progress[id];
    saveProgress(player, progress);
    return before < goal && after >= goal;
}

export function addAchievementProgress(player, id, amount = 1) {
    const achievement = ACHIEVEMENTS_BY_ID.get(id);
    if (!achievement) return false;
    return setAchievementProgress(player, id, (Number(loadProgress(player)[id]) || 0) + amount);
}

export function unlockAchievement(player, id) {
    const achievement = ACHIEVEMENTS_BY_ID.get(id);
    if (!achievement) return false;
    return setAchievementProgress(player, id, goalOf(achievement));
}

export function resetAchievements(player) {
    try {
        player.setDynamicProperty(PROGRESS_PROPERTY, undefined);
    } catch { }
}

// SECTION: Command Hook
// /scriptevent brr:bm_achievement unlock <id>
// /scriptevent brr:bm_achievement progress <id> [amount]
// /scriptevent brr:bm_achievement reset
// Run as (or via /execute as) the player who earns it, e.g. from a command block.
system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== "brr:bm_achievement") return;

    const player = event.sourceEntity;
    if (player?.typeId !== "minecraft:player") return;

    const [action, id, amount] = `${event.message ?? ""}`.trim().split(/\s+/);
    if (action === "unlock") unlockAchievement(player, id);
    else if (action === "progress") {
        // A typo in the amount is ignored rather than read as 0, which would wipe the progress.
        const steps = amount === undefined ? 1 : Number(amount);
        if (Number.isFinite(steps)) addAchievementProgress(player, id, steps);
    }
    else if (action === "reset") resetAchievements(player);
});
