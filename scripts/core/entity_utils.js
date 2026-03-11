import { world } from "@minecraft/server";

export function isEntityValid(entity) {
	if (!entity) return false;

	try {
		return entity.isValid === true;
	} catch {
		return false;
	}
}

export function getPlayerTags(player) {
	if (!isEntityValid(player)) return [];

	try {
		return player.getTags();
	} catch {
		return [];
	}
}

export function getPlayerName(player) {
	if (!isEntityValid(player)) return "";

	try {
		return player.name ?? "";
	} catch {
		return "";
	}
}

export function getPlayerById(playerId) {
	for (const player of world.getPlayers()) {
		if (player.id === playerId && isEntityValid(player)) {
			return player;
		}
	}

	return undefined;
}

export function runPlayerCommand(player, command) {
	if (!isEntityValid(player)) return false;

	try {
		player.runCommand(command);
		return true;
	} catch {
		return false;
	}
}

export function addTagToPlayer(player, tag) {
	if (!isEntityValid(player)) return;

	try {
		player.addTag(tag);
	} catch {
	}
}

export function removeTagFromPlayer(player, tag) {
	if (!isEntityValid(player)) return;

	try {
		player.removeTag(tag);
	} catch {
	}
}