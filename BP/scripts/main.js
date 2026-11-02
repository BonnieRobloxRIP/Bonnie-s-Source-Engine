import * as mc from "@minecraft/server";
import { emojiCommand } from "./handler/core/chat_system.js";
import "./handler/core/dev_privileges.js";
import "./handler/core/moderation.js";
import "./handler/core/death_messages.js";
import "./handler/pets.js";
import "./handler/weapons/gluon_gun.js";
import "./handler/weapons/tau_cannon.js";
import "./handler/weapons/crowbar.js";
import "./handler/weapons/glock17.js";
import "./handler/weapons/magnum357.js";
import "./handler/weapons/spas12.js";
import "./handler/interactables/chargers.js";
import "./handler/interactables/plushies.js";
import "./handler/npc/scientist.js";
import "./handler/anticheat/index.js";
import { cancelForbiddenBlockInteraction, loadPersistedPermissions } from "./handler/permissions.js";
import { initializeDynamicLightingSystem } from "./handler/core/dynamic_lighting.js";
import { registerBrrCommands } from "./handler/core/brr_commands.js";
import { parseBooleanLike } from "./handler/core/parse.js";
import { getInvisibleNameStyle, getUsernameMode, setInvisibleNameStyle, setUsernameMode, startUsernameModes } from "./handler/core/username_mode.js";
import { processBlackMesaMenuRequests } from "./handler/ui/black_mesa_menu.js";
import {
    startEngine,
    setEngineBlocksAlwaysVisible,
    setEngineToolsEnabled,
    handleEngineBlockInteract,
    handlePlayerSpawn
} from "./engine/index.js";
import "./antiexploit.js";

// SECTION: Entry Point
// Wires the systems together: every feature lives in its own module (imported above for its event
// subscriptions); this file registers the commands, loads saved settings and routes block clicks.

const { world, system } = mc;
const VERSION_TEXT = "§aBonnie's Source Engine Demo v0.5.2. Property of: BonnieRobloxRIP";

// SECTION: Startup Commands & Persisted Toggles
try {
    if (system?.beforeEvents?.startup) {
        system.beforeEvents.startup.subscribe((data) => {
            registerBrrCommands(data, {
                emojiCommand,
                setEngineBlocksAlwaysVisible: (nextValue) => {
                    setEngineBlocksAlwaysVisible(nextValue);
                    world.setDynamicProperty("engine_blocks_always_visible", nextValue);
                    return nextValue;
                },
                setToolsEnabled: (nextValue) => {
                    setEngineToolsEnabled(nextValue);
                    world.setDynamicProperty("tools_enabled", nextValue);
                    return nextValue;
                },
                getUsernameMode,
                setUsernameMode,
                getInvisibleNameStyle,
                setInvisibleNameStyle,
                versionText: VERSION_TEXT
            });
        });
    }
} catch { }

system.run(() => {
    setEngineBlocksAlwaysVisible(parseBooleanLike(world.getDynamicProperty("engine_blocks_always_visible"), false));
    setEngineToolsEnabled(parseBooleanLike(world.getDynamicProperty("tools_enabled"), true));
    startUsernameModes();
    loadPersistedPermissions();
    initializeDynamicLightingSystem();
});

startEngine();

system.runInterval(() => {
    processBlackMesaMenuRequests();
}, 1);

// SECTION: Player Spawn Handling
world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    if (!player) return;

    system.run(() => {
        if (event.initialSpawn) {
            try {
                console.warn(`Player ${player.name} Successfully connected`);
            } catch { }
        }

        handlePlayerSpawn(player, event.initialSpawn);
    });
});

// SECTION: Block Interaction
// Adventure rules first: a click they forbid never reaches an engine block.
world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
    if (data.cancel || cancelForbiddenBlockInteraction(data)) return;
    handleEngineBlockInteract(data);
});
