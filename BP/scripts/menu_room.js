import { system, world } from "@minecraft/server";

// The main menu's backdrop: the school's front yard (BP/structures/menu_background, 25x5x29, with a
// brr:menu_camera marker in it), placed away from the Story map so it can't be seen from the school
// (past most render distances), but close enough to stay loaded. Players sit in it while they're in
// the menu, invisible, behind the camera: the map itself is gone between games (map.js unloadMap).
const STRUCTURE_ID = "mystructure:menu_background";
// south of the map (which ends at z 12), at the height the yard was built at
export const MENU_ROOM_ORIGIN = { x: -19, y: 29, z: 180 };
const SIZE = { x: 25, y: 5, z: 29 };
const CAMERA_OFFSET = { x: 20, y: 3, z: 25 };
// where the structure was saved from: its camera's view was recorded there (menu_camera.js)
const SAVED_ORIGIN = { x: -19, y: 29, z: 40 };
// open yard behind and beside the camera, out of its view
const HOLD_OFFSET = { x: 21, y: 1, z: 26 };
const TICKING_AREA = "raldi_menu_room";
const RETRY_TICKS = 10;
const CAMERA_BLOCK = "brr:menu_camera";
// long enough to outlast any stay in the menu; renewed each time it opens
const INVISIBLE_TICKS = 20 * 60 * 60 * 6;

const add = (origin, offset) => ({ x: origin.x + offset.x, y: origin.y + offset.y, z: origin.z + offset.z });
export const MENU_CAMERA_SPOT = add(MENU_ROOM_ORIGIN, CAMERA_OFFSET);
// the same camera where the structure was saved, for the view recorded when it was placed by hand
export const SAVED_CAMERA_SPOT = add(SAVED_ORIGIN, CAMERA_OFFSET);
const HOLD_SPOT = add(MENU_ROOM_ORIGIN, HOLD_OFFSET);
// where the MrBeast battle builds its stage (at the top of the world, beast_battle.js): above the
// yard's middle, inside its ticking area, nowhere near the map or its pillars
export const BATTLE_STAGE_SPOT = { x: MENU_ROOM_ORIGIN.x + Math.floor(SIZE.x / 2), y: MENU_ROOM_ORIGIN.y, z: MENU_ROOM_ORIGIN.z + Math.floor(SIZE.z / 2) };

let retrying;
const held = new Set(); // ids of players waiting in the yard

function overworld() {
    return world.getDimension("overworld");
}

function ensureTickingArea() {
    const to = add(MENU_ROOM_ORIGIN, { x: SIZE.x - 1, y: 0, z: SIZE.z - 1 });
    try { overworld().runCommand(`tickingarea add ${MENU_ROOM_ORIGIN.x} 0 ${MENU_ROOM_ORIGIN.z} ${to.x} 0 ${to.z} ${TICKING_AREA} true`); } catch {
        // already there
    }
}

// true once the yard is down (or can't be: the structure is missing); false while unloaded
function placeRoom() {
    let block;
    try { block = overworld().getBlock(MENU_CAMERA_SPOT); } catch { }
    if (!block) return false;
    if (block.typeId === CAMERA_BLOCK) return true;
    if (!world.structureManager.get(STRUCTURE_ID)) {
        console.warn(`[menu] Structure ${STRUCTURE_ID} is missing from the behavior pack`);
        return true;
    }
    try {
        world.structureManager.place(STRUCTURE_ID, overworld(), MENU_ROOM_ORIGIN, { includeEntities: false });
        return true;
    } catch (error) {
        console.warn(`[menu] Could not place the menu yard: ${error}`);
        return false;
    }
}

// newcomers start in the yard too (they boot into the menu); the map may not be there between games
function makeWorldSpawn() {
    try { world.setDefaultSpawnLocation(HOLD_SPOT); } catch { }
}

// puts the yard down if it isn't there yet, retrying until its chunks have loaded
export function ensureMenuRoom() {
    ensureTickingArea();
    if (placeRoom()) {
        makeWorldSpawn();
        return;
    }
    if (retrying !== undefined) return;
    retrying = system.runInterval(() => {
        if (!placeRoom()) return;
        system.clearRun(retrying);
        retrying = undefined;
        makeWorldSpawn();
        // anyone sent here before it was down has been falling: back onto the grass
        for (const player of world.getAllPlayers()) {
            if (held.has(player.id)) holdInMenuRoom(player);
        }
    }, RETRY_TICKS);
}

// a player in the menu waits in the yard, out of sight of everyone's menu camera
export function holdInMenuRoom(player) {
    held.add(player.id);
    const spot = { x: HOLD_SPOT.x + 0.5, y: HOLD_SPOT.y, z: HOLD_SPOT.z + 0.5 };
    try {
        player.teleport(spot, { dimension: overworld() });
        player.addEffect("invisibility", INVISIBLE_TICKS, { showParticles: false });
        // a respawn while in the menu comes back here, not over the empty map
        player.setSpawnPoint({ ...spot, dimension: overworld() });
    } catch { }
}

// leaving the menu for a run (which takes them to the map's spawn itself)
export function releaseFromMenuRoom(player) {
    held.delete(player.id);
    try { player.removeEffect("invisibility"); } catch { }
}

world.afterEvents.playerLeave.subscribe(({ playerId }) => held.delete(playerId));
system.run(ensureMenuRoom);
