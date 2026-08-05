import { BlockPermutation, system, world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import {
    rotateSettingsByPlayer,
    selectionByPlayer,
    fillMaterialByPlayer,
    locatorBusyByPlayer,
    AIR_BLOCKS,
    PROTECTED_BLOCKS,
    rotateBlockStates,
    cloneVec3,
    getSelection,
    getSelectionBounds,
    getSelectionVolume,
    getSelectionState,
    forEachSelectionBlock,
    isActionReady,
    setSafeBlockType
} from "./core.js";

const ROTATE_SETTINGS_DP_KEY = "brr_bt_rotate";

export function getRotateSettings(playerId) {
    const defaults = { axis: "y", turns: 1 };
    const existing = rotateSettingsByPlayer.get(playerId);
    if (existing) return existing;

    let loaded = null;
    try {
        const player = world.getAllPlayers().find(p => `${p?.id ?? ""}` === `${playerId}`);
        const raw = `${player?.getDynamicProperty?.(ROTATE_SETTINGS_DP_KEY) ?? ""}`.trim();
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object") {
                const axis = ["x", "y", "z"].includes(`${parsed.axis ?? ""}`) ? `${parsed.axis}` : defaults.axis;
                const turns = Math.max(1, Math.min(3, Number(parsed.turns ?? defaults.turns)));
                loaded = { axis, turns };
            }
        }
    } catch { }

    const hydrated = loaded ?? defaults;
    rotateSettingsByPlayer.set(playerId, hydrated);
    return hydrated;
}

function saveRotateSettings(player, settings) {
    try {
        player?.setDynamicProperty?.(ROTATE_SETTINGS_DP_KEY, JSON.stringify(settings));
    } catch { }
}

export function rotateOffset3D(offset, size, axis, turns) {
    let x = Number(offset.dx ?? 0);
    let y = Number(offset.dy ?? 0);
    let z = Number(offset.dz ?? 0);
    let sx = Number(size.x ?? 1);
    let sy = Number(size.y ?? 1);
    let sz = Number(size.z ?? 1);

    for (let i = 0; i < turns; i++) {
        if (axis === "x") {
            const newY = (sz - 1) - z;
            const newZ = y;
            y = newY;
            z = newZ;
            const oldSy = sy;
            sy = sz;
            sz = oldSy;
            continue;
        }

        if (axis === "z") {
            const newX = (sy - 1) - y;
            const newY = x;
            x = newX;
            y = newY;
            const oldSx = sx;
            sx = sy;
            sy = oldSx;
            continue;
        }

        const newX = (sz - 1) - z;
        const newZ = x;
        x = newX;
        z = newZ;
        const oldSx = sx;
        sx = sz;
        sz = oldSx;
    }

    return {
        dx: x,
        dy: y,
        dz: z,
        size: { x: sx, y: sy, z: sz }
    };
}

export function getRotatedSelectionPreviewBounds(state, rotateSettings) {
    if (!state?.pos1 || !state?.pos2) return null;

    const bounds = getSelectionBounds(state.pos1, state.pos2);
    const min = bounds.min;
    const max = bounds.max;
    const size = {
        x: (max.x - min.x) + 1,
        y: (max.y - min.y) + 1,
        z: (max.z - min.z) + 1
    };

    const corners = [
        { dx: 0, dy: 0, dz: 0 },
        { dx: size.x - 1, dy: 0, dz: 0 },
        { dx: 0, dy: size.y - 1, dz: 0 },
        { dx: 0, dy: 0, dz: size.z - 1 },
        { dx: size.x - 1, dy: size.y - 1, dz: 0 },
        { dx: size.x - 1, dy: 0, dz: size.z - 1 },
        { dx: 0, dy: size.y - 1, dz: size.z - 1 },
        { dx: size.x - 1, dy: size.y - 1, dz: size.z - 1 }
    ];

    const transformed = corners.map(corner => rotateOffset3D(corner, size, rotateSettings.axis, rotateSettings.turns));
    const minOff = {
        x: Math.min(...transformed.map(p => p.dx)),
        y: Math.min(...transformed.map(p => p.dy)),
        z: Math.min(...transformed.map(p => p.dz))
    };
    const maxOff = {
        x: Math.max(...transformed.map(p => p.dx)),
        y: Math.max(...transformed.map(p => p.dy)),
        z: Math.max(...transformed.map(p => p.dz))
    };

    return {
        pos1: { x: min.x + minOff.x, y: min.y + minOff.y, z: min.z + minOff.z },
        pos2: { x: min.x + maxOff.x, y: min.y + maxOff.y, z: min.z + maxOff.z }
    };
}

export function rotateSelection(player) {
    const playerId = `${player?.id ?? ""}`;
    if (!playerId) return;

    const state = getSelection(playerId);
    if (!state?.pos1 || !state?.pos2) {
        player.sendMessage("§cSneak + click two blocks with the rotate tool first.");
        return;
    }

    const selectionState = getSelectionState(player);
    if (!selectionState) return;

    const rotateSettings = getRotateSettings(playerId);

    const min = selectionState.bounds.min;
    const max = selectionState.bounds.max;
    const size = {
        x: (max.x - min.x) + 1,
        y: (max.y - min.y) + 1,
        z: (max.z - min.z) + 1
    };
    const entries = [];

    forEachSelectionBlock(selectionState, (pos) => {
        let block;
        try {
            block = player.dimension.getBlock(pos);
        } catch {
            return;
        }
        if (!block) return;

        const typeId = `${block?.typeId ?? "minecraft:air"}`;
        if (AIR_BLOCKS.has(typeId) || PROTECTED_BLOCKS.has(typeId)) return;

        let states = {};
        try {
            states = block.permutation?.getAllStates?.() ?? {};
        } catch { }

        entries.push({
            dx: pos.x - min.x,
            dy: pos.y - min.y,
            dz: pos.z - min.z,
            typeId,
            states
        });
    });

    forEachSelectionBlock(selectionState, (pos) => {
        setSafeBlockType(player.dimension, pos, "minecraft:air");
    });

    let placed = 0;
    for (const entry of entries) {
        const rotated = rotateOffset3D(entry, size, rotateSettings.axis, rotateSettings.turns);
        const nextPos = {
            x: min.x + rotated.dx,
            y: min.y + rotated.dy,
            z: min.z + rotated.dz
        };

        try {
            const rotateTurnsForState = rotateSettings.axis === "y" ? rotateSettings.turns : 0;
            const perm = BlockPermutation.resolve(entry.typeId, rotateBlockStates(entry.states ?? {}, rotateTurnsForState));
            player.dimension.setBlockPermutation(nextPos, perm);
            placed++;
        } catch {
            if (setSafeBlockType(player.dimension, nextPos, entry.typeId)) placed++;
        }
    }

    state.pos1 = null;
    state.pos2 = null;
    fillMaterialByPlayer.delete(playerId);
    player.sendMessage(`§aRotated selection ${rotateSettings.turns * 90}° around ${rotateSettings.axis.toUpperCase()} axis (${placed} block(s)).`);
}

export async function openRotateSettingsForm(player, attempt = 0) {
    const playerId = `${player?.id ?? ""}`;
    if (!playerId) return;
    if (locatorBusyByPlayer.has(playerId)) return;

    const retry = () => {
        if (attempt >= 6) {
            player.sendMessage("§cRotate settings are busy right now. Try again in a moment.");
            return;
        }
        system.runTimeout(() => openRotateSettingsForm(player, attempt + 1), 2);
    };

    locatorBusyByPlayer.add(playerId);
    try {
        const settings = getRotateSettings(playerId);
        const axes = ["y", "x", "z"];
        const axisIndex = axes.indexOf(`${settings.axis ?? "y"}`);

        const form = new ModalFormData();
        form.title("Rotate Tool Settings");

        form.dropdown("Rotation Axis", ["Y (Vertical)", "X (East-West)", "Z (North-South)"], { defaultValueIndex: axisIndex >= 0 ? axisIndex : 0 });
        form.slider("Rotation Angle (degrees)", 90, 270, { valueStep: 90, defaultValue: (Number(settings.turns ?? 1) * 90) });

        const response = await form.show(player);
        if (response.canceled) {
            const cancelReason = `${response.cancelationReason ?? ""}`.toLowerCase();
            if (cancelReason.includes("userbusy") || cancelReason.includes("busy")) {
                retry();
            }
            return;
        }

        settings.axis = axes[response.formValues?.[0] ?? 0];
        settings.turns = (response.formValues?.[1] ?? 90) / 90;

        rotateSettingsByPlayer.set(playerId, settings);
        saveRotateSettings(player, settings);
        player.sendMessage(`§aRotate settings updated: §f${settings.turns * 90}°§7 around §f${settings.axis.toUpperCase()}§7 axis`);
    } catch (e) {
        const errorText = `${e ?? ""}`.toLowerCase();
        if (errorText.includes("not available") || errorText.includes("busy")) {
            retry();
            return;
        }
        player.sendMessage("§cRotate settings could not be opened right now.");
    } finally {
        locatorBusyByPlayer.delete(playerId);
    }
}