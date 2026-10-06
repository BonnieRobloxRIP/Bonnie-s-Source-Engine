// SECTION: Block Info Pages
// Shown by the Examples / Usage / Info tabs in Help. Fill these in — anything left blank renders
// as a placeholder line so the page still looks right.
//
// Each block has three sections, each shown separately in the left pane.
// Use \n for line breaks and § colour codes if you want them.

const EMPTY = { examples: "", usage: "", info: "" };

export const BLOCK_INFO = {
    "brr:tool_trigger": {
        examples: [
            "- If a player passes the condition, run command and fire onTrue outputs.",
            "- Name the block uniquely so outputs can target it and references stay stable.",
            "- Pick Execute on condition, then fill only the values that condition needs.",
            "- Add This Output, choose target + class info, and set Target Info Value (true/false for booleans).",
            "- Use Delay to stage chain reactions and Output Name to keep entries readable.",
            "- Set Start Disabled to gate the trigger until another block enables it."
        ].join("\n"),
        usage: [
            "Set a unique Name and choose Execute on condition.",
            "Fill only the condition values it needs; leave unused values blank.",
            "Run command is optional.",
            "In Output, choose an output type, target block, target field and value. Enable Add this output.",
            "Use Saved to review or delete outputs and Input to see incoming connections.",
            "Back returns to your edits. Submit saves them."
        ].join("\n\n"),
        info: "The Trigger Tool checks players touching its volume against the selected condition. "
            + "Start disabled pauses the trigger until it is enabled. "
            + "Outputs can change supported fields on named blocks; delays are measured in ticks."
    },
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
