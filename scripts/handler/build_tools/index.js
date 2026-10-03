import { system, world } from "@minecraft/server";
import {
    ITEM_BUILD_COPY,
    ITEM_BUILD_DISPLACE,
    ITEM_BUILD_FILL,
    ITEM_BUILD_ROTATE,
    ITEM_BUILD_SHAPE,
    ITEM_ENGINE_LOCATOR,
    ALL_BUILD_TOOL_ITEMS,
    ADVANCED_BUILD_TOOL_ITEMS,
    AIR_BLOCKS,
    BUILD_TOOL_ITEMS,
    FILL_UNHOLD_RESET_DISTANCE,
    PREVIEW_OUTLINE_PARTICLE,
    PREVIEW_MAX_PARTICLES,
    clipboardByPlayer,
    fillMaterialByPlayer,
    flattenTargetHeightByPlayer,
    lastHeldBuildToolByPlayer,
    shapePreviewByPlayer,
    buildBoundingBoxEdges,
    cloneVec3,
    getHeldTypeId,
    getLookedBlockLocation,
    getMainhandTypeId,
    getOffhandTypeId,
    getSelection,
    isActionReady,
    isWithinBounds,
    makeBoundsFromCorners,
    setSelectionCorner,
    showSelectionPreview
} from "./core.js";
import {
    applyTerrainDisplacement,
    ensureDisplacementPlayerCache,
    getTerrainSettings,
    handleDisplacementToolUse,
    openTerrainSettingsForm,
    showDisplacementRadiusPreview
} from "./displace.js";
import {
    getShapeSettings,
    lockShapePreviewFromLook,
    openShapeSettingsForm,
    placeShapeFromPreview,
    upsertShapePreview
} from "./shape.js";
import {
    getRotateSettings,
    getRotatedSelectionPreviewBounds,
    openRotateSettingsForm,
    rotateSelection
} from "./rotate.js";
import {
    copySelection,
    handleBuildToolExecute,
    showEngineLocator
} from "./tools.js";

let initialized = false;

export function setupBuildToolHandlers() {
    if (initialized) return;
    initialized = true;

    world.beforeEvents.playerInteractWithBlock.subscribe((eventData) => {
        if (eventData.cancel) return;

        const player = eventData.player;
        const playerId = `${player?.id ?? ""}`;
        if (!player || !playerId) return;

        const mainhandTypeId = getHeldTypeId(player, eventData.itemStack);
        const targetLocation = cloneVec3(eventData.block?.location);
        const shapeMode = `${getShapeSettings(playerId)?.mode ?? "fill"}`;

        const activeShapePreview = shapePreviewByPlayer.get(playerId);
        if (
            activeShapePreview?.locked
            && targetLocation
            && isWithinBounds(targetLocation, activeShapePreview.bounds)
            && mainhandTypeId
            && (
                (shapeMode === "dig" && (mainhandTypeId === ITEM_BUILD_SHAPE || !AIR_BLOCKS.has(mainhandTypeId)))
                || (shapeMode !== "dig" && !ALL_BUILD_TOOL_ITEMS.has(mainhandTypeId) && !AIR_BLOCKS.has(mainhandTypeId))
            )
        ) {
            if (!isActionReady(playerId, "shape_fill_commit", 3)) return;
            eventData.cancel = true;
            system.run(() => placeShapeFromPreview(player, mainhandTypeId));
            return;
        }

        if (!ALL_BUILD_TOOL_ITEMS.has(mainhandTypeId)) return;

        const location = eventData.block?.location;
        if (!location) return;

        if (!isActionReady(playerId, "use_gate", 5)) {
            eventData.cancel = true;
            return;
        }

        eventData.cancel = true;

        if (ADVANCED_BUILD_TOOL_ITEMS.has(mainhandTypeId)) {
            if (mainhandTypeId === ITEM_BUILD_DISPLACE) {
                if (Boolean(player?.isJumping)) {
                    if (!isActionReady(playerId, "terrain_settings", 8)) return;
                    system.runTimeout(() => openTerrainSettingsForm(player), 1);
                    return;
                }

                if (player.isSneaking) {
                    const settings = getTerrainSettings(playerId);
                    const offhandTypeId = getOffhandTypeId(player).trim();
                    const isSettingFlattenTarget = offhandTypeId && !AIR_BLOCKS.has(offhandTypeId) && !ALL_BUILD_TOOL_ITEMS.has(offhandTypeId);

                    if (`${settings.mode ?? ""}` !== "flatten" || !isSettingFlattenTarget) {
                        if (!isActionReady(playerId, "terrain_settings", 8)) return;
                        system.runTimeout(() => openTerrainSettingsForm(player), 1);
                        return;
                    }
                    if (!isActionReady(playerId, "flatten_target_set", 3)) return;
                    handleDisplacementToolUse(player, location, playerId);
                    return;
                }

                const offhandTypeId = getOffhandTypeId(player).trim();
                const isSettingFlattenTarget = offhandTypeId && !AIR_BLOCKS.has(offhandTypeId) && !ALL_BUILD_TOOL_ITEMS.has(offhandTypeId);
                if (isSettingFlattenTarget) {
                    if (!isActionReady(playerId, "flatten_target_set", 3)) return;
                    handleDisplacementToolUse(player, location, playerId);
                    return;
                }

                if (!isActionReady(playerId, "terrain_apply", 3)) return;
                system.run(() => applyTerrainDisplacement(player, location));
                return;
            }

            if (mainhandTypeId === ITEM_BUILD_SHAPE) {
                if (player.isSneaking || Boolean(player?.isJumping)) {
                    if (!isActionReady(playerId, "shape_settings", 8)) return;
                    system.runTimeout(() => openShapeSettingsForm(player), 1);
                    return;
                }
                if (!isActionReady(playerId, "shape_lock", 3)) return;
                system.run(() => lockShapePreviewFromLook(player));
                return;
            }

            if (mainhandTypeId === ITEM_BUILD_ROTATE) {
                if (Boolean(player?.isJumping)) {
                    if (!isActionReady(playerId, "rotate_settings", 10)) return;
                    system.runTimeout(() => openRotateSettingsForm(player), 1);
                    return;
                }
                if (player.isSneaking) {
                    if (!isActionReady(playerId, "rotate_corner", 12)) return;
                    setSelectionCorner(player, location);
                    return;
                }
                if (!isActionReady(playerId, "rotate_apply", 3)) return;
                system.run(() => rotateSelection(player));
                return;
            }

        }

        if (player.isSneaking) {
            if (!isActionReady(playerId, "corner_set", 20)) return;
            if (mainhandTypeId === ITEM_BUILD_COPY) {
                clipboardByPlayer.delete(playerId);
            }
            setSelectionCorner(player, location);
            const updatedState = getSelection(playerId);
            if (mainhandTypeId === ITEM_BUILD_COPY && updatedState.pos1 && updatedState.pos2) {
                system.run(() => copySelection(player));
            }
            return;
        }

        if (!isActionReady(playerId, "execute", 3)) return;
        system.run(() => handleBuildToolExecute(player, mainhandTypeId));
    });

    world.afterEvents.itemUse.subscribe((eventData) => {
        const player = eventData.source;
        if (!player || `${player?.typeId ?? ""}` !== "minecraft:player") return;

        const playerId = `${player.id ?? ""}`;
        const itemTypeId = getHeldTypeId(player, eventData.itemStack);

        if ((ALL_BUILD_TOOL_ITEMS.has(itemTypeId) || itemTypeId === ITEM_ENGINE_LOCATOR) && !isActionReady(playerId, "use_gate", 5)) {
            return;
        }

        if (itemTypeId === ITEM_ENGINE_LOCATOR) {
            if (!isActionReady(playerId, "locator", 4)) return;
            showEngineLocator(player);
            return;
        }

        if (itemTypeId === ITEM_BUILD_DISPLACE && Boolean(player?.isJumping)) {
            if (!isActionReady(playerId, "terrain_settings", 8)) return;
            system.runTimeout(() => openTerrainSettingsForm(player), 1);
            return;
        }

        if (itemTypeId === ITEM_BUILD_SHAPE && (player.isSneaking || Boolean(player?.isJumping))) {
            if (!isActionReady(playerId, "shape_settings", 8)) return;
            system.runTimeout(() => openShapeSettingsForm(player), 1);
            return;
        }

        if (itemTypeId === ITEM_BUILD_ROTATE && Boolean(player?.isJumping)) {
            if (!isActionReady(playerId, "rotate_settings", 10)) return;
            system.runTimeout(() => openRotateSettingsForm(player), 1);
            return;
        }

        handleBuildToolExecute(player, itemTypeId);
    });

    system.runInterval(() => {
        for (const player of world.getAllPlayers()) {
            const playerId = `${player?.id ?? ""}`;
            if (!playerId) continue;

            const heldTypeId = getMainhandTypeId(player).trim();
            const lastHeld = lastHeldBuildToolByPlayer.get(playerId) ?? "";

            if (lastHeld === ITEM_BUILD_FILL && heldTypeId !== ITEM_BUILD_FILL) {
                const stateCheck = getSelection(playerId);
                if (stateCheck?.pos1 && !stateCheck?.pos2) {
                    stateCheck.pos1 = null;
                    stateCheck.pos2 = null;
                    player.sendMessage("§7Selection reset. Sneak + click two blocks to set corners.");
                }
            }

            if (lastHeld === ITEM_BUILD_ROTATE && heldTypeId !== ITEM_BUILD_ROTATE) {
                const stateCheck = getSelection(playerId);
                if (stateCheck?.pos1 || stateCheck?.pos2) {
                    stateCheck.pos1 = null;
                    stateCheck.pos2 = null;
                }
            }
            lastHeldBuildToolByPlayer.set(playerId, heldTypeId);

            if (heldTypeId === ITEM_BUILD_DISPLACE) {
                ensureDisplacementPlayerCache(player);
                const settings = getTerrainSettings(playerId);
                const flattenTarget = flattenTargetHeightByPlayer.get(playerId);
                const looked = getLookedBlockLocation(player);

                if (looked && isActionReady(playerId, "terrain_preview", 2)) {
                    showDisplacementRadiusPreview(player, looked, Number(settings.radius ?? 4));
                }

                let modeText = settings.mode === "dig" ? "§cDig" : "§6Build";
                if (`${settings.mode ?? ""}` === "flatten") {
                    const flattenDisplayY = typeof flattenTarget === "number" ? flattenTarget : Math.floor(looked?.y ?? player.location.y);
                    modeText = `§bFlatten to Y=${flattenDisplayY}`;
                }

                const controlsHint = `${settings.mode ?? ""}` === "flatten"
                    ? "§7Sneak+use: set flatten Y, Jump+use: settings"
                    : "§7Jump+use: settings";
                player.onScreenDisplay.setActionBar(`§7Displacement | ${modeText} §7| radius §b${settings.radius} §7| strength §b${settings.strength} §8| ${controlsHint}`);
                continue;
            }

            const currentShapePreview = shapePreviewByPlayer.get(playerId);
            if (heldTypeId === ITEM_BUILD_SHAPE) {
                if (!currentShapePreview?.locked) {
                    const looked = getLookedBlockLocation(player);
                    if (looked) {
                        upsertShapePreview(player, looked, false, false);
                    }
                }

                const preview = shapePreviewByPlayer.get(playerId);
                if (preview) {
                    const points = preview.points ?? [];
                    const pointStep = Math.max(1, Math.ceil(points.length / PREVIEW_MAX_PARTICLES));
                    for (let i = 0; i < points.length; i += pointStep) {
                        const pos = points[i];
                        try {
                            player.dimension.spawnParticle(PREVIEW_OUTLINE_PARTICLE, {
                                x: pos.x + 0.5,
                                y: pos.y + 0.5,
                                z: pos.z + 0.5
                            });
                        } catch { }
                    }

                    if (preview.locked) {
                        player.onScreenDisplay.setActionBar("§7Shape locked: use any block on highlighted area to fill it. Sneak/Jump + use tool to edit settings.");
                    } else {
                        player.onScreenDisplay.setActionBar("§7Shape follows your look. Right-click to lock this preview location.");
                    }
                } else {
                    const settings = getShapeSettings(playerId);
                    player.onScreenDisplay.setActionBar(`§7Shape: §f${settings.shape} §7size §b${settings.size} §7height §b${settings.height} §8| §7look at block to preview`);
                }
                continue;
            }

            if (currentShapePreview?.locked && !ALL_BUILD_TOOL_ITEMS.has(heldTypeId)) {
                const points = currentShapePreview.points ?? [];
                const pointStep = Math.max(1, Math.ceil(points.length / PREVIEW_MAX_PARTICLES));
                for (let i = 0; i < points.length; i += pointStep) {
                    const pos = points[i];
                    try {
                        player.dimension.spawnParticle(PREVIEW_OUTLINE_PARTICLE, {
                            x: pos.x + 0.5,
                            y: pos.y + 0.5,
                            z: pos.z + 0.5
                        });
                    } catch { }
                }

                player.onScreenDisplay.setActionBar("§7Shape locked: place a block item on highlighted area to build.");
                continue;
            }

            if (heldTypeId === ITEM_BUILD_ROTATE) {
                const state = getSelection(playerId);
                const rotateSettings = getRotateSettings(playerId);
                if (!state?.pos1) {
                    const looked = getLookedBlockLocation(player);
                    if (looked) {
                        try {
                            player.dimension.spawnParticle(PREVIEW_OUTLINE_PARTICLE, {
                                x: looked.x + 0.5,
                                y: looked.y + 0.5,
                                z: looked.z + 0.5
                            });
                        } catch { }
                    }
                    player.onScreenDisplay.setActionBar(`§7Rotate (${rotateSettings.turns * 90}° ${rotateSettings.axis.toUpperCase()}): sneak + click corner 1`);
                } else if (!state?.pos2) {
                    const looked = getLookedBlockLocation(player);
                    if (looked) showSelectionPreview(player, state.pos1, looked, true);
                    else showSelectionPreview(player, state.pos1, state.pos1, true);
                } else {
                    showSelectionPreview(player, state.pos1, state.pos2, false);
                    const rotatedPreview = getRotatedSelectionPreviewBounds(state, rotateSettings);
                    if (rotatedPreview) {
                        const rotatedBounds = makeBoundsFromCorners(rotatedPreview.pos1, rotatedPreview.pos2);
                        const rotatedEdges = buildBoundingBoxEdges(rotatedBounds, 1);
                        for (const pos of rotatedEdges) {
                            try {
                                player.dimension.spawnParticle(PREVIEW_OUTLINE_PARTICLE, {
                                    x: pos.x + 0.5,
                                    y: pos.y + 0.5,
                                    z: pos.z + 0.5
                                });
                            } catch { }
                        }
                    }
                    player.onScreenDisplay.setActionBar(`§7Rotate ready: ${rotateSettings.turns * 90}° around ${rotateSettings.axis.toUpperCase()} (Jump + use for settings)`);
                }
                continue;
            }

            const persistState = getSelection(playerId);
            if (persistState?.pos1 && persistState?.pos2 && !BUILD_TOOL_ITEMS.has(heldTypeId)) {
                if (heldTypeId && heldTypeId !== ITEM_ENGINE_LOCATOR) {
                    fillMaterialByPlayer.set(playerId, heldTypeId);
                }
                const selectedFillTypeId = `${fillMaterialByPlayer.get(playerId) ?? ""}`.trim();
                showSelectionPreview(player, persistState.pos1, persistState.pos2, false);
                if (selectedFillTypeId) {
                    player.onScreenDisplay.setActionBar(`§7Selection ready — §b${selectedFillTypeId} §7loaded, swap to fill tool and right-click`);
                } else {
                    player.onScreenDisplay.setActionBar("§7Selection ready — §fhold a block, then swap to the fill tool");
                }
                continue;
            }

            if (!BUILD_TOOL_ITEMS.has(heldTypeId)) continue;

            const state = getSelection(playerId);
            const pos1 = state?.pos1;
            const pos2 = state?.pos2;
            const clipboard = clipboardByPlayer.get(playerId);

            if (heldTypeId === ITEM_BUILD_FILL && pos1 && pos2) {
                const midX = (pos1.x + pos2.x) / 2;
                const midY = (pos1.y + pos2.y) / 2;
                const midZ = (pos1.z + pos2.z) / 2;
                const ploc = player.location;
                const dist = Math.sqrt((ploc.x - midX) ** 2 + (ploc.y - midY) ** 2 + (ploc.z - midZ) ** 2);
                if (dist > FILL_UNHOLD_RESET_DISTANCE) {
                    const nearbyOther = world.getAllPlayers().some(otherPlayer => {
                        if (otherPlayer.id === playerId) return false;
                        const otherLocation = otherPlayer.location;
                        return Math.sqrt((otherLocation.x - midX) ** 2 + (otherLocation.y - midY) ** 2 + (otherLocation.z - midZ) ** 2) < 32;
                    });
                    if (!nearbyOther) {
                        state.pos1 = null;
                        state.pos2 = null;
                        player.sendMessage("§7Selection cleared (walked too far away).");
                        continue;
                    }
                }
            }

            if (heldTypeId === ITEM_BUILD_COPY && clipboard?.entries?.length && !pos1) {
                const looked = getLookedBlockLocation(player);
                if (looked) {
                    const clipSize = clipboard.size ?? { x: 1, y: 1, z: 1 };
                    const ghostPos2 = {
                        x: looked.x + clipSize.x - 1,
                        y: looked.y + clipSize.y - 1,
                        z: looked.z + clipSize.z - 1
                    };
                    showSelectionPreview(player, looked, ghostPos2, false);
                    player.onScreenDisplay.setActionBar(`§7Clipboard: §b${clipSize.x}x${clipSize.y}x${clipSize.z} §7» §fRight-click to paste`);
                }
                continue;
            }

            if (!pos1) {
                const looked = getLookedBlockLocation(player);
                if (!looked) continue;
                try {
                    player.dimension.spawnParticle(PREVIEW_OUTLINE_PARTICLE, {
                        x: looked.x + 0.5,
                        y: looked.y + 0.5,
                        z: looked.z + 0.5
                    });
                } catch { }
                player.onScreenDisplay.setActionBar("§7Sneak + click a block to set corner 1");
                continue;
            }

            if (!pos2) {
                const looked = getLookedBlockLocation(player);
                if (!looked) {
                    try {
                        player.dimension.spawnParticle(PREVIEW_OUTLINE_PARTICLE, {
                            x: pos1.x + 0.5,
                            y: pos1.y + 0.5,
                            z: pos1.z + 0.5
                        });
                    } catch { }
                    player.onScreenDisplay.setActionBar("§7Corner 1 set — sneak + click a second block");
                    continue;
                }
                showSelectionPreview(player, pos1, looked, true);
                continue;
            }

            showSelectionPreview(player, pos1, pos2, false);
        }
    }, 1);
}

setupBuildToolHandlers();