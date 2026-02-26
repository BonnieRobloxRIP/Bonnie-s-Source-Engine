import { ModalFormData } from "@minecraft/server-ui";
import { world } from "@minecraft/server";
import { addDecorativeSection, addReadOnlyListSection } from "./ui_formatting.js";

// SECTION: Npcclip Runtime Helpers
export function selectorTargetsEntity(selectorRaw, entity, block, options) {
    const selector = `${selectorRaw ?? ""}`.trim();
    if (!selector || !entity || !block?.dimension) return false;

    const normalized = selector.toLowerCase();
    const { parseSelectorFilters, applyEntityFilters } = options ?? {};

    if (!normalized.startsWith("@")) {
        const expected = normalized;
        const entityType = `${entity.typeId ?? ""}`.trim().toLowerCase();
        const entityName = `${entity.nameTag ?? ""}`.trim().toLowerCase();
        return expected === entityType || expected === entityName;
    }

    const base = normalized.slice(0, 2);
    if (base !== "@e") return false;

    let dimension;
    try {
        dimension = world.getDimension(block.dimension);
    } catch {
        return false;
    }

    let entities = Array.from(dimension.getEntities());
    const filters = typeof parseSelectorFilters === "function" ? parseSelectorFilters(selector) : null;
    entities = typeof applyEntityFilters === "function" ? applyEntityFilters(entities, filters) : entities;
    return entities.some(candidate => candidate?.id === entity.id);
}

export function shouldEnableNpcclipCollision(block, options) {
    if (!block) return false;

    const {
        toolsEnabled,
        parseBooleanLike,
        isEntityNearBlock,
        parseSelectorFilters,
        applyEntityFilters
    } = options ?? {};

    if (!toolsEnabled) return false;
    if (typeof parseBooleanLike !== "function" || typeof isEntityNearBlock !== "function") return false;
    if (parseBooleanLike(block?.data?.startDisabled, false)) return false;

    const excludeSelector = `${block?.data?.excludeSelector ?? ""}`.trim();

    let dimension;
    try {
        dimension = world.getDimension(block.dimension);
    } catch {
        return false;
    }

    const entities = Array.from(dimension.getEntities()).filter(entity => `${entity?.typeId ?? ""}` !== "minecraft:player");
    for (const entity of entities) {
        if (!isEntityNearBlock(entity, block, 0.45)) continue;

        const isExcluded = excludeSelector.length > 0
            ? selectorTargetsEntity(excludeSelector, entity, block, { parseSelectorFilters, applyEntityFilters })
            : false;

        if (!isExcluded) {
            return true;
        }
    }

    return false;
}

// SECTION: Npcclip UI Data Helpers
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

// SECTION: Npcclip UI
export function toolNpcclipUI(player, blockEntry, onSave) {
    if (!blockEntry.data) blockEntry.data = {};

    const form = new ModalFormData();
    form.title("Tool Npcclip");
    addDecorativeSection(form, "Class Info");

    const blockName = blockEntry.data?.name || `npcclip${Math.round(Math.random() * 10000)}`;

    form.textField("Name", "name", { defaultValue: blockName });
    form.toggle("Start disabled", { defaultValue: Boolean(blockEntry.data?.startDisabled) });
    form.textField("Exclude Selector", "@e[type=minecraft:zombie]", { defaultValue: `${blockEntry.data?.excludeSelector ?? ""}` });

    const currentBlockName = blockEntry.data?.name;
    const inputsList = getBlocksTargetingCurrent(currentBlockName);
    const inputLines = inputsList.map(input => `  - ${input.outputName} from ${input.sourceBlockName}`);
    const emptyInputsMessage = currentBlockName
        ? "No blocks have outputs saved for this block."
        : "This block needs a name to receive inputs.";
    addReadOnlyListSection(form, "Inputs", inputLines, emptyInputsMessage);

    form.submitButton("Save");

    form.show(player).then((response) => {
        if (response.canceled) return;

        const formData = (response.formValues ?? []).filter(value => value !== undefined && value !== null);
        if (formData.length < 3) {
            player.sendMessage("§cSave failed: form data is incomplete.");
            return;
        }

        let cursor = 0;
        const name = `${formData[cursor++] ?? blockName}`;
        const startDisabled = Boolean(formData[cursor++]);
        const excludeSelector = `${formData[cursor++] ?? ""}`;

        blockEntry.data = {
            ...blockEntry.data,
            name,
            startDisabled,
            excludeSelector
        };

        if (onSave) onSave(blockEntry);
        player.sendMessage(`§aNpcclip "${blockEntry.data.name}" saved!`);
    });
}
