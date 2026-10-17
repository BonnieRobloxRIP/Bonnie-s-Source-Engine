import { system } from "@minecraft/server";
import { flushRegistry, hasPendingWrites, loadRegistry } from "./registry.js";
import { processEventQueue } from "./io.js";
import { setAlwaysVisible, setToolsEnabled } from "./runtime.js";
import { startVisibilitySystem, invalidateVisibility } from "./systems/visibility.js";
import { startTouchSystem } from "./systems/touch.js";
import { startClipSystem } from "./systems/clips.js";
import { startLogicSystem } from "./systems/logic.js";
import { startPlayerRuleSystem, handlePlayerSpawn } from "./systems/player_rules.js";
import { startEditorSystem, handleEngineBlockInteract } from "./systems/editor.js";
import { startAmbientSystem } from "./systems/ambient.js";
import { syncAllCounters } from "./systems/math_counter.js";
import "./systems/filters.js";

// SECTION: Engine Bootstrap
// Loads the entity registry once the world is readable, then starts every runtime system.
// Pending entity changes are written at most once per second.

const FLUSH_INTERVAL_TICKS = 20;
let started = false;

export function startEngine() {
    if (started) return;
    started = true;

    system.run(() => {
        loadRegistry();
        startEditorSystem();
        startVisibilitySystem();
        startTouchSystem();
        startClipSystem();
        startLogicSystem();
        startPlayerRuleSystem();
        startAmbientSystem();
        syncAllCounters();

        system.runInterval(processEventQueue, 1);
        system.runInterval(() => {
            if (hasPendingWrites()) flushRegistry();
        }, FLUSH_INTERVAL_TICKS);
    });
}

export function setEngineBlocksAlwaysVisible(value) {
    setAlwaysVisible(value);
    invalidateVisibility();
}

export function setEngineToolsEnabled(value) {
    setToolsEnabled(value);
    invalidateVisibility();
}

export { handleEngineBlockInteract, handlePlayerSpawn };
