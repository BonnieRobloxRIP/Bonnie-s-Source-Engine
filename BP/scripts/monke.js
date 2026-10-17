import { system, world } from "@minecraft/server";
import { blockTypeAt } from "./core/block_cache.js";
import { gameTick, isPaused } from "./core/pause.js";
import { setSpeedFactor } from "./core/player_speed.js";
import { smashWindowAt, touchedBlocks } from "./core/windows.js";
import { musicVolume } from "./core/settings.js";
import { hitCharacter } from "./characters/registry.js";
import { isDoorType, openDoorAt, SMALL_DOOR_CLOSE_DELAY_TICKS } from "./doors.js";
import { consumeSelected } from "./item_functionality.js";
import { MONKENATOR_TAG } from "./jail.js";
import { onRunStart } from "./run.js";

// The Monkenator (Monkenator.cs / BecomeMonke in the original): for 10 seconds the player is a
// monke. It runs twice as fast, bonks Raldi instead of getting caught, opens doors by running into
// them and smashes windows it touches. Everyone sees it as a 2D gorilla: the player's mark variant
// switches RP/entity/player.entity.json over to the monke billboard. Its bathroom habits are in
// bathroom.js and Chipfloke doesn't fight it over a jailbreak (chipfloke.js).

const MONKENATOR_ID = "brr:item_monkenator";
const MONKE_TICKS = 200;
const SPEED_FACTOR = 2;
const MUSIC = "mus_monke";
const TRANSFORM_SOUND = "player.monke_transform";
const RALDI_ID = "brr:raldi";
const BONK_RANGE = 1.5;

// player id -> { player, until }
const monkes = new Map();

export function isMonke(player) {
    return player.hasTag(MONKENATOR_TAG);
}

function becomeMonke(player) {
    if (isMonke(player)) return false;
    player.addTag(MONKENATOR_TAG);
    try { player.triggerEvent("brr:monke_on"); } catch { }
    setSpeedFactor(player, "monke", SPEED_FACTOR);
    monkes.set(player.id, { player, until: gameTick() + MONKE_TICKS });
    try { player.dimension.playSound(TRANSFORM_SOUND, player.location); } catch { }
    try { player.playSound(MUSIC, { volume: musicVolume(player) }); } catch { }
    return true;
}

// `loud` false skips the transform sound, like being cut short by MrBeast or a new run
export function endMonke(player, loud = true) {
    monkes.delete(player.id);
    if (!player.isValid || !isMonke(player)) return;
    player.removeTag(MONKENATOR_TAG);
    try { player.triggerEvent("brr:monke_off"); } catch { }
    setSpeedFactor(player, "monke", undefined);
    try { player.runCommand(`stopsound @s ${MUSIC}`); } catch { }
    if (loud) try { player.dimension.playSound(TRANSFORM_SOUND, player.location); } catch { }
}

function bonkRaldi(player) {
    const raldis = player.dimension.getEntities({ type: RALDI_ID, location: player.location, maxDistance: BONK_RANGE });
    for (const raldi of raldis) hitCharacter(raldi, "monke", player);
}

// windows break on contact; doors only give way to a running monke
function smashThrough(player) {
    const dimension = player.dimension;
    const running = player.isSprinting;
    for (const location of touchedBlocks(player)) {
        if (running && isDoorType(blockTypeAt(dimension, location.x, location.y, location.z))) {
            openDoorAt(dimension, location, SMALL_DOOR_CLOSE_DELAY_TICKS);
        } else {
            smashWindowAt(dimension, location);
        }
    }
}

function update() {
    if (monkes.size === 0 || isPaused()) return;
    const tick = gameTick();
    for (const [id, monke] of monkes) {
        const player = monke.player;
        if (!player.isValid) {
            monkes.delete(id);
            continue;
        }
        if (tick >= monke.until) {
            endMonke(player);
            continue;
        }
        try {
            bonkRaldi(player);
            smashThrough(player);
        } catch (error) {
            console.warn(`[monke] Update failed for ${player.name}: ${error}`);
        }
    }
}

export function startMonkenator() {
    world.afterEvents.itemUse.subscribe(({ itemStack, source }) => {
        // already a monke: the item stays (OnItemUse returns false in the original)
        if (itemStack.typeId === MONKENATOR_ID && becomeMonke(source)) consumeSelected(source);
    });

    world.afterEvents.entityDie.subscribe(({ deadEntity }) => endMonke(deadEntity, false), { entityTypes: ["minecraft:player"] });

    // the tag outlives a relog or a script reload, the timer doesn't
    world.afterEvents.playerSpawn.subscribe(({ player }) => {
        if (!monkes.has(player.id)) endMonke(player, false);
    });

    world.afterEvents.playerLeave.subscribe(({ playerId }) => monkes.delete(playerId));

    onRunStart((player) => endMonke(player, false));

    system.runInterval(update, 1);
}
