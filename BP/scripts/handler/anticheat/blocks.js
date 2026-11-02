import { world, system, GameMode } from "@minecraft/server";
import { canSeeBlock, describeBlock, getGameMode, isOutOfReach, reportBlocked } from "./common.js";
import { allowSignEdit } from "./signs.js";

// SECTION: Breaking (Ore Miner, Auto Mine, Highway Builder, extended block reach)
// Breaking through walls or from far away is cancelled, and so is survival breaking a block
// survival can't break at all. Breaking speed isn't checked: lag can make it look wrong.

const UNBREAKABLE_IN_SURVIVAL = new Set([
    "minecraft:bedrock",
    "minecraft:barrier",
    "minecraft:invisible_bedrock",
    "minecraft:border_block",
    "minecraft:allow",
    "minecraft:deny",
    "minecraft:command_block",
    "minecraft:chain_command_block",
    "minecraft:repeating_command_block",
    "minecraft:structure_block",
    "minecraft:jigsaw",
    "minecraft:end_portal_frame"
]);
// A client mining through a wall retries every tick; the same rejected block isn't re-traced for this long.
const REJECT_MEMORY_TICKS = 10;

// playerId -> { x, y, z, tick, check } of the last rejected break.
const lastRejectedBreak = new Map();

function findBreakProblem(player, block) {
    const typeId = block.typeId;
    if (getGameMode(player) === GameMode.Survival
        && (UNBREAKABLE_IN_SURVIVAL.has(typeId) || typeId.startsWith("minecraft:light_block"))) {
        return "Breaking Unbreakable Block";
    }
    if (isOutOfReach(player, block)) return "Break Reach";
    if (!canSeeBlock(player, block)) return "Breaking Through Wall";
    return undefined;
}

world.beforeEvents.playerBreakBlock.subscribe((event) => {
    if (event.cancel) return;

    const { player, block } = event;
    const now = system.currentTick;
    const previous = lastRejectedBreak.get(player.id);
    let check;
    if (previous && now - previous.tick <= REJECT_MEMORY_TICKS
        && previous.x === block.x && previous.y === block.y && previous.z === block.z) {
        check = previous.check;
    } else {
        check = findBreakProblem(player, block);
    }
    if (!check) return;

    event.cancel = true;
    lastRejectedBreak.set(player.id, { x: block.x, y: block.y, z: block.z, tick: now, check });
    reportBlocked(player, check, describeBlock(block));
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => lastRejectedBreak.delete(playerId));

// SECTION: Opening Containers & Signs (Container Ghost Hand)
// Only containers and signs: opening other blocks through a wall gains nothing. A sign that passes
// is unlocked for editing (see signs.js).

const CONTAINERS_WITHOUT_INVENTORY = new Set(["minecraft:ender_chest"]);

function interactionKind(block) {
    if (block.getComponent("minecraft:sign")) return "Sign";
    if (block.getComponent("minecraft:inventory") || CONTAINERS_WITHOUT_INVENTORY.has(block.typeId)) return "Container";
    return undefined;
}

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    if (event.cancel) return;

    const { player, block } = event;
    const kind = interactionKind(block);
    if (!kind) return;

    let problem;
    if (isOutOfReach(player, block)) problem = "Reach";
    else if (!canSeeBlock(player, block)) problem = "Through Wall";

    if (!problem) {
        if (kind === "Sign") allowSignEdit(block);
        return;
    }

    event.cancel = true;
    if (event.isFirstEvent) reportBlocked(player, `Opening ${kind} ${problem}`, describeBlock(block));
});

// SECTION: Placing (AirPlace, Anchor Aura air place, extended block reach)
// Vanilla always places against a block (or water, for lily pads), so the new block always has a
// neighbour. Placement isn't checked for line of sight: bridging places against faces you can't see.

const NEIGHBOUR_OFFSETS = [
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: -1, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: -1 }
];

// The cell itself counts too (placing into water or tall grass replaces it).
function hasSupport(block) {
    if (!block.isAir) return true;
    for (const offset of NEIGHBOUR_OFFSETS) {
        try {
            const neighbour = block.offset(offset);
            // An unloaded neighbour counts: it can't be checked.
            if (!neighbour || !neighbour.isAir) return true;
        } catch {
            return true;
        }
    }
    return false;
}

world.beforeEvents.playerPlaceBlock.subscribe((event) => {
    if (event.cancel) return;

    const { player, block } = event;
    let check;
    if (!hasSupport(block)) check = "Air Place";
    else if (isOutOfReach(player, block)) check = "Place Reach";
    if (!check) return;

    event.cancel = true;
    reportBlocked(player, check, `at ${block.x} ${block.y} ${block.z}`);
});
