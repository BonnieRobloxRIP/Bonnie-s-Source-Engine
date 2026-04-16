import { world } from "@minecraft/server";
import { registerFloodButtonSystems } from "./flood_button.js";

registerFloodButtonSystems();

world.afterEvents.entityDie.subscribe((event) => {
	try {
		const deadEntity = event.deadEntity;
		if (deadEntity.typeId !== "minecraft:player" || !deadEntity.hasTag("endless")) {
			return;
		}

		deadEntity.runCommand(
			"execute if score room_count endless > @s storage_endless run scoreboard players operation @s storage_endless = room_count endless"
		);
	} catch (error) {
		console.warn(`[Flood Escape] Failed to update storage_endless on endless death: ${error}`);
	}
});

world.afterEvents.playerLeave.subscribe(() => {
	try {
		const overworld = world.getDimension("overworld");
		overworld.runCommand("function lobby_functions/misc/scoreboard_leave");
	} catch (error) {
		console.warn(`[Flood Escape] Failed to run scoreboard_leave on player leave: ${error}`);
	}
});
