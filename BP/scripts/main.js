import { world, system, CommandPermissionLevel, CustomCommandParamType } from "@minecraft/server";
import "./handler/chat_system.js";
import { evaluateCondition, validateConditionRequirements } from "./handler/condition_executer.js";
import { conditionTools } from "./tool_ui/conditions_tools.js";
import { areaPortalToolUI } from "./tool_ui/tool_areaportal.js";
import { infoPlayerspawnUI } from "./tool_ui/info_playerspawn.js";
import { infoTargetAreaportalUI } from "./tool_ui/info_target_areaportal.js";
import { toolInvisibleUI } from "./tool_ui/tool_invisible.js";
import { triggerToolUI as showTriggerToolUI } from "./tool_ui/tool_trigger.js";
import { blockParticles } from "./handler/block_particles.js";

let visible = false;
let blockList = ["brr:tool_areaportal", "brr:info_playerspawn_block", "brr:tool_invisible", "brr:tool_trigger", "brr:info_target_areaportal_block"];
let collisionsList = ["brr:tool_invisible"];
const itemToBlockMap = {
    "brr:info_playerspawn": "brr:info_playerspawn_block",
    "brr:info_target_areaportal": "brr:info_target_areaportal_block"
};
const MAX_SIZE = 28000;
const outputTypes = ["onTrue", "onFalse"]
const inputs = ["startDisabled", "selector", "destination", "destinationBlock", "worldSpawnAtBlock", "worldSpawn", "executeOnConditon", "triggerConditionValue1", "triggerConditionValue2", "triggerConditionValue3", "runCommand"]
const directions = [
    { x: 0, y: 1, z: 0 },
    { x: 0, y: -1, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: -1 },
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 }
];

function getAdjacentPositions(x, y, z) {
    return directions.map(dir => ({ x: x + dir.x, y: y + dir.y, z: z + dir.z }));
}

function generateGroupId() {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function isToolNamespaceBlock(typeId) {
    return typeof typeId === "string" && typeId.startsWith("brr:tool_");
}

function getAdjacentGroupIds(blocks, x, y, z, dimension, blockType) {
    const adjPositions = getAdjacentPositions(x, y, z);
    const adjBlocks = blocks.filter(b =>
        b.dimension === dimension &&
        adjPositions.some(pos => pos.x === b.x && pos.y === b.y && pos.z === b.z) &&
        b.typeId === blockType
    );

    return [...new Set(adjBlocks.map(b => b.groupId).filter(id => id))];
}

function mergeToolGroups(blocks, blockType, groupIds, newGroupId) {
    if (!Array.isArray(groupIds) || groupIds.length <= 1) return;

    const sourceBlock = blocks.find(b => b.groupId === newGroupId && b.typeId === blockType && b.data);
    const sharedData = sourceBlock?.data ? JSON.parse(JSON.stringify(sourceBlock.data)) : null;

    blocks.forEach(block => {
        if (groupIds.includes(block.groupId) && block.typeId === blockType) {
            block.groupId = newGroupId;
            if (sharedData) {
                block.data = JSON.parse(JSON.stringify(sharedData));
            }
        }
    });
}

function getActiveVisibleBlockTypes() {
    const activeTypes = new Set();

    for (const player of world.getPlayers()) {
        const equip = player.getComponent("minecraft:equippable");
        const mainhand = equip?.getEquipment("Mainhand");
        const heldType = mainhand?.typeId ?? "minecraft:air";

        if (blockList.includes(heldType)) {
            activeTypes.add(heldType);
        }

        if (itemToBlockMap[heldType]) {
            activeTypes.add(itemToBlockMap[heldType]);
        }
    }

    return activeTypes;
}

function isPlayerInCreative(player) {
    if (!player) return false;

    if (typeof player.getGameMode === "function") {
        try {
            return `${player.getGameMode()}`.toLowerCase() === "creative";
        } catch { }
    }

    try {
        return (player.runCommand("testfor @s[m=creative]")?.successCount ?? 0) > 0;
    } catch { }

    try {
        return (player.runCommand("testfor @s[m=1]")?.successCount ?? 0) > 0;
    } catch { }

    return false;
}

function isBlockedTriggerCommand(command) {
    const normalized = `${command ?? ""}`
        .trim()
        .replace(/^\/+/, "")
        .trim()
        .toLowerCase();

    return normalized === "op"
        || normalized.startsWith("op ")
        || normalized === "minecraft:op"
        || normalized.startsWith("minecraft:op ")
        || normalized === "deop"
        || normalized.startsWith("deop ")
        || normalized === "minecraft:deop"
        || normalized.startsWith("minecraft:deop ");
}

function getHiddenPlaceholderType(block) {
    if (block?.typeId === "brr:tool_invisible") {
        return parseBooleanLike(block?.data?.startDisabled, false)
            ? "brr:data"
            : "brr:data_collision";
    }

    return collisionsList.includes(block?.typeId) ? "brr:data_collision" : "brr:data";
}

function saveLargeJSON(keyBase, value) {
    const json = JSON.stringify(value);
    let index = 0;
    let pos = 0;

    while (world.getDynamicProperty(`${keyBase}_${index}`) !== undefined) {
        world.setDynamicProperty(`${keyBase}_${index}`, undefined);
        index++;
    }

    index = 0;
    while (pos < json.length) {
        const chunk = json.slice(pos, pos + MAX_SIZE);
        world.setDynamicProperty(`${keyBase}_${index}`, chunk);
        pos += MAX_SIZE;
        index++;
    }

    world.setDynamicProperty(`${keyBase}_count`, index);
}

function loadLargeJSON(keyBase) {
    const count = world.getDynamicProperty(`${keyBase}_count`);
    if (typeof count !== "number") return [];

    let result = "";
    for (let i = 0; i < count; i++) {
        const chunk = world.getDynamicProperty(`${keyBase}_${i}`);
        if (chunk) result += chunk;
    }

    try {
        return JSON.parse(result);
    } catch {
        return [];
    }
}

system.runInterval(() => {
    const blocks = loadLargeJSON("blocks");
    const activeTypes = getActiveVisibleBlockTypes();
    for (const block of blocks) {
        const dim = world.getDimension(block.dimension);
        const pos = { x: block.x, y: block.y, z: block.z };
        const current = dim.getBlock(pos);
        if (visible) {
            try { dim.setBlockType(pos, block.typeId); } catch { }
            continue;
        }
        if (activeTypes.has(block.typeId)) {
            try { dim.setBlockType(pos, block.typeId); } catch { }
        }
        else {
            if (current && (current.typeId === block.typeId || current.typeId === "brr:data" || current.typeId === "brr:data_collision")) {
                try {
                    const hiddenType = getHiddenPlaceholderType(block);
                    if (current.typeId !== hiddenType) {
                        dim.setBlockType(pos, hiddenType);
                    }
                } catch { }
            }
        }
    }
}, 5);

world.beforeEvents.playerBreakBlock.subscribe((data) => {
    const block = data.block;
    let blocks = loadLargeJSON("blocks");
    if (blockList.includes(block.typeId)) {
        const beforeCount = blocks.length;
        blocks = blocks.filter((b) => !(b.x === block.x && b.y === block.y && b.z === block.z && b.dimension === block.dimension.id));
        if (blocks.length !== beforeCount) {
            saveLargeJSON("blocks", blocks);
        }
    }
})

world.afterEvents.playerPlaceBlock.subscribe((data) => {
    const block = data.block;
    if (blockList.includes(block.typeId)) {
        let blocks = loadLargeJSON("blocks");

        let newGroupId = null;
        let sharedData = {};

        if (isToolNamespaceBlock(block.typeId)) {
            const adjacentGroupIds = getAdjacentGroupIds(blocks, block.x, block.y, block.z, block.dimension.id, block.typeId);

            if (adjacentGroupIds.length > 0) {
                newGroupId = adjacentGroupIds[0];
                const adjacentBlock = blocks.find(b => b.groupId === newGroupId);
                if (adjacentBlock && adjacentBlock.data) {
                    sharedData = JSON.parse(JSON.stringify(adjacentBlock.data));
                }

                if (adjacentGroupIds.length > 1) {
                    mergeToolGroups(blocks, block.typeId, adjacentGroupIds, newGroupId);
                }
            } else {
                newGroupId = generateGroupId();
            }
        }

        blocks.push({
            x: block.x,
            y: block.y,
            z: block.z,
            typeId: block.typeId,
            dimension: block.dimension.id,
            groupId: newGroupId,
            data: { ...sharedData, startDisabled: false }
        });
        saveLargeJSON("blocks", blocks);
    }
})

system.beforeEvents.startup.subscribe((data) => {
    const commandsList = ["engine_blocks_always_visible"]
    data.customCommandRegistry.registerEnum("brr:cmds", commandsList)
    data.customCommandRegistry.registerCommand(
        {
            name: "brr:brr",
            description: "Bonnie's Source Engine Settings",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            mandatoryParameters: [
                { name: "brr:cmds", type: CustomCommandParamType.Enum },
                { name: "value", type: CustomCommandParamType.Boolean }
            ],
        },
        (origin, subcommand, value) => {
            const sender = origin.sourceEntity;
            if (!sender) return;

            if (subcommand === "engine_blocks_always_visible") {
                visible = value ?? false;
                sender.sendMessage(`Toggled tool blocks visibility to ${visible}`);
                return;
            }
        }
    );
});

function getBlocksTargetingCurrent(currentBlockName) {
    const allBlocks = loadLargeJSON("blocks");
    const inputsList = [];

    // Safety check for the block name
    if (!currentBlockName) return inputsList;

    allBlocks.forEach(block => {
        // Only check blocks that have outputs
        if (block.data && block.data.outputs) {
            block.data.outputs.forEach(output => {
                // Check if the output targets the current block
                if (output.targetName === currentBlockName) {
                    inputsList.push({
                        sourceBlockName: block.data.name || `[Block at ${block.x},${block.y},${block.z}]`,
                        outputName: output.name,
                    });
                }
            });
        }
    });

    return inputsList;
}
// ------------------------------------


function getNamedTargets() {
    const blocks = loadLargeJSON("blocks");
    const namedBlocks = blocks.filter(b => b.data && b.data.name).map(b => b.data.name);
    // Use a Set to ensure unique names
    return [...new Set(namedBlocks)];
}

function getNearestTriggerBlockEntry(player, maxDistance = 12) {
    const playerLoc = player?.location;
    const playerDimension = player?.dimension?.id;
    if (!playerLoc || !playerDimension) return null;

    const maxDistanceSquared = maxDistance * maxDistance;
    const blocks = loadLargeJSON("blocks");
    let nearest = null;
    let nearestDistanceSquared = Number.POSITIVE_INFINITY;

    for (const block of blocks) {
        if (block?.typeId !== "brr:tool_trigger") continue;
        if (block?.dimension !== playerDimension) continue;

        const centerX = block.x + 0.5;
        const centerY = block.y + 0.5;
        const centerZ = block.z + 0.5;
        const dx = centerX - playerLoc.x;
        const dy = centerY - playerLoc.y;
        const dz = centerZ - playerLoc.z;
        const distSquared = (dx * dx) + (dy * dy) + (dz * dz);

        if (distSquared <= maxDistanceSquared && distSquared < nearestDistanceSquared) {
            nearest = block;
            nearestDistanceSquared = distSquared;
        }
    }

    return nearest;
}

function saveBlockEntry(blockEntry) {
    let blocks = loadLargeJSON("blocks");
    const index = blocks.findIndex(b =>
        b.x === blockEntry.x &&
        b.y === blockEntry.y &&
        b.z === blockEntry.z &&
        b.dimension === blockEntry.dimension
    );

    if (index !== -1) {
        blocks[index] = blockEntry;

        if (blocks[index].groupId && isToolNamespaceBlock(blocks[index].typeId)) {
            const groupId = blocks[index].groupId;
            blocks.forEach(block => {
                if (block.groupId === groupId && block.typeId === blocks[index].typeId) {
                    block.data = JSON.parse(JSON.stringify(blockEntry.data));
                }
            });
        }

        saveLargeJSON("blocks", blocks);
    }
}

function isPositionInsideBlock(pos, block) {
    if (!pos || !block) return false;
    return pos.x >= block.x && pos.x < block.x + 1
        && pos.y >= block.y && pos.y < block.y + 1
        && pos.z >= block.z && pos.z < block.z + 1;
}

function getEntityProbeLocations(entity) {
    const loc = entity?.location;
    if (!loc) return [];

    const probes = [{ x: loc.x, y: loc.y, z: loc.z }];

    if (entity?.typeId === "minecraft:player") {
        probes.push(
            { x: loc.x, y: loc.y + 0.9, z: loc.z },
            { x: loc.x, y: loc.y + 1.5, z: loc.z }
        );
    }

    return probes;
}

function isEntityInsideBlock(entity, block) {
    const probes = getEntityProbeLocations(entity);
    for (const probe of probes) {
        if (isPositionInsideBlock(probe, block)) return true;
    }
    return false;
}

function parseSelectorFilters(selector) {
    const trimmed = `${selector ?? ""}`.trim();
    const match = trimmed.match(/^@[pares](?:\[(.*)\])?$/i);
    if (!match) return null;

    const entriesRaw = `${match[1] ?? ""}`.trim();
    if (!entriesRaw) return {};

    const filters = {};
    for (const entry of entriesRaw.split(",")) {
        const [rawKey, ...rawValueParts] = entry.split("=");
        const key = `${rawKey ?? ""}`.trim().toLowerCase();
        const value = rawValueParts.join("=").trim();
        if (!key || !value) continue;
        filters[key] = value;
    }

    return filters;
}

function applyEntityFilters(entities, filters) {
    if (!filters || !entities?.length) return entities ?? [];

    let results = entities;

    if (typeof filters.type === "string" && filters.type.length > 0) {
        const expectedType = filters.type.trim().toLowerCase();
        results = results.filter(entity => `${entity.typeId ?? ""}`.toLowerCase() === expectedType);
    }

    if (typeof filters.name === "string" && filters.name.length > 0) {
        const expectedName = filters.name.trim().toLowerCase();
        results = results.filter(entity => {
            const tag = `${entity.nameTag ?? ""}`.trim().toLowerCase();
            const playerName = `${entity.name ?? ""}`.trim().toLowerCase();
            return tag === expectedName || playerName === expectedName;
        });
    }

    if (typeof filters.tag === "string" && filters.tag.length > 0) {
        const tagName = filters.tag.trim();
        results = results.filter(entity => {
            try {
                return entity.hasTag(tagName);
            } catch {
                return false;
            }
        });
    }

    return results;
}

function getAreaPortalTargets(block, selectorRaw) {
    const selector = `${selectorRaw ?? "minecraft:player"}`.trim();
    const normalized = selector.toLowerCase();

    let dimension;
    try {
        dimension = world.getDimension(block.dimension);
    } catch {
        return [];
    }

    const blockCenter = { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 };

    if (normalized.startsWith("@")) {
        const filters = parseSelectorFilters(selector);
        const base = normalized.slice(0, 2);

        if (base === "@a") {
            let players = Array.from(dimension.getPlayers());
            players = applyEntityFilters(players, filters);
            return players;
        }

        if (base === "@e") {
            let entities = Array.from(dimension.getEntities());
            entities = applyEntityFilters(entities, filters);
            return entities;
        }

        if (base === "@p") {
            let players = Array.from(dimension.getPlayers());
            players = applyEntityFilters(players, filters);
            if (players.length === 0) return [];

            players.sort((a, b) => {
                const adx = a.location.x - blockCenter.x;
                const ady = a.location.y - blockCenter.y;
                const adz = a.location.z - blockCenter.z;
                const bdx = b.location.x - blockCenter.x;
                const bdy = b.location.y - blockCenter.y;
                const bdz = b.location.z - blockCenter.z;
                return (adx * adx + ady * ady + adz * adz) - (bdx * bdx + bdy * bdy + bdz * bdz);
            });

            return [players[0]];
        }

        if (base === "@r") {
            let players = Array.from(dimension.getPlayers());
            players = applyEntityFilters(players, filters);
            if (players.length === 0) return [];
            const randomIndex = Math.floor(Math.random() * players.length);
            return [players[randomIndex]];
        }

        if (base === "@s") {
            return [];
        }

        return [];
    }

    if (normalized === "minecraft:player") {
        return Array.from(dimension.getPlayers());
    }

    try {
        return Array.from(dimension.getEntities({ type: selector }));
    } catch {
        return [];
    }
}

function getNormalizedTriggerData(data) {
    if (!data) return data;
    const normalized = { ...data };

    if (typeof normalized.executeCondition === "number") {
        normalized.executeCondition = conditionTools[normalized.executeCondition] ?? "noCondition";
    }

    if (typeof normalized.executeCondition !== "string" || !normalized.executeCondition) {
        normalized.executeCondition = "noCondition";
    }

    return normalized;
}

function fireOutputsForEvent(sourceBlock, eventName) {
    if (!sourceBlock?.data || sourceBlock.data.startDisabled) return;
    const outputs = Array.isArray(sourceBlock.data.outputs) ? sourceBlock.data.outputs : [];
    if (outputs.length === 0) return;

    function resolveOutputTargetProperty(targetProperty) {
        const aliases = {
            playerspawnWorldSpawnAtBlock: "worldSpawnAtBlock",
            playerspawnWorldSpawn: "worldSpawn",
            playerspawnSetsPlayerSpawnPoint: "setsPlayerSpawnPoint"
        };

        return aliases[targetProperty] ?? targetProperty;
    }

    function parseBooleanLike(value, defaultValue = false) {
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value !== 0;

        const normalized = `${value ?? ""}`.trim().toLowerCase();
        if (["true", "1", "yes", "on"].includes(normalized)) return true;
        if (["false", "0", "no", "off", ""].includes(normalized)) return false;
        return defaultValue;
    }

    function coerceOutputTargetValue(targetProperty, rawValue) {
        if (targetProperty === "worldSpawnAtBlock" || targetProperty === "setsPlayerSpawnPoint") {
            return parseBooleanLike(rawValue, false);
        }

        return `${rawValue ?? ""}`;
    }

    const blocks = loadLargeJSON("blocks");
    let changed = false;

    for (const output of outputs) {
        if (`${output?.outputType ?? ""}` !== eventName) continue;

        const targetName = `${output?.targetName ?? ""}`.trim();
        const targetProperty = resolveOutputTargetProperty(`${output?.targetProperty ?? ""}`.trim());
        if (!targetName || !targetProperty) continue;

        const targetIndex = blocks.findIndex(block => `${block?.data?.name ?? ""}`.trim() === targetName);
        if (targetIndex === -1) continue;

        if (!blocks[targetIndex].data) blocks[targetIndex].data = {};
        blocks[targetIndex].data[targetProperty] = coerceOutputTargetValue(targetProperty, output?.targetValue);
        changed = true;
    }

    if (changed) saveLargeJSON("blocks", blocks);
}

function parseSpawnCoordinates(raw) {
    const coords = `${raw ?? ""}`.trim().split(/\s+/);
    if (coords.length !== 3) return null;

    const x = Number.parseFloat(coords[0]);
    const y = Number.parseFloat(coords[1]);
    const z = Number.parseFloat(coords[2]);

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
    return { x: x + 0.5, y: y + 0, z: z + 0.5 };
}

function parseBooleanLike(value, defaultValue = false) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;

    const normalized = `${value ?? ""}`.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off", ""].includes(normalized)) return false;
    return defaultValue;
}

function applyWorldSpawnPoint(spawnCoords) {
    const x = spawnCoords.x;
    const y = spawnCoords.y;
    const z = spawnCoords.z;

    try {
        world.setDefaultSpawnLocation({ x, y, z });
        return true;
    } catch { }

    try {
        world.getDimension("minecraft:overworld").runCommand(`setworldspawn ${x} ${y} ${z}`);
        return true;
    } catch { }

    return false;
}

function applySpawnPointForPlayer(player, spawnCoords, dim) {
    try {
        player.setSpawnPoint(spawnCoords, dim);
        return true;
    } catch { }

    try {
        player.setSpawnPoint({
            x: spawnCoords.x,
            y: spawnCoords.y,
            z: spawnCoords.z,
            dimension: dim
        });
        return true;
    } catch { }

    try {
        player.runCommand(`spawnpoint @s ${Math.floor(spawnCoords.x)} ${Math.floor(spawnCoords.y)} ${Math.floor(spawnCoords.z)}`);
        return true;
    } catch { }

    return false;
}

let playerspawnWarningShown = false;
let lastAppliedWorldSpawnKey = "";

system.runInterval(() => {
    const blocks = loadLargeJSON("blocks");
    const players = world.getPlayers();

    for (const block of blocks) {
        if (block.typeId === "brr:tool_trigger" && !block.data?.startDisabled) {
            const triggerData = getNormalizedTriggerData(block.data);

            for (const player of players) {
                if (!isEntityInsideBlock(player, block)) continue;

                if (evaluateCondition(triggerData, player, world)) {
                    if (triggerData.runCommand) {
                        if (!isBlockedTriggerCommand(triggerData.runCommand)) {
                            try {
                                player.runCommand(triggerData.runCommand);
                            } catch { }
                        }
                    }
                    fireOutputsForEvent(block, "onTrue");
                } else {
                    fireOutputsForEvent(block, "onFalse");
                }
            }
        }

        if (block.typeId === "brr:tool_areaportal" && !block.data?.startDisabled) {
            const targets = getAreaPortalTargets(block, block.data?.selector);
            for (const entity of targets) {
                if (!isEntityInsideBlock(entity, block)) continue;

                let destCoords = null;
                const destDim = world.getDimension(block.dimension);

                if (block.data?.destinationBlock) {
                    const targetBlock = blocks.find(b => b.typeId === "brr:info_target_areaportal_block" && b.data?.name === block.data.destinationBlock);
                    if (targetBlock) {
                        destCoords = { x: targetBlock.x + 0.5, y: targetBlock.y, z: targetBlock.z + 0.5 };
                    }
                } else if (block.data?.destination) {
                    const coords = `${block.data.destination}`.trim().split(/\s+/);
                    if (coords.length === 3) {
                        destCoords = { x: Number.parseFloat(coords[0]), y: Number.parseFloat(coords[1]), z: Number.parseFloat(coords[2]) };
                    }
                }

                if (destCoords && destDim) {
                    try {
                        entity.teleport(destCoords, { dimension: destDim });
                    } catch { }
                }
            }
        }
    }
}, 2);

system.runInterval(() => {
    const blocks = loadLargeJSON("blocks");
    const activePlayerspawnBlocks = blocks.filter(block =>
        block.typeId === "brr:info_playerspawn_block" && !block.data?.startDisabled
    );

    if (activePlayerspawnBlocks.length !== 1) {
        if (activePlayerspawnBlocks.length > 1 && !playerspawnWarningShown) {
            playerspawnWarningShown = true;
            try {
                world.sendMessage("§e[Info Playerspawn] Multiple active info_playerspawn blocks detected. Disable all but one.");
            } catch { }
        }
        if (activePlayerspawnBlocks.length <= 1) {
            playerspawnWarningShown = false;
        }
        return;
    }

    playerspawnWarningShown = false;

    const activeBlock = activePlayerspawnBlocks[0];
    const spawnDim = world.getDimension(activeBlock.dimension);
    let spawnCoords = null;
    const worldSpawnAtBlock = parseBooleanLike(activeBlock.data?.worldSpawnAtBlock, true);
    const setsPlayerSpawnPoint = parseBooleanLike(activeBlock.data?.setsPlayerSpawnPoint, false);

    if (worldSpawnAtBlock) {
        spawnCoords = { x: activeBlock.x + 0.5, y: activeBlock.y + 0, z: activeBlock.z + 0.5 };
    } else if (activeBlock.data?.worldSpawn) {
        spawnCoords = parseSpawnCoordinates(activeBlock.data.worldSpawn);
    }

    if (!spawnCoords) return;

    if (setsPlayerSpawnPoint) {
        lastAppliedWorldSpawnKey = "";
        for (const player of world.getPlayers()) {
            applySpawnPointForPlayer(player, spawnCoords, spawnDim);
        }
        return;
    }

    const spawnKey = `${Math.floor(spawnCoords.x)}|${Math.floor(spawnCoords.y)}|${Math.floor(spawnCoords.z)}`;
    if (spawnKey === lastAppliedWorldSpawnKey) return;

    if (applyWorldSpawnPoint(spawnCoords)) {
        lastAppliedWorldSpawnKey = spawnKey;
    }
}, 100);

system.runInterval(() => {
    const blocks = loadLargeJSON("blocks");
    const activeTypes = visible ? null : getActiveVisibleBlockTypes();

    for (const block of blocks) {
        if (!visible && activeTypes && !activeTypes.has(block.typeId)) {
            continue;
        }

        const particleId = blockParticles[block.typeId];
        if (!particleId) continue;

        const dim = world.getDimension(block.dimension);
        const particlePos = {
            x: block.x + 0.5,
            y: block.y + 0.5,
            z: block.z + 0.5
        };

        try {
            dim.spawnParticle(particleId, particlePos);
        } catch { }
    }
}, 2);

world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    if (!player) return;

    system.run(() => {
        const blocks = loadLargeJSON("blocks");
        const activePlayerspawnBlocks = blocks.filter(block =>
            block.typeId === "brr:info_playerspawn_block" && !block.data?.startDisabled
        );

        if (activePlayerspawnBlocks.length !== 1) return;

        const activeBlock = activePlayerspawnBlocks[0];
        const worldSpawnAtBlock = parseBooleanLike(activeBlock.data?.worldSpawnAtBlock, true);
        const setsPlayerSpawnPoint = parseBooleanLike(activeBlock.data?.setsPlayerSpawnPoint, false);
        if (setsPlayerSpawnPoint) return;

        let spawnCoords = null;
        if (worldSpawnAtBlock) {
            spawnCoords = { x: activeBlock.x + 0.5, y: activeBlock.y + 0, z: activeBlock.z + 0.5 };
        } else if (activeBlock.data?.worldSpawn) {
            spawnCoords = parseSpawnCoordinates(activeBlock.data.worldSpawn);
        }

        if (!spawnCoords) return;

        try {
            player.teleport(spawnCoords, { dimension: world.getDimension(activeBlock.dimension) });
        } catch { }
    });
});

const lastTrigger = new Map();
const COOLDOWN_MS = 500;

world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
    const block = data.block;
    if (blockList.includes(block.typeId)) {
        if (data.player.isSneaking) return;

        if (!isPlayerInCreative(data.player)) {
            data.player.sendMessage("§cOnly players in Creative mode can configure these blocks.");
            data.cancel = true;
            return;
        }

        const now = Date.now();
        const previous = lastTrigger.get(data.player.id) ?? 0;
        if (now - previous < COOLDOWN_MS) return;
        lastTrigger.set(data.player.id, now);

        let blocks = loadLargeJSON("blocks");
        let blockEntry = blocks.find(b =>
            b.x === block.x && b.y === block.y && b.z === block.z && b.dimension === block.dimension.id
        );

        if (!blockEntry) {
            blockEntry = {
                x: block.x,
                y: block.y,
                z: block.z,
                typeId: block.typeId,
                dimension: block.dimension.id,
                data: { startDisabled: false }
            };
            blocks.push(blockEntry);
            saveLargeJSON("blocks", blocks);
        }

        data.cancel = true;
        if (block.typeId === "brr:tool_trigger") {
            system.run(() => {
                showTriggerToolUI(data.player, blockEntry, {
                    onSave: saveBlockEntry,
                    conditionTools,
                    validateConditionRequirements,
                    getNamedTargets,
                    getBlocksTargetingCurrent,
                    outputTypes,
                    inputs
                });
            })
        }
        if (block.typeId === "brr:tool_areaportal") {
            system.run(() => {
                areaPortalToolUI(data.player, blockEntry, saveBlockEntry);
            })
        }
        if (block.typeId === "brr:info_playerspawn_block") {
            system.run(() => {
                infoPlayerspawnUI(data.player, blockEntry, saveBlockEntry);
            })
        }
        if (block.typeId === "brr:info_target_areaportal_block") {
            system.run(() => {
                infoTargetAreaportalUI(data.player, blockEntry, saveBlockEntry);
            })
        }
        if (block.typeId === "brr:tool_invisible") {
            system.run(() => {
                toolInvisibleUI(data.player, blockEntry, saveBlockEntry);
            })
        }
    }
})