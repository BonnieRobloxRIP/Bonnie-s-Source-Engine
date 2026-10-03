import { BlockPermutation, system, world } from "@minecraft/server";

// SECTION: Build Tool Constants
export const ITEM_ENGINE_LOCATOR = "brr:engine_locator";
export const ITEM_BUILD_DESTROY = "brr:builder_destroy";
export const ITEM_BUILD_COPY = "brr:builder_copy";
export const ITEM_BUILD_FILL = "brr:builder_fill";
export const ITEM_BUILD_DISPLACE = "brr:builder_displace";
export const ITEM_BUILD_SHAPE = "brr:builder_shape";
export const ITEM_BUILD_ROTATE = "brr:builder_rotate";

export const BUILD_TOOL_ITEMS = new Set([ITEM_BUILD_DESTROY, ITEM_BUILD_COPY, ITEM_BUILD_FILL]);
export const ADVANCED_BUILD_TOOL_ITEMS = new Set([ITEM_BUILD_DISPLACE, ITEM_BUILD_SHAPE, ITEM_BUILD_ROTATE]);
export const ALL_BUILD_TOOL_ITEMS = new Set([...BUILD_TOOL_ITEMS, ...ADVANCED_BUILD_TOOL_ITEMS]);
export const AIR_BLOCKS = new Set(["minecraft:air", "minecraft:cave_air", "minecraft:void_air"]);
export const ALWAYS_REPLACEABLE = new Set([
    "minecraft:air",
    "minecraft:cave_air",
    "minecraft:void_air",
    "minecraft:tallgrass",
    "minecraft:double_plant",
    "minecraft:yellow_flower",
    "minecraft:red_flower",
    "minecraft:waterlily",
    "minecraft:snow_layer",
    "minecraft:vine",
    "minecraft:deadbush",
    "minecraft:seagrass",
    "minecraft:tall_seagrass",
    "minecraft:kelp",
    "minecraft:kelp_plant"
]);

export const MAX_SELECTION_VOLUME = 8192;
export const MAX_COPY_VOLUME = 8192;
export const PREVIEW_OUTLINE_PARTICLE = "brr:builder_controller";
export const PREVIEW_MAX_PARTICLES = 240;
export const PROTECTED_BLOCKS = new Set(["minecraft:bedrock", "minecraft:end_gateway", "minecraft:end_portal", "minecraft:allow"]);
export const FILL_UNHOLD_RESET_DISTANCE = 64;
const LIQUID_BLOCKS = new Set(["minecraft:water", "minecraft:flowing_water", "minecraft:lava", "minecraft:flowing_lava"]);

// SECTION: Build Tool Runtime State
export const selectionByPlayer = new Map();
export const clipboardByPlayer = new Map();
export const fillMaterialByPlayer = new Map();
export const actionCooldownByPlayer = new Map();
export const locatorBusyByPlayer = new Set();
export const lastHeldBuildToolByPlayer = new Map();
export const terrainSettingsByPlayer = new Map();
export const shapeSettingsByPlayer = new Map();
export const rotateSettingsByPlayer = new Map();
export const shapePreviewByPlayer = new Map();
export const flattenTargetHeightByPlayer = new Map();

// SECTION: Shared Helpers
export function getMainhandTypeId(player) {
    const equippable = player?.getComponent("minecraft:equippable");
    return `${equippable?.getEquipment("Mainhand")?.typeId ?? ""}`;
}

export function getHeldTypeId(player, eventItemStack = null) {
    const fromEvent = `${eventItemStack?.typeId ?? ""}`.trim();
    if (fromEvent) return fromEvent;
    return getMainhandTypeId(player).trim();
}

export function getOffhandTypeId(player) {
    const equippable = player?.getComponent("minecraft:equippable");
    return `${equippable?.getEquipment("Offhand")?.typeId ?? ""}`;
}

export function getCurrentTick() {
    return Math.floor(Date.now() / 50);
}

export function isActionReady(playerId, actionKey, minDeltaTicks = 2) {
    const tick = getCurrentTick();
    const key = `${playerId}|${actionKey}`;
    const previousTick = actionCooldownByPlayer.get(key) ?? -999999;
    if ((tick - previousTick) < minDeltaTicks) return false;
    actionCooldownByPlayer.set(key, tick);
    return true;
}

export function cloneVec3(v) {
    return {
        x: Math.floor(v?.x ?? 0),
        y: Math.floor(v?.y ?? 0),
        z: Math.floor(v?.z ?? 0)
    };
}

// SECTION: Geometry Helpers
export function yawToFacingIndex(yaw) {
    const normalized = ((Number(yaw) % 360) + 360) % 360;
    return Math.round(normalized / 90) % 4;
}

export function rotateOffset(dx, dz, turns) {
    switch (turns & 3) {
        case 0: return { dx, dz };
        case 1: return { dx: -dz, dz: dx };
        case 2: return { dx: -dx, dz: -dz };
        default: return { dx: dz, dz: -dx };
    }
}

export function rotateCardinalState(states, key, turns) {
    const order = ["south", "west", "north", "east"];
    const value = `${states?.[key] ?? ""}`.toLowerCase();
    const index = order.indexOf(value);
    if (index === -1) return;
    states[key] = order[(index + turns) & 3];
}

export function rotateBlockStates(states, turns) {
    if (!states || !turns) return states ?? {};

    const next = { ...states };
    if (typeof next.direction === "number") next.direction = (next.direction + turns) & 3;
    if (typeof next.weirdo_direction === "number") {
        const remap = [0, 2, 1, 3];
        const reverse = [0, 2, 1, 3];
        const pos = reverse[next.weirdo_direction] ?? 0;
        next.weirdo_direction = remap[(pos + turns) & 3];
    }
    rotateCardinalState(next, "minecraft:cardinal_direction", turns);
    rotateCardinalState(next, "torch_facing_direction", turns);
    rotateCardinalState(next, "minecraft:block_face", turns);

    if (typeof next.ground_sign_direction === "number") {
        next.ground_sign_direction = (next.ground_sign_direction + (turns * 4)) % 16;
    }

    return next;
}

// SECTION: Selection Helpers
export function getSelection(playerId) {
    if (!selectionByPlayer.has(playerId)) {
        selectionByPlayer.set(playerId, { pos1: null, pos2: null });
    }
    return selectionByPlayer.get(playerId);
}

export function setSelectionCorner(player, blockLocation) {
    const playerId = `${player?.id ?? ""}`;
    if (!playerId) return;

    const state = getSelection(playerId);
    const location = cloneVec3(blockLocation);

    if (!state.pos1 || (state.pos1 && state.pos2)) {
        state.pos1 = location;
        state.pos2 = null;
        fillMaterialByPlayer.delete(playerId);
        player.sendMessage(`§7Selection corner 1 set to §f${location.x}, ${location.y}, ${location.z}`);
        return;
    }

    state.pos2 = location;
    const volume = getSelectionVolume(state.pos1, state.pos2);
    player.sendMessage(`§7Selection corner 2 set to §f${location.x}, ${location.y}, ${location.z} §7(${volume} blocks)`);
}

export function getSelectionBounds(pos1, pos2) {
    return {
        min: {
            x: Math.min(pos1.x, pos2.x),
            y: Math.min(pos1.y, pos2.y),
            z: Math.min(pos1.z, pos2.z)
        },
        max: {
            x: Math.max(pos1.x, pos2.x),
            y: Math.max(pos1.y, pos2.y),
            z: Math.max(pos1.z, pos2.z)
        }
    };
}

export function getSelectionVolume(pos1, pos2) {
    const bounds = getSelectionBounds(pos1, pos2);
    const sizeX = (bounds.max.x - bounds.min.x) + 1;
    const sizeY = (bounds.max.y - bounds.min.y) + 1;
    const sizeZ = (bounds.max.z - bounds.min.z) + 1;
    return sizeX * sizeY * sizeZ;
}

export function getLookedBlockLocation(player, maxDistance = 96) {
    try {
        const hit = player.getBlockFromViewDirection({
            maxDistance,
            includePassableBlocks: false
        });
        if (hit?.block?.location) return cloneVec3(hit.block.location);
    } catch { }

    return null;
}

export function makeBoundsFromCorners(pos1, pos2) {
    return {
        min: {
            x: Math.min(pos1.x, pos2.x),
            y: Math.min(pos1.y, pos2.y),
            z: Math.min(pos1.z, pos2.z)
        },
        max: {
            x: Math.max(pos1.x, pos2.x),
            y: Math.max(pos1.y, pos2.y),
            z: Math.max(pos1.z, pos2.z)
        }
    };
}

// SECTION: Preview Helpers
export function addUniquePosition(targetArray, seen, x, y, z) {
    const key = `${x}|${y}|${z}`;
    if (seen.has(key)) return;
    seen.add(key);
    targetArray.push({ x, y, z });
}

export function buildBoundingBoxEdges(bounds, step = 1) {
    const edges = [];
    const { min, max } = bounds;
    const seen = new Set();

    const addEdge = (x, y, z) => {
        const key = `${x}|${y}|${z}`;
        if (!seen.has(key)) {
            seen.add(key);
            edges.push({ x, y, z });
        }
    };

    const safeStep = Math.max(1, Math.floor(step));
    const addAxisLine = (start, end) => {
        const dx = Math.sign(end.x - start.x);
        const dy = Math.sign(end.y - start.y);
        const dz = Math.sign(end.z - start.z);
        const length = Math.max(
            Math.abs(end.x - start.x),
            Math.abs(end.y - start.y),
            Math.abs(end.z - start.z)
        );

        for (let i = 0; i <= length; i += safeStep) {
            addEdge(start.x + (dx * i), start.y + (dy * i), start.z + (dz * i));
        }

        // Always include exact endpoint when length is not divisible by step.
        addEdge(end.x, end.y, end.z);
    };

    addAxisLine({ x: min.x, y: min.y, z: min.z }, { x: max.x, y: min.y, z: min.z });
    addAxisLine({ x: min.x, y: max.y, z: min.z }, { x: max.x, y: max.y, z: min.z });
    addAxisLine({ x: min.x, y: min.y, z: max.z }, { x: max.x, y: min.y, z: max.z });
    addAxisLine({ x: min.x, y: max.y, z: max.z }, { x: max.x, y: max.y, z: max.z });

    addAxisLine({ x: min.x, y: min.y, z: min.z }, { x: min.x, y: max.y, z: min.z });
    addAxisLine({ x: max.x, y: min.y, z: min.z }, { x: max.x, y: max.y, z: min.z });
    addAxisLine({ x: min.x, y: min.y, z: max.z }, { x: min.x, y: max.y, z: max.z });
    addAxisLine({ x: max.x, y: min.y, z: max.z }, { x: max.x, y: max.y, z: max.z });

    addAxisLine({ x: min.x, y: min.y, z: min.z }, { x: min.x, y: min.y, z: max.z });
    addAxisLine({ x: max.x, y: min.y, z: min.z }, { x: max.x, y: min.y, z: max.z });
    addAxisLine({ x: min.x, y: max.y, z: min.z }, { x: min.x, y: max.y, z: max.z });
    addAxisLine({ x: max.x, y: max.y, z: min.z }, { x: max.x, y: max.y, z: max.z });

    return edges;
}

export function showSelectionPreview(player, pos1, pos2, isDynamic = false) {
    const bounds = makeBoundsFromCorners(pos1, pos2);
    const volume = getSelectionVolume(pos1, pos2);
    const sizeX = (bounds.max.x - bounds.min.x) + 1;
    const sizeY = (bounds.max.y - bounds.min.y) + 1;
    const sizeZ = (bounds.max.z - bounds.min.z) + 1;

    const showFilledPreview = volume <= 42 && sizeX > 1 && sizeY > 1 && sizeZ > 1;
    const edgePreviewPositions = [];

    if (showFilledPreview) {
        for (let x = bounds.min.x; x <= bounds.max.x; x++) {
            for (let y = bounds.min.y; y <= bounds.max.y; y++) {
                for (let z = bounds.min.z; z <= bounds.max.z; z++) {
                    edgePreviewPositions.push({ x, y, z });
                }
            }
        }
    } else {
        edgePreviewPositions.push(...buildBoundingBoxEdges(bounds, 1));
    }

    for (const pos of edgePreviewPositions) {
        try {
            player.dimension.spawnParticle(PREVIEW_OUTLINE_PARTICLE, {
                x: pos.x + 0.5,
                y: pos.y + 0.5,
                z: pos.z + 0.5
            });
        } catch { }
    }

    player.onScreenDisplay.setActionBar(
        `§fSelection: §b${sizeX}x${sizeY}x${sizeZ} §7(§f${volume}§7)${isDynamic ? " §8- §7Sneak + click to confirm" : ""}`
    );
}

export function getSelectionState(player) {
    const playerId = `${player?.id ?? ""}`;
    if (!playerId) return null;

    const state = getSelection(playerId);
    if (!state?.pos1 || !state?.pos2) {
        player.sendMessage("§cSelection incomplete. Sneak + use this tool on two blocks to set corners.");
        return null;
    }

    const volume = getSelectionVolume(state.pos1, state.pos2);
    if (volume > MAX_SELECTION_VOLUME) {
        player.sendMessage(`§cSelection too large (${volume}). Max allowed is ${MAX_SELECTION_VOLUME}.`);
        return null;
    }

    return {
        pos1: state.pos1,
        pos2: state.pos2,
        bounds: getSelectionBounds(state.pos1, state.pos2),
        volume
    };
}

export function forEachSelectionBlock(selectionState, callback) {
    const { min, max } = selectionState.bounds;

    for (let x = min.x; x <= max.x; x++) {
        for (let y = min.y; y <= max.y; y++) {
            for (let z = min.z; z <= max.z; z++) {
                callback({ x, y, z });
            }
        }
    }
}

export function setSafeBlockType(dimension, pos, typeId) {
    try {
        const current = dimension.getBlock(pos);
        const currentTypeId = `${current?.typeId ?? "minecraft:air"}`;
        if (PROTECTED_BLOCKS.has(currentTypeId)) return false;
        dimension.setBlockType(pos, typeId);
        return true;
    } catch {
        return false;
    }
}

export function findSurfaceY(dimension, x, z, aroundY, range = 28) {
    const top = Math.min(319, aroundY + range);
    const bottom = Math.max(-64, aroundY - range);

    for (let y = top; y >= bottom; y--) {
        let block;
        let above;
        try {
            block = dimension.getBlock({ x, y, z });
            above = dimension.getBlock({ x, y: y + 1, z });
        } catch {
            continue;
        }

        const typeId = `${block?.typeId ?? "minecraft:air"}`;
        const aboveTypeId = `${above?.typeId ?? "minecraft:air"}`;
        const isLiquid = LIQUID_BLOCKS.has(typeId);
        const aboveIsOpen = AIR_BLOCKS.has(aboveTypeId) || LIQUID_BLOCKS.has(aboveTypeId);
        if (!AIR_BLOCKS.has(typeId) && !isLiquid && aboveIsOpen) {
            return y;
        }
    }

    return null;
}

export function isWithinBounds(pos, bounds) {
    if (!bounds) return false;
    return pos.x >= bounds.min.x && pos.x <= bounds.max.x
        && pos.y >= bounds.min.y && pos.y <= bounds.max.y
        && pos.z >= bounds.min.z && pos.z <= bounds.max.z;
}

export function getPointsBounds(points) {
    if (!points?.length) {
        return {
            min: { x: 0, y: 0, z: 0 },
            max: { x: 0, y: 0, z: 0 }
        };
    }

    const min = { x: points[0].x, y: points[0].y, z: points[0].z };
    const max = { x: points[0].x, y: points[0].y, z: points[0].z };
    for (const p of points) {
        if (p.x < min.x) min.x = p.x;
        if (p.y < min.y) min.y = p.y;
        if (p.z < min.z) min.z = p.z;
        if (p.x > max.x) max.x = p.x;
        if (p.y > max.y) max.y = p.y;
        if (p.z > max.z) max.z = p.z;
    }

    return { min, max };
}

export function addUniquePoint(target, seen, x, y, z) {
    const key = `${x}|${y}|${z}`;
    if (seen.has(key)) return;
    seen.add(key);
    target.push({ x, y, z });
}