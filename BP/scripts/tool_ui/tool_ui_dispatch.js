import { openBlockForm, isBlockFormSupported } from "./form_engine.js";

// SECTION: Block UI Dispatch
// Every engine block shares one declarative form definition, so this only has to route
// the interaction to the shared engine.
export function openToolUIForBlock(player, blockEntry, options = {}) {
    if (!player || !isBlockFormSupported(blockEntry?.typeId)) return;
    openBlockForm(player, blockEntry, options.onSave);
}
