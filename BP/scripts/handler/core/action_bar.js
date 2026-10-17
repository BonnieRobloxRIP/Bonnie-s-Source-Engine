// One owner for the action bar, so its users don't overwrite each other: a subtitle line (what an NPC nearby is
// saying) above a HUD line (the held weapon's ammo). updateActionBar runs every tick for every player (from the
// weapon tick dispatcher); the text is re-sent periodically because the action bar fades on its own, and cleared
// when neither line is showing.

const RESEND_TICKS = 30;
const subtitleByPlayer = new Map();
const shownByPlayer = new Map();

/** Shows a subtitle to the player for `ticks` (replaces the one showing). */
export function showSubtitle(player, text, ticks, tick) {
    if (!player?.id || !text) return;
    subtitleByPlayer.set(player.id, { text, until: tick + ticks });
}

/** Composes and sends the action bar; `hudText` is the HUD line reported this tick (undefined: none). */
export function updateActionBar(player, hudText, tick) {
    const subtitle = subtitleByPlayer.get(player.id);
    // Nothing to show and nothing shown: the common case for players without a weapon.
    if (!subtitle && !hudText && !shownByPlayer.has(player.id)) return;
    if (subtitle && tick >= subtitle.until) subtitleByPlayer.delete(player.id);
    const lines = [subtitleByPlayer.get(player.id)?.text, hudText].filter((line) => line !== undefined && line !== "");
    const shown = shownByPlayer.get(player.id);

    if (!lines.length) {
        if (shown) {
            try {
                player.onScreenDisplay.setActionBar("");
            } catch { }
            shownByPlayer.delete(player.id);
        }
        return;
    }

    const text = lines.join("\n");
    if (shown && shown.text === text && (tick - shown.tick) < RESEND_TICKS) return;
    try {
        player.onScreenDisplay.setActionBar(text);
        shownByPlayer.set(player.id, { text, tick });
    } catch { }
}

/** Forgets players that left. */
export function pruneActionBar(onlinePlayers) {
    for (const map of [subtitleByPlayer, shownByPlayer]) {
        for (const id of map.keys()) if (!onlinePlayers.has(id)) map.delete(id);
    }
}
