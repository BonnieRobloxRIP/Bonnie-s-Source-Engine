import { world, system, CommandPermissionLevel, CustomCommandParamType } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";

let visible = false;
let blockList = ["brr:areaportal_tool", "brr:blockbullets_brush", "brr:npcclip_tool", "brr:blocklight_tool", "brr:func_train", "brr:info_playerspawn", "brr:invisible_brush", "brr:nodraw_brush", "brr:nodraw_portable_brush", "brr:playerclip_brush", "brr:skip_tool", "brr:skybox_brush", "brr:trigger_tool"];
let collisionsList = ["brr:nodraw_brush", "brr:invisible_brush", "brr:skybox_brush", "brr:nodraw_portable_brush"];
const MAX_SIZE = 28000;
const conditions = [
    "noCondition",
    "ifPlayerNameIs",
    "ifPlayerNameIsNot",
    "ifPlayerIsSneaking",
    "ifPlayerIsSwimming",
    "ifPlayerIsRiding",
    "ifPlayerIsWearing",
    "ifPlayerHasTag",
    "ifPlayerDoesNotHaveTag",
    "ifPlayerScoreIsHigher",
    "ifPlayerScoreIsLower",
    "ifPlayerScoreIs",
    "ifPlayerHasNoScore",
    "ifPlayerHasScore",
    "ifPlayerHasInInventory",
    "ifPlayerDoesNotHaveInInventory",
    "ifPlayerHealthIsHigher",
    "ifPlayerHealthIsLower",
    "ifPlayerHealthIsFull",
    "ifPlayerIsDead",
    "ifPlayerIsAlive",
    "ifPlayerIsOnConsole",
    "ifPlayerIsOnMobile",
    "ifPlayerisOnDesktop",
    "ifPlayerLanguageIs",
    "ifPlayerLanguageIsNot",
    "ifPlayerIsAt",
    "ifPlayerIsNotAt",
    "ifPlayerDamaged",
    "ifPlayerDamagedFromSource",

    "ifScoreIsHigher",
    "ifScoreIsLower",
    "ifScoreIs",
    "ifScoreIsNot",

    "ifEntityHasTag",
    "ifEntityDoesNotHaveTag",
    "ifEntityHasName",
    "ifEntityDoesNotHaveName",
    "ifEntityNameIsNot",
    "ifEntityScoreIsHigher",
    "ifEntityScoreIsLower",
    "ifEntityScoreIs",
    "ifEntityHasNoScore",
    "ifEntityHasScore",
    "ifEntityHealthIsHigher",
    "ifEntityHealthIsLower",
    "ifEntityHealthIsFull",
    "ifEntityIsDead",
    "ifEntityIsAlive",
    "ifEntityHasInInventory",
    "ifEntityDoesNotHaveInInventory",
    "ifEntityExists",
    "ifEntityDoesNotExist",
    "ifEntityIsAt",
    "ifEntityIsNotAt",
    "ifEntityDamaged",
    "ifEntityDamagedFromSource",

    "ifBlockIs",
    "ifBlockIsNot",
    "ifBlockHas",
    "ifBlockDoesNotHave",
    "ifBlocksAre",
    "ifBlockAreaHas",
    "ifBlocksAreNot",
    "ifBlockAreaDoesNotHave",

    "ifTimeIs",
    "ifTimeIsNot",
    "ifWeatherIs",
    "ifWeatherIsNot",

    "ifItemDurabilityIs",
    "ifItemDurabilityFull",
    "ifItemDurabilityIsHigher",
    "ifItemDurabilityIsLower"
];
const outputTypes = ["onStartTouch", "onStart", "onTrigger", "onFalse", "onTrue", "onEntityTouch"];
const inputs = ["startDisabled", "selector", "destination", "destinationBlock", "worldSpawnAtBlock", "worldSpawn", "executeOnConditon", "triggerConditionValue1", "triggerConditionValue2", "triggerConditionValue3", "runCommand"];

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



world.beforeEvents.playerBreakBlock.subscribe((data) => {
    const block = data.block;
    let blocks = loadLargeJSON("blocks");
    if (blockList.includes(block.typeId)) {
        blocks = blocks.filter((b) => !(b.x === block.x && b.y === block.y && b.z === block.z && b.dimension === block.dimension.id));
        saveLargeJSON("blocks", blocks);
    }
})

world.afterEvents.playerPlaceBlock.subscribe((data) => {
    const block = data.block;
    let blocks = loadLargeJSON("blocks");
    if (blockList.includes(block.typeId)) {
        blocks.push({ x: block.x, y: block.y, z: block.z, typeId: block.typeId, dimension: block.dimension.id });
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

            if (subcommand === "engine_blocks_always_visible") {
                visible = value ?? false;
                sender.sendMessage(`Toggled tool blocks visibility to ${visible}`);
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

function triggerToolUI(player, blockEntry) {
    if (!blockEntry.data) blockEntry.data = {};
    if (!blockEntry.data.outputs) blockEntry.data.outputs = [];

    let blockOutputs = blockEntry.data.outputs;
    const targetNames = getNamedTargets();

    const triggerForm = new ModalFormData()
    triggerForm.title(`Trigger Tool`)

    triggerForm.divider()
    triggerForm.header("Class Info")
    triggerForm.divider()

    triggerForm.textField("Name", "name", { defaultValue: blockEntry.data?.name ?? `trigger${Math.round(Math.random() * 10000)}` })
    triggerForm.toggle("Start disabled", { defaultValue: blockEntry.data?.startDisabled ?? false })
    triggerForm.dropdown("Execute on condition", conditions, { defaultValueIndex: blockEntry.data?.executeCondition ?? 0 })
    triggerForm.textField("Condition value 1", "Condtion Value", { defaultValue: blockEntry.data?.conditionValue1 ?? "" })
    triggerForm.textField("Condition value 2", "Condtion Value", { defaultValue: blockEntry.data?.conditionValue2 ?? "" })
    triggerForm.textField("Condition value 3", "Condtion Value", { defaultValue: blockEntry.data?.conditionValue3 ?? "" })
    triggerForm.textField("Run Command", "Command", { defaultValue: blockEntry.data?.runCommand ?? "" })

    triggerForm.divider()
    triggerForm.header("Add New Output")
    triggerForm.divider()

    triggerForm.toggle("Add this output", { defaultValue: false })
    triggerForm.textField("Output name", "name", { defaultValue: `output${Math.round(Math.random() * 10000)}` })
    triggerForm.dropdown("Output type", outputTypes, { defaultValueIndex: 0 })
    triggerForm.dropdown("Target", targetNames, { defaultValueIndex: 0 })
    triggerForm.dropdown("Target class info", inputs, { defaultValueIndex: 0 })
    triggerForm.textField("Target info value", "Value", { defaultValue: "" })
    triggerForm.textField("Delay (In ticks)", "Delay", { defaultValue: "0" })

    triggerForm.divider()
    triggerForm.header(`Existing Outputs`)

    if (blockOutputs.length === 0) {
        triggerForm.label("No outputs exist.");
    } else {
        blockOutputs.forEach((output) => {
            triggerForm.divider()
            triggerForm.label(`Target name: ${output.name}`)
            triggerForm.label(`Output type: ${output.outputType}`)
            triggerForm.label(`Target: ${output.targetName}`)
            triggerForm.label(`Target class info: ${output.targetProperty}`)
            triggerForm.label(`Target info value: ${output.targetValue}`)
            triggerForm.label(`Delay (In ticks): ${output.delay}`)
            triggerForm.toggle(`Delete: ${output.name}`, { defaultValue: false });
        });
    }

    triggerForm.divider()
    triggerForm.header("Inputs")
    triggerForm.divider()

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

        const newOutputName = formValues[14];
        const newOutputDelay = parseInt(formValues[19]);

        if (!isNaN(newOutputDelay) && newOutputName && formValues[13]) {
            const newOutput = {
                name: newOutputName,
                outputType: outputTypes[formValues[15]],
                targetName: targetNames[formValues[16]],
                targetProperty: inputs[formValues[17]],
                targetValue: formValues[18],
                delay: newOutputDelay,
            };
            blockOutputs.push(newOutput);
        }

        let outputsToKeep = [];
        if (blockOutputs.length > 0) {
            for (let i = 0; i < blockOutputs.length; i++) {
                const output = blockOutputs[i];
                const deleteToggleValue = formValues[23 + i];
                if (!deleteToggleValue) {
                    outputsToKeep.push(output);
                }
            }
            blockOutputs = outputsToKeep;
        }

        blockEntry.data = {
            name: formValues[3],
            startDisabled: formValues[4],
            executeCondition: formValues[5],
            conditionValue1: formValues[6],
            conditionValue2: formValues[7],
            conditionValue3: formValues[8],
            runCommand: formValues[9],
            outputs: blockOutputs // Save the updated list of outputs
        };

        let blocks = loadLargeJSON("blocks");
        const index = blocks.findIndex(b =>
            b.x === blockEntry.x &&
            b.y === blockEntry.y &&
            b.z === blockEntry.z &&
            b.dimension === blockEntry.dimension
        );

        if (index !== -1) {
            blocks[index] = blockEntry;
            saveLargeJSON("blocks", blocks);
        }
    });
}

const lastTrigger = new Map();
const COOLDOWN_MS = 500;

world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
    const block = data.block;
    if (blockList.includes(block.typeId) && !data.player.isSneaking) {
        const now = Date.now();
        const previous = lastTrigger.get(data.player.id) ?? 0;
        if (now - previous < COOLDOWN_MS) return;
        lastTrigger.set(data.player.id, now);

        const blocks = loadLargeJSON("blocks");
        const blockEntry = blocks.find(b =>
            b.x === block.x && b.y === block.y && b.z === block.z && b.dimension === block.dimension.id
        );

        data.cancel = true;
        if (block.typeId === "brr:areaportal_tool") {

        }
        if (block.typeId === "brr:trigger_tool") {
            system.run(() => {
                triggerToolUI(data.player, blockEntry);
            })
        }
    }
})

