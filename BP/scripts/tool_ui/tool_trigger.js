import { ModalFormData } from "@minecraft/server-ui";
import { addDecorativeSection, addReadOnlyListSection } from "./ui_formatting.js";

function isBlacklistedTriggerCommand(command) {
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

export function triggerToolUI(player, blockEntry, options) {
	if (!blockEntry.data) blockEntry.data = {};

	const {
		onSave,
		conditionTools,
		validateConditionRequirements,
		getNamedTargets,
		getBlocksTargetingCurrent,
		outputTypes,
		inputs
	} = options;

	const triggerForm = new ModalFormData();
	triggerForm.title("Trigger Tool");
	if (!Array.isArray(blockEntry.data.outputs)) blockEntry.data.outputs = [];
	const blockOutputs = [...blockEntry.data.outputs];
	const namedTargets = getNamedTargets();
	const targetOptions = namedTargets.length > 0 ? namedTargets : ["(No named blocks)"];

	addDecorativeSection(triggerForm, "Class Info");
	const blockName = blockEntry.data?.name || `trigger${Math.round(Math.random() * 10000)}`;
	triggerForm.textField("Name", "name", { defaultValue: blockName });
	triggerForm.toggle("Start disabled", { defaultValue: Boolean(blockEntry.data?.startDisabled) });
	triggerForm.dropdown("Execute on condition", conditionTools, { defaultValueIndex: Math.max(0, conditionTools.indexOf(blockEntry.data?.executeCondition || "noCondition")) });
	triggerForm.textField("Condition value 1", "Value 1 (leave blank if not needed)", { defaultValue: blockEntry.data?.conditionValue1 || "" });
	triggerForm.textField("Condition value 2", "Value 2 (leave blank if not needed)", { defaultValue: blockEntry.data?.conditionValue2 || "" });
	triggerForm.textField("Condition value 3", "Value 3 (leave blank if not needed)", { defaultValue: blockEntry.data?.conditionValue3 || "" });
	triggerForm.textField("Run Command", "Command to execute", { defaultValue: blockEntry.data?.runCommand || "" });

	addDecorativeSection(triggerForm, "Outputs");
	triggerForm.toggle("Add this output", { defaultValue: false });
	triggerForm.textField("Output Name", "name", { defaultValue: `output${Math.round(Math.random() * 10000)}` });
	triggerForm.dropdown("Output Type", outputTypes, { defaultValueIndex: 0 });
	triggerForm.dropdown("Output Target", targetOptions, { defaultValueIndex: 0 });
	triggerForm.dropdown("Target Class Info", inputs, { defaultValueIndex: 0 });
	triggerForm.textField("Target Info Value", "Value", { defaultValue: "" });
	triggerForm.textField("Delay (in ticks)", "0", { defaultValue: "0" });

	addDecorativeSection(triggerForm, "Existing Outputs");
	if (blockOutputs.length === 0) {
		triggerForm.label("No outputs exist.");
	} else {
		for (const output of blockOutputs) {
			triggerForm.label(`Output name: ${output?.name || "(unnamed)"}`);
			triggerForm.label(`Output type: ${output?.outputType || "none"}`);
			triggerForm.label(`Target: ${output?.targetName || "(none)"}`);
			triggerForm.label(`Target class info: ${output?.targetProperty || "(none)"}`);
			triggerForm.label(`Target value: ${output?.targetValue || ""}`);
			triggerForm.label(`Delay: ${output?.delay ?? 0}`);
			triggerForm.toggle(`Delete: ${output?.name || "(unnamed output)"}`, { defaultValue: false });
			triggerForm.divider();
		}
	}

	const currentBlockName = blockEntry.data?.name;
	const inputsList = getBlocksTargetingCurrent(currentBlockName);
	const inputLines = inputsList.map(input => `  - ${input.outputName} from ${input.sourceBlockName}`);
	const emptyInputsMessage = currentBlockName
		? "No blocks have outputs saved for this block."
		: "This block needs a name to receive inputs.";
	addReadOnlyListSection(triggerForm, "Inputs", inputLines, emptyInputsMessage);

	triggerForm.submitButton("Save");

	triggerForm.show(player).then((response) => {
		if (response.canceled) return;

		const formValues = (response.formValues ?? []).filter(value => value !== undefined && value !== null);
		if (formValues.length < 14) {
			player.sendMessage("§cSave failed: form data is incomplete.");
			return;
		}

		let cursor = 0;
		const name = `${formValues[cursor++] ?? blockName}`;
		const startDisabled = Boolean(formValues[cursor++]);
		const selectedCondition = conditionTools[Number(formValues[cursor++])] ?? "noCondition";
		const v1 = `${formValues[cursor++] ?? ""}`;
		const v2 = `${formValues[cursor++] ?? ""}`;
		const v3 = `${formValues[cursor++] ?? ""}`;
		const runCommand = `${formValues[cursor++] ?? ""}`;

		const shouldAddOutput = Boolean(formValues[cursor++]);
		const outputName = `${formValues[cursor++] ?? ""}`.trim();
		const outputTypeIndex = Number(formValues[cursor++]);
		const outputTargetIndex = Number(formValues[cursor++]);
		const outputTargetPropertyIndex = Number(formValues[cursor++]);
		const outputTargetValue = `${formValues[cursor++] ?? ""}`;
		const outputDelayRaw = Number.parseInt(`${formValues[cursor++] ?? "0"}`, 10);
		const outputDelay = Number.isFinite(outputDelayRaw) ? Math.max(0, outputDelayRaw) : 0;

		let nextOutputs = blockOutputs;
		if (shouldAddOutput && outputName) {
			const selectedTarget = targetOptions[outputTargetIndex] ?? "";
			if (selectedTarget && selectedTarget !== "(No named blocks)") {
				nextOutputs.push({
					name: outputName,
					outputType: outputTypes[outputTypeIndex] ?? outputTypes[0] ?? "onTrue",
					targetName: selectedTarget,
					targetProperty: inputs[outputTargetPropertyIndex] ?? inputs[0] ?? "startDisabled",
					targetValue: outputTargetValue,
					delay: outputDelay
				});
			}
		}

		if (blockOutputs.length > 0) {
			const outputsToKeep = [];
			for (let i = 0; i < blockOutputs.length; i++) {
				const shouldDelete = Boolean(formValues[cursor++]);
				if (!shouldDelete) outputsToKeep.push(blockOutputs[i]);
			}
			nextOutputs = outputsToKeep;
		}

		const validationError = validateConditionRequirements(selectedCondition, v1, v2, v3);
		if (validationError) {
			player.sendMessage(`§c${validationError}`);
			return;
		}

		if (isBlacklistedTriggerCommand(runCommand)) {
			player.sendMessage("§cBlocked command: /op and /deop are blacklisted from Trigger blocks. Nice try kiddo");
			return;
		}

		blockEntry.data = {
			...blockEntry.data,
			name,
			startDisabled,
			executeCondition: selectedCondition,
			conditionValue1: v1,
			conditionValue2: v2,
			conditionValue3: v3,
			runCommand,
			outputs: nextOutputs
		};

		if (onSave) onSave(blockEntry);
		player.sendMessage(`§aTrigger "${blockEntry.data.name}" saved!`);
	});
}

