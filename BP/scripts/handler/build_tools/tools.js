import { ModalFormData } from "@minecraft/server-ui";
import { BlockPermutation, world } from "@minecraft/server";
import {
    ITEM_BUILD_COPY,
    ITEM_BUILD_DESTROY,
    ITEM_BUILD_FILL,
    AIR_BLOCKS,
    BUILD_TOOL_ITEMS,
    MAX_COPY_VOLUME,
    clipboardByPlayer,
    fillMaterialByPlayer,
    locatorBusyByPlayer,
    getSelection,
    getSelectionState,
    getLookedBlockLocation,
    getOffhandTypeId,
    forEachSelectionBlock,
    rotateOffset,
    rotateBlockStates,
    yawToFacingIndex
} from "./core.js";

export function destroySelection(player) {
    const selectionState = getSelectionState(player);
    if (!selectionState) return;

    let changed = 0;
    forEachSelectionBlock(selectionState, (pos) => {
        try {
            const block = player.dimension.getBlock(pos);
            const typeId = `${block?.typeId ?? "minecraft:air"}`;
            if (typeId === "minecraft:bedrock" || typeId === "minecraft:end_gateway" || typeId === "minecraft:end_portal") return;
            player.dimension.setBlockType(pos, "minecraft:air");
            changed++;
        } catch { }
    });

    player.sendMessage(`§aDestroyed ${changed} block(s) in selection.`);
    const stateAfterDestroy = getSelection(`${player?.id ?? ""}`);
    stateAfterDestroy.pos1 = null;
    stateAfterDestroy.pos2 = null;
    fillMaterialByPlayer.delete(`${player?.id ?? ""}`);
}

export function copySelection(player) {
    const playerId = `${player?.id ?? ""}`;
    if (!playerId) return;

    const selectionState = getSelectionState(player);
    if (!selectionState) return;

    if (selectionState.volume > MAX_COPY_VOLUME) {
        player.sendMessage(`§cSelection too large to copy (${selectionState.volume}). Max copy size is ${MAX_COPY_VOLUME}.`);
        return;
    }

    const entries = [];
    const min = selectionState.bounds.min;

    forEachSelectionBlock(selectionState, (pos) => {
        let block;
        try {
            block = player.dimension.getBlock(pos);
        } catch {
            return;
        }

        if (!block) return;

        const typeId = `${block?.typeId ?? "minecraft:air"}`;
        let states = {};
        try {
            states = block.permutation?.getAllStates?.() ?? {};
        } catch { }

        if (AIR_BLOCKS.has(typeId)) return;

        entries.push({
            dx: pos.x - min.x,
            dy: pos.y - min.y,
            dz: pos.z - min.z,
            typeId,
            states
        });
    });

    clipboardByPlayer.set(playerId, {
        entries,
        captureFacing: yawToFacingIndex(player.getRotation().y),
        size: {
            x: (selectionState.bounds.max.x - min.x) + 1,
            y: (selectionState.bounds.max.y - min.y) + 1,
            z: (selectionState.bounds.max.z - min.z) + 1
        },
        copiedAt: Date.now()
    });

    player.sendMessage(`§aCopied ${entries.length} block(s).`);
    const stateAfterCopy = getSelection(playerId);
    stateAfterCopy.pos1 = null;
    stateAfterCopy.pos2 = null;
    fillMaterialByPlayer.delete(playerId);
}

export function pasteClipboard(player, destinationMin) {
    const playerId = `${player?.id ?? ""}`;
    if (!playerId) return;

    const clipboard = clipboardByPlayer.get(playerId);
    if (!clipboard?.entries?.length) {
        player.sendMessage("§cClipboard is empty. Sneak + use copy tool in air to capture a selection first.");
        return;
    }

    let pasted = 0;
    for (const entry of clipboard.entries) {
        const rotated = rotateOffset(Number(entry.dx ?? 0), Number(entry.dz ?? 0), 0);
        const pos = {
            x: destinationMin.x + rotated.dx,
            y: destinationMin.y + Number(entry.dy ?? 0),
            z: destinationMin.z + rotated.dz
        };

        try {
            const perm = BlockPermutation.resolve(`${entry.typeId ?? "minecraft:air"}`, rotateBlockStates(entry.states ?? {}, 0));
            player.dimension.setBlockPermutation(pos, perm);
            pasted++;
        } catch {
            try {
                player.dimension.setBlockType(pos, `${entry.typeId ?? "minecraft:air"}`);
                pasted++;
            } catch { }
        }
    }

    if (pasted === 0) {
        player.sendMessage("§eNo blocks were pasted.");
        return;
    }

    player.sendMessage(`§aPasted ${pasted} block(s).`);
}

export function fillSelection(player, overrideFillTypeId = null) {
    const playerId = `${player?.id ?? ""}`;
    const selectionState = getSelectionState(player);
    if (!selectionState) return;

    const offhandTypeId = getOffhandTypeId(player).trim();
    const rememberedFillTypeId = `${fillMaterialByPlayer.get(playerId) ?? ""}`.trim();
    const fillTypeId = overrideFillTypeId || offhandTypeId || rememberedFillTypeId || "";

    if (!fillTypeId || fillTypeId === "minecraft:air") {
        player.sendMessage("§cHold a block briefly, then swap back to the fill tool, or use your offhand.");
        return;
    }

    let changed = 0;
    forEachSelectionBlock(selectionState, (pos) => {
        try {
            player.dimension.setBlockType(pos, fillTypeId);
            changed++;
        } catch { }
    });

    player.sendMessage(`§aFilled ${changed} block(s) with ${fillTypeId}.`);
    const stateAfterFill = getSelection(playerId);
    stateAfterFill.pos1 = null;
    stateAfterFill.pos2 = null;
    fillMaterialByPlayer.delete(playerId);
}

export function handleBuildToolExecute(player, itemTypeId) {
    const playerId = `${player?.id ?? ""}`;
    if (!playerId) return;
    if (!BUILD_TOOL_ITEMS.has(itemTypeId)) return;

    const state = getSelection(playerId);

    if (itemTypeId === ITEM_BUILD_COPY) {
        const clipboard = clipboardByPlayer.get(playerId);
        if (clipboard?.entries?.length) {
            const target = getLookedBlockLocation(player);
            if (!target) {
                player.sendMessage("§cAim at a block to paste.");
                return;
            }
            pasteClipboard(player, target);
            return;
        }
        if (!state?.pos1) {
            player.sendMessage("§7Sneak + click two blocks to set selection corners, then right-click to copy.");
            return;
        }
        if (!state?.pos2) {
            player.sendMessage("§7Sneak + click a second block to complete the selection.");
            return;
        }
        copySelection(player);
        return;
    }

    if (itemTypeId === ITEM_BUILD_DESTROY) {
        if (!state?.pos1) {
            player.sendMessage("§7Sneak + click two blocks to set selection corners, then right-click to destroy.");
            return;
        }
        if (!state?.pos2) {
            player.sendMessage("§7Sneak + click a second block to complete the selection.");
            return;
        }
        destroySelection(player);
        return;
    }

    if (itemTypeId === ITEM_BUILD_FILL) {
        if (!state?.pos1) {
            player.sendMessage("§7Sneak + click two blocks to set selection corners, then right-click to fill.");
            return;
        }
        if (!state?.pos2) {
            player.sendMessage("§7Sneak + click a second block to complete the selection.");
            return;
        }
        fillSelection(player);
    }
}

function loadLargeJSON(keyBase) {
    const count = world.getDynamicProperty(`${keyBase}_count`);
    if (typeof count !== "number") return [];

    let result = "";
    for (let i = 0; i < count; i++) {
        const chunk = world.getDynamicProperty(`${keyBase}_${i}`);
        if (typeof chunk === "string") result += chunk;
    }

    try {
        return JSON.parse(result);
    } catch {
        return [];
    }
}

function clusterEntries(entries) {
    const byDimension = new Map();
    for (const entry of entries) {
        const dim = `${entry?.dimension ?? "overworld"}`;
        if (!byDimension.has(dim)) byDimension.set(dim, []);
        byDimension.get(dim).push(entry);
    }

    const clusters = [];
    const neighbors = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

    for (const [dimension, dimensionEntries] of byDimension.entries()) {
        const map = new Map();
        for (const entry of dimensionEntries) {
            map.set(`${entry.x}|${entry.y}|${entry.z}`, entry);
        }

        const visited = new Set();
        for (const entry of dimensionEntries) {
            const rootKey = `${entry.x}|${entry.y}|${entry.z}`;
            if (visited.has(rootKey)) continue;

            const queue = [entry];
            visited.add(rootKey);
            const cluster = [];
            let sumX = 0;
            let sumY = 0;
            let sumZ = 0;

            while (queue.length > 0) {
                const current = queue.shift();
                cluster.push(current);
                sumX += Number(current.x ?? 0);
                sumY += Number(current.y ?? 0);
                sumZ += Number(current.z ?? 0);

                for (const [dx, dy, dz] of neighbors) {
                    const key = `${Number(current.x ?? 0) + dx}|${Number(current.y ?? 0) + dy}|${Number(current.z ?? 0) + dz}`;
                    if (visited.has(key) || !map.has(key)) continue;
                    visited.add(key);
                    queue.push(map.get(key));
                }
            }

            const count = cluster.length;
            const center = {
                x: Math.round(sumX / count),
                y: Math.round(sumY / count),
                z: Math.round(sumZ / count)
            };

            const uniqueTypes = new Set(cluster.map(item => `${item?.typeId ?? "unknown"}`));
            const uniqueNames = new Set(cluster.map(item => `${item?.data?.name ?? ""}`.trim()).filter(Boolean));
            const namePrefix = uniqueNames.size > 0 ? `${Array.from(uniqueNames)[0]} ` : "";
            const typePrefix = uniqueTypes.size === 1 ? `${Array.from(uniqueTypes)[0]} ` : "mixed ";

            clusters.push({
                dimension,
                center,
                count,
                label: `${namePrefix}${typePrefix}(${count})`
            });
        }
    }

    clusters.sort((a, b) => b.count - a.count);
    return clusters;
}

export async function showEngineLocator(player) {
    const playerId = `${player?.id ?? ""}`;
    if (!playerId) return;
    if (locatorBusyByPlayer.has(playerId)) return;

    locatorBusyByPlayer.add(playerId);
    try {
        const blocks = loadLargeJSON("blocks");
        if (!Array.isArray(blocks) || blocks.length === 0) {
            player.sendMessage("§eNo engine blocks are currently saved.");
            return;
        }

        const clusters = clusterEntries(blocks);
        if (clusters.length === 0) {
            player.sendMessage("§eNo engine block clusters found.");
            return;
        }

        const limitedClusters = clusters.slice(0, 200);
        const options = limitedClusters.map(cluster => `${cluster.label} | ${cluster.dimension} @ ${cluster.center.x}, ${cluster.center.y}, ${cluster.center.z}`);

        const form = new ModalFormData();
        form.title("Engine Block Locator");
        form.dropdown(`Found ${blocks.length} engine blocks in ${clusters.length} cluster(s)`, options, { defaultValueIndex: 0 });

        const response = await form.show(player);
        if (response.canceled) return;

        const selected = limitedClusters[Number(response.formValues?.[0] ?? 0)];
        if (!selected) return;

        let dimension;
        try {
            dimension = world.getDimension(selected.dimension);
        } catch {
            player.sendMessage(`§cDimension '${selected.dimension}' is unavailable.`);
            return;
        }

        try {
            player.teleport({
                x: selected.center.x + 0.5,
                y: selected.center.y + 1,
                z: selected.center.z + 0.5
            }, { dimension });
            player.sendMessage(`§aTeleported near cluster center (${selected.center.x}, ${selected.center.y}, ${selected.center.z}) in ${selected.dimension}.`);
        } catch {
            player.sendMessage("§cTeleport failed.");
        }
    } catch {
        player.sendMessage("§cEngine locator could not open right now.");
    } finally {
        locatorBusyByPlayer.delete(playerId);
    }
}