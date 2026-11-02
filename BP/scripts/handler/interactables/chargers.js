import { InputMode, system, world } from "@minecraft/server";
import { playWorldSound, playWorldSoundInstances } from "../core/player_settings.js";

// SECTION: Wall Chargers
// The health and HEV chargers work the same way; createCharger takes what differs (block, sounds,
// empty animation). Like Black Mesa, a charger charges while the use button is held: holding it
// keeps refiring the interact event, and a gap of HOLD_RELEASE_TICKS means it was let go. Touch
// screens can't hold "use" on a block (holding breaks it), so there one tap charges until the
// player looks away or walks off. Charge draining is visual/audio only for now; no healing or
// suit power is applied yet.

const CHARGE_STATE = "brr:charge_level";
const CHARGE_HIGH_STATE = "brr:charge_high";
const EMPTY_ANIMATION_STATE = "brr:empty_animation";
const CHARGE_STEP = 5;
const CHARGE_INTERVAL_TICKS = 15;
const EMPTY_ANIMATION_FIRST_HOLD_TICKS = 10;
const MAX_INTERACTION_DISTANCE = 3.5;
// Matches max_distance on the charger sound definitions; players further away cannot hear it.
const SOUND_RANGE = 30;
const DENY_SOUND_COOLDOWN_TICKS = 20;
const HOLD_RELEASE_TICKS = 8;

// SECTION: Shared Helpers
function getLocationKey(dimensionId, location) {
    return `${dimensionId}:${location.x},${location.y},${location.z}`;
}

function isPlayerInReach(player, dimensionId, location) {
    try {
        if (!player?.isValid) return false;
        if (player.dimension.id !== dimensionId) return false;

        const dx = player.location.x - (location.x + 0.5);
        const dy = player.location.y - (location.y + 0.5);
        const dz = player.location.z - (location.z + 0.5);
        return (dx * dx) + (dy * dy) + (dz * dz) <= MAX_INTERACTION_DISTANCE * MAX_INTERACTION_DISTANCE;
    } catch {
        return false;
    }
}

// 0-100, stored in two states: 80-100 counts down in charge_level with charge_high set, 0-75 counts
// up from 0 without it (the block's geometry and textures switch on those).
function getChargeLevel(block) {
    const chargeLevel = Number(block?.permutation?.getState(CHARGE_STATE));
    const isHighCharge = Number(block?.permutation?.getState(CHARGE_HIGH_STATE)) === 1;
    if (!Number.isFinite(chargeLevel)) return 100;
    return isHighCharge
        ? Math.max(80, Math.min(100, 100 - chargeLevel))
        : Math.max(0, Math.min(75, chargeLevel));
}

function setBlockState(block, state, value) {
    try {
        block.setPermutation(block.permutation.withState(state, value));
        return true;
    } catch {
        return false;
    }
}

function setChargeLevel(block, chargeLevel) {
    const clampedChargeLevel = Math.max(0, Math.min(100, chargeLevel));
    const isHighCharge = clampedChargeLevel > 75;
    const storedLevel = isHighCharge ? 100 - clampedChargeLevel : clampedChargeLevel;

    try {
        let permutation = block.permutation.withState(CHARGE_HIGH_STATE, isHighCharge ? 1 : 0);
        permutation = permutation.withState(CHARGE_STATE, storedLevel);
        block.setPermutation(permutation);
        return true;
    } catch {
        return false;
    }
}

// Sound APIs are blocked in the restricted-execution context of beforeEvents, so defer to a normal tick.
function playBlockSound(dimensionId, location, soundId) {
    if (!dimensionId || !location || !soundId) return;

    system.run(() => {
        try {
            const soundLocation = { x: location.x + 0.5, y: location.y + 0.5, z: location.z + 0.5 };
            playWorldSound(world.getDimension(dimensionId), soundId, soundLocation, { pitch: 1, volume: 1 });
        } catch { }
    });
}

function usesHoldToCharge(player) {
    try {
        return player.inputInfo.lastInputModeUsed !== InputMode.Touch;
    } catch {
        return true;
    }
}

function isSessionAt(session, dimensionId, block) {
    return session?.dimensionId === dimensionId
        && session.location.x === block.x && session.location.y === block.y && session.location.z === block.z;
}

function isDead(player) {
    try {
        return (player.getComponent("minecraft:health")?.currentValue ?? 1) <= 0;
    } catch {
        return false;
    }
}

// SECTION: Charger Factory
/**
 * config:
 *   typeId           the charger block
 *   startSound       played when charging starts
 *   loopSound        optional; loops after the start sound, from startSoundTicks on, until charging ends
 *   startSoundTicks  length of the start sound in ticks (when there is a loop sound)
 *   denySound        played when it's empty, or charging was cut off
 *   emptyAnimation   { stepTicks, lastStage }: once empty, brr:empty_animation steps 1..lastStage,
 *                    the first EMPTY_ANIMATION_FIRST_HOLD_TICKS after emptying, then every stepTicks
 */
function createCharger(config) {
    const { typeId, startSound, loopSound, startSoundTicks = 0, denySound, emptyAnimation } = config;

    const activeSessions = new Map();
    const emptyAnimationDeadlines = new Map();
    const chargerUserByCharger = new Map();
    const lastDenyTickByCharger = new Map();

    function playSessionSound(session, soundId, loopCount) {
        try {
            const dimension = world.getDimension(session.dimensionId);
            const { x, y, z } = session.location;
            const location = { x: x + 0.5, y: y + 0.5, z: z + 0.5 };
            return playWorldSoundInstances(dimension, soundId, location, { pitch: 1, volume: 1, loopCount }, SOUND_RANGE);
        } catch {
            return [];
        }
    }

    function isActiveSession(session) {
        return activeSessions.get(session.playerId) === session;
    }

    // The start sound, then the loop (if any) for as long as the session lasts. Deferred like playBlockSound.
    function startChargeSound(session) {
        system.run(() => {
            if (!isActiveSession(session)) return;
            session.sounds.push(...playSessionSound(session, startSound, 0));
            if (!loopSound) return;

            system.runTimeout(() => {
                if (isActiveSession(session)) session.sounds.push(...playSessionSound(session, loopSound, -1));
            }, startSoundTicks);
        });
    }

    // Stops only this charger's sound, so other chargers in earshot keep playing.
    function stopChargeSound(session) {
        system.run(() => {
            for (const sound of session.sounds) {
                try {
                    sound.stop();
                } catch { }
            }
            session.sounds.length = 0;
        });
    }

    function playDenySound(dimensionId, location) {
        const chargerKey = getLocationKey(dimensionId, location);
        const lastDenyTick = lastDenyTickByCharger.get(chargerKey);
        if (Number.isFinite(lastDenyTick) && (system.currentTick - lastDenyTick) < DENY_SOUND_COOLDOWN_TICKS) return;

        lastDenyTickByCharger.set(chargerKey, system.currentTick);
        playBlockSound(dimensionId, location, denySound);
    }

    function endSession(playerId, playDenySoundOnEnd) {
        const session = activeSessions.get(playerId);
        if (!session) return;

        activeSessions.delete(playerId);

        const chargerKey = getLocationKey(session.dimensionId, session.location);
        if (chargerUserByCharger.get(chargerKey) === playerId) {
            chargerUserByCharger.delete(chargerKey);
        }

        stopChargeSound(session);
        if (playDenySoundOnEnd) {
            playDenySound(session.dimensionId, session.location);
        }
    }

    function isStillCharging(session) {
        const player = session.player;
        if (!isPlayerInReach(player, session.dimensionId, session.location)) return false;

        try {
            const hit = player.getBlockFromViewDirection({
                maxDistance: MAX_INTERACTION_DISTANCE,
                includePassableBlocks: true
            });
            const block = hit?.block;
            return block?.typeId === typeId
                && block.x === session.location.x
                && block.y === session.location.y
                && block.z === session.location.z;
        } catch {
            return false;
        }
    }

    function getSessionBlock(session) {
        try {
            return session.player.dimension.getBlock(session.location);
        } catch {
            return undefined;
        }
    }

    function startEmptyAnimation(block) {
        const blockKey = getLocationKey(block.dimension.id, block);
        setBlockState(block, EMPTY_ANIMATION_STATE, 0);
        emptyAnimationDeadlines.set(blockKey, {
            dimensionId: block.dimension.id,
            location: { x: block.x, y: block.y, z: block.z },
            stage: 0,
            nextStageTick: system.currentTick + EMPTY_ANIMATION_FIRST_HOLD_TICKS
        });
    }

    world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
        if (event.cancel || event.block?.typeId !== typeId) return;
        // Using the charger isn't also using the held item (placing a block on it, firing a gun).
        // Sneaking still lets the item through, the way it does on a chest.
        if (!event.player?.isSneaking) event.cancel = true;
        // Holding the interact button refires this event: that keeps a charge going, only the
        // initial press starts one.
        if (event.isFirstEvent === false) {
            const session = activeSessions.get(`${event.player?.id ?? ""}`);
            if (isSessionAt(session, event.block.dimension.id, event.block)) session.lastHoldTick = system.currentTick;
            return;
        }

        const player = event.player;
        const block = event.block;
        const playerId = `${player?.id ?? ""}`;
        if (!player || !playerId) return;

        const dimensionId = block.dimension.id;
        const blockLocation = { x: block.x, y: block.y, z: block.z };
        if (!isPlayerInReach(player, dimensionId, blockLocation)) return;

        const chargerKey = getLocationKey(dimensionId, blockLocation);
        if (chargerUserByCharger.has(chargerKey)) return;

        if (getChargeLevel(block) <= 0) {
            playDenySound(dimensionId, blockLocation);
            return;
        }

        endSession(playerId, false);
        chargerUserByCharger.set(chargerKey, playerId);
        const session = {
            player,
            playerId,
            dimensionId,
            location: blockLocation,
            nextChargeTick: system.currentTick + CHARGE_INTERVAL_TICKS,
            holdToCharge: usesHoldToCharge(player),
            lastHoldTick: system.currentTick,
            sounds: []
        };
        activeSessions.set(playerId, session);
        startChargeSound(session);
    });

    system.runInterval(() => {
        const currentTick = system.currentTick;

        for (const [playerId, session] of activeSessions) {
            // Letting go of the button (or dying) just stops it; the deny sound is for being cut off.
            if ((session.holdToCharge && currentTick - session.lastHoldTick > HOLD_RELEASE_TICKS) || isDead(session.player)) {
                endSession(playerId, false);
                continue;
            }
            if (!isStillCharging(session)) {
                endSession(playerId, true);
                continue;
            }

            if (currentTick < session.nextChargeTick) continue;
            session.nextChargeTick = currentTick + CHARGE_INTERVAL_TICKS;

            const block = getSessionBlock(session);
            if (block?.typeId !== typeId) {
                endSession(playerId, true);
                continue;
            }

            const nextChargeLevel = Math.max(0, getChargeLevel(block) - CHARGE_STEP);
            if (!setChargeLevel(block, nextChargeLevel)) {
                endSession(playerId, true);
                continue;
            }

            if (nextChargeLevel === 0) {
                startEmptyAnimation(block);
                endSession(playerId, true);
            }
        }

        for (const [blockKey, animation] of emptyAnimationDeadlines) {
            if (currentTick < animation.nextStageTick) continue;

            try {
                const block = world.getDimension(animation.dimensionId).getBlock(animation.location);
                if (block?.typeId !== typeId || getChargeLevel(block) > 0) {
                    emptyAnimationDeadlines.delete(blockKey);
                    continue;
                }

                animation.stage++;
                setBlockState(block, EMPTY_ANIMATION_STATE, animation.stage);
                if (animation.stage >= emptyAnimation.lastStage) emptyAnimationDeadlines.delete(blockKey);
                else animation.nextStageTick = currentTick + emptyAnimation.stepTicks;
            } catch {
                emptyAnimationDeadlines.delete(blockKey);
            }
        }
    }, 1);
}

// SECTION: Chargers
createCharger({
    typeId: "brr:health_charger",
    startSound: "interactable.health_charger.start",
    loopSound: "interactable.health_charger.loop",
    // healthcharger_start.ogg is 1.066 s long; the loop starts as it ends. The two files were cut
    // from one recording at a point where the loop's end runs back into its start without a seam.
    startSoundTicks: 21,
    denySound: "interactable.health_charger.deny",
    emptyAnimation: { stepTicks: 1, lastStage: 7 }
});

createCharger({
    typeId: "brr:hev_charger",
    // 16 s long, which outlasts a full charge (20 steps of 15 ticks), so it needs no loop.
    startSound: "interactable.hev_charger.start",
    denySound: "interactable.hev_charger.deny",
    emptyAnimation: { stepTicks: 3, lastStage: 2 }
});
