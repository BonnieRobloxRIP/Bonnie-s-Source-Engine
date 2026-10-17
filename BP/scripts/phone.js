import { MolangVariableMap, system, world } from "@minecraft/server";
import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";
import { createMarkerType } from "./core/block_markers.js";
import { distanceSquared } from "./core/math.js";
import { gameTick, isPaused } from "./core/pause.js";
import { setPhoneOverlay } from "./hud.js";
import { PHONE_AUDIO } from "./phone_data.js";
import { Navigator } from "./characters/navigation.js";
import { hitCharacter, registerCharacter, trackedCharacters } from "./characters/registry.js";
import { SegmentedSound } from "./characters/segmented_sound.js";

const PHONE_ID = "brr:item_phone";
const NOTEBOOKS_PROPERTY = "brr:phone_notebooks";
const spawner = createMarkerType("brr:character_spawner", "brr:character_spawners");
const forms = new Set();
const calls = new Map();
const pings = new Map();
const overlays = new Map();
const useTicks = new Map();
// the "job done" notification pops up 1 second after the kill and stays 3 seconds (Discord() in BaldiScript.Kill)
const HITMAN_NOTIFY_DELAY_TICKS = 20;
const HITMAN_NOTIFY_SHOW_TICKS = 60;
let notebooks;

function loadNotebooks() {
    if (!notebooks) {
        try { notebooks = JSON.parse(world.getDynamicProperty(NOTEBOOKS_PROPERTY) ?? "[]"); }
        catch { notebooks = []; }
    }
    return notebooks;
}

export function notePhoneNotebook(block) {
    if (!block.typeId.startsWith("brr:2d_nb_")) return;
    const spots = loadNotebooks();
    if (spots.some((spot) => spot.dimensionId === block.dimension.id
        && spot.x === block.x && spot.y === block.y && spot.z === block.z)) return;
    spots.push({ dimensionId: block.dimension.id, x: block.x, y: block.y, z: block.z, typeId: block.typeId });
    world.setDynamicProperty(NOTEBOOKS_PROPERTY, JSON.stringify(spots));
}

export function forgetPhoneNotebook(block) {
    notebooks = loadNotebooks().filter((spot) => spot.dimensionId !== block.dimension.id
        || spot.x !== block.x || spot.y !== block.y || spot.z !== block.z);
    world.setDynamicProperty(NOTEBOOKS_PROPERTY, JSON.stringify(notebooks));
}

export function registerPhoneComponents(registry) {
    registry.registerCustomComponent("brr:character_spawner", spawner.component);
}

function hotbarHasPhone(player) {
    const container = player.getComponent("minecraft:inventory")?.container;
    if (!container) return false;
    for (let slot = 0; slot < Math.min(9, container.size); slot++) {
        if (container.getItem(slot)?.typeId === PHONE_ID) return true;
    }
    return false;
}

function overlay(player, name, ticks) {
    setPhoneOverlay(player, name, true);
    const key = `${player.id}:${name}`;
    overlays.set(key, { player, name, until: system.currentTick + ticks });
}

// the phone is single use: the selected one goes first, otherwise any phone on the hotbar
function consumePhone(player) {
    const container = player.getComponent("minecraft:inventory")?.container;
    if (!container) return;
    const slots = [player.selectedSlotIndex];
    for (let slot = 0; slot < Math.min(9, container.size); slot++) if (slot !== player.selectedSlotIndex) slots.push(slot);
    for (const slot of slots) {
        const item = container.getItem(slot);
        if (item?.typeId !== PHONE_ID) continue;
        if (item.amount > 1) {
            item.amount--;
            container.setItem(slot, item);
        } else {
            container.setItem(slot);
        }
        return;
    }
}

function callHitman(player) {
    const dimension = player.dimension;
    if (calls.has(player.id) || dimension.getEntities({ type: "brr:hitman" }).length) return;
    const location = spawner.findNearest(dimension, player.location);
    if (!location) {
        player.sendMessage("Place a character_spawner block before calling the hitman.");
        return;
    }
    consumePhone(player);
    player.playSound("phonedial");
    calls.set(player.id, { player, dimension, location, pickupAt: gameTick() + PHONE_AUDIO.dialTicks });
}

const PING_TICKS = 100;
const PING_SIZE = 0.55;
// how far in front of the eyes the marker is drawn; close enough that walls never get between
const PING_PROJECT_DISTANCE = 0.6;
const PING_MIN_SIZE = 0.03;
// one map for every ping particle: spawnParticle copies the values, so it is just refilled each time
let pingVars;

function pingNotebooks(player) {
    consumePhone(player);
    player.playSound("ping");
    pings.set(player.dimension.id, { dimension: player.dimension, until: gameTick() + PING_TICKS });
}

// Particles are always depth tested, so the ping is drawn per player right in front of the camera
// on the line towards each notebook. Perspective keeps it exactly over the notebook on screen and
// scaling it by distance keeps its apparent size, so it reads as seen through walls.
function spawnPing(viewer, spot) {
    const eye = viewer.getHeadLocation();
    const dx = spot.x + 0.5 - eye.x;
    const dy = spot.y + 0.7 - eye.y;
    const dz = spot.z + 0.5 - eye.z;
    const distance = Math.hypot(dx, dy, dz);
    if (distance < 0.001) return;
    const scale = Math.min(PING_PROJECT_DISTANCE, distance) / distance;
    pingVars ??= new MolangVariableMap();
    pingVars.setFloat("variable.size", Math.max(PING_MIN_SIZE, PING_SIZE * scale));
    viewer.spawnParticle("brr:notebook_ping", { x: eye.x + dx * scale, y: eye.y + dy * scale, z: eye.z + dz * scale }, pingVars);
}

async function showPhone(player, attempt = 0) {
    try {
        const response = await new ActionFormData().title("brr:phone").body("")
            .button("Call Hitman", "textures/ui/phone/Phone_Call")
            .button("Ping Notebooks", "textures/ui/phone/Phone_Ping")
            .button("Quit...", "textures/ui/phone/Phone_Quit").show(player);
        if (response.cancelationReason === FormCancelationReason.UserBusy && attempt < 20 && player.isValid) {
            system.runTimeout(() => showPhone(player, attempt + 1), 5);
            return;
        }
        forms.delete(player.id);
        if (response.canceled || !player.isValid || !hotbarHasPhone(player)) return;
        if (response.selection === 0) callHitman(player);
        else if (response.selection === 1) pingNotebooks(player);
    } catch {
        forms.delete(player.id);
    }
}

function usePhone({ itemStack, source: player }) {
    if (itemStack?.typeId !== PHONE_ID || !player || forms.has(player.id)) return;
    if (useTicks.get(player.id) === system.currentTick) return;
    useTicks.set(player.id, system.currentTick);
    forms.add(player.id);
    system.run(() => showPhone(player));
}

registerCharacter({
    typeId: "brr:hitman",
    createState(entity) {
        const sound = new SegmentedSound("hitman", true);
        const remaining = entity.getDynamicProperty("brr:completion_ticks");
        const notifyAt = typeof remaining === "number" ? gameTick() + remaining : undefined;
        if (notifyAt === undefined) sound.start(gameTick());
        return { dimension: entity.dimension, nav: new Navigator({ doorHeight: 3 }), sound, notifyAt };
    },
    tick(entity, state, ctx) {
        if (state.notifyAt !== undefined) {
            entity.setDynamicProperty("brr:completion_ticks", Math.max(0, state.notifyAt - ctx.tick));
            if (ctx.tick < state.notifyAt) return;
            const owner = world.getAllPlayers().find((player) => player.id === entity.getDynamicProperty("brr:caller"));
            if (owner) {
                overlay(owner, "hitman", HITMAN_NOTIFY_SHOW_TICKS);
                owner.playSound("notification");
            }
            entity.remove();
            return;
        }
        state.sound.update(entity, ctx.tick);
        const targets = trackedCharacters(entity.dimension).filter((target) => target.typeId === "brr:raldi"
            && target.getProperty("brr:visual") !== 7);
        targets.sort((first, second) => distanceSquared(entity.location, first.location) - distanceSquared(entity.location, second.location));
        const target = targets[0];
        if (!target) return;
        if (distanceSquared(entity.location, target.location) <= 1 && hitCharacter(target, "hitman", entity)) {
            state.sound.stop(entity.dimension);
            entity.dimension.playSound("hitman_kill", entity.location);
            entity.setProperty("brr:hidden", true);
            state.notifyAt = ctx.tick + HITMAN_NOTIFY_DELAY_TICKS;
            entity.setDynamicProperty("brr:completion_ticks", HITMAN_NOTIFY_DELAY_TICKS);
            return;
        }
        state.nav.glide(entity, target.location, 0.15);
    },
    onRemove(state) { state.sound.stop(state.dimension); }
});

export function startPhone() {
    world.afterEvents.itemUse.subscribe(usePhone);
    if (world.afterEvents.itemUseOn) world.afterEvents.itemUseOn.subscribe(usePhone);
    else world.beforeEvents.itemUseOn?.subscribe(usePhone);
    world.afterEvents.playerLeave.subscribe(({ playerId }) => {
        forms.delete(playerId);
        calls.delete(playerId);
        useTicks.delete(playerId);
        for (const [key, entry] of overlays) {
            if (entry.player.id !== playerId) continue;
            setPhoneOverlay(entry.player, entry.name, false);
            overlays.delete(key);
        }
    });
    system.runInterval(() => {
        if (overlays.size === 0 && calls.size === 0 && pings.size === 0) return;
        for (const [key, entry] of overlays) {
            if (!entry.player.isValid || system.currentTick >= entry.until) {
                setPhoneOverlay(entry.player, entry.name, false);
                overlays.delete(key);
            }
        }
        if (isPaused()) return;
        const tick = gameTick();
        for (const [id, call] of calls) {
            if (!call.player.isValid) { calls.delete(id); continue; }
            if (tick < call.pickupAt) continue;
            if (call.spawnAt === undefined) {
                call.player.playSound("phnpickup");
                call.spawnAt = tick + PHONE_AUDIO.pickupTicks;
                continue;
            }
            if (tick < call.spawnAt) continue;
            try {
                if (!call.dimension.getEntities({ type: "brr:hitman" }).length) {
                    const hitman = call.dimension.spawnEntity("brr:hitman", { x: call.location.x + 0.5, y: call.location.y, z: call.location.z + 0.5 });
                    hitman.setDynamicProperty("brr:caller", id);
                }
            } catch { call.player.sendMessage("The character_spawner must be in a loaded area."); }
            calls.delete(id);
        }
        for (const [id, ping] of pings) {
            if (tick >= ping.until) { pings.delete(id); continue; }
            if (!ping.spots || tick % 10 === 0) {
                ping.spots = loadNotebooks().filter((spot) => {
                    if (spot.dimensionId !== id) return false;
                    let block;
                    try { block = ping.dimension.getBlock(spot); } catch { }
                    return !block || block.typeId.startsWith("brr:2d_nb_");
                });
            }
            // redrawn every tick since the marker sits on the camera and has to follow it
            if (ping.spots.length === 0) continue;
            for (const viewer of world.getAllPlayers()) {
                if (viewer.dimension.id !== id) continue;
                for (const spot of ping.spots) {
                    try { spawnPing(viewer, spot); } catch { }
                }
            }
        }
    }, 1);
    system.runInterval(() => {
        if (isPaused()) return;
        for (const player of world.getAllPlayers()) {
            if (!hotbarHasPhone(player) || overlays.has(`${player.id}:noise`) || Math.random() >= 0.05) continue;
            overlay(player, "noise", PHONE_AUDIO.noiseTicks);
            player.playSound("noisescalling");
        }
    }, 100);
}