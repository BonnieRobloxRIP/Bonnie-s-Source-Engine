import { world } from "@minecraft/server";
import { createMarkerType } from "./core/block_markers.js";
import { MENU_CAMERA_SPOT, SAVED_CAMERA_SPOT } from "./menu_room.js";

// The original renders its 3D school behind the main menu; here the menu looks at the front yard
// (menu_room.js). A brr:menu_camera marker sets where the camera sits, and the way its placer was
// looking when they placed it sets where it points.
const MARKER_ID = "brr:menu_camera";
const VIEWS_PROPERTY = "brr:menu_camera_views";
const marker = createMarkerType(MARKER_ID, "brr:menu_camera_spots");

function views() {
    try { return JSON.parse(world.getDynamicProperty(VIEWS_PROPERTY) ?? "{}"); } catch { return {}; }
}

function viewKey(dimensionId, location) {
    return `${dimensionId}:${location.x},${location.y},${location.z}`;
}

export function registerMenuCameraComponents(blockComponentRegistry) {
    blockComponentRegistry.registerCustomComponent("brr:menu_camera", marker.component);
}

export function startMenuCamera() {
    world.afterEvents.playerPlaceBlock.subscribe(({ block, player, dimension }) => {
        if (block.typeId !== MARKER_ID) return;
        const rotation = player.getRotation();
        const all = views();
        all[viewKey(dimension.id, block.location)] = { pitch: rotation.x, yaw: rotation.y };
        world.setDynamicProperty(VIEWS_PROPERTY, JSON.stringify(all));
        player.sendMessage("§7Main menu camera placed. It looks the way you were looking.");
    });
}

// the yard's camera when it's there; otherwise the nearest marker placed by hand
function cameraSpot(player) {
    const overworld = world.getDimension("overworld");
    let block;
    try { block = overworld.getBlock(MENU_CAMERA_SPOT); } catch { }
    if (block?.typeId === MARKER_ID) return { dimension: overworld, spot: MENU_CAMERA_SPOT };
    const spot = marker.findNearest(player.dimension, player.location);
    return spot && { dimension: player.dimension, spot };
}

// the way a camera points; the yard's was recorded where the yard was saved from, before it moved
function viewOf(dimensionId, spot) {
    const all = views();
    const own = all[viewKey(dimensionId, spot)];
    if (own) return own;
    if (spot === MENU_CAMERA_SPOT) {
        const saved = all[viewKey(dimensionId, SAVED_CAMERA_SPOT)];
        if (saved) {
            all[viewKey(dimensionId, spot)] = saved;
            world.setDynamicProperty(VIEWS_PROPERTY, JSON.stringify(all));
            return saved;
        }
    }
    return { pitch: 0, yaw: 0 };
}

// points the player's camera through the yard's (or the nearest) marker; false when there is none
export function showMenuCamera(player) {
    const found = cameraSpot(player);
    if (!found) return false;
    const { dimension, spot } = found;
    const view = viewOf(dimension.id, spot);
    try {
        player.camera.setCamera("minecraft:free", {
            location: { x: spot.x + 0.5, y: spot.y + 0.5, z: spot.z + 0.5 },
            rotation: { x: view.pitch, y: view.yaw }
        });
        return true;
    } catch {
        return false;
    }
}

export function clearMenuCamera(player) {
    try { player.camera.clear(); } catch { }
}
