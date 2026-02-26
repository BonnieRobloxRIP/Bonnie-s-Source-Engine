// SECTION: Output Target Keys
export let outputClassInfoTargets = [
    "startDisabled",

    "triggerConditionExecute",
    "triggerConditionValue1",
    "triggerConditionValue2",
    "triggerConditionValue3",
    "triggerRunCommand",

    "areaportalSelector",
    "areaportalDestination",
    "areaportalDestinationBlock",

    "playerspawnWorldSpawnAtBlock",
    "playerspawnWorldSpawn",
    "playerspawnSetsPlayerSpawnPoint",

    "playerclipExcludeOperators",
    "playerclipExcludeGamemode",
    "playerclipExcludeSelector",

    "npcclipExcludeSelector"
]

// SECTION: Output Target Metadata
export const outputTargetMetadata = {
    startDisabled: {
        label: "Start disabled",
        valueType: "boolean",
        supportedBlockTypes: ["*"]
    },
    triggerConditionExecute: {
        label: "Trigger: Execute on condition",
        valueType: "string",
        supportedBlockTypes: ["brr:tool_trigger"]
    },
    triggerConditionValue1: {
        label: "Trigger: Condition value 1",
        valueType: "string",
        supportedBlockTypes: ["brr:tool_trigger"]
    },
    triggerConditionValue2: {
        label: "Trigger: Condition value 2",
        valueType: "string",
        supportedBlockTypes: ["brr:tool_trigger"]
    },
    triggerConditionValue3: {
        label: "Trigger: Condition value 3",
        valueType: "string",
        supportedBlockTypes: ["brr:tool_trigger"]
    },
    triggerRunCommand: {
        label: "Trigger: Run command",
        valueType: "string",
        supportedBlockTypes: ["brr:tool_trigger"]
    },
    areaportalSelector: {
        label: "Area Portal: Selector",
        valueType: "string",
        supportedBlockTypes: ["brr:tool_areaportal"]
    },
    areaportalDestination: {
        label: "Area Portal: Destination",
        valueType: "string",
        supportedBlockTypes: ["brr:tool_areaportal"]
    },
    areaportalDestinationBlock: {
        label: "Area Portal: Destination block",
        valueType: "string",
        supportedBlockTypes: ["brr:tool_areaportal"]
    },
    playerspawnWorldSpawnAtBlock: {
        label: "Playerspawn: World spawn at block",
        valueType: "boolean",
        supportedBlockTypes: ["brr:info_playerspawn_block"]
    },
    playerspawnWorldSpawn: {
        label: "Playerspawn: World spawn",
        valueType: "string",
        supportedBlockTypes: ["brr:info_playerspawn_block"]
    },
    playerspawnSetsPlayerSpawnPoint: {
        label: "Playerspawn: Set player spawn point",
        valueType: "boolean",
        supportedBlockTypes: ["brr:info_playerspawn_block"]
    },
    playerclipExcludeOperators: {
        label: "Playerclip: Exclude operators",
        valueType: "boolean",
        supportedBlockTypes: ["brr:tool_playerclip"]
    },
    playerclipExcludeGamemode: {
        label: "Playerclip: Exclude gamemode",
        valueType: "string",
        supportedBlockTypes: ["brr:tool_playerclip"]
    },
    playerclipExcludeSelector: {
        label: "Playerclip: Exclude selector",
        valueType: "string",
        supportedBlockTypes: ["brr:tool_playerclip"]
    },
    npcclipExcludeSelector: {
        label: "Npcclip: Exclude selector",
        valueType: "string",
        supportedBlockTypes: ["brr:tool_npcclip"]
    }
};

// SECTION: Output Target Helpers
export function getOutputTargetLabel(targetProperty) {
    return outputTargetMetadata[targetProperty]?.label ?? targetProperty;
}

export function getOutputTargetValueType(targetProperty) {
    return outputTargetMetadata[targetProperty]?.valueType ?? "string";
}

export function isOutputTargetSupportedByBlockType(targetProperty, blockType) {
    const supportedTypes = outputTargetMetadata[targetProperty]?.supportedBlockTypes;
    if (!Array.isArray(supportedTypes) || supportedTypes.length === 0) return true;
    return supportedTypes.includes("*") || supportedTypes.includes(blockType);
}

// SECTION: Output Trigger Types
export const outputTypes = [
    "none",
    "onTrue",
    "onFalse",
]