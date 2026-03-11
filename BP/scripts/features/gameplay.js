import { world } from "@minecraft/server";
import { isEntityValid, runPlayerCommand } from "../core/entity_utils.js";
import { oreBlocks } from "../data/ore_blocks.js";

const oreFunctionByBlockId = new Map(
	oreBlocks.map((oreEntry) => [oreEntry.ID, oreEntry.function])
);

function runDeathMessageForPlayer(player) {
	const didRunAsPlayer = runPlayerCommand(player, "function game_functions/misc/death_message");
	if (didRunAsPlayer) {
		return;
	}

	const playerName = typeof player?.name === "string" ? player.name : "";
	if (!playerName) {
		return;
	}

	const escapedPlayerName = playerName
		.replace(/\\/g, "\\\\")
		.replace(/"/g, "\\\"");

	try {
		world
			.getDimension("overworld")
			.runCommand(`execute as @a[name="${escapedPlayerName}"] run function game_functions/misc/death_message`);
	} catch {
	}
}

world.afterEvents.entityDie.subscribe((event) => {
	const deadEntity = event.deadEntity;
	if (!deadEntity || deadEntity.typeId !== "minecraft:player") return;

	try {
		if (!deadEntity.hasTag("game")) return;
	} catch {
		return;
	}

	runDeathMessageForPlayer(deadEntity);
});

world.afterEvents.playerBreakBlock.subscribe((event) => {
	const player = event.player;
	if (!player || !isEntityValid(player)) return;

	try {
		if (!player.hasTag("game")) return;
	} catch {
		return;
	}

	const brokenBlockId = event.brokenBlockPermutation?.type?.id ?? event.block?.typeId;
	if (!brokenBlockId) return;

	const functionPath = oreFunctionByBlockId.get(brokenBlockId);
	if (!functionPath) return;

	runPlayerCommand(player, `function ${functionPath}`);
});