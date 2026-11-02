import { world, system, BlockTypes, BlockVolume, SignSide } from "@minecraft/server";
import { alertOperators } from "./common.js";

// SECTION: Sign Guard (Sign Aura)
// The server gets no event when sign text changes, so the signs around each player are read once a
// second and compared with the last read. Text may only change on a sign someone placed, or opened
// with a clear line of sight (blocks.js), in the last 10 minutes; any other change is put back.
// A sign missing from a read is forgotten, so a sign swapped in later (by hand, command or
// structure) starts fresh. The one case that gets undone wrongly: a command or structure swapping
// in a sign with different text in the same spot less than a second after the last read.

const SCAN_INTERVAL_TICKS = 20;
const SCAN_RADIUS = 12;
const SCAN_HALF_HEIGHT = 8;
const EDIT_WINDOW_TICKS = 12000;
const NEARBY_RADIUS = 16;
const SIDES = [SignSide.Front, SignSide.Back];

let signTypeIds;
// "dimension|x|y|z" -> { dimensionId, location, typeId, text, raw, waxed } from the last read.
const knownSigns = new Map();
// "dimension|x|y|z" -> tick the sign was last placed or opened.
const editableSince = new Map();

const keyOf = (dimensionId, { x, y, z }) => `${dimensionId}|${x}|${y}|${z}`;

/** Lets the sign's text change for a while; called when a player opens it. */
export function allowSignEdit(block) {
    editableSince.set(keyOf(block.dimension.id, block), system.currentTick);
}

world.afterEvents.playerPlaceBlock.subscribe(({ block }) => {
    if (block.getComponent("minecraft:sign")) allowSignEdit(block);
});

function getSignTypeIds() {
    signTypeIds ??= BlockTypes.getAll()
        .map(type => type.id)
        .filter(id => id.startsWith("minecraft:") && id.includes("sign"));
    return signTypeIds;
}

function readSign(sign) {
    const snapshot = { text: {}, raw: {}, waxed: sign.isWaxed };
    for (const side of SIDES) {
        snapshot.text[side] = sign.getText(side) ?? "";
        snapshot.raw[side] = sign.getRawText(side);
    }
    return snapshot;
}

function checkSign(dimension, location, key, now) {
    const block = dimension.getBlock(location);
    const sign = block?.getComponent("minecraft:sign");
    if (!sign) return;

    const current = readSign(sign);
    const known = knownSigns.get(key);
    knownSigns.set(key, { dimensionId: dimension.id, location, typeId: block.typeId, ...current });
    if (!known || known.typeId !== block.typeId) return;
    if (SIDES.every(side => known.text[side] === current.text[side])) return;

    const openedAt = editableSince.get(key);
    if (!known.waxed && openedAt !== undefined && now - openedAt <= EDIT_WINDOW_TICKS) return;

    try {
        for (const side of SIDES) sign.setText(known.raw[side] ?? known.text[side], side);
    } catch {
        return;
    }
    knownSigns.set(key, known);

    const nearby = dimension.getPlayers({ location: block.center(), maxDistance: NEARBY_RADIUS }).map(player => player.name);
    alertOperators(`sign|${dimension.id}`,
        `§7Sign at ${location.x} ${location.y} ${location.z} was edited without anyone opening it; old text put back.§r Nearby: §e${nearby.join(", ") || "nobody"}`);
}

function scanAround(player, now) {
    const dimension = player.dimension;
    const { min, max } = dimension.heightRange;
    const x = Math.floor(player.location.x);
    const y = Math.floor(player.location.y);
    const z = Math.floor(player.location.z);
    const from = { x: x - SCAN_RADIUS, y: Math.max(min, y - SCAN_HALF_HEIGHT), z: z - SCAN_RADIUS };
    const to = { x: x + SCAN_RADIUS, y: Math.min(max - 1, y + SCAN_HALF_HEIGHT), z: z + SCAN_RADIUS };
    if (from.y > to.y) return;

    const volume = new BlockVolume(from, to);
    const found = dimension.getBlocks(volume, { includeTypes: getSignTypeIds() }, true);
    const present = new Set();
    for (const location of found.getBlockLocationIterator()) {
        const key = keyOf(dimension.id, location);
        present.add(key);
        try {
            checkSign(dimension, location, key, now);
        } catch { }
    }

    for (const [key, known] of knownSigns) {
        if (known.dimensionId === dimension.id && !present.has(key) && volume.isInside(known.location)) knownSigns.delete(key);
    }
}

// Players are spread over the interval, so each tick reads around a few of them at most.
system.runInterval(() => {
    const now = system.currentTick;
    const players = world.getAllPlayers();
    for (let index = 0; index < players.length; index++) {
        if ((now + index) % SCAN_INTERVAL_TICKS !== 0) continue;
        try {
            scanAround(players[index], now);
        } catch { }
    }

    if (now % EDIT_WINDOW_TICKS === 0) {
        for (const [key, tick] of editableSince) {
            if (now - tick > EDIT_WINDOW_TICKS) editableSince.delete(key);
        }
    }
}, 1);
