import { ModalFormData } from "@minecraft/server-ui";
import { addDecorativeSection, addReadOnlyListSection, sendUiError, sendUiSaved } from "../ui_formatting.js";
import { getBlocksTargetingCurrent } from "../shared_data_helpers.js";

const HIDDEN_NON_COLLIDING_BLOCK = "brr:data";

// SECTION: Invisible Runtime Helpers
export function getHiddenPlaceholderType(block, options) {
    const {
        toolsEnabled,
        collisionBlockTypes,
        lightBlockTypes,
        parseBooleanLike,
        shouldEnableNpcclipCollision,
        npcclipOptions
    } = options ?? {};

    if (!toolsEnabled && collisionBlockTypes?.includes(block?.typeId)) {
        return HIDDEN_NON_COLLIDING_BLOCK;
    }

    if (block?.typeId === "brr:tool_invisible") {
        return parseBooleanLike?.(block?.data?.startDisabled, false)
            ? HIDDEN_NON_COLLIDING_BLOCK
            : "brr:data_collision";
    }

    if (block?.typeId === "brr:tool_playerclip") {
        return HIDDEN_NON_COLLIDING_BLOCK;
    }

    if (block?.typeId === "brr:tool_npcclip") {
        return shouldEnableNpcclipCollision?.(block, npcclipOptions)
            ? "brr:data_collision"
            : HIDDEN_NON_COLLIDING_BLOCK;
    }

    if (lightBlockTypes?.includes(block?.typeId)) {
        return "brr:data_blocklight";
    }

    return collisionBlockTypes?.includes(block?.typeId) ? "brr:data_collision" : HIDDEN_NON_COLLIDING_BLOCK;
}

// SECTION: Invisible UI
export function toolInvisibleUI(player, blockEntry, onSave) {
    if (!blockEntry.data) blockEntry.data = {};

    const invisibleForm = new ModalFormData();
    invisibleForm.title("Tool Invisible");
    addDecorativeSection(invisibleForm, "§1§1Tool Invisible");

    const blockName = blockEntry.data?.name || `invisible${Math.round(Math.random() * 10000)}`;
    invisibleForm.textField("Name", "name", { defaultValue: blockName });
    invisibleForm.toggle("Start disabled", { defaultValue: Boolean(blockEntry.data?.startDisabled) });

    const currentBlockName = blockEntry.data?.name;
    const inputsList = getBlocksTargetingCurrent(currentBlockName);
    const inputLines = inputsList.map(input => `  - ${input.outputName} from ${input.sourceBlockName}`);
    const emptyInputsMessage = currentBlockName
        ? "No blocks have outputs saved for this block."
        : "This block needs a name to receive inputs.";
    addReadOnlyListSection(invisibleForm, "Inputs", inputLines, emptyInputsMessage);

    invisibleForm.submitButton("Save");

    invisibleForm.show(player).then((response) => {
        if (response.canceled) return;

        const formData = (response.formValues ?? []).filter(value => value !== undefined && value !== null);
        if (formData.length < 2) {
            sendUiError(player, "Save failed: form data is incomplete.");
            return;
        }

        let cursor = 0;
        const name = `${formData[cursor++] ?? blockName}`;
        const startDisabled = Boolean(formData[cursor++]);

        blockEntry.data = {
            ...blockEntry.data,
            name,
            startDisabled
        };

        if (onSave) onSave(blockEntry);
        sendUiSaved(player, "Invisible block", blockEntry.data.name);
    });
}