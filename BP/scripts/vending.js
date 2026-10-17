import { system } from "@minecraft/server";
import { giveToHotbar } from "./core/hotbar.js";
import { ITEM_TO_BLOCK } from "./item_blocks.js";
import { gameTick, isPaused } from "./core/pause.js";
import { getObjective } from "./core/scoreboard.js";
import { SegmentedSound } from "./characters/segmented_sound.js";

// Prices inspected on the front textures; money is in cents, ETH in whole units.
export const VENDING_MACHINES = {
    "brr:vending_bsoda": { item: "brr:item_bsoda", price: 25 },
    "brr:vending_bsoda_eth": { item: "brr:item_bsoda", price: 1, currency: "etherium" },
    "brr:vending_bsoda_free": { item: "brr:item_bsoda", price: 0 },
    "brr:vending_alarm_clock": { item: "brr:item_alarm", price: 50 },
    "brr:vending_energy": { item: "brr:item_energy", price: 50 },
    "brr:vending_hammer": { item: "brr:item_hammer", price: 75 },
    "brr:vending_monkenator": { item: "brr:item_monkenator", price: 100 },
    "brr:vending_sprite_cranberry": { item: "brr:item_sprite_cranberry", price: 25 },
    "brr:vending_wd_nosquee": { item: "brr:item_squee", price: 50 },
    "brr:vending_zesty": { item: "brr:item_zestybar", price: 25 },
    "brr:vending_zesty_eth": { item: "brr:item_zestybar", price: 1, currency: "etherium" },
    "brr:vending_peppermint_bar": { item: "brr:item_peppermint_bar", price: 25 },
    "brr:vending_ornament": { item: "brr:item_ornament", price: 50 },
    "brr:vending_pearl": { item: "minecraft:ender_pearl", price: 50 }
};

const CRANBERRY_MACHINE = "brr:vending_sprite_cranberry";
const songs = new Map();
// the machine's front faces its cardinal_direction (the front texture is on its north face)
const FRONT = { north: { x: 0, z: -1 }, south: { x: 0, z: 1 }, west: { x: -1, z: 0 }, east: { x: 1, z: 0 } };
let placeItemBlock = () => false;

function baseOf(block) {
    return block.permutation.getState("minecraft:multi_block_part") === 1 ? block.below() : block;
}

function keyOf(block) {
    return `${block.dimension.id}:${block.x},${block.y},${block.z}`;
}

function center(block) {
    return { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 };
}

function notify(player, message, values = []) {
    player.sendMessage({ translate: `brr.vending.${message}`, with: values });
}

// the block in front of the machine's bottom half, where a bought item is put down
function frontOf(base) {
    const front = FRONT[base.permutation.getState("minecraft:cardinal_direction")];
    if (!front) return undefined;
    try { return base.dimension.getBlock({ x: base.x + front.x, y: base.y, z: base.z + front.z }); } catch { return undefined; }
}

function purchase(block, player) {
    if (isPaused()) {
        notify(player, "paused");
        return;
    }
    const machine = VENDING_MACHINES[block.typeId];
    const base = baseOf(block);
    if (!machine || !base || base.typeId !== block.typeId) {
        notify(player, "unavailable");
        return;
    }
    // the item comes out as its item block in front of the machine (pick it up like any other, with
    // the five-slot swap when full); one with no item block (the ender pearl) goes straight into a slot
    const front = ITEM_TO_BLOCK[machine.item] ? frontOf(base) : undefined;
    if (front && !front.isAir) {
        notify(player, "blocked");
        return;
    }

    const currency = machine.currency ?? "money";
    const objective = machine.price > 0 ? getObjective(currency, currency === "etherium" ? "ETH" : "Money") : undefined;
    const balance = objective && player.scoreboardIdentity ? objective.getScore(player) ?? 0 : 0;
    if (balance < machine.price) {
        notify(player, currency === "etherium" ? "eth" : "money",
            [currency === "etherium" ? String(machine.price) : (machine.price / 100).toFixed(2)]);
        return;
    }

    if (objective) objective.setScore(player, balance - machine.price);
    let delivered = false;
    try {
        delivered = placeItemBlock(front, machine.item) || giveToHotbar(player, machine.item);
    } catch (error) {
        if (objective) objective.setScore(player, balance);
        throw error;
    }
    if (!delivered) {
        if (objective) objective.setScore(player, balance);
        notify(player, "full");
        return;
    }
    try {
        base.dimension.playSound("coin_drop", center(base));
    } catch (error) {
        console.warn(`[vending] Purchase completed but coin_drop failed at ${keyOf(base)}: ${error}`);
    }
}

function tickTheme(block) {
    if (block.typeId !== CRANBERRY_MACHINE
        || block.permutation.getState("minecraft:multi_block_part") !== 0) return;
    const key = keyOf(block);
    let entry = songs.get(key);
    if (!entry) {
        entry = { sound: new SegmentedSound("vending.cranberry", true), lastSeen: system.currentTick };
        entry.sound.start(gameTick());
        songs.set(key, entry);
    }
    entry.lastSeen = system.currentTick;
    if (!isPaused()) entry.sound.update({ dimension: block.dimension, location: center(block) }, gameTick());
}

// Unloaded or command-removed machines stop ticking; discard their inactive playback state.
system.runInterval(() => {
    for (const [key, entry] of songs) {
        if (system.currentTick - entry.lastSeen > 200) songs.delete(key);
    }
}, 200);

export function registerVendingComponents(blockComponentRegistry, hooks = {}) {
    if (hooks.placeItemBlock) placeItemBlock = (block, itemId) => block !== undefined && hooks.placeItemBlock(block, itemId);
    blockComponentRegistry.registerCustomComponent("brr:vending", {
        onPlayerInteract({ block, player }) {
            if (!player) return;
            try {
                purchase(block, player);
            } catch (error) {
                console.warn(`[vending] Purchase failed at ${keyOf(block)}: ${error}`);
                notify(player, "unavailable");
            }
        },
    });

    blockComponentRegistry.registerCustomComponent("brr:vending_theme", {
        onTick({ block }) { tickTheme(block); },
        onPlace({ block }) {
            const base = baseOf(block);
            if (base) songs.delete(keyOf(base));
        },
        onPlayerBreak({ block }) {
            const base = baseOf(block);
            if (base) songs.delete(keyOf(base));
        }
    });
}
