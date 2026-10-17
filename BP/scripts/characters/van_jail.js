import { createMarkerType } from "../core/block_markers.js";

const vanJailSpots = createMarkerType("brr:chipfloke_van_tp", "brr:van_jail_spots");

export function findVanJailSpot(dimension, near) {
    return vanJailSpots.findNearest(dimension, near);
}

export function registerVanJailComponents(registry) {
    registry.registerCustomComponent("brr:van_jail_spot", vanJailSpots.component);
}
