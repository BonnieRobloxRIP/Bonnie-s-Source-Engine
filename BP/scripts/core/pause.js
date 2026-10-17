import { system } from "@minecraft/server";

// While anything holds a pause, gameTick() stands still and paused systems skip their updates,
// so every deadline measured in game ticks resumes exactly where it stopped.
const holders = new Set();
let pausedAt;
let pausedTotal = 0;

export function isPaused() {
    return holders.size > 0;
}

export function gameTick() {
    return (pausedAt ?? system.currentTick) - pausedTotal;
}

export function holdPause(holder) {
    if (holders.size === 0) pausedAt = system.currentTick;
    holders.add(holder);
}

export function releasePause(holder) {
    if (!holders.delete(holder) || holders.size > 0) return;
    pausedTotal += system.currentTick - pausedAt;
    pausedAt = undefined;
}
