import { world } from "@minecraft/server";

const SPECTATE_ITEM_ID = "brr:fe_spectate";
const SPECTATE_FUNCTION_PATH = "lobby_functions/misc/items/fe_spectate";

let itemSystemsInitialized = false;

function runSpectateFunctionAsTarget(player) {
	const escapedName = player.name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
	player.dimension.runCommand(
		`execute as @a[name="${escapedName}",c=1] at @s run function ${SPECTATE_FUNCTION_PATH}`
	);
}

export function registerItemSystems() {
	if (itemSystemsInitialized) {
		return;
	}
	itemSystemsInitialized = true;

	world.afterEvents.itemUse.subscribe((event) => {
		const player = event.source;
		if (!player || player.typeId !== "minecraft:player") {
			return;
		}

		if (event.itemStack?.typeId !== SPECTATE_ITEM_ID) {
			return;
		}

		try {
			runSpectateFunctionAsTarget(player);
		} catch {
			// Intentionally silent to avoid spamming scripting logs.
		}
	});
}
