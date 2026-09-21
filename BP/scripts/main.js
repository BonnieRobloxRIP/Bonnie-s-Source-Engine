import { system, world } from "@minecraft/server";
import { registerFloodButtonSystems } from "./flood_button.js";
import { registerFloodExitButtonSystems } from "./flood_exit_button.js";
import { registerItemSystems } from "./items.js";
import { registerLaserSystems } from "./laser_system.js";
// import { registerCraftalogBadgeSystems } from "./craftalog/badges.js";

const DEAD_PLAYER_SOUND_IDS = [
	"sfx.ambiance.dead_player.1",
	"sfx.ambiance.dead_player.2",
	"sfx.ambiance.dead_player.3",
];

const ENDLESS_RESPAWN_PENDING_TAG = "fe_endless_respawn_pending";
const ENDLESS_RESPAWN_CLEANUP_FUNCTION = "lobby_functions/misc/endless_respawn_cleanup";
const ENDLESS_RESPAWN_LOCATION = { x: 23, y: 23, z: 38 };
const pendingEndlessRespawns = new Set();

function getRandomDeadPlayerSoundId() {
	const randomIndex = Math.floor(Math.random() * DEAD_PLAYER_SOUND_IDS.length);
	return DEAD_PLAYER_SOUND_IDS[randomIndex];
}

function playDeadPlayerAmbianceForAllPlayers() {
	const soundId = getRandomDeadPlayerSoundId();

	for (const player of world.getAllPlayers()) {
		try {
			player.runCommand(`playsound ${soundId} @s`);
		} catch {
			// Keep death ambiance silent on failure to avoid log spam.
		}
	}
}

registerFloodButtonSystems();
registerFloodExitButtonSystems();
registerItemSystems();
registerLaserSystems();
// registerCraftalogBadgeSystems();

world.afterEvents.entityDie.subscribe((event) => {
	try {
		const deadEntity = event.deadEntity;
		if (deadEntity.typeId !== "minecraft:player") {
			return;
		}

		playDeadPlayerAmbianceForAllPlayers();

		if (!deadEntity.hasTag("endless")) {
			return;
		}

		pendingEndlessRespawns.add(deadEntity.name);

		const overworld = world.getDimension("overworld");
		overworld.runCommand(
			`execute as @a[name="${deadEntity.name}",tag=endless] run tag @s add ${ENDLESS_RESPAWN_PENDING_TAG}`
		);

		overworld.runCommand(
			`execute as @a[name="${deadEntity.name}",tag=endless] if score room_count endless > @s storage_endless run scoreboard players operation @s storage_endless = room_count endless`
		);
	} catch (error) {
		console.warn(`[Flood Escape] Failed to update storage_endless on endless death: ${error}`);
	}
});

world.afterEvents.playerSpawn.subscribe((event) => {
	try {
		if (event.initialSpawn) {
			return;
		}

		const player = event.player;
		if (!pendingEndlessRespawns.delete(player.name) && !player.hasTag(ENDLESS_RESPAWN_PENDING_TAG)) {
			return;
		}

		system.run(() => {
			try {
				player.teleport(ENDLESS_RESPAWN_LOCATION, { dimension: world.getDimension("overworld") });
				player.runCommand(`function ${ENDLESS_RESPAWN_CLEANUP_FUNCTION}`);
				player.runCommand(`tag @s remove ${ENDLESS_RESPAWN_PENDING_TAG}`);
			} catch (error) {
				console.warn(`[Flood Escape] Failed to finish endless respawn cleanup: ${error}`);
			}
		});
	} catch (error) {
		console.warn(`[Flood Escape] Failed to run endless respawn cleanup: ${error}`);
	}
});

world.afterEvents.playerLeave.subscribe((event) => {
	try {
		pendingEndlessRespawns.delete(event.playerName);
		const overworld = world.getDimension("overworld");
		overworld.runCommand("function lobby_functions/misc/scoreboard_leave");
	} catch (error) {
		console.warn(`[Flood Escape] Failed to run scoreboard_leave on player leave: ${error}`);
	}
});
