const TARGET_PROPERTY_ALIASES = {
	playerspawnWorldSpawnAtBlock: "worldSpawnAtBlock",
	playerspawnWorldSpawn: "worldSpawn",
	playerspawnSetsPlayerSpawnPoint: "setsPlayerSpawnPoint",
	playerspawnSelectors: "selectors",
	playerclipExcludeOperators: "excludeOperators",
	playerclipExcludeGamemode: "excludeGamemode",
	playerclipExcludeSelector: "excludeSelector",
	npcclipExcludeSelector: "excludeSelector",
	gameNametagWorksInUsernames: "worksInUsernames",
	gameNametagWorksInChat: "worksInChat",
	gameNametagSuffix: "suffix",
	gameNametagPrefix: "prefix",
	gameNametagNametag: "nametag",
	gameNametagOrder: "nametagOrder",
	gameNametagSelectors: "selectors",
	triggerConditionExecute: "executeCondition",
	triggerConditionValue1: "conditionValue1",
	triggerConditionValue2: "conditionValue2",
	triggerConditionValue3: "conditionValue3",
	triggerRunCommand: "runCommand",
	areaportalSelector: "selector",
	areaportalDestination: "destination",
	areaportalDestinationBlock: "destinationBlock",
	executeOnCondition: "executeCondition",
	executeOnConditon: "executeCondition"
};

function resolveOutputTargetProperty(targetProperty) {
	return TARGET_PROPERTY_ALIASES[targetProperty] ?? targetProperty;
}

// SECTION: Trigger Runtime Helpers
export function isBlockedTriggerCommand(command) {
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

export function getNormalizedTriggerData(data, conditionTools) {
	if (!data) return data;
	const normalized = { ...data };

	// Support older saved keys while converging everything to executeCondition/conditionValueX.
	normalized.executeCondition = normalized.executeCondition
		?? normalized.executeOnCondition
		?? normalized.executeOnConditon
		?? normalized.triggerConditionExecute;
	normalized.conditionValue1 = normalized.conditionValue1 ?? normalized.triggerConditionValue1;
	normalized.conditionValue2 = normalized.conditionValue2 ?? normalized.triggerConditionValue2;
	normalized.conditionValue3 = normalized.conditionValue3 ?? normalized.triggerConditionValue3;
	normalized.runCommand = normalized.runCommand ?? normalized.triggerRunCommand;

	if (typeof normalized.executeCondition === "number") {
		normalized.executeCondition = conditionTools?.[normalized.executeCondition] ?? "noCondition";
	}

	if (typeof normalized.executeCondition !== "string" || !normalized.executeCondition) {
		normalized.executeCondition = "noCondition";
	}

	return normalized;
}

export function fireOutputsForEvent(sourceBlock, eventName, options) {
	if (!sourceBlock?.data || sourceBlock.data.startDisabled) return;
	const outputs = Array.isArray(sourceBlock.data.outputs) ? sourceBlock.data.outputs : [];
	if (outputs.length === 0) return;

	const { loadBlocks, saveBlocks, parseBooleanLike } = options ?? {};
	if (typeof loadBlocks !== "function" || typeof saveBlocks !== "function" || typeof parseBooleanLike !== "function") return;

	function coerceOutputTargetValue(targetProperty, rawValue) {
		if (targetProperty === "worldSpawnAtBlock"
			|| targetProperty === "setsPlayerSpawnPoint"
			|| targetProperty === "excludeOperators"
			|| targetProperty === "worksInUsernames"
			|| targetProperty === "worksInChat"
			|| targetProperty === "suffix"
			|| targetProperty === "prefix"
			|| targetProperty === "startDisabled") {
			return parseBooleanLike(rawValue, false);
		}

		return `${rawValue ?? ""}`;
	}

	const blocks = loadBlocks("blocks");
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

	if (changed) saveBlocks("blocks", blocks);
}

export function fireNamedOutput(sourceBlock, outputName, options) {
	if (!sourceBlock?.data || sourceBlock.data.startDisabled) return;
	const outputs = Array.isArray(sourceBlock.data.outputs) ? sourceBlock.data.outputs : [];
	if (outputs.length === 0) return;

	const { loadBlocks, saveBlocks, parseBooleanLike } = options ?? {};
	if (typeof loadBlocks !== "function" || typeof saveBlocks !== "function" || typeof parseBooleanLike !== "function") return;

	function coerceValue(targetProperty, rawValue) {
		if (targetProperty === "worldSpawnAtBlock"
			|| targetProperty === "setsPlayerSpawnPoint"
			|| targetProperty === "excludeOperators"
			|| targetProperty === "worksInUsernames"
			|| targetProperty === "worksInChat"
			|| targetProperty === "suffix"
			|| targetProperty === "prefix"
			|| targetProperty === "startDisabled"
			|| targetProperty === "coopSetStateATrue"
			|| targetProperty === "coopSetStateAFalse"
			|| targetProperty === "coopToggleStateA"
			|| targetProperty === "coopSetStateBTrue"
			|| targetProperty === "coopSetStateBFalse"
			|| targetProperty === "coopToggleStateB"
			|| targetProperty === "randomChanceTrigger") {
			return parseBooleanLike(rawValue, false);
		}
		return `${rawValue ?? ""}`;
	}

	const blocks = loadBlocks("blocks");
	let changed = false;

	for (const output of outputs) {
		if (`${output?.name ?? ""}`.trim() !== outputName) continue;

		const targetName = `${output?.targetName ?? ""}`.trim();
		const targetProperty = resolveOutputTargetProperty(`${output?.targetProperty ?? ""}`.trim());
		if (!targetName || !targetProperty) continue;

		const targetIndex = blocks.findIndex(block => `${block?.data?.name ?? ""}`.trim() === targetName);
		if (targetIndex === -1) continue;

		if (!blocks[targetIndex].data) blocks[targetIndex].data = {};
		blocks[targetIndex].data[targetProperty] = coerceValue(targetProperty, output?.targetValue);
		changed = true;
	}

	if (changed) saveBlocks("blocks", blocks);
}
