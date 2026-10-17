import { system, world, ItemStack, BlockVolume } from "@minecraft/server";
import { PLACEHOLDER_BLOCK_TYPES, isBrushClass, isEntityClass } from "../classes.js";
import {
    addCell,
    createEntity,
    getEntityAt,
    getEntityById,
    isRegistryLoaded,
    mergeEntities,
    removeCellAt,
    setEntityDisabled,
    updateEntityData
} from "../registry.js";
import { syncEntityBlockState } from "./logic.js";
import { forgetCellAppearance } from "./visibility.js";
import { ENTITY_CLASS_TO_ITEM, getEngineSettings, getMainhandTypeId, isPlayerCreative, safeGetDimension } from "../runtime.js";
import { invalidateHeldItem } from "../../handler/core/held_item.js";
import { openToolUIForBlock } from "../../tool_ui/tool_ui_dispatch.js";

// SECTION: Editor
// Placing a tool block next to one of the same type extends that brush (and joins brushes it
// now touches); breaking removes the cell. Interacting opens the entity's property form.

const ADJACENT = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const INTERACT_COOLDOWN_TICKS = 10;

// SECTION: Placement & Breaking
function getAdjacentBrushes(typeId, dimension, cell) {
    const found = [];
    for (const [dx, dy, dz] of ADJACENT) {
        const neighbour = getEntityAt(dimension, cell.x + dx, cell.y + dy, cell.z + dz);
        if (neighbour && neighbour.typeId === typeId && !found.includes(neighbour)) found.push(neighbour);
    }
    return found;
}

function handlePlace({ block }) {
    if (!isRegistryLoaded()) return;
    const typeId = block.typeId;
    if (!isEntityClass(typeId)) return;

    const dimension = block.dimension.id;
    const cell = { x: block.x, y: block.y, z: block.z };
    removeCellAt(dimension, cell.x, cell.y, cell.z);
    forgetCellAppearance(dimension, cell.x, cell.y, cell.z);

    if (isBrushClass(typeId)) {
        const brushes = getAdjacentBrushes(typeId, dimension, cell);
        if (brushes.length > 0) {
            // The largest touching brush keeps its settings; the others join it.
            brushes.sort((a, b) => b.cells.length - a.cells.length);
            addCell(brushes[0], cell);
            if (brushes.length > 1) mergeEntities(brushes[0], brushes.slice(1));
            return;
        }
    }

    const entity = createEntity(typeId, dimension, [cell]);
    syncEntityBlockState(entity);
}

// SECTION: Command Fill
// /brr:block_fill: fills a box with one engine block type and registers it in one go. A brush
// class becomes one brush (joining same-type brushes it touches, which take its settings);
// a point class becomes one entity per block. Returns { count } or { error }.
export const MAX_FILL_BRUSH_CELLS = 32768;
export const MAX_FILL_POINT_CELLS = 256;

export function fillEngineBlocks(typeId, dimensionId, from, to, data) {
    if (!isRegistryLoaded()) return { error: "The engine has not loaded yet." };
    if (!isEntityClass(typeId)) return { error: `${typeId} is not an engine block.` };
    const dimension = safeGetDimension(dimensionId);
    if (!dimension) return { error: "Unknown dimension." };

    const min = { x: Math.floor(Math.min(from.x, to.x)), y: Math.floor(Math.min(from.y, to.y)), z: Math.floor(Math.min(from.z, to.z)) };
    const max = { x: Math.floor(Math.max(from.x, to.x)), y: Math.floor(Math.max(from.y, to.y)), z: Math.floor(Math.max(from.z, to.z)) };
    const count = (max.x - min.x + 1) * (max.y - min.y + 1) * (max.z - min.z + 1);
    const brush = isBrushClass(typeId);
    const limit = brush ? MAX_FILL_BRUSH_CELLS : MAX_FILL_POINT_CELLS;
    if (count > limit) return { error: `Too many blocks (${count}); the limit for this block type is ${limit}.` };

    try {
        dimension.fillBlocks(new BlockVolume(min, max), typeId);
    } catch (error) {
        return { error: `Could not place the blocks (is the area loaded?): ${error?.message ?? error}` };
    }

    const cells = [];
    for (let x = min.x; x <= max.x; x++) {
        for (let y = min.y; y <= max.y; y++) {
            for (let z = min.z; z <= max.z; z++) {
                removeCellAt(dimensionId, x, y, z);
                forgetCellAppearance(dimensionId, x, y, z);
                cells.push({ x, y, z });
            }
        }
    }

    if (!brush) {
        for (const cell of cells) syncEntityBlockState(createEntity(typeId, dimensionId, [cell], data));
        return { count };
    }

    const entity = createEntity(typeId, dimensionId, cells, data);
    const touching = new Set();
    for (const cell of cells) {
        for (const neighbour of getAdjacentBrushes(typeId, dimensionId, cell)) {
            if (neighbour !== entity) touching.add(neighbour);
        }
    }
    if (touching.size > 0) mergeEntities(entity, [...touching]);
    return { count };
}

function handleBreak({ block, brokenBlockPermutation }) {
    if (!isRegistryLoaded()) return;
    const brokenType = brokenBlockPermutation?.type?.id ?? "";
    if (!isEntityClass(brokenType) && !PLACEHOLDER_BLOCK_TYPES.has(brokenType)) return;
    removeCellAt(block.dimension.id, block.x, block.y, block.z);
    forgetCellAppearance(block.dimension.id, block.x, block.y, block.z);
}

// SECTION: Property Form
// Called by the form engine with the edited keyvalues. Saving "recompiles" the entity: fire
// counts reset and the runtime enabled state follows Start Disabled again.
function saveEntityFromForm(entity, nextData) {
    if (getEntityById(entity.id) !== entity) return false;

    for (const connection of Array.isArray(nextData.outputs) ? nextData.outputs : []) {
        delete connection.remaining;
    }
    // Runtime state (counter values, playing sounds...) starts over from the new settings.
    delete nextData.runtime;
    updateEntityData(entity, nextData);
    setEntityDisabled(entity, Boolean(nextData.startDisabled));
    syncEntityBlockState(entity);
    return true;
}

const lastInteractTick = new Map();

// Called from main.js's playerInteractWithBlock before-event once permission checks passed.
export function handleEngineBlockInteract(event) {
    const block = event.block;
    const typeId = block?.typeId;
    if (!isEntityClass(typeId) || !isRegistryLoaded()) return;

    const player = event.player;
    // Sneaking skips the form so tool blocks can be placed against other tool blocks.
    if (player.isSneaking || !getEngineSettings().toolsEnabled) return;

    if (!isPlayerCreative(player)) {
        player.sendMessage("§cOnly players in Creative mode can configure these blocks.");
        event.cancel = true;
        return;
    }

    event.cancel = true;
    const now = system.currentTick;
    if (now - (lastInteractTick.get(player.id) ?? -Infinity) < INTERACT_COOLDOWN_TICKS) return;
    lastInteractTick.set(player.id, now);

    const dimension = block.dimension.id;
    const cell = { x: block.x, y: block.y, z: block.z };
    system.run(() => {
        let entity = getEntityAt(dimension, cell.x, cell.y, cell.z);
        if (!entity || entity.typeId !== typeId) {
            removeCellAt(dimension, cell.x, cell.y, cell.z);
            entity = createEntity(typeId, dimension, [cell]);
        }
        openToolUIForBlock(player, entity, { onSave: saveEntityFromForm });
    });
}

// SECTION: Pick-Block Normalization
// Pick-block on a logic/info block gives the block item; swap it for the placeable item. Pick-block
// selects the slot it fills, so only the held item is checked: it is cached for the tick and shared
// with the other systems, so this costs nothing until someone actually holds a block item.
function normalizePickedItems() {
    for (const player of world.getPlayers()) {
        const itemTypeId = ENTITY_CLASS_TO_ITEM[getMainhandTypeId(player)];
        if (!itemTypeId) continue;
        try {
            const inventory = player.getComponent("minecraft:inventory")?.container;
            const slot = player.selectedSlotIndex;
            const item = inventory?.getItem(slot);
            if (!item || !ENTITY_CLASS_TO_ITEM[item.typeId]) continue;
            inventory.setItem(slot, new ItemStack(itemTypeId, Math.max(1, item.amount)));
            invalidateHeldItem(player);
        } catch { }
    }
}

export function startEditorSystem() {
    world.afterEvents.playerPlaceBlock.subscribe(handlePlace);
    world.afterEvents.playerBreakBlock.subscribe(handleBreak);
    world.afterEvents.playerLeave.subscribe(({ playerId }) => lastInteractTick.delete(playerId));
    system.runInterval(normalizePickedItems, 5);
}
