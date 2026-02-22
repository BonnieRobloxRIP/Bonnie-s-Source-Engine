import { ModalFormData } from "@minecraft/server-ui";
import { world } from "@minecraft/server";
import { outputClassInfoTargets, outputTypes } from "./output_ci_targets.js";
import { addDecorativeSection, addReadOnlyListSection } from "./ui_formatting.js";

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

function getNamedTargets() {
    const blocks = loadLargeJSON("blocks");
    const namedBlocks = blocks.filter(b => b.data && b.data.name).map(b => b.data.name);
    return [...new Set(namedBlocks)];
}

function getBlocksTargetingCurrent(currentBlockName) {
    const allBlocks = loadLargeJSON("blocks");
    const inputsList = [];
    if (!currentBlockName) return inputsList;

    allBlocks.forEach(block => {
        if (block.data && block.data.outputs) {
            block.data.outputs.forEach(output => {
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

export function infoPlayerspawnUI(player, blockEntry, onSave) {
    if (!blockEntry.data) blockEntry.data = {};
    if (!Array.isArray(blockEntry.data.outputs)) blockEntry.data.outputs = [];

    const blockOutputs = [...blockEntry.data.outputs];
    const namedTargets = getNamedTargets();
    const targetOptions = namedTargets.length > 0 ? namedTargets : ["(No named blocks)"];

    const playerspawnForm = new ModalFormData();
    playerspawnForm.title("Info Playerspawn Block");
    addDecorativeSection(playerspawnForm, "Class Info");

    const spawnName = blockEntry.data?.name || `playerspawn${Math.round(Math.random() * 10000)}`;
    playerspawnForm.textField("Name", "name", { defaultValue: spawnName });
    playerspawnForm.toggle("Start disabled", { defaultValue: Boolean(blockEntry.data?.startDisabled) });
    playerspawnForm.toggle("World spawn at block", { defaultValue: blockEntry.data?.worldSpawnAtBlock !== false });
    playerspawnForm.textField("World spawn coordinates", "Pos: XYZ (e.g., 0 64 0)", { defaultValue: blockEntry.data?.worldSpawn || "" });
    playerspawnForm.toggle("Set Player Spawn Point", { defaultValue: Boolean(blockEntry.data?.setsPlayerSpawnPoint) });

    addDecorativeSection(playerspawnForm, "Outputs");
    playerspawnForm.toggle("Add this output", { defaultValue: false });
    playerspawnForm.textField("Output Name", "name", { defaultValue: `output${Math.round(Math.random() * 10000)}` });
    playerspawnForm.dropdown("Output Type", outputTypes, { defaultValueIndex: 0 });
    playerspawnForm.dropdown("Output Target", targetOptions, { defaultValueIndex: 0 });
    playerspawnForm.dropdown("Target Class Info", outputClassInfoTargets, { defaultValueIndex: 0 });
    playerspawnForm.textField("Target Info Value", "Value", { defaultValue: "" });
    playerspawnForm.textField("Delay (in ticks)", "0", { defaultValue: "0" });

    addDecorativeSection(playerspawnForm, "Existing Outputs");
    if (blockOutputs.length === 0) {
        playerspawnForm.label("No outputs exist.");
    } else {
        blockOutputs.forEach(output => {
            playerspawnForm.label(`Output name: ${output?.name || "(unnamed)"}`);
            playerspawnForm.label(`Output type: ${output?.outputType || "none"}`);
            playerspawnForm.label(`Target: ${output?.targetName || "(none)"}`);
            playerspawnForm.label(`Target class info: ${output?.targetProperty || "(none)"}`);
            playerspawnForm.label(`Target value: ${output?.targetValue || ""}`);
            playerspawnForm.label(`Delay: ${output?.delay ?? 0}`);
            playerspawnForm.toggle(`Delete: ${output?.name || "(unnamed output)"}`, { defaultValue: false });
            playerspawnForm.divider();
        });
    }

    const currentBlockName = blockEntry.data?.name;
    const inputsList = getBlocksTargetingCurrent(currentBlockName);
    const inputLines = inputsList.map(input => `  - ${input.outputName} from ${input.sourceBlockName}`);
    const emptyInputsMessage = currentBlockName
        ? "No blocks have outputs saved for this block."
        : "This block needs a name to receive inputs.";
    addReadOnlyListSection(playerspawnForm, "Inputs", inputLines, emptyInputsMessage);

    playerspawnForm.submitButton("Save");

    playerspawnForm.show(player).then((response) => {
        if (response.canceled) return;

        const formData = (response.formValues ?? []).filter(value => value !== undefined && value !== null);
        if (formData.length < 12) {
            player.sendMessage("§cSave failed: form data is incomplete.");
            return;
        }

        let cursor = 0;
        const name = `${formData[cursor++] ?? spawnName}`;
        const startDisabled = Boolean(formData[cursor++]);
        const worldSpawnAtBlock = Boolean(formData[cursor++]);
        const worldSpawn = `${formData[cursor++] ?? ""}`;
        const setsPlayerSpawnPoint = Boolean(formData[cursor++]);

        const addOutput = Boolean(formData[cursor++]);
        const outputName = `${formData[cursor++] ?? ""}`.trim();
        const outputTypeIndex = Number(formData[cursor++]);
        const outputTargetIndex = Number(formData[cursor++]);
        const outputTargetPropertyIndex = Number(formData[cursor++]);
        const outputTargetValue = `${formData[cursor++] ?? ""}`;
        const outputDelayRaw = Number.parseInt(`${formData[cursor++] ?? "0"}`, 10);
        const outputDelay = Number.isFinite(outputDelayRaw) ? Math.max(0, outputDelayRaw) : 0;

        let nextOutputs = blockOutputs;
        if (addOutput && outputName) {
            const selectedTarget = targetOptions[outputTargetIndex] ?? "";
            if (selectedTarget && selectedTarget !== "(No named blocks)") {
                nextOutputs.push({
                    name: outputName,
                    outputType: outputTypes[outputTypeIndex] ?? outputTypes[0] ?? "none",
                    targetName: selectedTarget,
                    targetProperty: outputClassInfoTargets[outputTargetPropertyIndex] ?? outputClassInfoTargets[0] ?? "startDisabled",
                    targetValue: outputTargetValue,
                    delay: outputDelay
                });
            }
        }

        if (blockOutputs.length > 0) {
            const outputsToKeep = [];
            for (let i = 0; i < blockOutputs.length; i++) {
                const shouldDelete = Boolean(formData[cursor++]);
                if (!shouldDelete) outputsToKeep.push(blockOutputs[i]);
            }
            nextOutputs = outputsToKeep;
        }

        blockEntry.data.name = name;
        blockEntry.data.startDisabled = startDisabled;
        blockEntry.data.worldSpawnAtBlock = worldSpawnAtBlock;
        blockEntry.data.worldSpawn = worldSpawn;
        blockEntry.data.setsPlayerSpawnPoint = setsPlayerSpawnPoint;
        blockEntry.data.outputs = nextOutputs;

        // Call the save callback
        if (onSave) onSave(blockEntry);
        player.sendMessage(`§aPlayerspawn block "${blockEntry.data.name}" saved!`);
    });
}
