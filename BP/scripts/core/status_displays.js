const displays = new Map();
export const STATUS_SLOTS = 4;
export const STATUS_VALUE_WIDTH = 6;
// three digits fit after the mode letter and its §r reset (the poop meter counts down from 150)
const MAX_STATUS_VALUE = 999;

// Timer updates preserve activation order; the newest active display takes priority.
export function setStatusDisplay(player, mode, value) {
    let active = displays.get(player.id);
    if (value === undefined) {
        active?.delete(mode);
        if (!active?.size) displays.delete(player.id);
        return;
    }
    if (!active) {
        active = new Map();
        displays.set(player.id, active);
    }
    active.set(mode, value);
}

export function statusDisplayPayload(player) {
    const active = [...(displays.get(player.id)?.entries() ?? [])];
    const values = Array.from({ length: STATUS_SLOTS }, (_, slot) => {
        const entry = active[slot];
        if (!entry) return "-".repeat(STATUS_VALUE_WIDTH + 1);
        const [mode, value] = entry;
        const text = String(Math.max(0, Math.min(MAX_STATUS_VALUE, Math.ceil(value))));
        return mode + "§r" + text.padEnd(STATUS_VALUE_WIDTH - 3, " ");
    }).join("");
    const latest = active.at(-1);
    const selected = latest
        ? latest[0] + "§r" + String(Math.max(0, Math.min(MAX_STATUS_VALUE, Math.ceil(latest[1])))).padEnd(STATUS_VALUE_WIDTH - 3, " ")
        : "-".repeat(STATUS_VALUE_WIDTH + 1);
    return values + selected;
}

export function clearStatusDisplays(playerId) {
    displays.delete(playerId);
}
