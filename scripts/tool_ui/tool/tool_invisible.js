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
