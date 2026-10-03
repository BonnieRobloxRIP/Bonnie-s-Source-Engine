// SECTION: Block Info Pages
// Shown by the Help tab on every block form. Fill these in — anything left blank renders
// as a placeholder line so the page still looks right.
//
// Each block has three sections, matching the three headings on the Help tab.
// Use \n for line breaks and § colour codes if you want them.

const EMPTY = { examples: "", usage: "", info: "" };

export const BLOCK_INFO = {
    "brr:tool_trigger": { ...EMPTY },
    "brr:tool_areaportal": { ...EMPTY },
    "brr:tool_invisible": { ...EMPTY },
    "brr:tool_playerclip": { ...EMPTY },
    "brr:tool_npcclip": { ...EMPTY },
    "brr:info_playerspawn_block": { ...EMPTY },
    "brr:info_target_areaportal_block": { ...EMPTY },
    "brr:game_nametag_block": { ...EMPTY },
    "brr:logic_auto_block": { ...EMPTY },
    "brr:logic_branch_block": { ...EMPTY },
    "brr:logic_case_block": { ...EMPTY },
    "brr:logic_compare_block": { ...EMPTY },
    "brr:logic_coop_manager_block": { ...EMPTY },
    "brr:logic_random_outputs_block": { ...EMPTY },
    "brr:logic_timer_block": { ...EMPTY }
};

export function getBlockInfoSection(typeId, section) {
    const text = `${(BLOCK_INFO[typeId] ?? EMPTY)[section] ?? ""}`.trim();
    return text || "§8(not written yet)§r";
}
