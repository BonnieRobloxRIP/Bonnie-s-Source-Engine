import { system, world } from "@minecraft/server";
import { applyEmojiReplacements, isDevTagReplicationAttempt } from "../../handler/core/chat_system.js";
import { getEntitiesOfClass } from "../registry.js";
import { entityOrigin, resolveSelectorPlayers } from "../selectors.js";
import { getEngineSettings, safeGetDimension } from "../runtime.js";

// SECTION: Player Rule Entities
// info_playerspawn decides where players (re)spawn; game_nametag decorates names in chat and
// above heads. Both only touch a player when the result actually changes.

const PLAYERSPAWN = "brr:info_playerspawn_block";
const NAMETAG = "brr:game_nametag_block";
const SPAWN_INTERVAL_TICKS = 100;
const NAMETAG_INTERVAL_TICKS = 10;

function toBool(value, fallback) {
    if (typeof value === "boolean") return value;
    const text = `${value ?? ""}`.trim().toLowerCase();
    if (!text) return fallback;
    return text === "true" || text === "1" || text === "yes" || text === "on";
}

// SECTION: info_playerspawn
let multipleSpawnWarningShown = false;
let lastWorldSpawnKey = "";
const lastPlayerSpawnKey = new Map();

function getActivePlayerspawn() {
    const active = [...getEntitiesOfClass(PLAYERSPAWN)].filter(entity => !entity.disabled);
    if (active.length > 1) {
        if (!multipleSpawnWarningShown) {
            multipleSpawnWarningShown = true;
            try {
                world.sendMessage("§eYou can have only 1 info_playerspawn block active at a time bro.");
            } catch { }
        }
        return undefined;
    }
    multipleSpawnWarningShown = false;
    return active[0];
}

function getSpawnConfig(entity) {
    const data = entity.data ?? {};
    let location = null;

    if (toBool(data.worldSpawnAtBlock, true)) {
        const cell = entity.cells[0];
        location = { x: cell.x + 0.5, y: cell.y, z: cell.z + 0.5 };
    } else {
        const coords = `${data.worldSpawn ?? ""}`.trim().split(/\s+/).map(Number.parseFloat);
        if (coords.length === 3 && coords.every(Number.isFinite)) {
            location = { x: coords[0] + 0.5, y: coords[1], z: coords[2] + 0.5 };
        }
    }
    if (!location) return null;

    return {
        location,
        dimension: safeGetDimension(entity.dimension),
        setsPlayerSpawnPoint: toBool(data.setsPlayerSpawnPoint, false),
        teleportOnJoin: toBool(data.teleportOnJoin, true),
        selector: `${data.selectors ?? ""}`.trim() || "@a"
    };
}

function applyPlayerSpawn(player, config) {
    const key = `${config.dimension?.id}|${config.location.x}|${config.location.y}|${config.location.z}`;
    if (lastPlayerSpawnKey.get(player.id) === key) return;
    try {
        player.setSpawnPoint({ ...config.location, dimension: config.dimension });
        lastPlayerSpawnKey.set(player.id, key);
    } catch { }
}

function runSpawnPass() {
    if (!getEngineSettings().toolsEnabled) return;
    const entity = getActivePlayerspawn();
    const config = entity ? getSpawnConfig(entity) : null;
    if (!config || !config.dimension) return;

    if (config.setsPlayerSpawnPoint) {
        lastWorldSpawnKey = "";
        for (const player of resolveSelectorPlayers(config.selector, entityOrigin(entity), "world")) {
            applyPlayerSpawn(player, config);
        }
        return;
    }

    const key = `${Math.floor(config.location.x)}|${Math.floor(config.location.y)}|${Math.floor(config.location.z)}`;
    if (key === lastWorldSpawnKey) return;
    try {
        world.setDefaultSpawnLocation(config.location);
        lastWorldSpawnKey = key;
    } catch { }
}

// Called from main.js on playerSpawn: places a (re)spawning player according to the active spawn.
// initialSpawn: the player just joined; "Teleport on join" off leaves them where they logged out.
export function handlePlayerSpawn(player, initialSpawn) {
    if (!getEngineSettings().toolsEnabled) return;
    const entity = getActivePlayerspawn();
    const config = entity ? getSpawnConfig(entity) : null;
    if (!config || !config.dimension) return;

    if (config.setsPlayerSpawnPoint) {
        const targets = resolveSelectorPlayers(config.selector, entityOrigin(entity), "world");
        if (targets.some(target => target.id === player.id)) {
            lastPlayerSpawnKey.delete(player.id);
            applyPlayerSpawn(player, config);
        }
        return;
    }

    if (initialSpawn && !config.teleportOnJoin) return;
    try {
        player.teleport(config.location, { dimension: config.dimension });
    } catch { }
}

// SECTION: game_nametag
const lastNametagPayload = new Map();

function formatNametag(raw) {
    const trimmed = `${raw ?? ""}`.trim();
    if (!trimmed) return "";
    if (isDevTagReplicationAttempt(trimmed)) return "[§r§d§lRetard§r]";
    return `[§r${applyEmojiReplacements(trimmed)}§r]`;
}

function syncNametagProperty(player, value) {
    if (lastNametagPayload.has(player.id) && lastNametagPayload.get(player.id) === value) return;
    try {
        if (player.getDynamicProperty("brr_nametag") !== value) player.setDynamicProperty("brr_nametag", value);
        lastNametagPayload.set(player.id, value);
    } catch { }
}

function joinTags(entries, predicate, prefix) {
    return entries.filter(predicate).map(entry => (prefix ? `${entry.tag} ` : ` ${entry.tag}`)).join("");
}

function runNametagPass() {
    const entriesByPlayer = new Map();

    for (const entity of getEntitiesOfClass(NAMETAG)) {
        if (entity.disabled) continue;
        const tag = formatNametag(entity.data?.nametag);
        if (!tag) continue;

        const entry = {
            tag,
            order: Number.parseInt(`${entity.data.nametagOrder ?? 0}`, 10) || 0,
            usernames: toBool(entity.data.worksInUsernames, true),
            chat: toBool(entity.data.worksInChat, true),
            prefix: toBool(entity.data.prefix, true),
            suffix: toBool(entity.data.suffix, false)
        };

        const selector = `${entity.data.selectors ?? ""}`.trim() || "@a";
        for (const player of resolveSelectorPlayers(selector, entityOrigin(entity))) {
            let entries = entriesByPlayer.get(player.id);
            if (!entries) entriesByPlayer.set(player.id, entries = []);
            entries.push(entry);
        }
    }

    const onlineIds = new Set();
    for (const player of world.getPlayers()) {
        onlineIds.add(player.id);
        const entries = entriesByPlayer.get(player.id);
        if (!entries || entries.length === 0) {
            syncNametagProperty(player, undefined);
            continue;
        }

        entries.sort((a, b) => a.order - b.order);
        syncNametagProperty(player, JSON.stringify({
            chatPrefix: joinTags(entries, entry => entry.chat && entry.prefix, true),
            chatSuffix: joinTags(entries, entry => entry.chat && entry.suffix, false),
            usernamePrefix: joinTags(entries, entry => entry.usernames && entry.prefix, true),
            usernameSuffix: joinTags(entries, entry => entry.usernames && entry.suffix, false)
        }));
    }

    for (const id of lastNametagPayload.keys()) if (!onlineIds.has(id)) lastNametagPayload.delete(id);
    for (const id of lastPlayerSpawnKey.keys()) if (!onlineIds.has(id)) lastPlayerSpawnKey.delete(id);
}

export function startPlayerRuleSystem() {
    system.runInterval(runSpawnPass, SPAWN_INTERVAL_TICKS);
    system.runInterval(runNametagPass, NAMETAG_INTERVAL_TICKS);
}
