import { system, world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { addTagToPlayer, getPlayerTags, isEntityValid, removeTagFromPlayer, runPlayerCommand } from "../core/entity_utils.js";

const itemsMap = ["brr:sk_game_start", "brr:sk_game_stop", "brr:sk_music_yes", "brr:sk_music_no", "brr:sk_settings", "brr:sk_spectate"];
const usableItemIds = new Set(itemsMap);

function openSettingsForm(player) {
	if (!isEntityValid(player)) return;

	const hasAfkMode = getPlayerTags(player).includes("stop");
	const isMusicEnabled = !getPlayerTags(player).includes("music_stop");
	const isEmoteSoundEnabled = !getPlayerTags(player).includes("stop_emote_sound");

	const form = new ModalFormData()
		.title("Settings")
		.toggle("Afk mode", { defaultValue: hasAfkMode })
		.toggle("Music Enabled", { defaultValue: isMusicEnabled })
		.toggle("Emote Sounds Enabled", { defaultValue: isEmoteSoundEnabled });

	form.show(player)
		.then((response) => {
			if (response.canceled) return;
			if (!isEntityValid(player)) return;

			const afkEnabled = response.formValues?.[0] === true;
			if (afkEnabled) addTagToPlayer(player, "stop");
			else removeTagFromPlayer(player, "stop");

			const musicEnabled = response.formValues?.[1] === true;
			if (musicEnabled) removeTagFromPlayer(player, "music_stop");
			else addTagToPlayer(player, "music_stop");

			const emoteMusicEnabled = response.formValues?.[2] === true;
			if (emoteMusicEnabled) removeTagFromPlayer(player, "stop_emote_sound");
			else addTagToPlayer(player, "stop_emote_sound");
		})
		.catch(() => {
		});
}

function handleMappedItemUse(player, itemTypeId) {
	if (!isEntityValid(player)) return;

	switch (itemTypeId) {
		case "brr:sk_game_start":
			runPlayerCommand(player, "execute if score game lobby matches 0 run scoreboard players set enabled lobby 1");
			break;
		case "brr:sk_game_stop":
			runPlayerCommand(player, "execute if score game lobby matches 0 run scoreboard players set enabled lobby 0");
			break;
		case "brr:sk_music_yes":
			removeTagFromPlayer(player, "music_stop");
			break;
		case "brr:sk_music_no":
			addTagToPlayer(player, "music_stop");
			break;
		case "brr:sk_settings":
			openSettingsForm(player);
			break;
		case "brr:sk_spectate":
			addTagToPlayer(player, "spectator");
			break;
	}
}

world.afterEvents.itemUse.subscribe((event) => {
	const player = event.source;
	if (!player || player.typeId !== "minecraft:player") return;
	if (!isEntityValid(player)) return;

	const itemTypeId = event.itemStack?.typeId;
	if (!itemTypeId || !usableItemIds.has(itemTypeId)) return;

	system.run(() => {
		handleMappedItemUse(player, itemTypeId);
	});
});