import { system, world } from "@minecraft/server";
import { SPOOP_NOTEBOOKS } from "./core/game_state.js";
import { NEIGHBOR_OFFSETS } from "./core/math.js";
import { gameTick } from "./core/pause.js";
import { highestScore } from "./core/scoreboard.js";
import { soundVolume } from "./core/settings.js";

// each entry is a set of block ids that make up one interactable door instance
const DOOR_FAMILIES = [
    ["brr:door_small"],
    ["brr:door_fac"],
    ["brr:door_office"],
    ["brr:door_poo"],
    ["brr:door_beast"],
    ["brr:door_bedroom"],
    ["brr:door_medical"],
    ["brr:door_other"],
    ["brr:door_police"],
    ["brr:door_jail"],
    ["brr:door_stall"]
];

const BIG_DOOR_FAMILY = new Set(["brr:door_big_left", "brr:door_big_right"]);

// behaves like the big swing door but is its own family (never merges with a neighbouring big door) and can't be locked
const KITCHEN_DOOR_FAMILY = new Set(["brr:door_kitchen_left", "brr:door_kitchen_right"]);

export const DOOR_LOCK_DURATION_TICKS = 300;
const DOOR_LOCK_SOUND = "door.swingdoorlock";
const DOOR_LOCKS_PROPERTY = "brr:door_locks";

export const SMALL_DOOR_CLOSE_DELAY_TICKS = 40;
export const BIG_DOOR_CLOSE_DELAY_TICKS = 40;
const BIG_DOOR_TRIGGER_RADIUS = 3;
const DOOR_OPEN_SOUND = "door.open";
const DOOR_CLOSE_SOUND = "door.close";
const BIG_DOOR_OPEN_SOUND = "door.swingopen";

const familyByType = new Map();
for (const family of DOOR_FAMILIES) {
    const set = new Set(family);
    for (const id of family) familyByType.set(id, set);
}
for (const id of BIG_DOOR_FAMILY) familyByType.set(id, BIG_DOOR_FAMILY);
for (const id of KITCHEN_DOOR_FAMILY) familyByType.set(id, KITCHEN_DOOR_FAMILY);

// locked big doors, keyed by group key: { dimensionId, locations, unlockAt }
const doorLocks = new Map();
// "dim:x,y,z" of every part of a locked group -> its doorLocks key
const lockedPartIndex = new Map();
let locksRestored = false;

// pending auto-close jobs, keyed by a stable id for the door group: { dimensionId, locations, doorway, typeId, big, closeAt }
const doorCloseAt = new Map();
// "dim:x,y,z" of every part of an open group -> its doorCloseAt key
const openPartIndex = new Map();
const openedListeners = [];
// (player, block) => boolean; false stops that player from opening the door
let playerDoorGate;

function partKey(dimensionId, x, y, z) {
    return `${dimensionId}:${x},${y},${z}`;
}

export function isDoorType(typeId) {
    return familyByType.has(typeId);
}

export function isBigDoorType(typeId) {
    return BIG_DOOR_FAMILY.has(typeId) || KITCHEN_DOOR_FAMILY.has(typeId);
}

export function isLockableDoorType(typeId) {
    return BIG_DOOR_FAMILY.has(typeId);
}

export function isDoorLockedAt(dimension, x, y, z) {
    return lockedPartIndex.has(partKey(dimension.id, x, y, z));
}

// barred doors (blaze rod) keep the state in the block itself so it survives structure saves.
// characters may still pass through barred jail doors (e.g. escorting someone to jail)
const BARRED_STATE = "brr:barred";
const BAR_ITEM = "minecraft:blaze_rod";
const JAIL_DOOR = "brr:door_jail";
const BARRED_SOUND = "door.lock";
const BAR_SOUND = "door.lock";
const UNBAR_SOUND = "door.unlock";
const BARRED_CACHE_TTL_TICKS = 100;
const BARRED_SOUND_COOLDOWN_TICKS = 30;
// "dim:x,y,z" -> { barred, at }
const barredCache = new Map();
// "playerId|groupPart" -> tick of the last locked rattle
const barredSoundAt = new Map();

function isBarredPermutation(permutation) {
    try { return permutation.getState(BARRED_STATE) === true; } catch { return false; }
}

// A barred big swing door is the original's notebook-locked door (SwingingDoorScript): it stays shut
// until someone has SPOOP_NOTEBOOKS notebooks, then opens like any other. The block keeps its
// barred state, so the map's barring is never lost.
const NOTEBOOK_DOOR_LINE = "door.raldi";
// coming back after this long counts as a new try at the door (the original's NeedMoreScript
// played on every trigger enter); the door checks for players every 10 ticks
const NOTEBOOK_DOOR_RETRY_TICKS = 40;
// playerId -> tick of their last try at a notebook-locked door (per player, not per part, since
// both halves of a door check for players)
const notebookDoorTries = new Map();
let notebooksTick = -1;
let notebooksMet = false;

function enoughNotebooks() {
    if (notebooksTick === system.currentTick) return notebooksMet;
    notebooksTick = system.currentTick;
    notebooksMet = highestScore(world.getAllPlayers(), "notebooks") >= SPOOP_NOTEBOOKS;
    return notebooksMet;
}

function isNotebookDoor(typeId) {
    return BIG_DOOR_FAMILY.has(typeId);
}

// barred, and not a notebook door that the notebooks have already opened up
function isBarredShut(block) {
    if (!isBarredPermutation(block.permutation)) return false;
    return !isNotebookDoor(block.typeId) || !enoughNotebooks();
}

// "You need to collect 2 notebooks before you can use these doors!", once per try, to that player only
function playNotebookLine(player) {
    const now = gameTick();
    const last = notebookDoorTries.get(player.id) ?? -Infinity;
    notebookDoorTries.set(player.id, now);
    if (now - last < NOTEBOOK_DOOR_RETRY_TICKS) return;
    try { player.playSound(NOTEBOOK_DOOR_LINE, { volume: soundVolume(player) }); } catch { }
}

export function isDoorBarredAt(dimension, x, y, z) {
    const key = partKey(dimension.id, x, y, z);
    const now = gameTick();
    const cached = barredCache.get(key);
    if (cached && now - cached.at < BARRED_CACHE_TTL_TICKS) return cached.barred;
    let barred = false;
    try {
        const block = dimension.getBlock({ x, y, z });
        barred = !!block && isDoorType(block.typeId) && isBarredPermutation(block.permutation);
    } catch { }
    barredCache.set(key, { barred, at: now });
    return barred;
}

// true when a character (not a player) may not path through this door cell
export function isDoorBarredForCharacters(dimension, x, y, z, typeId) {
    if (typeId === JAIL_DOOR || !isDoorType(typeId)) return false;
    if (isNotebookDoor(typeId) && enoughNotebooks()) return false;
    return isDoorBarredAt(dimension, x, y, z);
}

function playBarredRattle(player, block) {
    const key = `${player.id}|${block.dimension.id}:${block.x},${block.y},${block.z}`;
    const now = gameTick();
    if (now - (barredSoundAt.get(key) ?? -Infinity) < BARRED_SOUND_COOLDOWN_TICKS) return;
    barredSoundAt.set(key, now);
    if (barredSoundAt.size > 256) {
        for (const [k, at] of barredSoundAt) if (now - at >= BARRED_SOUND_COOLDOWN_TICKS) barredSoundAt.delete(k);
    }
    playDoorSound(block.dimension, block, BARRED_SOUND);
}

// toggles the barred state of a whole door instance and shuts it. returns the new state, or undefined if not a door
export function toggleDoorBarred(startBlock) {
    const group = findDoorGroup(startBlock);
    if (group.length === 0) return undefined;
    const barred = !group.some((block) => isBarredPermutation(block.permutation));
    const dimensionId = startBlock.dimension.id;
    const now = gameTick();
    for (const block of group) {
        let permutation = block.permutation;
        if (permutation.getState(BARRED_STATE) === undefined) continue;
        permutation = permutation.withState(BARRED_STATE, barred);
        if (barred && permutation.getState("brr:open") === true) permutation = permutation.withState("brr:open", false);
        block.setPermutation(permutation);
        const key = partKey(dimensionId, block.x, block.y, block.z);
        barredCache.set(key, { barred, at: now });
        if (barred) {
            const openKey = openPartIndex.get(key);
            if (openKey) doorCloseAt.delete(openKey);
            openPartIndex.delete(key);
        }
    }
    const doorway = group.reduce((lowest, part) => part.y < lowest.y ? part : lowest, group[0]);
    playDoorSound(startBlock.dimension, doorway, barred ? BAR_SOUND : UNBAR_SOUND);
    return barred;
}

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    const { block, itemStack, player } = event;
    if (itemStack?.typeId !== BAR_ITEM || !isDoorType(block.typeId)) return;
    event.cancel = true;
    if (event.isFirstEvent === false) return;
    const dimension = block.dimension;
    const location = { x: block.x, y: block.y, z: block.z };
    system.run(() => {
        let target;
        try { target = dimension.getBlock(location); } catch { }
        if (!target || !isDoorType(target.typeId)) return;
        const barred = toggleDoorBarred(target);
        if (barred === undefined) return;
        try { player.onScreenDisplay.setActionBar(barred ? "§cDoor barred" : "§aDoor unbarred"); } catch { }
    });
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => notebookDoorTries.delete(playerId));

const forgetBarred = ({ block, dimension }) => barredCache.delete(partKey(dimension.id, block.x, block.y, block.z));
world.afterEvents.playerBreakBlock.subscribe(forgetBarred);
world.afterEvents.playerPlaceBlock.subscribe(forgetBarred);

// listener receives { player, dimension, location, typeId } where location is the doorway floor centre
export function onDoorOpened(listener) {
    openedListeners.push(listener);
}

export function setPlayerDoorGate(gate) {
    playerDoorGate = gate;
}

function playerMayOpen(player, block) {
    if (!playerDoorGate) return true;
    try { return playerDoorGate(player, block) !== false; } catch { return true; }
}

function playDoorSound(dimension, doorway, soundId) {
    try { dimension.playSound(soundId, { x: doorway.x + 0.5, y: doorway.y + 1, z: doorway.z + 0.5 }); } catch { }
}

// flood-fills through adjacent blocks that belong to the same door family to find every part of one door instance
export function findDoorGroup(startBlock) {
    const family = familyByType.get(startBlock.typeId);
    if (!family) return [];

    const dimension = startBlock.dimension;
    const found = [];
    const visited = new Set();
    const stack = [startBlock];

    while (stack.length > 0) {
        const current = stack.pop();
        const key = `${current.x},${current.y},${current.z}`;
        if (visited.has(key)) continue;
        visited.add(key);

        if (!family.has(current.typeId)) continue;
        found.push(current);

        for (const offset of NEIGHBOR_OFFSETS) {
            const neighbor = dimension.getBlock({
                x: current.x + offset.x,
                y: current.y + offset.y,
                z: current.z + offset.z
            });
            if (neighbor) stack.push(neighbor);
        }
    }

    return found;
}

function groupKey(dimensionId, blocks) {
    let min = blocks[0];
    for (const block of blocks) {
        if (block.x < min.x || block.y < min.y || block.z < min.z) min = block;
    }
    return `${dimensionId}:${min.x},${min.y},${min.z}`;
}

function setDoorGroupOpen(blocks, open) {
    for (const block of blocks) {
        if (block.permutation.getState("brr:open") === open) continue;
        block.setPermutation(block.permutation.withState("brr:open", open));
    }
}

function notifyOpened(player, dimension, doorway, typeId) {
    const event = { player, dimension, typeId, location: { x: doorway.x + 0.5, y: doorway.y, z: doorway.z + 0.5 } };
    for (const listener of openedListeners) {
        try { listener(event); } catch { }
    }
}

// already-open door: just push its close timer back, no block reads
function extendOpenGroup(dimension, x, y, z, delayTicks, player, alwaysNotify) {
    const key = openPartIndex.get(partKey(dimension.id, x, y, z));
    const entry = key && doorCloseAt.get(key);
    if (!entry) return undefined;
    entry.closeAt = gameTick() + delayTicks;
    if (player && alwaysNotify) notifyOpened(player, dimension, entry.doorway, entry.typeId);
    return entry.locations;
}

// opens every part of the door instance containing startBlock, then (re)schedules its auto-close timer.
// returns the part locations of the group ([] if startBlock is not a door)
export function openDoorGroup(startBlock, delayTicks, player, alwaysNotify = false) {
    const dimension = startBlock.dimension;
    restoreLocks();
    if (lockedPartIndex.has(partKey(dimension.id, startBlock.x, startBlock.y, startBlock.z))) return [];
    if (isBarredShut(startBlock)) {
        if (player) {
            if (isNotebookDoor(startBlock.typeId)) playNotebookLine(player);
            else playBarredRattle(player, startBlock);
            return [];
        }
        if (startBlock.typeId !== JAIL_DOOR) return [];
    }
    const known = extendOpenGroup(dimension, startBlock.x, startBlock.y, startBlock.z, delayTicks, player, alwaysNotify);
    if (known) return known;

    const group = findDoorGroup(startBlock);
    if (group.length === 0) return [];
    // a locked state with no tracked lock (e.g. lost on reload) is stale, so drop it
    if (restoreLocks()) clearStaleLock(group);

    const dimensionId = dimension.id;
    const typeId = startBlock.typeId;
    const big = isBigDoorType(typeId);
    const wasOpen = group.some((block) => block.permutation.getState("brr:open") === true);
    setDoorGroupOpen(group, true);
    const key = groupKey(dimensionId, group);
    const locations = group.map((block) => ({ x: block.x, y: block.y, z: block.z }));
    const doorway = locations.reduce((lowest, part) => part.y < lowest.y ? part : lowest, locations[0]);
    doorCloseAt.set(key, { dimensionId, locations, doorway, typeId, big, closeAt: gameTick() + delayTicks });
    for (const part of locations) openPartIndex.set(partKey(dimensionId, part.x, part.y, part.z), key);
    if (!wasOpen) playDoorSound(dimension, doorway, big ? BIG_DOOR_OPEN_SOUND : DOOR_OPEN_SOUND);
    if (player && (alwaysNotify || !wasOpen)) notifyOpened(player, dimension, doorway, typeId);
    return locations;
}

// same as openDoorGroup but skips the getBlock when the door is already open
export function openDoorAt(dimension, location, delayTicks) {
    const known = extendOpenGroup(dimension, location.x, location.y, location.z, delayTicks);
    if (known) return known;
    let block;
    try { block = dimension.getBlock(location); } catch { }
    return block ? openDoorGroup(block, delayTicks) : [];
}

function setLockedState(blocks, locked) {
    for (const block of blocks) {
        let permutation = block.permutation;
        if (permutation.getState("brr:locked") === undefined) continue;
        if (locked) permutation = permutation.withState("brr:open", false);
        if (permutation.getState("brr:locked") !== locked) permutation = permutation.withState("brr:locked", locked);
        if (permutation !== block.permutation) block.setPermutation(permutation);
    }
}

function clearStaleLock(group) {
    try {
        if (group.some((block) => block.permutation.getState("brr:locked") === true)) setLockedState(group, false);
    } catch { }
}

function trackLock(key, dimensionId, locations, unlockAt) {
    doorLocks.set(key, { dimensionId, locations, unlockAt });
    for (const part of locations) lockedPartIndex.set(partKey(dimensionId, part.x, part.y, part.z), key);
}

// written when a lock starts or ends; a reload resumes each lock with the time it had left at
// that save (at most DOOR_LOCK_DURATION_TICKS), which is close enough for a 15 second lock
function saveLocks() {
    const now = gameTick();
    const data = [];
    for (const entry of doorLocks.values()) {
        data.push({ d: entry.dimensionId, r: Math.max(0, entry.unlockAt - now), l: entry.locations.map((p) => [p.x, p.y, p.z]) });
    }
    try { world.setDynamicProperty(DOOR_LOCKS_PROPERTY, data.length > 0 ? JSON.stringify(data) : undefined); } catch { }
}

// reloads locks that were active when the world was last saved; returns true once that has happened
function restoreLocks() {
    if (locksRestored) return true;
    let raw;
    try { raw = world.getDynamicProperty(DOOR_LOCKS_PROPERTY); } catch { return false; }
    locksRestored = true;
    if (typeof raw !== "string") return true;
    try {
        const now = gameTick();
        for (const entry of JSON.parse(raw)) {
            const locations = entry.l.map(([x, y, z]) => ({ x, y, z }));
            if (locations.length === 0) continue;
            trackLock(groupKey(entry.d, locations), entry.d, locations, now + entry.r);
        }
    } catch { }
    return true;
}

// shuts a big swing door and keeps it shut for durationTicks. returns false if the door can't be locked
// (not a lockable door, e.g. the kitchen variant, or already locked)
export function lockDoorGroup(startBlock, durationTicks = DOOR_LOCK_DURATION_TICKS) {
    if (!startBlock || !isLockableDoorType(startBlock.typeId)) return false;
    restoreLocks();
    const dimension = startBlock.dimension;
    const dimensionId = dimension.id;
    if (lockedPartIndex.has(partKey(dimensionId, startBlock.x, startBlock.y, startBlock.z))) return false;

    const group = findDoorGroup(startBlock);
    if (group.length === 0) return false;
    const key = groupKey(dimensionId, group);
    const locations = group.map((block) => ({ x: block.x, y: block.y, z: block.z }));

    // cancel any pending auto-close for this door, it is being shut right now
    for (const part of locations) {
        const openKey = openPartIndex.get(partKey(dimensionId, part.x, part.y, part.z));
        if (openKey) doorCloseAt.delete(openKey);
        openPartIndex.delete(partKey(dimensionId, part.x, part.y, part.z));
    }

    setLockedState(group, true);
    trackLock(key, dimensionId, locations, gameTick() + durationTicks);
    saveLocks();
    const doorway = locations.reduce((lowest, part) => part.y < lowest.y ? part : lowest, locations[0]);
    playDoorSound(dimension, doorway, DOOR_LOCK_SOUND);
    return true;
}

function unlockExpired() {
    if (!restoreLocks() || doorLocks.size === 0) return;
    const now = gameTick();
    let changed = false;
    for (const [key, entry] of doorLocks) {
        if (now < entry.unlockAt) continue;
        const dimension = world.getDimension(entry.dimensionId);
        const blocks = [];
        for (const location of entry.locations) {
            lockedPartIndex.delete(partKey(entry.dimensionId, location.x, location.y, location.z));
            let block;
            try { block = dimension.getBlock(location); } catch { }
            if (block) blocks.push(block);
        }
        try { setLockedState(blocks, false); } catch { }
        doorLocks.delete(key);
        changed = true;
    }
    if (changed) saveLocks();
}

export function registerDoorComponents(blockComponentRegistry) {
    // small doors: right-clicking opens (or extends the open timer of) the whole door instance
    blockComponentRegistry.registerCustomComponent("brr:door_interact", {
        onPlayerInteract({ block, player }) {
            if (player && !playerMayOpen(player, block)) return;
            openDoorGroup(block, SMALL_DOOR_CLOSE_DELAY_TICKS, player, true);
        }
    });

    // big double door: opens automatically whenever a player is within range
    blockComponentRegistry.registerCustomComponent("brr:door_auto", {
        onTick({ block, dimension }) {
            // multi-block column: only the bottom part triggers
            const part = block.permutation.getState("minecraft:multi_block_part");
            if (part !== undefined && part !== 0) return;
            const nearbyPlayers = dimension.getPlayers({
                location: { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 },
                maxDistance: BIG_DOOR_TRIGGER_RADIUS
            }).filter((player) => playerMayOpen(player, block));
            if (nearbyPlayers.length > 0) {
                openDoorGroup(block, BIG_DOOR_CLOSE_DELAY_TICKS, nearbyPlayers[0]);
            }
        }
    });
}

// runs once a second and closes any door whose auto-close timer has expired
system.runInterval(() => {
    unlockExpired();
    const now = gameTick();
    for (const [key, entry] of doorCloseAt) {
        if (now < entry.closeAt) continue;

        const dimension = world.getDimension(entry.dimensionId);
        let closed = false;
        for (const location of entry.locations) {
            openPartIndex.delete(partKey(entry.dimensionId, location.x, location.y, location.z));
            let block;
            try { block = dimension.getBlock(location); } catch { }
            if (block && block.permutation.getState("brr:open") === true) {
                block.setPermutation(block.permutation.withState("brr:open", false));
                closed = true;
            }
        }
        // swing doors close silently on purpose
        if (closed && !entry.big) playDoorSound(dimension, entry.doorway, DOOR_CLOSE_SOUND);
        doorCloseAt.delete(key);
    }
}, 20);
