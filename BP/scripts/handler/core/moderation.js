import { CommandPermissionLevel, PlayerPermissionLevel, system, world } from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { isNativeDevPlayer } from "./chat_system.js";

// SECTION: Operators
const OP_TELEMETRY_TAG = "§8[Moderation]§r";

export function isOperatorPlayer(player) {
    if (!player) return false;
    try {
        if (player.playerPermissionLevel === PlayerPermissionLevel.Operator) return true;
    } catch { }
    try {
        return Number(player.commandPermissionLevel) >= Number(CommandPermissionLevel.GameDirectors);
    } catch {
        return false;
    }
}

export function sendOperatorTelemetry(message, excludePlayerId = "") {
    const text = `${message ?? ""}`.trim();
    if (!text) return;

    const excluded = `${excludePlayerId ?? ""}`.trim();
    for (const onlinePlayer of world.getPlayers()) {
        if (`${onlinePlayer?.id ?? ""}` === excluded) continue;
        if (!isOperatorPlayer(onlinePlayer)) continue;

        try {
            onlinePlayer.sendMessage(`${OP_TELEMETRY_TAG} ${text}`);
        } catch { }
    }
}

// SECTION: Kicking
function sanitizeKickReason(reason) {
    return `${reason ?? "Kicked"}`
        .replace(/[\r\n]/g, " ")
        .replace(/\s+/g, " ")
        .trim() || "Kicked";
}

function escapeForKickCommand(rawName) {
    return `${rawName ?? ""}`.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function createKickTag() {
    const rand = Math.floor(Math.random() * 1679616).toString(36);
    return `brrkick_${Date.now().toString(36)}_${rand}`;
}

/** Kicks a player; false when the kick didn't happen (the host, the developer, or the command failed). */
export function kickPlayerSafely(player, reason) {
    if (!player || isNativeDevPlayer(player)) return false;

    const playerName = `${player?.name ?? ""}`;
    const escapedName = escapeForKickCommand(playerName);
    const tag = createKickTag();
    const kickReason = sanitizeKickReason(reason);

    try {
        if (world.getDimension("overworld").runCommand(`kick "${escapedName}" ${kickReason}`).successCount > 0) return true;
    } catch { }

    // Names the quoted form can't match (invisible characters etc.) are kicked through a temporary tag.
    try {
        player.addTag(tag);
    } catch {
        return false;
    }

    let kicked = false;
    try {
        kicked = world.getDimension("overworld").runCommand(`kick @a[tag=${tag}] ${kickReason}`).successCount > 0;
    } catch { }

    if (!kicked) {
        try {
            player.removeTag(tag);
        } catch { }
        return false;
    }

    system.runTimeout(() => {
        try {
            if (player.isValid) {
                player.removeTag(tag);
            }
        } catch { }
    }, 20);

    return true;
}

// SECTION: Invalid Usernames
// Names with invisible or control characters can't be told apart in chat or targeted by commands.
const INVISIBLE_USERNAME_PATTERN = /[§­͏؜᠎​-‏‪-‮⁠-⁯﻿]/u;
const CONTROL_USERNAME_PATTERN = /[\u0000-\u001F\u007F-\u009F]/u;
const kickedInvalidNamePlayers = new Set();

export function hasInvalidNameCharacters(rawPlayerName) {
    const playerName = `${rawPlayerName ?? ""}`;
    if (!playerName.trim()) return true;
    return INVISIBLE_USERNAME_PATTERN.test(playerName) || CONTROL_USERNAME_PATTERN.test(playerName);
}

function kickPlayersWithInvalidNames() {
    const activePlayerIds = new Set();

    for (const player of world.getPlayers()) {
        const playerId = `${player?.id ?? ""}`.trim();
        if (!playerId) continue;

        activePlayerIds.add(playerId);

        const playerName = `${player?.name ?? ""}`;
        if (!hasInvalidNameCharacters(playerName)) {
            kickedInvalidNamePlayers.delete(playerId);
            continue;
        }

        if (kickedInvalidNamePlayers.has(playerId)) {
            continue;
        }

        kickedInvalidNamePlayers.add(playerId);

        try {
            const kicked = kickPlayerSafely(player, "Invalid or invisible characters in username are not allowed.");
            sendOperatorTelemetry(`Invalid username moderation on ${player.name}. kick=${kicked}.`, `${player?.id ?? ""}`);
        } catch { }
    }

    for (const playerId of kickedInvalidNamePlayers) {
        if (!activePlayerIds.has(playerId)) {
            kickedInvalidNamePlayers.delete(playerId);
        }
    }
}

system.runInterval(kickPlayersWithInvalidNames, 10);

// SECTION: Bans
// Local worlds have no /ban (only Realms and dedicated servers' allow lists do), so banned players
// are kept in a world list and kicked whenever they join. Matched by player id (stable across name
// changes) or by name. On a dedicated server antiexploit.js also turns them away before they load in.
const BANS_PROPERTY = "brr_bans";
const MAX_BANS_LENGTH = 30000; // dynamic property strings stop at 32767 characters
const MAX_REASON_LENGTH = 100;
let bans;

function loadBans() {
    if (bans) return bans;
    bans = [];
    try {
        const parsed = JSON.parse(`${world.getDynamicProperty(BANS_PROPERTY) ?? "[]"}`);
        if (Array.isArray(parsed)) bans = parsed.filter(entry => entry && typeof entry.name === "string");
    } catch { }
    return bans;
}

function saveBans(next) {
    const text = JSON.stringify(next);
    if (text.length > MAX_BANS_LENGTH) return false;
    try {
        world.setDynamicProperty(BANS_PROPERTY, next.length > 0 ? text : undefined);
    } catch {
        return false;
    }
    bans = next;
    return true;
}

const sameName = (a, b) => `${a ?? ""}`.trim().toLowerCase() === `${b ?? ""}`.trim().toLowerCase();

export function findBanByName(name) {
    return loadBans().find(entry => sameName(entry.name, name));
}

function findBan(player) {
    return loadBans().find(entry => entry.id === player.id) ?? findBanByName(player.name);
}

export function getBanMessage(entry) {
    return entry?.reason ? `You are banned from this world. Reason: ${entry.reason}` : "You are banned from this world.";
}

/** Bans and kicks a player. Returns the message for whoever ran it. */
export function banPlayer(actor, target, reasonRaw) {
    if (!target?.isValid) return "§cThat player is no longer here.";
    if (actor && actor.id === target.id) return "§cYou can't ban yourself.";
    if (isNativeDevPlayer(target)) return "§cThe developer can't be banned.";
    if (findBan(target)) return `§e${target.name} is already banned.`;

    const reason = `${reasonRaw ?? ""}`.replace(/\s+/g, " ").trim().slice(0, MAX_REASON_LENGTH);
    const entry = { id: target.id, name: target.name, reason, at: Date.now(), by: actor?.name ?? "" };
    if (!saveBans([...loadBans(), entry])) return "§cThe ban list is full; unban someone first.";

    if (!kickPlayerSafely(target, getBanMessage(entry))) {
        // The host of a local world can't be kicked, so a ban on them could never take effect.
        saveBans(loadBans().filter(other => other !== entry));
        return `§c${target.name} couldn't be kicked (the host can't be), so they weren't banned.`;
    }
    sendOperatorTelemetry(`${target.name} was banned by ${entry.by || "the server"}${reason ? `: ${reason}` : "."}`, actor?.id);
    return `§a${target.name} is banned.`;
}

/** Removes every ban with this name. Returns the message for whoever ran it. */
export function unbanByName(name) {
    const remaining = loadBans().filter(entry => !sameName(entry.name, name));
    const removed = loadBans().length - remaining.length;
    if (removed === 0) return `§c${name} isn't banned.`;
    saveBans(remaining);
    return `§a${name} is unbanned.`;
}

export function describeBans() {
    const list = loadBans();
    if (list.length === 0) return "Nobody is banned.";
    return [`§eBanned players (${list.length}):`, ...list.map(formatBanLine)].join("\n");
}

function formatBanLine(entry) {
    const date = entry.at ? new Date(entry.at).toISOString().slice(0, 10) : "";
    return `§f${entry.name}§7 ${[date, entry.reason].filter(Boolean).join(" - ")}`;
}

/** The ban list as a menu: picking someone asks to unban them. */
export function showBanList(player) {
    const list = loadBans();
    if (list.length === 0) {
        player.sendMessage("Nobody is banned.");
        return;
    }

    const form = new ActionFormData().title("Banned Players").body("Pick a player to unban them.");
    for (const entry of list) form.button(formatBanLine(entry));
    form.show(player).then(response => {
        const entry = response.canceled ? undefined : list[response.selection ?? -1];
        if (!entry) return;

        const confirm = new MessageFormData()
            .title("Unban")
            .body(`Unban ${entry.name}?${entry.reason ? `\n\nBanned for: ${entry.reason}` : ""}`)
            .button1("Unban")
            .button2("Cancel");
        return confirm.show(player).then(answer => {
            if (answer.canceled || answer.selection !== 0) return showBanList(player);
            player.sendMessage(unbanByName(entry.name));
        });
    }).catch(() => { });
}

// Banned players are kicked as they join; their saved name follows gamertag changes.
world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    if (!initialSpawn) return;
    system.run(() => {
        if (!player.isValid) return;
        const entry = findBan(player);
        if (!entry) return;
        if (entry.name !== player.name) {
            entry.name = player.name;
            saveBans([...loadBans()]);
        }
        if (kickPlayerSafely(player, getBanMessage(entry))) sendOperatorTelemetry(`Banned player ${player.name} tried to join and was kicked.`);
    });
});
