import { system, world } from "@minecraft/server";

const HEV_CHARGER_TYPE_ID = "brr:hev_charger";
const CHARGE_STATE = "brr:charge_level";
const CHARGE_HIGH_STATE = "brr:charge_high";
const EMPTY_ANIMATION_STATE = "brr:empty_animation";
const CHARGE_STEP = 5;
const CHARGE_INTERVAL_TICKS = 15;
const EMPTY_ANIMATION_STEP_TICKS = 3;
const EMPTY_ANIMATION_FIRST_HOLD_TICKS = 10;
const MAX_INTERACTION_DISTANCE = 3.5;
const START_SOUND = "interactable.hev_charger.start";
const DENY_SOUND = "interactable.hev_charger.deny";
// Matches max_distance on the charger sound definitions.
const SOUND_STOP_RADIUS = 30;
const DENY_SOUND_COOLDOWN_TICKS = 20;

const activeSessions = new Map();
const emptyAnimationDeadlines = new Map();
const chargerUserByCharger = new Map();
const lastDenyTickByCharger = new Map();

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
        const soundLocation = { x: location.x + 0.5, y: location.y + 0.5, z: location.z + 0.5 };

        let dimension;
        try {
            dimension = world.getDimension(dimensionId);
        } catch {
            return;
        }

        try {
            dimension.playSound(soundId, soundLocation, { pitch: 1, volume: 1 });
            return;
        } catch { }

        try {
            dimension.runCommand(`playsound ${soundId} @a ${soundLocation.x} ${soundLocation.y} ${soundLocation.z} 1 1`);
        } catch { }
    });
}

function stopBlockStartSound(dimensionId, location) {
    if (!dimensionId || !location) return;

    system.run(() => {
        try {
            const dimension = world.getDimension(dimensionId);
            dimension.runCommand(`stopsound @a[x=${location.x},y=${location.y},z=${location.z},r=${SOUND_STOP_RADIUS}] ${START_SOUND}`);
        } catch { }
    });
}

function playDenySound(dimensionId, location) {
    const chargerKey = getLocationKey(dimensionId, location);
    const lastDenyTick = lastDenyTickByCharger.get(chargerKey);
    if (Number.isFinite(lastDenyTick) && (system.currentTick - lastDenyTick) < DENY_SOUND_COOLDOWN_TICKS) return;

    lastDenyTickByCharger.set(chargerKey, system.currentTick);
    playBlockSound(dimensionId, location, DENY_SOUND);
}

function endSession(playerId, playDenySoundOnEnd) {
    const session = activeSessions.get(playerId);
    if (!session) return;

    activeSessions.delete(playerId);

    const chargerKey = getLocationKey(session.dimensionId, session.location);
    if (chargerUserByCharger.get(chargerKey) === playerId) {
        chargerUserByCharger.delete(chargerKey);
    }

    stopBlockStartSound(session.dimensionId, session.location);
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
        return block?.typeId === HEV_CHARGER_TYPE_ID
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
        empty2Tick: system.currentTick + EMPTY_ANIMATION_FIRST_HOLD_TICKS,
        empty3Tick: system.currentTick + EMPTY_ANIMATION_FIRST_HOLD_TICKS + EMPTY_ANIMATION_STEP_TICKS
    });
}

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    if (event.cancel || event.block?.typeId !== HEV_CHARGER_TYPE_ID) return;
    // Holding the interact button refires this event; only the initial press should count.
    if (event.isFirstEvent === false) return;

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
    activeSessions.set(playerId, {
        player,
        dimensionId,
        location: blockLocation,
        nextChargeTick: system.currentTick + CHARGE_INTERVAL_TICKS
    });
    playBlockSound(dimensionId, blockLocation, START_SOUND);
});

system.runInterval(() => {
    const currentTick = system.currentTick;

    for (const [playerId, session] of activeSessions) {
        if (!isStillCharging(session)) {
            endSession(playerId, true);
            continue;
        }

        if (currentTick < session.nextChargeTick) continue;
        session.nextChargeTick = currentTick + CHARGE_INTERVAL_TICKS;

        const block = getSessionBlock(session);
        if (block?.typeId !== HEV_CHARGER_TYPE_ID) {
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
        if (currentTick < animation.empty2Tick) continue;

        try {
            const dimension = world.getDimension(animation.dimensionId);
            const block = dimension.getBlock(animation.location);
            if (block?.typeId !== HEV_CHARGER_TYPE_ID || getChargeLevel(block) > 0) {
                emptyAnimationDeadlines.delete(blockKey);
                continue;
            }

            if (currentTick >= animation.empty3Tick) {
                setBlockState(block, EMPTY_ANIMATION_STATE, 2);
                emptyAnimationDeadlines.delete(blockKey);
            } else {
                setBlockState(block, EMPTY_ANIMATION_STATE, 1);
            }
        } catch {
            emptyAnimationDeadlines.delete(blockKey);
        }
    }
}, 1);
