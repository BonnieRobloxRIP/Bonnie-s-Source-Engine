import { Direction, GameMode, ItemStack, system, world } from "@minecraft/server";
import { playWorldSound } from "./player_settings.js";
import { isOutOfReach } from "../anticheat/common.js";

// SECTION: Custom Slabs & Stairs
// Custom blocks don't merge into double slabs or bend into stair corners by themselves, so this does
// it for every brr:..._slab and brr:..._stairs block (made by tools/dev_blocks/make_variants.mjs;
// block format 1.26.50 rejects "tag:" components, so they're known by id).
// Only what players place and break is followed: blocks set by /fill, /clone or structures keep
// whatever shape they were given.

const isCustomSlab = typeId => typeof typeId === "string" && typeId.startsWith("brr:") && typeId.endsWith("_slab");
const isCustomStairs = typeId => typeof typeId === "string" && typeId.startsWith("brr:") && typeId.endsWith("_stairs");
const DOUBLE = "brr:double";
const HALF = "minecraft:vertical_half";
const DIRECTION = "minecraft:cardinal_direction";
const SHAPE = "brr:shape";
const PLACE_SOUND = "use.stone";
const SOUND_RANGE = 16;

// brr:shape values, in the generator's order.
const STRAIGHT = 0;
const INNER_LEFT = 1;
const INNER_RIGHT = 2;
const OUTER_LEFT = 3;
const OUTER_RIGHT = 4;

const OFFSETS = {
    north: { x: 0, y: 0, z: -1 },
    south: { x: 0, y: 0, z: 1 },
    east: { x: 1, y: 0, z: 0 },
    west: { x: -1, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
    down: { x: 0, y: -1, z: 0 }
};
const FACE_NAMES = {
    [Direction.North]: "north",
    [Direction.South]: "south",
    [Direction.East]: "east",
    [Direction.West]: "west",
    [Direction.Up]: "up",
    [Direction.Down]: "down"
};
// Seen from above; left is counter-clockwise, as in Java's StairBlock.
const LEFT = { north: "west", west: "south", south: "east", east: "north" };
const OPPOSITE = { north: "south", south: "north", east: "west", west: "east" };
const AXIS = { north: "z", south: "z", east: "x", west: "x" };
// Vanilla stairs' weirdo_direction.
const WEIRDO_DIRECTIONS = ["east", "west", "south", "north"];

function neighbour(block, side) {
    try {
        return block.offset(OFFSETS[side]);
    } catch {
        return undefined;
    }
}

// SECTION: Double Slabs
// Using a slab on the matching half of the same slab, or placing one into a cell that holds the
// other half, fills the cell instead of placing a new block.
function slabHalfPlaced(face, faceLocation) {
    if (face === "up") return "bottom";
    if (face === "down") return "top";
    return faceLocation.y - Math.floor(faceLocation.y) > 0.5 ? "top" : "bottom";
}

function isSingleSlab(block, typeId) {
    return block?.typeId === typeId && isCustomSlab(typeId) && !block.permutation.getState(DOUBLE);
}

function findMergeTarget(block, faceName, faceLocation, typeId) {
    if (isSingleSlab(block, typeId)) {
        const half = block.permutation.getState(HALF);
        if ((half === "bottom" && faceName === "up") || (half === "top" && faceName === "down")) return block;
    }
    const target = neighbour(block, faceName);
    if (isSingleSlab(target, typeId) && target.permutation.getState(HALF) !== slabHalfPlaced(faceName, faceLocation)) {
        return target;
    }
    return undefined;
}

function useOneFromHand(player, typeId) {
    if (player.getGameMode() === GameMode.Creative) return;
    const container = player.getComponent("minecraft:inventory")?.container;
    const item = container?.getItem(player.selectedSlotIndex);
    if (!container || item?.typeId !== typeId) return;
    if (item.amount > 1) {
        item.amount--;
        container.setItem(player.selectedSlotIndex, item);
    } else {
        container.setItem(player.selectedSlotIndex, undefined);
    }
}

function mergeSlab(player, dimension, location, typeId) {
    const block = dimension.getBlock(location);
    if (!isSingleSlab(block, typeId)) return;
    block.setPermutation(block.permutation.withState(DOUBLE, true));
    useOneFromHand(player, typeId);
    const center = { x: location.x + 0.5, y: location.y + 0.5, z: location.z + 0.5 };
    playWorldSound(dimension, PLACE_SOUND, center, { volume: 1, pitch: 0.8 }, SOUND_RANGE);
}

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    if (event.cancel) return;
    const { player, block, itemStack } = event;
    const typeId = itemStack?.typeId;
    if (!typeId || !player || !block) return;

    let target;
    try {
        target = findMergeTarget(block, FACE_NAMES[event.blockFace], event.faceLocation, typeId);
    } catch {
        return;
    }
    if (!target) return;

    const mode = player.getGameMode();
    if (mode !== GameMode.Creative && mode !== GameMode.Survival) return;
    // Same reach limit as placing a block (anticheat/blocks.js).
    if (isOutOfReach(player, target)) return;

    // Holding the button refires this event; only the first press merges, and the repeats are
    // still cancelled so they don't place a second slab beside the one being merged.
    event.cancel = true;
    if (event.isFirstEvent === false) return;
    const { dimension } = target;
    const location = { x: target.x, y: target.y, z: target.z };
    system.run(() => mergeSlab(player, dimension, location, typeId));
});

// A double slab is two slabs: survival gets the second one back.
world.afterEvents.playerBreakBlock.subscribe(({ player, block, brokenBlockPermutation }) => {
    try {
        if (!isCustomSlab(brokenBlockPermutation.type.id) || !brokenBlockPermutation.getState(DOUBLE)) return;
        if (player.getGameMode() !== GameMode.Survival) return;
        const center = { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 };
        block.dimension.spawnItem(new ItemStack(brokenBlockPermutation.type.id, 1), center);
    } catch { }
});

// SECTION: Stair Corners
// The corner rules of Java's StairBlock. Vanilla stairs count as neighbours, so a custom stair
// bends to meet them (they don't bend back: Bedrock shapes its own stairs).
function readStair(block) {
    if (!block) return undefined;
    try {
        const permutation = block.permutation;
        if (isCustomStairs(block.typeId)) {
            return { facing: permutation.getState(DIRECTION), half: permutation.getState(HALF) };
        }
        if (!block.typeId.endsWith("_stairs")) return undefined;
        const states = permutation.getAllStates();
        const facing = typeof states.weirdo_direction === "number"
            ? WEIRDO_DIRECTIONS[states.weirdo_direction]
            : states[DIRECTION];
        if (!facing) return undefined;
        return { facing, half: states.upside_down_bit ? "top" : "bottom" };
    } catch {
        return undefined;
    }
}

function canTakeShape(block, stair, side) {
    const other = readStair(neighbour(block, side));
    return !other || other.facing !== stair.facing || other.half !== stair.half;
}

function stairShape(block, stair) {
    const front = readStair(neighbour(block, stair.facing));
    if (front && front.half === stair.half && AXIS[front.facing] !== AXIS[stair.facing]
        && canTakeShape(block, stair, OPPOSITE[front.facing])) {
        return front.facing === LEFT[stair.facing] ? OUTER_LEFT : OUTER_RIGHT;
    }
    const back = readStair(neighbour(block, OPPOSITE[stair.facing]));
    if (back && back.half === stair.half && AXIS[back.facing] !== AXIS[stair.facing]
        && canTakeShape(block, stair, back.facing)) {
        return back.facing === LEFT[stair.facing] ? INNER_LEFT : INNER_RIGHT;
    }
    return STRAIGHT;
}

function updateStair(block) {
    if (!block || !isCustomStairs(block.typeId)) return;
    try {
        const stair = readStair(block);
        const shape = stairShape(block, stair);
        if (block.permutation.getState(SHAPE) !== shape) {
            block.setPermutation(block.permutation.withState(SHAPE, shape));
        }
    } catch { }
}

// A stair's shape only reads the four cells beside it, so a change only reaches those four.
function updateStairsAround(block, includeSelf) {
    if (includeSelf) updateStair(block);
    for (const side of ["north", "south", "east", "west"]) updateStair(neighbour(block, side));
}

world.afterEvents.playerPlaceBlock.subscribe(({ block }) => {
    if (readStair(block)) updateStairsAround(block, true);
});

world.afterEvents.playerBreakBlock.subscribe(({ block, brokenBlockPermutation }) => {
    try {
        if (!brokenBlockPermutation.type.id.endsWith("_stairs")) return;
    } catch {
        return;
    }
    updateStairsAround(block, false);
});
