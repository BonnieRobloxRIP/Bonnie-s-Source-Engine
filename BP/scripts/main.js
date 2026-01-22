// Core server imports from the Minecraft scripting API
import { world, system, CommandPermissionLevel, CustomCommandParamType } from "@minecraft/server";
// UI helper for modal forms
import { ModalFormData } from "@minecraft/server-ui";
import { conditionTools } from "./tool_ui/conditions_tools.js";
import { chatRank, nametagRank, emojiCommand } from "./handler/chat_system.js"; // do not remove these bruv
chatRank;
nametagRank;
emojiCommand;
// ------------------------------------

// Toggle to force showing the actual tool blocks instead of placeholder data blocks
let visible = false;

// Types of blocks that this script recognizes as "tools" and tracks
let blockList = ["brr:tool_trigger", "brr:tool_areaportal", "brr:tool_blocklight", "brr:tool_blockbullets", "brr:tool_skip", "brr:tool_playerclip", "brr:tool_npcclip", "brr:tool_invisible", "brr:tool_nodraw", "brr:tool_nodraw_portalable", "brr:tool_3d_skybox", "brr:info_playerspawn_block", "brr:info_target_areaportal_block", "brr:game_nametag_block", "brr:ambient_generic_block", "brr:env_explosion_block", "brr:env_fire_block", "brr:env_spark_block", "brr:env_particle_block", "brr:filter_class_block", "brr:filter_multiple_block", "brr:filter_name_block", "brr:filter_team_block", "brr:fnaf_ai_block", "brr:fnaf_ai_manager_block", "brr:fnaf_camera_block", "brr:fnaf_power_manager_block", "brr:game_end_block", "brr:game_text_block", "brr:info_landmark_block", "brr:logic_auto_block", "brr:logic_case_block", "brr:logic_branch_block", "brr:logic_compare_block", "brr:logic_coop_manager_block", "brr:logic_multicompare_block", "brr:logic_random_outputs_block", "brr:logic_relay_block", "brr:logic_script_block", "brr:logic_timer_block", "brr:math_counter_block", "brr:multi_manager_block", "brr:npc_maker_block", "brr:scripted_sentence_block", "brr:trigger_relay_block", "brr:bullseye_block", "brr:assault_point_block", "brr:assault_rally_block"];

// Subset of blocks which require collision/physics-preserving placeholder
let collisionsList = ["brr:tool_invisible", "brr:tool_nodraw", "brr:tool_nodraw_portalable", "brr:tool_3d_skybox"];
// Maximum chunk size for saving large JSON to dynamic properties
const MAX_SIZE = 28000;
// Possible output types for triggers (used in the UI)
const outputTypes = ["onTrue", "onFalse"]

// Input/property options that a trigger output can target
const inputs = ["startDisabled", "selector", "destination", "destinationBlock", "worldSpawnAtBlock", "worldSpawn", "executeOnConditon", "triggerConditionValue1", "triggerConditionValue2", "triggerConditionValue3", "runCommand"]

// Directions for adjacency checks (6 faces)
const directions = [
    { x: 0, y: 1, z: 0 }, // up
    { x: 0, y: -1, z: 0 }, // down
    { x: 0, y: 0, z: 1 }, // north
    { x: 0, y: 0, z: -1 }, // south
    { x: 1, y: 0, z: 0 }, // east
    { x: -1, y: 0, z: 0 } // west
];

// Helper: Get adjacent block positions
function getAdjacentPositions(x, y, z) {
    return directions.map(dir => ({ x: x + dir.x, y: y + dir.y, z: z + dir.z }));
}

// Helper: Generate a unique groupId
function generateGroupId() {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Find groupIds of adjacent blocks
function getAdjacentGroupIds(blocks, x, y, z, dimension) {
    const adjPositions = getAdjacentPositions(x, y, z);
    const adjBlocks = blocks.filter(b =>
        b.dimension === dimension &&
        adjPositions.some(pos => pos.x === b.x && pos.y === b.y && pos.z === b.z) &&
        b.typeId === "brr:tool_trigger"
    );
    return [...new Set(adjBlocks.map(b => b.groupId).filter(id => id))];
}

// Helper: Merge groups (update all blocks in old groups to new groupId, keep sharedData from first)
function mergeGroups(blocks, sharedData, groupIds, newGroupId) {
    if (groupIds.length <= 1) return;
    // Update all blocks in the groups to newGroupId
    blocks.forEach(b => {
        if (groupIds.includes(b.groupId)) {
            b.groupId = newGroupId;
        }
    });
    // Keep sharedData from the first groupId
    if (!sharedData[newGroupId]) {
        sharedData[newGroupId] = sharedData[groupIds[0]] || {};
    }
    // Remove old sharedData entries
    groupIds.forEach(id => {
        if (id !== newGroupId) delete sharedData[id];
    });
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

// Persist an arbitrarily-large object by splitting it into chunks
// and storing them as multiple dynamic properties on the `world` object.
// This avoids hitting size limits for a single dynamic property.

function loadLargeJSON(keyBase) {
    const count = world.getDynamicProperty(`${keyBase}_count`);
    if (typeof count !== "number") return [];

    let result = "";
    for (let i = 0; i < count; i++) {
        const chunk = world.getDynamicProperty(`${keyBase}_${i}`);
        if (chunk) result += chunk;  // Skip missing chunks, load partial data
    }

    try {
        return JSON.parse(result);
    } catch {
        return [];
    }
}

system.runInterval(() => {
    const blocks = loadLargeJSON("blocks");
    const activeTypes = new Set();
    for (const player of world.getPlayers()) {
        const equip = player.getComponent("minecraft:equippable");
        const mainhand = equip?.getEquipment("Mainhand");
        const heldType = mainhand?.typeId ?? "minecraft:air";
        if (blockList.includes(heldType)) {
            activeTypes.add(heldType);
        }
    }
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
            if (current && current.typeId === block.typeId) {
                try {
                    dim.setBlockType(pos, collisionsList.includes(block.typeId) ? "brr:data_collision" : "brr:data");
                } catch { }
            }
        }
    }
}, 5);

// Periodic task (very frequent) that ensures tool blocks are visually
// represented correctly for players. If a player is holding a matching
// tool item, the real block is shown; otherwise a lightweight placeholder
// (`brr:data` or `brr:data_collision`) is used so the world looks correct
// but the special block behavior remains hidden.



world.beforeEvents.playerBreakBlock.subscribe((data) => {
    const block = data.block;
    if (blockList.includes(block.typeId)) {
        let blocks = loadLargeJSON("blocks");
        blocks = blocks.filter((b) => !(b.x === block.x && b.y === block.y && b.z === block.z && b.dimension === block.dimension.id));
        saveLargeJSON("blocks", blocks);
    }
});

// Keep persistent list in sync when a tracked tool block is broken by a player

world.afterEvents.playerPlaceBlock.subscribe((data) => {
    const block = data.block;
    if (blockList.includes(block.typeId)) {
        let blocks = loadLargeJSON("blocks");
        blocks.push({ x: block.x, y: block.y, z: block.z, typeId: block.typeId, dimension: block.dimension.id, data: {} });
        saveLargeJSON("blocks", blocks);
    }
});

// Add newly placed tracked tool blocks to the persistent list

system.beforeEvents.startup.subscribe((data) => {
    const commandsList = ["engine_blocks_always_visible"];
    data.customCommandRegistry.registerEnum("brr:cmds", commandsList);
    data.customCommandRegistry.registerCommand({
        name: "brr:brr",
        description: "Bonnie's Source Engine Settings",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [
            { name: "brr:cmds", type: CustomCommandParamType.Enum },
            { name: "value", type: CustomCommandParamType.Boolean }
        ],
    }, (origin, subcommand, value) => {
        const sender = origin.sourceEntity;
        if (subcommand === "engine_blocks_always_visible") {
            visible = value ?? false;
            sender.sendMessage(`Toggled tool blocks visibility to ${visible}`);
        }
    });
});

// Register custom console/command behavior on server startup. This
// registers `brr:brr engine_blocks_always_visible <true|false>` which
// toggles whether tool blocks are always visible.

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
// Helper: return a list of other saved blocks that have outputs targeting
// the block whose name is `currentBlockName`. Used in the trigger UI to
// show incoming connections.
// ------------------------------------
const blockParticles = {
    "brr:info_playerspawn_block": "brr:info_playerspawn",
    "brr:info_target_areaportal_block": "brr:info_target_areaportal",
    "brr:ambient_generic_block": "brr:ambient_generic",
    "brr:assault_point_block": "brr:assault_point",
    "brr:assault_rally_block": "brr:assault_rally",
    "brr:bullseye_block": "brr:bullseye",
    "brr:env_explosion_block": "brr:env_explosion",
    "brr:env_fire_block": "brr:env_fire",
    "brr:env_particle_block": "brr:env_particles",
    "brr:env_spark_block": "brr:env_spark",
    "brr:filter_class_block": "brr:filter_class",
    "brr:filter_multiple_block": "brr:filter_multiple",
    "brr:filter_name_block": "brr:filter_name",
    "brr:filter_team_block": "brr:filter_team",
    "brr:fnaf_ai_block": "brr:fnaf_ai",
    "brr:fnaf_ai_manager_block": "brr:fnaf_ai_manager",
    "brr:fnaf_camera_block": "brr:fnaf_camera",
    "brr:fnaf_power_manager_block": "brr:fnaf_power_manager",
    "brr:game_end_block": "brr:game_end",
    "brr:game_nametag_block": "brr:game_nametag",
    "brr:game_text_block": "brr:game_text",
    "brr:info_landmark_block": "brr:info_landmark",
    "brr:logic_auto_block": "brr:logic_auto",
    "brr:logic_branch_block": "brr:logic_branch",
    "brr:logic_case_block": "brr:logic_case",
    "brr:logic_compare_block": "brr:logic_compare",
    "brr:logic_coop_manager_block": "brr:logic_coop_manager",
    "brr:logic_multicompare_block": "brr:logic_multicompare",
    "brr:logic_random_outputs_block": "brr:logic_random_outputs",
    "brr:logic_relay_block": "brr:logic_relay",
    "brr:logic_script_block": "brr:logic_script",
    "brr:logic_timer_block": "brr:logic_timer",
    "brr:math_counter_block": "brr:math_counter",
    "brr:multi_manager_block": "brr:multi_manager",
    "brr:npc_maker_block": "brr:npc_maker",
    "brr:scripted_sentence_block": "brr:scripted_sentence",
    "brr:trigger_relay_block": "brr:trigger_relay"
}

system.runInterval(() => {
    const blocks = loadLargeJSON("blocks");

    for (const block of blocks) {
        // Check if this block type is supposed to have a particle
        const particleId = blockParticles[block.typeId];

        if (particleId) {
            const dim = world.getDimension(block.dimension);
            const particlePos = {
                x: block.x + 0.5,
                y: block.y + 0.5,
                z: block.z + 0.5
            };

            try {
                dim.spawnParticle(particleId, particlePos);
            } catch (e) {
                // Silently skip if dimension is unloaded
            }
        }
    }
}, 19);
// Periodic task to spawn visual particles for certain block types.
// Runs less frequently than the rendering loop.
// ------------------------------------
function getNamedTargets() {
    const blocks = loadLargeJSON("blocks");
    const namedBlocks = blocks.filter(b => b.data && b.data.name).map(b => b.data.name);
    // Use a Set to ensure unique names
    return [...new Set(namedBlocks)];
}

// Return unique block names that have been assigned by the user. These
// are used to populate dropdowns in the trigger editor UI.

function triggerToolUI(player, blockEntry) {
    if (!blockEntry.data) blockEntry.data = {};
    if (!blockEntry.data.outputs) blockEntry.data.outputs = [];
    let blockOutputs = blockEntry.data.outputs;
    const targetNames = getNamedTargets();

    const triggerForm = new ModalFormData()
    triggerForm.title(`Trigger Tool`)

    triggerForm.textField("Name", "name", { defaultValue: blockEntry.data?.name ?? `trigger${Math.round(Math.random() * 10000)}` })
    triggerForm.toggle("Start disabled", { defaultValue: blockEntry.data?.startDisabled ?? false })
    triggerForm.dropdown("Execute on condition", conditionTools, { defaultValueIndex: blockEntry.data?.executeCondition ?? 0 })
    triggerForm.textField("Condition value 1", "Condition Value", { defaultValue: blockEntry.data?.conditionValue1 ?? "" })
    triggerForm.textField("Condition value 2", "Condition Value", { defaultValue: blockEntry.data?.conditionValue2 ?? "" })
    triggerForm.textField("Condition value 3", "Condition Value", { defaultValue: blockEntry.data?.conditionValue3 ?? "" })
    triggerForm.textField("Run Command", "Command", { defaultValue: blockEntry.data?.runCommand ?? "" })

    triggerForm.toggle("Add this output", { defaultValue: false })
    triggerForm.textField("Output name", "name", { defaultValue: `output${Math.round(Math.random() * 10000)}` })
    triggerForm.dropdown("Output type", outputTypes, { defaultValueIndex: 0 })
    triggerForm.dropdown("Target", targetNames, { defaultValueIndex: 0 })
    triggerForm.dropdown("Target class info", inputs, { defaultValueIndex: 0 })
    triggerForm.textField("Target info value", "Value", { defaultValue: "" })
    triggerForm.textField("Delay (In ticks)", "Delay", { defaultValue: "0" })

    if (blockOutputs.length === 0) {
        triggerForm.label("No outputs exist.");
    } else {
        blockOutputs.forEach((output) => {
            triggerForm.label(`Target name: ${output.name}`)
            triggerForm.label(`Output type: ${output.outputType}`)
            triggerForm.label(`Target: ${output.targetName}`)
            triggerForm.label(`Target class info: ${output.targetProperty}`)
            triggerForm.label(`Target info value: ${output.targetValue}`)
            triggerForm.label(`Delay (In ticks): ${output.delay}`)
            triggerForm.toggle(`Delete: ${output.name}`, { defaultValue: false });
        });
    }

    const currentBlockName = blockEntry.data?.name;
    const inputsList = getBlocksTargetingCurrent(currentBlockName);
    if (inputsList.length === 0) {
        triggerForm.label(currentBlockName ? `No blocks have outputs saved for this block.` : "This block needs a name to receive inputs.");
    } else {
        const inputLabels = inputsList.map(input => `  - ${input.outputName} from ${input.sourceBlockName}`).join('\n');
        triggerForm.label(`This block is targeted by the following outputs:\n${inputLabels}`);
    }

    triggerForm.submitButton("Save")


    triggerForm.show(player).then((response) => {
        if (response.canceled) return;

        const formValues = response.formValues;

        // Add new output if requested
        if (formValues[7] && formValues[8]) {  // Add this output and output name provided
            const newOutput = {
                name: formValues[8],
                outputType: outputTypes[formValues[9]],
                targetName: targetNames[formValues[10]],
                targetProperty: inputs[formValues[11]],
                targetValue: formValues[12],
                delay: parseInt(formValues[13]) || 0,
            };
            blockOutputs.push(newOutput);
        }

        // Handle deletions for existing outputs
        let outputsToKeep = [];
        if (blockOutputs.length > 0) {
            const deleteStartIndex = 14;  // Toggles start after the 14 fixed fields
            for (let i = 0; i < blockOutputs.length; i++) {
                if (!formValues[deleteStartIndex + i]) {
                    outputsToKeep.push(blockOutputs[i]);
                }
            }
        }
        blockOutputs = outputsToKeep;

        // Save the updated data
        blockEntry.data = {
            name: formValues[0],
            startDisabled: formValues[1],
            executeCondition: formValues[2],
            conditionValue1: formValues[3],
            conditionValue2: formValues[4],
            conditionValue3: formValues[5],
            runCommand: formValues[6] || "",  // Ensure it's always a string
            outputs: blockOutputs
        };

        let blocks = loadLargeJSON("blocks");
        const index = blocks.findIndex(b => b.x === blockEntry.x && b.y === blockEntry.y && b.z === blockEntry.z && b.dimension === blockEntry.dimension);
        if (index !== -1) {
            blocks[index] = blockEntry;
            saveLargeJSON("blocks", blocks);
        }
        player.sendMessage("Trigger data saved!");
    });
}

const lastTrigger = new Map();
const COOLDOWN_MS = 500;

world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
    const block = data.block;
    if (blockList.includes(block.typeId)) {
        const now = Date.now();
        const previous = lastTrigger.get(data.player.id) ?? 0;
        if (now - previous < COOLDOWN_MS) return;
        lastTrigger.set(data.player.id, now);

        const blocks = loadLargeJSON("blocks");
        const blockEntry = blocks.find(b =>
            b.x === block.x && b.y === block.y && b.z === block.z && b.dimension === block.dimension.id
        );

        data.cancel = true;
        if (block.typeId === "brr:tool_trigger") {
            system.run(() => {
                triggerToolUI(data.player, blockEntry);
            });
        }
        if (block.typeId === "brr:tool_areaportal") {
            system.run(() => {
                areaPortalUI(data.player, blockEntry);
            });
        }
    }
});

// Handle player interaction with tracked tool blocks. Prevent default
// behavior and open the appropriate UI (e.g., trigger editor). A small
// cooldown per-player avoids rapid re-opening.


// areaportal tool ui will be here
function getNamedAreaPortals() {
    const blocks = loadLargeJSON("blocks");
    return blocks.filter(b => b.typeId === "brr:info_target_areaportal_block" && b.data?.name).map(b => b.data.name);
}


function areaPortalUI(player, blockEntry) {
    if (!blockEntry.data) blockEntry.data = {};
    const namedPortals = getNamedAreaPortals();
    const portalOptions = ["(None)"].concat(namedPortals);

    const portalForm = new ModalFormData();
    portalForm.title(`Area Portal Tool`);

    portalForm.textField("Name", "name", { defaultValue: blockEntry.data?.name ?? `areaportal${Math.round(Math.random() * 10000)}` });
    portalForm.toggle("Start disabled", { defaultValue: blockEntry.data?.startDisabled ?? false });
    portalForm.textField("Selector", "Selector (e.g., minecraft:player)", { defaultValue: blockEntry.data?.selector ?? "minecraft:player" });
    portalForm.textField("Destination", "Pos: XYZ (leave blank if using Destination Block)", { defaultValue: blockEntry.data?.destination ?? "" });
    portalForm.dropdown("Destination Block", portalOptions, { defaultValueIndex: namedPortals.indexOf(blockEntry.data?.destinationBlock) + 1 || 0 });

    portalForm.submitButton("Save");

    portalForm.show(player).then((response) => {
        if (response.canceled) return;

        const formValues = response.formValues;
        const selectedPortalIndex = formValues[4];
        const destinationBlock = selectedPortalIndex > 0 ? portalOptions[selectedPortalIndex] : null;

        // Basic validation
        if (destinationBlock && formValues[3]) {
            player.sendMessage("Cannot set both Destination and Destination Block. Using Destination Block.");
        }

        blockEntry.data = {
            name: formValues[0],
            startDisabled: formValues[1],
            selector: formValues[2],
            destination: formValues[3],
            destinationBlock: destinationBlock
        };

        let blocks = loadLargeJSON("blocks");
        const index = blocks.findIndex(b => b.x === blockEntry.x && b.y === blockEntry.y && b.z === blockEntry.z && b.dimension === blockEntry.dimension);
        if (index !== -1) {
            blocks[index] = blockEntry;
            saveLargeJSON("blocks", blocks);
        }
        player.sendMessage("Area Portal data saved!");
    });
}

system.runInterval(() => {
    const blocks = loadLargeJSON("blocks");
    for (const block of blocks) {
        if (block.typeId === "brr:tool_trigger") {
            const blockData = block.data;
            if (!blockData || blockData.startDisabled) continue;

            const players = world.getPlayers();
            for (const player of players) {
                const loc = player.location;
                if (loc.x >= block.x && loc.x < block.x + 1 &&
                    loc.y >= block.y && loc.y < block.y + 1 &&
                    loc.z >= block.z && loc.z < block.z + 1) {
                    // Inside the block, execute trigger
                    executeTriggerOutputs(block, { player, world });
                }
            }
        }
    }
}, 5);