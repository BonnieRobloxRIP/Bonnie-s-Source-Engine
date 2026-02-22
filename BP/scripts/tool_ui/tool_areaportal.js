import { ModalFormData } from "@minecraft/server-ui";
import { world } from "@minecraft/server";
import { outputClassInfoTargets, outputTypes } from "./output_ci_targets.js";
import { addDecorativeSection, addReadOnlyListSection } from "./ui_formatting.js";

function getNamedAreaPortals() {
    const blocks = loadLargeJSON("blocks");
    return blocks.filter(b => b.typeId === "brr:info_target_areaportal_block" && b.data?.name).map(b => b.data.name);
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

export function areaPortalToolUI(player, blockEntry, onSave) {
    if (!blockEntry.data) blockEntry.data = {};
    if (!Array.isArray(blockEntry.data.outputs)) blockEntry.data.outputs = [];

    const namedPortals = getNamedAreaPortals();
    const portalOptions = ["(None)"].concat(namedPortals);
    const blockOutputs = [...blockEntry.data.outputs];
    const namedTargets = getNamedTargets();
    const targetOptions = namedTargets.length > 0 ? namedTargets : ["(No named blocks)"];

    const portalForm = new ModalFormData();
    portalForm.title("Area Portal Tool");
    addDecorativeSection(portalForm, "Class Info");

    const portalName = blockEntry.data?.name || `areaportal${Math.round(Math.random() * 10000)}`;
    portalForm.textField("Name", "name", { defaultValue: portalName });
    portalForm.toggle("Start disabled", { defaultValue: Boolean(blockEntry.data?.startDisabled) });
    portalForm.textField("Selector", "Selector (e.g., minecraft:player)", { defaultValue: blockEntry.data?.selector || "minecraft:player" });
    portalForm.textField("Destination", "Pos: XYZ (leave blank if using Destination Block)", { defaultValue: blockEntry.data?.destination || "" });
    portalForm.dropdown("Destination Block", portalOptions, { defaultValueIndex: blockEntry.data?.destinationBlock ? namedPortals.indexOf(blockEntry.data.destinationBlock) + 1 : 0 });

    addDecorativeSection(portalForm, "Outputs");
    portalForm.toggle("Add this output", { defaultValue: false });
    portalForm.textField("Output Name", "name", { defaultValue: `output${Math.round(Math.random() * 10000)}` });
    portalForm.dropdown("Output Type", outputTypes, { defaultValueIndex: 0 });
    portalForm.dropdown("Output Target", targetOptions, { defaultValueIndex: 0 });
    portalForm.dropdown("Target Class Info", outputClassInfoTargets, { defaultValueIndex: 0 });
    portalForm.textField("Target Info Value", "Value", { defaultValue: "" });
    portalForm.textField("Delay (in ticks)", "0", { defaultValue: "0" });

    addDecorativeSection(portalForm, "Existing Outputs");
    if (blockOutputs.length === 0) {
        portalForm.label("No outputs exist.");
    } else {
        blockOutputs.forEach(output => {
            portalForm.label(`Output name: ${output?.name || "(unnamed)"}`);
            portalForm.label(`Output type: ${output?.outputType || "none"}`);
            portalForm.label(`Target: ${output?.targetName || "(none)"}`);
            portalForm.label(`Target class info: ${output?.targetProperty || "(none)"}`);
            portalForm.label(`Target value: ${output?.targetValue || ""}`);
            portalForm.label(`Delay: ${output?.delay ?? 0}`);
            portalForm.toggle(`Delete: ${output?.name || "(unnamed output)"}`, { defaultValue: false });
            portalForm.divider();
        });
    }

    const currentBlockName = blockEntry.data?.name;
    const inputsList = getBlocksTargetingCurrent(currentBlockName);
    const inputLines = inputsList.map(input => `  - ${input.outputName} from ${input.sourceBlockName}`);
    const emptyInputsMessage = currentBlockName
        ? "No blocks have outputs saved for this block."
        : "This block needs a name to receive inputs.";
    addReadOnlyListSection(portalForm, "Inputs", inputLines, emptyInputsMessage);

    portalForm.submitButton("Save");

    portalForm.show(player).then((response) => {
        if (response.canceled) return;

        const formData = (response.formValues ?? []).filter(value => value !== undefined && value !== null);
        if (formData.length < 12) {
            player.sendMessage("§cSave failed: form data is incomplete.");
            return;
        }

        let cursor = 0;

        const name = `${formData[cursor++] ?? portalName}`;
        const startDisabled = Boolean(formData[cursor++]);
        const selector = `${formData[cursor++] ?? "minecraft:player"}`;
        const destination = `${formData[cursor++] ?? ""}`;
        const selectedPortalIndex = Number(formData[cursor++]);

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
        blockEntry.data.selector = selector;
        blockEntry.data.destination = destination;
        if (selectedPortalIndex > 0) {
            blockEntry.data.destinationBlock = namedPortals[selectedPortalIndex - 1];
            // Clear destination if using destinationBlock
            blockEntry.data.destination = "";
        } else {
            blockEntry.data.destinationBlock = "";
        }
        blockEntry.data.outputs = nextOutputs;

        // Validate that at least one destination method is chosen
        if (!blockEntry.data.destination && !blockEntry.data.destinationBlock) {
            player.sendMessage("§cError: You must specify either a Destination or Destination Block!");
            return;
        }

        // Call the save callback
        if (onSave) onSave(blockEntry);
        player.sendMessage(`§aArea Portal "${blockEntry.data.name}" saved!`);
    });
}
