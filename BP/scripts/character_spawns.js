import { BlockVolume, system, world } from "@minecraft/server";
import { CHARACTER_STARTS } from "./character_starts_data.js";
import { sendCharacterAction } from "./characters/registry.js";
import { resetWalterLabs } from "./characters/walter.js";
import { meetTutor } from "./beginning.js";
import { SPOOP_NOTEBOOKS } from "./core/game_state.js";
import { isPaused } from "./core/pause.js";
import { highestScore } from "./core/scoreboard.js";
import { MAP_BOUNDS, isMapLoading } from "./map.js";
import { activeRunMode } from "./run.js";

// Characters in Story runs, like the original: every character waits in the school, switched off,
// until spoop mode (the second notebook), when ShowChar() switches them all on where they stand.
// Here "where they stand" is a brr:start_<character> marker in the map (scripts_gen/
// gen_character_starts.mjs). Raldi is the exception: he's there from the start as the tutor, waving,
// and at 2 notebooks he moves to his own marker and starts roaming.
const RALDI = "brr:raldi";
const STATE_PROPERTY = "brr:character_spawns"; // "run" once the run's characters are out, "spoop" after 2 notebooks
const CHECK_TICKS = 10;
const STORY = "story";

let markers; // [{ block, entity, when, location }], found in the placed map
// every marker was found: the map is the same every run, so later runs reuse the search
let markersComplete = false;

function overworld() {
    return world.getDimension("overworld");
}

function findMarkers() {
    const found = [];
    try {
        const volume = new BlockVolume(MAP_BOUNDS.min, MAP_BOUNDS.max);
        const list = overworld().getBlocks(volume, { includeTypes: Object.keys(CHARACTER_STARTS) }, true);
        for (const location of list.getBlockLocationIterator()) {
            const block = overworld().getBlock(location);
            const start = block && CHARACTER_STARTS[block.typeId];
            if (start) found.push({ block: block.typeId, ...start, location: { x: location.x, y: location.y, z: location.z } });
        }
    } catch (error) {
        console.warn(`[spawns] Searching the map for character starts failed: ${error}`);
    }
    markersComplete = true;
    for (const block of Object.keys(CHARACTER_STARTS)) {
        if (found.some((marker) => marker.block === block)) continue;
        markersComplete = false;
        console.warn(`[spawns] No ${block} in the map; that character won't turn up`);
    }
    return found;
}

function stage() {
    return world.getDynamicProperty(STATE_PROPERTY);
}

// spoop mode: everyone is out (2 notebooks)
export function isSpoopMode() {
    return stage() === "spoop";
}

// a fresh map: everyone back to waiting (resetGame removes the characters themselves)
export function resetCharacterSpawns() {
    world.setDynamicProperty(STATE_PROPERTY, undefined);
    if (!markersComplete) markers = undefined;
}

function standOn(location) {
    return { x: location.x + 0.5, y: location.y, z: location.z + 0.5 };
}

function existing(type) {
    try { return overworld().getEntities({ type }); } catch { return []; }
}

function spawn(marker) {
    try { return overworld().spawnEntity(marker.entity, standOn(marker.location)); }
    catch (error) {
        console.warn(`[spawns] Could not spawn ${marker.entity} at ${marker.location.x} ${marker.location.y} ${marker.location.z}: ${error}`);
        return undefined;
    }
}

// the start of a run: Raldi the tutor, waiting to sing his hello when the players come in (beginning.js)
function spawnRunCharacters() {
    for (const marker of markers.filter((entry) => entry.when === "run")) {
        if (existing(marker.entity).length > 0) continue;
        const entity = spawn(marker);
        if (entity && marker.entity === RALDI) meetTutor(entity);
    }
}

// ShowChar(): everyone on their markers. Characters already there (summoned by hand, or Raldi) aren't
// doubled; Raldi walks over from wherever he is to his own spot and starts roaming.
function spawnSpoopCharacters() {
    for (const marker of markers.filter((entry) => entry.when === "spoop")) {
        const present = existing(marker.entity);
        if (marker.entity !== RALDI) {
            if (present.length === 0) spawn(marker);
            continue;
        }
        const raldi = present[0] ?? spawn(marker);
        if (!raldi) continue;
        try { raldi.teleport(standOn(marker.location)); } catch { }
        sendCharacterAction(raldi, "freeroam");
    }
}

export function startCharacterSpawns() {
    system.runInterval(() => {
        if (activeRunMode() !== STORY || isPaused() || isMapLoading()) return;
        const current = stage();
        if (current === "spoop") return;
        markers ??= findMarkers();
        if (current === undefined) {
            resetWalterLabs(overworld(), MAP_BOUNDS);
            spawnRunCharacters();
            world.setDynamicProperty(STATE_PROPERTY, "run");
            return;
        }
        if (highestScore(world.getAllPlayers(), "notebooks") < SPOOP_NOTEBOOKS) return;
        spawnSpoopCharacters();
        world.setDynamicProperty(STATE_PROPERTY, "spoop");
    }, CHECK_TICKS);
}
