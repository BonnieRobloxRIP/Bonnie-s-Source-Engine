import { system, world } from "@minecraft/server";
import { findMeme, playMeme } from "./memes.js";
import { setItemExplosion } from "./hud.js";

const ITEM_ID = "brr:item_gameboy";
const EXPLOSION_TICKS = 16;
const EXPLODING_PROPERTY = "brr:gameboy_exploding";
const exploding = new Map();
const useTicks = new Map();

function gameboySlots(player) {
    const container = player.getComponent("minecraft:inventory")?.container;
    const slots = [];
    if (container) {
        for (let slot = 0; slot < container.size; slot++) {
            if (container.getItem(slot)?.typeId === ITEM_ID) slots.push(slot);
        }
    }
    return { container, slots };
}

export function explodeGameboy(player) {
    if (exploding.has(player.id)) return;
    const { slots } = gameboySlots(player);
    if (!slots.length) return;
    setItemExplosion(player, system.currentTick, slots.filter((slot) => slot < 5));
    player.setDynamicProperty(EXPLODING_PROPERTY, true);
    player.dimension.playSound("item.xp_explode", player.location);
    exploding.set(player.id, { player, until: system.currentTick + EXPLOSION_TICKS });
}

function useGameboy({ itemStack, source: player }) {
    if (itemStack?.typeId !== ITEM_ID || !player || exploding.has(player.id)) return;
    if (useTicks.get(player.id) === system.currentTick) return;
    useTicks.set(player.id, system.currentTick);
    system.run(() => {
        if (!player.isValid || exploding.has(player.id) || !gameboySlots(player).slots.length) return;
        const meme = findMeme("item/gameboyvideo");
        if (!meme) {
            console.error("[Gameboy] Missing generated video data. Run make_meme_sheets.mjs --only item/GameBoyVideo.");
            player.sendMessage("The Gameboy video is missing from this pack.");
            return;
        }
        playMeme(player, { ...meme, formTitle: "brr:gameboy" });
    });
}

export function startGameboy() {
    world.afterEvents.itemUse.subscribe(useGameboy);
    if (world.afterEvents.itemUseOn) world.afterEvents.itemUseOn.subscribe(useGameboy);
    else world.beforeEvents.itemUseOn?.subscribe(useGameboy);
    world.afterEvents.playerSpawn.subscribe(({ player }) => {
        if (player.getDynamicProperty(EXPLODING_PROPERTY) !== true) return;
        const { container, slots } = gameboySlots(player);
        for (const slot of slots) container.setItem(slot);
        player.setDynamicProperty(EXPLODING_PROPERTY, undefined);
        setItemExplosion(player);
        exploding.delete(player.id);
    });
    world.afterEvents.playerLeave.subscribe(({ playerId }) => {
        const entry = exploding.get(playerId);
        if (entry) {
            if (entry.player.isValid) {
                const { container, slots } = gameboySlots(entry.player);
                for (const slot of slots) container.setItem(slot);
                entry.player.setDynamicProperty(EXPLODING_PROPERTY, undefined);
            }
            setItemExplosion(entry.player);
        }
        exploding.delete(playerId);
        useTicks.delete(playerId);
    });
    system.runInterval(() => {
        if (exploding.size === 0) return;
        for (const [id, entry] of exploding) {
            if (entry.player.isValid && system.currentTick < entry.until) continue;
            if (entry.player.isValid) {
                const { container, slots } = gameboySlots(entry.player);
                for (const slot of slots) container.setItem(slot);
                entry.player.setDynamicProperty(EXPLODING_PROPERTY, undefined);
            }
            setItemExplosion(entry.player);
            exploding.delete(id);
        }
    }, 1);
}
