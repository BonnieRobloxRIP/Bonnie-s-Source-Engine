import { system } from "@minecraft/server";
import { playWorldSound } from "../core/player_settings.js";

// SECTION: Plushies
// Every plushie block has the brr:plush custom component: using one, or a player stepping on it,
// squeaks, puffs out a few particles and plays a quick squish (squashed, a small overshoot, back to
// rest). The squish frames are the brr:squish block state; tools/plushies/apply_squish.mjs gives each
// plushie the permutations that scale its model for those frames.

const SQUEAK_SOUND = "brr.plush.squeak";
const SQUEEZE_PARTICLE = "brr:plushie";
const SQUISH_STATE = "brr:squish";
const FRAME_TICKS = 2;
const SQUEAK_COOLDOWN_TICKS = 3;
const SOUND_RANGE = 24;

// "dimension|x|y|z" -> { squeeze, lastSqueakTick } for plushies being squeezed right now.
const squeezes = new Map();
let squeezeCount = 0;

function setFrame(dimension, location, typeId, frame) {
    try {
        const block = dimension.getBlock(location);
        // Broken or replaced since the squeeze started: leave whatever is there alone.
        if (block?.typeId !== typeId) return;
        block.setPermutation(block.permutation.withState(SQUISH_STATE, frame));
    } catch { }
}

function squeeze(block) {
    const { dimension, typeId } = block;
    const location = { x: block.x, y: block.y, z: block.z };
    const key = `${dimension.id}|${location.x}|${location.y}|${location.z}`;
    const now = system.currentTick;

    const previous = squeezes.get(key);
    if (previous && now - previous.lastSqueakTick < SQUEAK_COOLDOWN_TICKS) return;
    const entry = { squeeze: ++squeezeCount, lastSqueakTick: now };
    squeezes.set(key, entry);

    const center = { x: location.x + 0.5, y: location.y + 0.25, z: location.z + 0.5 };
    playWorldSound(dimension, SQUEAK_SOUND, center, { pitch: 0.9 + Math.random() * 0.35, volume: 1 }, SOUND_RANGE);
    try {
        dimension.spawnParticle(SQUEEZE_PARTICLE, center);
    } catch { }

    // A newer squeeze restarts the animation; frames from the older one are skipped.
    const isCurrent = () => squeezes.get(key) === entry;
    setFrame(dimension, location, typeId, 1);
    system.runTimeout(() => {
        if (isCurrent()) setFrame(dimension, location, typeId, 2);
    }, FRAME_TICKS);
    system.runTimeout(() => {
        if (!isCurrent()) return;
        setFrame(dimension, location, typeId, 0);
        squeezes.delete(key);
    }, FRAME_TICKS * 2);
}

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("brr:plush", {
        onPlayerInteract: ({ block }) => squeeze(block),
        onStepOn: ({ block, entity }) => {
            if (entity?.typeId === "minecraft:player") squeeze(block);
        }
    });
});
