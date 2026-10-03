
// SECTION: UI Feedback Helpers
export function sendUiError(player, message) {
    const text = `${message ?? "An unknown error occurred."}`.trim() || "An unknown error occurred.";
    player?.sendMessage(`§c${text}`);
}

export function sendUiSaved(player, toolName, savedName) {
    const label = `${toolName ?? "Block"}`.trim() || "Block";
    const entryName = `${savedName ?? ""}`.trim();
    player?.sendMessage(entryName ? `§a${label} "${entryName}" saved.` : `§a${label} saved.`);
}