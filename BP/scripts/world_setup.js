import { system, world } from "@minecraft/server";
import { ensureMenuRoom } from "./menu_room.js";

// A brand-new world gets BP/functions/rc_setup once (scoreboards, gamerules, time, spawn); every game
// reset runs it again anyway (main_menu.js resetGame). The menu yard goes down after it, so its
// spawn (menu_room.js) is the one that sticks: the map isn't there until the first game starts.
const PREPARED_PROPERTY = "brr:world_prepared";
const RETRY_TICKS = 20;
const MAX_ATTEMPTS = 15;

function prepare(attempt = 0) {
    if (world.getDynamicProperty(PREPARED_PROPERTY) === true) return;
    try {
        world.getDimension("overworld").runCommand("function rc_setup");
        world.setDynamicProperty(PREPARED_PROPERTY, true);
        ensureMenuRoom();
    } catch (error) {
        if (attempt + 1 < MAX_ATTEMPTS) system.runTimeout(() => prepare(attempt + 1), RETRY_TICKS);
        else console.warn(`[setup] Couldn't prepare the new world with rc_setup: ${error}`);
    }
}

system.run(() => prepare());
