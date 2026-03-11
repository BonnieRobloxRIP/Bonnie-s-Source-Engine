import { system, world } from "@minecraft/server";
import { getPlayerName, getPlayerTags, isEntityValid, runPlayerCommand } from "../core/entity_utils.js";

world.afterEvents.playerSpawn.subscribe((event) => {
	if (!event.initialSpawn) return;
	const player = event.player;

	system.run(() => {
		if (!isEntityValid(player)) return;

		if (getPlayerTags(player).includes("lobby")) {
			runPlayerCommand(player, "scoreboard players reset @s music");
		}

		const playerTags = getPlayerTags(player);
		const hasJoinedBefore = playerTags.includes("joined_before");
		const welcomePrefix = hasJoinedBefore ? "Welcome back" : "Welcome";
		const playerName = getPlayerName(player);
		if (playerName) {
			runPlayerCommand(player, `tellraw @s {"rawtext":[{"text":"§f${welcomePrefix} to §r§l§bSky§awars§r§f, §r§l§e${playerName}§r§f! Join my discord server twin §5§odiscord.gg/GpwNShCz7m§r§l§f!"}]}`);
		}

		if (!hasJoinedBefore) {
			try {
				player.addTag("joined_before");
			} catch {
				return;
			}
		}

		if (getPlayerTags(player).includes("game")) {
			runPlayerCommand(player, "tp @s 0 1 -1");
		}
	});
});