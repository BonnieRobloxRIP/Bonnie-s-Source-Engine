import { system, world } from "@minecraft/server";
import { invalidateBlock } from "./block_cache.js";

// light block key -> id of the entity it follows; unclaimed or abandoned lights remove themselves
const claims = new Map();
const MAX_OWNER_DISTANCE_SQUARED = 4 * 4;

function keyOf(dimension, location) {
    return `${dimension.id}:${location.x},${location.y},${location.z}`;
}

export function claimLight(dimension, location, ownerId) {
    claims.set(keyOf(dimension, location), ownerId);
}

export function releaseLight(dimension, location) {
    claims.delete(keyOf(dimension, location));
}

function ownerNearby(ownerId, dimension, location) {
    let owner;
    try { owner = world.getEntity(ownerId); } catch { }
    if (!owner?.isValid || owner.dimension.id !== dimension.id) return false;
    const dx = owner.location.x - (location.x + 0.5);
    const dy = owner.location.y - (location.y + 0.5);
    const dz = owner.location.z - (location.z + 0.5);
    return dx * dx + dy * dy + dz * dz <= MAX_OWNER_DISTANCE_SQUARED;
}

function removeIfAbandoned(block, dimension) {
    const key = keyOf(dimension, block.location);
    const ownerId = claims.get(key);
    if (ownerId !== undefined && ownerNearby(ownerId, dimension, block.location)) return;
    claims.delete(key);
    try {
        if (!block.isValid || !block.typeId.endsWith("_light")) return;
        block.setType("minecraft:air");
        invalidateBlock(dimension, block.location);
    } catch { }
}

export function registerLightComponents(blockComponentRegistry) {
    blockComponentRegistry.registerCustomComponent("brr:script_light", {
        onTick({ block, dimension }) {
            // a tick of grace so a freshly placed light can be claimed first
            system.run(() => removeIfAbandoned(block, dimension));
        }
    });
}
