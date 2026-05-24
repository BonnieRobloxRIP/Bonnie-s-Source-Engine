import { system, world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import {
    shapeSettingsByPlayer,
    shapePreviewByPlayer,
    locatorBusyByPlayer,
    AIR_BLOCKS,
    ALL_BUILD_TOOL_ITEMS,
    PREVIEW_OUTLINE_PARTICLE,
    addUniquePoint,
    cloneVec3,
    getPointsBounds,
    getLookedBlockLocation,
    isWithinBounds,
    setSafeBlockType
} from "./core.js";

const SHAPE_SETTINGS_DP_KEY = "brr_bt_shape";

export function getShapeSettings(playerId) {
    const defaults = { shape: "sphere", size: 7, height: 7, hollow: true, mode: "fill", smooth: true };
    const existing = shapeSettingsByPlayer.get(playerId);
    if (existing) return existing;

    let loaded = null;
    try {
        const player = world.getAllPlayers().find(p => `${p?.id ?? ""}` === `${playerId}`);
        const raw = `${player?.getDynamicProperty?.(SHAPE_SETTINGS_DP_KEY) ?? ""}`.trim();
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object") {
                loaded = {
                    shape: ["sphere", "cylinder", "cube"].includes(`${parsed.shape ?? ""}`) ? `${parsed.shape}` : defaults.shape,
                    size: Math.max(1, Math.min(33, Number(parsed.size ?? defaults.size))),
                    height: Math.max(1, Math.min(32, Number(parsed.height ?? defaults.height))),
                    hollow: Boolean(parsed.hollow ?? defaults.hollow),
                    mode: `${parsed.mode ?? ""}` === "dig" ? "dig" : "fill",
                    smooth: Boolean(parsed.smooth ?? defaults.smooth)
                };
            }
        }
    } catch { }

    const hydrated = loaded ?? defaults;
    shapeSettingsByPlayer.set(playerId, hydrated);
    return hydrated;
}

function saveShapeSettings(player, settings) {
    try {
        player?.setDynamicProperty?.(SHAPE_SETTINGS_DP_KEY, JSON.stringify(settings));
    } catch { }
}

function isSmoothCardinalTip(x, z, radius, smooth) {
    if (!smooth || radius < 3) return false;
    return (Math.abs(x) === radius && z === 0) || (Math.abs(z) === radius && x === 0);
}

function isSmoothSpherePole(x, y, z, radius, smooth) {
    if (!smooth || radius < 3) return false;
    return Math.abs(y) === radius && x === 0 && z === 0;
}

export function buildShapeOffsets(shape, size, height, hollow, smooth = true) {
    const points = [];
    const seen = new Set();
    const maxHeight = Math.max(1, height);
    const radius = Math.max(1, Math.floor(size / 2));

    if (shape === "cube") {
        const half = radius;
        for (let x = -half; x <= half; x++) {
            for (let y = 0; y < maxHeight; y++) {
                for (let z = -half; z <= half; z++) {
                    if (hollow) {
                        const isBoundary = x === -half || x === half || z === -half || z === half || y === 0 || y === (maxHeight - 1);
                        if (!isBoundary) continue;
                    }
                    addUniquePoint(points, seen, x, y, z);
                }
            }
        }
        return points;
    }

    if (shape === "sphere") {
        const r2 = radius * radius;
        const inner = Math.max(0, radius - 1);
        const innerR2 = inner * inner;
        for (let x = -radius; x <= radius; x++) {
            for (let y = -radius; y <= radius; y++) {
                for (let z = -radius; z <= radius; z++) {
                    if (isSmoothCardinalTip(x, z, radius, smooth)) continue;
                    if (isSmoothSpherePole(x, y, z, radius, smooth)) continue;
                    const d2 = (x * x) + (y * y) + (z * z);
                    if (d2 > r2) continue;
                    if (hollow && d2 < innerR2) continue;
                    addUniquePoint(points, seen, x, y, z);
                }
            }
        }
        return points;
    }

    if (shape === "cylinder") {
        const r2 = radius * radius;
        const innerR2 = Math.max(0, (radius - 1) * (radius - 1));
        for (let x = -radius; x <= radius; x++) {
            for (let z = -radius; z <= radius; z++) {
                if (isSmoothCardinalTip(x, z, radius, smooth)) continue;
                const d2 = (x * x) + (z * z);
                if (d2 > r2) continue;
                const isWall = d2 >= innerR2;
                for (let y = 0; y < maxHeight; y++) {
                    if (hollow && y > 0 && y < (maxHeight - 1) && !isWall) continue;
                    addUniquePoint(points, seen, x, y, z);
                }
            }
        }
        return points;
    }

    const discR2 = radius * radius;
    const discInnerR2 = Math.max(0, (radius - 1) * (radius - 1));
    for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
            if (isSmoothCardinalTip(x, z, radius, smooth)) continue;
            const d2 = (x * x) + (z * z);
            if (d2 > discR2) continue;
            if (hollow && d2 < discInnerR2) continue;
            addUniquePoint(points, seen, x, 0, z);
        }
    }
    return points;
}

export function upsertShapePreview(player, anchor, locked = false, announce = false) {
    const playerId = `${player?.id ?? ""}`;
    if (!playerId) return;

    const current = shapePreviewByPlayer.get(playerId);
    if (current
        && current.anchor?.x === anchor.x
        && current.anchor?.y === anchor.y
        && current.anchor?.z === anchor.z
        && Boolean(current.locked) === Boolean(locked)
    ) {
        return;
    }

    const settings = getShapeSettings(playerId);
    const offsets = buildShapeOffsets(
        `${settings.shape ?? "sphere"}`,
        Number(settings.size ?? 7),
        Number(settings.height ?? 7),
        Boolean(settings.hollow),
        Boolean(settings.smooth ?? true)
    );
    const points = offsets.map(offset => ({
        x: anchor.x + offset.x,
        y: anchor.y + offset.y,
        z: anchor.z + offset.z
    }));

    shapePreviewByPlayer.set(playerId, {
        anchor: cloneVec3(anchor),
        points,
        bounds: getPointsBounds(points),
        locked
    });

    if (announce) {
        player.sendMessage(
            `§7Shape preview ${locked ? "locked" : "updated"}: §f${settings.shape} §7size §f${settings.size} §7height §f${settings.height} §7hollow §f${settings.hollow ? "on" : "off"}`
        );
    }
}

export function lockShapePreviewFromLook(player) {
    const playerId = `${player?.id ?? ""}`;
    if (!playerId) return;

    const looked = getLookedBlockLocation(player);
    if (!looked) {
        player.sendMessage("§cAim at a block to lock the shape preview.");
        return;
    }

    upsertShapePreview(player, looked, true, true);
}

export function placeShapeFromPreview(player, materialTypeId = "") {
    const playerId = `${player?.id ?? ""}`;
    if (!playerId) return;

    const preview = shapePreviewByPlayer.get(playerId);
    if (!preview) {
        player.sendMessage("§cNo shape preview is active. Hold the shape tool and look at a block.");
        return;
    }

    if (!preview.locked) {
        player.sendMessage("§cShape preview is not locked. Right-click with the shape tool to lock it.");
        return;
    }

    const settings = getShapeSettings(playerId);
    const isDigMode = `${settings.mode ?? "fill"}` === "dig";

    const material = `${materialTypeId}`.trim();
    if (!isDigMode && (!material || AIR_BLOCKS.has(material) || ALL_BUILD_TOOL_ITEMS.has(material))) {
        player.sendMessage("§cUse a regular block item on the preview area to build the shape.");
        return;
    }

    const targetTypeId = isDigMode ? "minecraft:air" : material;
    let changed = 0;
    for (const pos of preview.points) {
        if (setSafeBlockType(player.dimension, pos, targetTypeId)) changed++;
    }

    shapePreviewByPlayer.delete(playerId);
    if (isDigMode) {
        player.sendMessage(`§aShape dug out (${changed} block(s) set to air).`);
    } else {
        player.sendMessage(`§aShape built with ${changed} block(s) using ${material}.`);
    }
}

export async function openShapeSettingsForm(player, attempt = 0) {
    const playerId = `${player?.id ?? ""}`;
    if (!playerId) return;
    if (locatorBusyByPlayer.has(playerId)) return;

    const retry = () => {
        if (attempt >= 6) {
            player.sendMessage("§cShape settings are busy right now. Try again in a moment.");
            return;
        }
        system.runTimeout(() => openShapeSettingsForm(player, attempt + 1), 2);
    };

    locatorBusyByPlayer.add(playerId);
    try {
        const settings = getShapeSettings(playerId);
        const shapes = ["sphere", "cylinder", "cube"];
        const shapeIndex = shapes.indexOf(`${settings.shape ?? "sphere"}`);

        const form = new ModalFormData();
        form.title("Shape Builder Settings");

        form.dropdown("Shape Type", shapes, { defaultValueIndex: shapeIndex >= 0 ? shapeIndex : 0 });
        form.slider("Size (diameter)", 1, 33, { valueStep: 1, defaultValue: Number(settings.size ?? 7) });
        form.slider("Height", 1, 32, { valueStep: 1, defaultValue: Number(settings.height ?? 7) });
        form.toggle("Hollow Mode", { defaultValue: Boolean(settings.hollow) });
        form.toggle("Dig Mode (air instead of block)", { defaultValue: `${settings.mode ?? "fill"}` === "dig" });
        form.toggle("Smooth Round Edges", { defaultValue: Boolean(settings.smooth ?? true) });

        const response = await form.show(player);
        if (response.canceled) {
            const cancelReason = `${response.cancelationReason ?? ""}`.toLowerCase();
            if (cancelReason.includes("userbusy") || cancelReason.includes("busy")) {
                retry();
            }
            return;
        }

        settings.shape = shapes[response.formValues?.[0] ?? 0];
        settings.size = response.formValues?.[1] ?? 7;
        settings.height = response.formValues?.[2] ?? 7;
        settings.hollow = response.formValues?.[3] ?? true;
        settings.mode = response.formValues?.[4] ? "dig" : "fill";
        settings.smooth = response.formValues?.[5] ?? true;

        shapeSettingsByPlayer.set(playerId, settings);
        saveShapeSettings(player, settings);
        shapePreviewByPlayer.delete(playerId);
        player.sendMessage(`§aShape settings updated: §f${settings.shape} §7size §f${settings.size} §7height §f${settings.height} §7hollow §f${settings.hollow ? "on" : "off"} §7mode §f${settings.mode} §7smooth §f${settings.smooth ? "on" : "off"}`);
    } catch (e) {
        const errorText = `${e ?? ""}`.toLowerCase();
        if (errorText.includes("not available") || errorText.includes("busy")) {
            retry();
            return;
        }
        player.sendMessage("§cShape settings could not be opened right now.");
    } finally {
        locatorBusyByPlayer.delete(playerId);
    }
}