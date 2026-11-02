import { system, world } from "@minecraft/server";

// SECTION: Usernames
// /brr:username_mode hides or randomizes player names; /brr:invisible_names hides invisible players'
// names in death messages (sent by death_messages.js, which asks getDisplayName for every name).
// While hidden or randomized mode is on this owns every player's nametag, and chat_system.js must
// not write its rank nametag over it (the two loops used to overwrite each other, flashing real
// names on screen).

const USERNAME_MODE_PROPERTY = "brr_username_mode";
const USERNAME_ALIAS_MAP_PROPERTY = "brr_username_alias_map";
const INVISIBLE_NAMES_PROPERTY = "brr_invisible_names";
export const CHAT_DISPLAY_NAME_OVERRIDE_PROPERTY = "brr_display_name_override";
export const USERNAME_MODES = ["normal", "hidden", "randomized"];
// off: invisible players keep their name; hidden: "???"; obfuscated: the name as scrambling characters.
export const INVISIBLE_NAME_STYLES = ["off", "hidden", "obfuscated"];
const USERNAME_MODE_NORMAL = "normal";
const USERNAME_MODE_HIDDEN = "hidden";
const USERNAME_MODE_RANDOMIZED = "randomized";
// An empty nametag draws nothing at all (a lone "§" still rendered). Chat needs a visible stand-in.
const HIDDEN_USERNAME_PLACEHOLDER = "";
const HIDDEN_CHAT_NAME = "§7???";
const GENERIC_PLAYER_ALIASES = [
    "Emily",
    "Max",
    "Oliver",
    "Fiona",
    "Liam",
    "Ava",
    "Noah",
    "Mia",
    "Lucas",
    "Zoe",
    "Ethan",
    "Ruby",
    "Logan",
    "Chloe",
    "Mason",
    "Nora",
    "Henry",
    "Ivy",
    "Felix",
    "Nina",
    "Leo",
    "Aria",
    "Elijah",
    "Nova",
    "Amelia",
    "Jack",
    "Grace",
    "Owen",
    "Hazel",
    "Caleb",
    "Lily",
    "Isaac",
    "Stella",
    "Jasper",
    "Violet",
    "Miles",
    "Clara",
    "Theo",
    "Luna",
    "Ezra",
    "Maya",
    "Silas",
    "Willow",
    "Hugo",
    "Elena",
    "Rowan",
    "Iris",
    "Declan",
    "Sadie",
    "Arthur",
    "Penny",
    "Finn",
    "Rosie",
    "Oscar",
    "Daisy",
    "Wyatt",
    "Hannah",
    "Gavin",
    "Lucy",
    "Dylan",
    "Mabel",
    "Tobias",
    "Eliza",
    "Simon",
    "June",
    "Adrian",
    "Paige",
    "Colin",
    "Freya",
    "Marcus",
    "Tessa",
    "Quinn",
    "Harper",
    "Jude",
    "Wren",
    "Elliot",
    "Maeve",
    "Rhys",
    "Sophie",
    "Gideon"
];

let usernameMode = USERNAME_MODE_NORMAL;
let invisibleNameStyle = "off";
let modeOwnsNametags = false;
const assignedAliasByPlayerId = new Map();

// SECTION: Modes and Aliases
function normalizeUsernameMode(rawMode) {
    const normalized = `${rawMode ?? ""}`.trim().toLowerCase();
    if (normalized === USERNAME_MODE_HIDDEN || normalized === USERNAME_MODE_RANDOMIZED) {
        return normalized;
    }
    return USERNAME_MODE_NORMAL;
}

function sanitizeAlias(aliasRaw) {
    const normalized = `${aliasRaw ?? ""}`
        .replace(/\s+/g, " ")
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
        .trim();
    if (!normalized) return "Player";
    return normalized.slice(0, 32);
}

// Aliases are only kept for players who are online, in memory: someone who leaves and rejoins (or
// whose mode was changed) gets a new random name. Older versions saved every alias ever handed out
// in USERNAME_ALIAS_MAP_PROPERTY; that list is deleted on load.
function persistUsernameModerationState() {
    try {
        world.setDynamicProperty(USERNAME_MODE_PROPERTY, usernameMode);
    } catch { }
}

function loadUsernameModerationState() {
    try {
        usernameMode = normalizeUsernameMode(world.getDynamicProperty(USERNAME_MODE_PROPERTY));
    } catch {
        usernameMode = USERNAME_MODE_NORMAL;
    }
    try {
        const style = `${world.getDynamicProperty(INVISIBLE_NAMES_PROPERTY) ?? "off"}`;
        invisibleNameStyle = INVISIBLE_NAME_STYLES.includes(style) ? style : "off";
    } catch { }

    try {
        world.setDynamicProperty(USERNAME_ALIAS_MAP_PROPERTY, undefined);
    } catch { }
}

function getShuffledAliases() {
    const aliases = [...GENERIC_PLAYER_ALIASES];
    for (let index = aliases.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        const temp = aliases[index];
        aliases[index] = aliases[swapIndex];
        aliases[swapIndex] = temp;
    }
    return aliases;
}

function createUniqueAlias(usedAliases) {
    const shuffledAliases = getShuffledAliases();
    for (const alias of shuffledAliases) {
        if (!usedAliases.has(alias)) {
            return alias;
        }
    }

    let suffix = 2;
    while (suffix < 10000) {
        for (const alias of shuffledAliases) {
            const fallbackAlias = `${alias}${suffix}`;
            if (!usedAliases.has(fallbackAlias)) {
                return fallbackAlias;
            }
        }
        suffix++;
    }

    return `Player${Date.now()}`;
}

function refreshAliasAssignments(players, forceReassign = false) {
    if (forceReassign) assignedAliasByPlayerId.clear();

    // Players who left give their alias up.
    const onlineIds = new Set(players.map(player => `${player?.id ?? ""}`.trim()));
    for (const playerId of assignedAliasByPlayerId.keys()) {
        if (!onlineIds.has(playerId)) assignedAliasByPlayerId.delete(playerId);
    }

    const usedAliases = new Set();
    for (const alias of assignedAliasByPlayerId.values()) {
        if (`${alias ?? ""}`.trim()) {
            usedAliases.add(`${alias}`);
        }
    }

    for (const player of players) {
        const playerId = `${player?.id ?? ""}`.trim();
        if (!playerId) continue;
        if (assignedAliasByPlayerId.has(playerId)) continue;

        const alias = sanitizeAlias(createUniqueAlias(usedAliases));
        usedAliases.add(alias);
        assignedAliasByPlayerId.set(playerId, alias);
    }
}

// Last chat-name override written per player, so the dynamic property is only written when it changes.
const chatNameOverrideByPlayerId = new Map();

function applyUsernameModeToPlayers() {
    const players = world.getPlayers();
    modeOwnsNametags = usernameMode !== USERNAME_MODE_NORMAL;
    if (usernameMode === USERNAME_MODE_RANDOMIZED) {
        refreshAliasAssignments(players);
    }

    const onlineIds = new Set();

    for (const player of players) {
        let nextNameTag = "";
        let nextChatName = "";
        let shouldOverrideNameTag = false;
        let shouldOverrideChatName = false;

        if (usernameMode === USERNAME_MODE_HIDDEN) {
            nextNameTag = HIDDEN_USERNAME_PLACEHOLDER;
            nextChatName = HIDDEN_CHAT_NAME;
            shouldOverrideNameTag = true;
            shouldOverrideChatName = true;
        } else if (usernameMode === USERNAME_MODE_RANDOMIZED) {
            const playerId = `${player?.id ?? ""}`.trim();
            const alias = sanitizeAlias(assignedAliasByPlayerId.get(playerId));
            nextNameTag = alias;
            nextChatName = alias;
            shouldOverrideNameTag = true;
            shouldOverrideChatName = true;
        }

        try {
            // In normal mode, let chat_system.js own player nametag formatting.
            if (shouldOverrideNameTag && `${player.nameTag ?? ""}` !== nextNameTag) {
                player.nameTag = nextNameTag;
            }
        } catch { }

        const chatOverride = shouldOverrideChatName ? nextChatName : undefined;
        onlineIds.add(player.id);
        if (chatNameOverrideByPlayerId.has(player.id) && chatNameOverrideByPlayerId.get(player.id) === chatOverride) continue;
        try {
            if (player.getDynamicProperty(CHAT_DISPLAY_NAME_OVERRIDE_PROPERTY) !== chatOverride) {
                player.setDynamicProperty(CHAT_DISPLAY_NAME_OVERRIDE_PROPERTY, chatOverride);
            }
            chatNameOverrideByPlayerId.set(player.id, chatOverride);
        } catch { }
    }

    for (const id of chatNameOverrideByPlayerId.keys()) {
        if (!onlineIds.has(id)) chatNameOverrideByPlayerId.delete(id);
    }
}

// SECTION: Public API
export function usernameModeOwnsNametags() {
    return modeOwnsNametags;
}

export function getUsernameMode() {
    return usernameMode;
}

// mode: "normal" | "hidden" | "randomized" (validated by the command).
export function setUsernameMode(mode) {
    usernameMode = normalizeUsernameMode(mode);
    if (usernameMode === USERNAME_MODE_RANDOMIZED) refreshAliasAssignments(world.getPlayers(), true);
    else assignedAliasByPlayerId.clear();
    persistUsernameModerationState();
    applyUsernameModeToPlayers();
    notifyNameSettingsChanged();
}

export function getInvisibleNameStyle() {
    return invisibleNameStyle;
}

export function setInvisibleNameStyle(style) {
    if (!INVISIBLE_NAME_STYLES.includes(style)) return;
    invisibleNameStyle = style;
    try {
        world.setDynamicProperty(INVISIBLE_NAMES_PROPERTY, style === "off" ? undefined : style);
    } catch { }
    notifyNameSettingsChanged();
}

/** True while some name setting means vanilla messages would show names they shouldn't. */
export function namesNeedHiding() {
    return usernameMode !== USERNAME_MODE_NORMAL || invisibleNameStyle !== "off";
}

/**
 * The name to show for a player in messages, following the username mode and invisibility.
 * wasInvisible: the player was invisible a moment ago (death clears effects before the event runs).
 */
export function getDisplayName(player, wasInvisible = false) {
    let name = `${player?.name ?? "?"}`;
    if (usernameMode === USERNAME_MODE_HIDDEN) name = HIDDEN_CHAT_NAME;
    else if (usernameMode === USERNAME_MODE_RANDOMIZED) name = sanitizeAlias(assignedAliasByPlayerId.get(player?.id));

    let invisible = wasInvisible;
    try {
        invisible ||= Boolean(player?.getEffect("invisibility"));
    } catch { }
    if (!invisible || invisibleNameStyle === "off") return name;
    if (invisibleNameStyle === "hidden") return HIDDEN_CHAT_NAME;
    return `§k${name.replace(/§./g, "")}§r`;
}

const settingsListeners = [];

/** Called after the username mode or invisible-name style changes. */
export function onNameSettingsChanged(listener) {
    settingsListeners.push(listener);
}

function notifyNameSettingsChanged() {
    for (const listener of settingsListeners) {
        try {
            listener();
        } catch { }
    }
}

/** Loads the saved settings and starts keeping nametags in line (call once the world is loaded). */
export function startUsernameModes() {
    loadUsernameModerationState();
    notifyNameSettingsChanged();
    system.runInterval(applyUsernameModeToPlayers, 10);
}
