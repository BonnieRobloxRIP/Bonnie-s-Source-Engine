import { world } from "@minecraft/server";
import { distanceSquared } from "./math.js";

// Invisible marker blocks (teleport destinations) remember where they were placed in a world
// dynamic property, so a script can find the nearest one without scanning chunks.
export function createMarkerType(blockTypeId, propertyName) {
    let spots;

    function load() {
        if (spots) return spots;
        try { spots = JSON.parse(world.getDynamicProperty(propertyName) ?? "[]"); } catch { spots = []; }
        return spots;
    }

    function save() {
        world.setDynamicProperty(propertyName, JSON.stringify(spots));
    }

    function indexOf(dimensionId, location) {
        return load().findIndex((spot) => spot.dimensionId === dimensionId
            && spot.x === location.x && spot.y === location.y && spot.z === location.z);
    }

    function add(dimension, location) {
        if (indexOf(dimension.id, location) !== -1) return;
        spots.push({ dimensionId: dimension.id, x: location.x, y: location.y, z: location.z });
        save();
    }

    function remove(dimensionId, location) {
        const index = indexOf(dimensionId, location);
        if (index === -1) return;
        spots.splice(index, 1);
        save();
    }

    function validSpots(dimension) {
        return [...load()].filter((spot) => {
            if (spot.dimensionId !== dimension.id) return false;
            let block;
            try { block = dimension.getBlock(spot); } catch { }
            if (block && block.typeId !== blockTypeId) {
                remove(spot.dimensionId, spot);
                return false;
            }
            return true;
        });
    }

    return {
        findRandom(dimension) {
            const candidates = validSpots(dimension);
            const spot = candidates[Math.floor(Math.random() * candidates.length)];
            return spot && { x: spot.x, y: spot.y, z: spot.z };
        },
        // nearest marker in the dimension; stale entries (block gone) are dropped on the way
        findNearest(dimension, near) {
            const candidates = load()
                .filter((spot) => spot.dimensionId === dimension.id)
                .sort((a, b) => distanceSquared(a, near) - distanceSquared(b, near));
            for (const spot of candidates) {
                let block;
                try { block = dimension.getBlock(spot); } catch { }
                // unloaded chunks can't be verified, trust the saved entry
                if (block && block.typeId !== blockTypeId) {
                    remove(spot.dimensionId, spot);
                    continue;
                }
                return { x: spot.x, y: spot.y, z: spot.z };
            }
            return undefined;
        },
        component: {
            onPlace({ block, dimension }) { add(dimension, block.location); },
            onTick({ block, dimension }) { add(dimension, block.location); },
            onPlayerBreak({ block, dimension }) { remove(dimension.id, block.location); }
        }
    };
}
