import { system, world } from "@minecraft/server";
import { AIR, invalidateBlock } from "./core/block_cache.js";
import { gameTick, isPaused } from "./core/pause.js";
import { SegmentedSound } from "./characters/segmented_sound.js";

export const POLISH_MARKER_ID = "brr:polish_cow_marker";
const PROPERTY = "brr:polish_markers";
const songs = new Map();
let markers;

function load() {
    if (markers) return markers;
    const stored = world.getDynamicProperty(PROPERTY);
    const parsed = stored === undefined ? [] : JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.some((marker) => !marker
        || typeof marker.dimensionId !== "string"
        || ![marker.x, marker.y, marker.z].every(Number.isInteger))) {
        throw new Error("Invalid saved Polish Cow markers");
    }
    markers = parsed;
    return markers;
}

function save() {
    world.setDynamicProperty(PROPERTY, JSON.stringify(markers));
}

function matches(marker, dimension, location) {
    return marker.dimensionId === dimension.id && marker.x === location.x
        && marker.y === location.y && marker.z === location.z;
}

function keyOf(dimension, location) {
    return `${dimension.id}:${location.x},${location.y},${location.z}`;
}

function forget(dimension, location) {
    markers = load().filter((marker) => !matches(marker, dimension, location));
    songs.delete(keyOf(dimension, location));
    save();
}

function note(block) {
    if (load().some((marker) => matches(marker, block.dimension, block.location))) return;
    markers.push({ dimensionId: block.dimension.id, ...block.location });
    save();
}

export function placePolishMarker(player) {
    if (isPaused()) {
        player.sendMessage({ translate: "brr.polish_marker.paused" });
        return false;
    }
    const location = {
        x: Math.floor(player.location.x),
        // Standing feet can be reported just below the floor's top face.
        y: Math.floor(player.location.y + 0.01),
        z: Math.floor(player.location.z)
    };
    try {
        const block = player.dimension.getBlock(location);
        if (!block?.isAir) {
            player.sendMessage({ translate: "brr.polish_marker.blocked" });
            return false;
        }
        load();
        block.setType(POLISH_MARKER_ID);
        invalidateBlock(block.dimension, location);
        forget(block.dimension, location);
        note(block);
        return true;
    } catch (error) {
        console.warn(`[polish_marker] Placement failed: ${error}`);
        player.sendMessage({ translate: "brr.polish_marker.unavailable" });
        return false;
    }
}

export function oldestPolishMarker(dimension) {
    for (const marker of [...load()]) {
        if (marker.dimensionId !== dimension.id || marker.consumed) continue;
        let block;
        try { block = dimension.getBlock(marker); } catch (error) {
            console.warn(`[polish_marker] Cannot inspect ${keyOf(dimension, marker)}: ${error}`);
        }
        if (block && block.typeId !== POLISH_MARKER_ID) {
            forget(dimension, marker);
            continue;
        }
        return marker;
    }
    return undefined;
}

// Unloaded destinations are cleared by their next block tick after the successful teleport.
export function consumePolishMarker(dimension, marker) {
    marker.consumed = true;
    save();
    songs.delete(keyOf(dimension, marker));
    try {
        const block = dimension.getBlock(marker);
        if (!block) return;
        if (block.typeId === POLISH_MARKER_ID) {
            block.setType(AIR);
            invalidateBlock(dimension, marker);
        }
        forget(dimension, marker);
    } catch (error) {
        console.warn(`[polish_marker] Removal deferred at ${keyOf(dimension, marker)}: ${error}`);
    }
}

export function registerPolishMarkerComponents(registry) {
    registry.registerCustomComponent("brr:polish_marker", {
        onPlace({ block }) {
            forget(block.dimension, block.location);
            note(block);
        },
        onPlayerBreak({ block }) { forget(block.dimension, block.location); },
        onTick({ block }) {
            const marker = load().find((entry) => matches(entry, block.dimension, block.location));
            if (marker?.consumed) {
                consumePolishMarker(block.dimension, marker);
                return;
            }
            note(block);
            const key = keyOf(block.dimension, block.location);
            let entry = songs.get(key);
            if (!entry) {
                entry = { sound: new SegmentedSound("polish_marker", true) };
                entry.sound.start(gameTick());
                songs.set(key, entry);
            }
            entry.lastSeen = system.currentTick;
            if (!isPaused()) entry.sound.update({
                dimension: block.dimension,
                location: { x: block.x + 0.5, y: block.y, z: block.z + 0.5 }
            }, gameTick());
        }
    });
}

system.runInterval(() => {
    for (const [key, entry] of songs) {
        if (system.currentTick - entry.lastSeen > 200) songs.delete(key);
    }
}, 200);
