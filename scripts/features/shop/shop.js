import { world, system } from "@minecraft/server";
import { SHOP_CATALOG, SHOP_CATEGORY_RULES } from "./shop_items.js";

const CURRENCY_OBJECTIVE_IDS = ["coins_storage"];
const WINS_OBJECTIVE_IDS = ["win_storage"];
const FREE_COINS_TAG = "brr";
const COLOR_CODE_PATTERN = /§./g;
const COINS_LINE_PATTERNS = /^(\d[\d,]*)\s+Coins(?:\s+)?$/i;
const WINS_LINE_PATTERNS = /^(\d[\d,]*)\s+Wins(?:\s+)?$/i;

const shopItemsBySignKey = new Map();
const shopItemsByKey = new Map();

for (const item of SHOP_CATALOG) {
	shopItemsByKey.set(item.key, item);

	for (const signKey of item.signKeys) {
		shopItemsBySignKey.set(normalizeSignLine(signKey), item);
	}
}

const lastShopUseTickByPlayer = new Map();
const equippedOrderByPlayerCategory = new Map();

function getCurrentTick() {
	return system.currentTick ?? 0;
}

function isSignBlock(block) {
	return typeof block?.typeId === "string" && block.typeId.includes("sign");
}

function stripFormattingCodes(text) {
	return typeof text === "string" ? text.replace(COLOR_CODE_PATTERN, "") : "";
}

function normalizeSignLine(text) {
	return stripFormattingCodes(text)
		.replace(/\s+/g, " ")
		.trim()
		.toLowerCase();
}

function parseRequiredAmount(line, patterns) {
	const plainLine = stripFormattingCodes(line).trim();
	const normalizedPatterns = Array.isArray(patterns)
		? patterns
		: patterns
			? [patterns]
			: [];

	for (const pattern of normalizedPatterns) {
		const match = plainLine.match(pattern);
		if (!match) continue;

		const numericText = (match[1] ?? "").replace(/,/g, "");
		const amount = Number(numericText);
		if (Number.isFinite(amount) && amount > 0) {
			return amount;
		}
	}

	return 0;
}

function getSignText(block) {
	const signComponent = block.getComponent("minecraft:sign");
	if (!signComponent) return "";

	if (typeof signComponent.getText === "function") {
		return signComponent.getText() ?? "";
	}

	if (typeof signComponent.getTextFace === "function") {
		const frontText = signComponent.getTextFace("front") ?? "";
		if (frontText) return frontText;
		return signComponent.getTextFace("back") ?? "";
	}

	return "";
}

function parseShopDataFromSign(block) {
	const signText = getSignText(block);
	if (!signText) return null;

	const lines = signText
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	if (lines.length === 0) return null;

	const itemLine = lines.find((line) => shopItemsBySignKey.has(normalizeSignLine(line)));
	if (!itemLine) return null;

	const itemConfig = shopItemsBySignKey.get(normalizeSignLine(itemLine));
	if (!itemConfig) return null;

	let requiredCoins = 0;
	let requiredWins = 0;

	for (const line of lines) {
		if (requiredCoins <= 0) {
			requiredCoins = parseRequiredAmount(line, COINS_LINE_PATTERNS);
		}

		if (requiredWins <= 0) {
			requiredWins = parseRequiredAmount(line, WINS_LINE_PATTERNS);
		}
	}

	if (itemConfig.requiresCoins && requiredCoins <= 0) return null;
	if (itemConfig.requiresWins && requiredWins <= 0) return null;

	return { itemConfig, requiredCoins, requiredWins };
}

function getObjectiveScore(player, objectiveId) {
	const objective = world.scoreboard.getObjective(objectiveId);
	if (!objective || !player.scoreboardIdentity) return 0;

	try {
		return objective.getScore(player.scoreboardIdentity) ?? 0;
	} catch {
		try {
			const participant = objective
				.getParticipants()
				.find((entry) => entry.displayName === player.name);

			if (!participant) return 0;
			return objective.getScore(participant) ?? 0;
		} catch {
			return 0;
		}
	}
}

function resolveObjectiveId(objectiveIds) {
	for (const objectiveId of objectiveIds) {
		if (world.scoreboard.getObjective(objectiveId)) {
			return objectiveId;
		}
	}

	return null;
}

function setObjectiveScore(player, objectiveId, score) {
	const objective = world.scoreboard.getObjective(objectiveId);
	if (!objective || !player.scoreboardIdentity) return false;

	try {
		objective.setScore(player.scoreboardIdentity, score);
		return true;
	} catch {
		try {
			player.runCommand(`scoreboard players set @s ${objectiveId} ${score}`);
			return true;
		} catch {
			return false;
		}
	}
}

function isInteractionOnCooldown(player) {
	const currentTick = getCurrentTick();
	const lastTick = lastShopUseTickByPlayer.get(player.id) ?? -999;

	if (currentTick - lastTick < 5) {
		return true;
	}

	lastShopUseTickByPlayer.set(player.id, currentTick);
	return false;
}

function sendRawText(player, text) {
	player.runCommand(`tellraw @s {"rawtext":[{"text":"${text}"}]}`);
}

function sendPurchaseAnnouncement(player, announcementMessage) {
	if (typeof announcementMessage !== "string" || announcementMessage.length === 0) {
		return;
	}

	const playerName = player?.nameTag || player?.name || "Unknown";
	const message = announcementMessage.replace(/\{player\}/gi, playerName);
	world.sendMessage(message);
}

function getCategoryMaxEquipped(category) {
	const categoryRule = SHOP_CATEGORY_RULES[category];
	const configuredLimit = categoryRule?.maxEquipped;

	if (typeof configuredLimit === "number" && configuredLimit > 0) {
		return configuredLimit;
	}

	return 1;
}

function getCategoryPurchaseAgain(category) {
	const categoryRule = SHOP_CATEGORY_RULES[category];
	return categoryRule?.purchaseAgain === true;
}

function getPlayerCategoryOrderKey(playerId, category) {
	return `${playerId}|${category}`;
}

function equipOwnedItem(player, itemConfig) {
	if (!itemConfig.category || !itemConfig.equipTag) {
		return false;
	}

	const categoryMaxEquipped = getCategoryMaxEquipped(itemConfig.category);
	const categoryPurchaseAgain = getCategoryPurchaseAgain(itemConfig.category);
	const playerCategoryOrderKey = getPlayerCategoryOrderKey(player.id, itemConfig.category);
	const existingOrder = equippedOrderByPlayerCategory.get(playerCategoryOrderKey) ?? [];

	const currentlyEquippedKeys = [];

	for (const catalogItem of SHOP_CATALOG) {
		if (catalogItem.category !== itemConfig.category || !catalogItem.equipTag) {
			continue;
		}

		if (player.hasTag(catalogItem.equipTag)) {
			currentlyEquippedKeys.push(catalogItem.key);
		}
	}

	const orderedEquippedKeys = existingOrder.filter((itemKey) => currentlyEquippedKeys.includes(itemKey));
	for (const itemKey of currentlyEquippedKeys) {
		if (!orderedEquippedKeys.includes(itemKey)) {
			orderedEquippedKeys.push(itemKey);
		}
	}

	player.addTag(itemConfig.equipTag);

	if (!orderedEquippedKeys.includes(itemConfig.key)) {
		orderedEquippedKeys.push(itemConfig.key);
	}

	while (orderedEquippedKeys.length > categoryMaxEquipped) {
		const unequippedItemKey = orderedEquippedKeys.shift();
		if (!unequippedItemKey || unequippedItemKey === itemConfig.key) {
			continue;
		}

		const unequippedItemConfig = shopItemsByKey.get(unequippedItemKey);
		if (!unequippedItemConfig?.equipTag) {
			continue;
		}

		let didUnequip = false;
		let didRemoveOwnership = false;

		if (player.hasTag(unequippedItemConfig.equipTag)) {
			player.removeTag(unequippedItemConfig.equipTag);
			didUnequip = true;
		}

		if (categoryPurchaseAgain && unequippedItemConfig.ownershipTag && player.hasTag(unequippedItemConfig.ownershipTag)) {
			player.removeTag(unequippedItemConfig.ownershipTag);
			didRemoveOwnership = true;
		}

		if (didUnequip) {
			sendRawText(
				player,
				`§7Unequipped §f${unequippedItemConfig.displayName}`
			);
		}

		if (didRemoveOwnership) {
			sendRawText(player, `§cRemoved §f${unequippedItemConfig.displayName}§c from your owned items to keep things fair`);
		}
	}

	equippedOrderByPlayerCategory.set(playerCategoryOrderKey, orderedEquippedKeys);

	if (itemConfig.equipMessage) {
		sendRawText(player, itemConfig.equipMessage);
	}

	return true;
}

function handleShopSignInteraction(player, block) {
	if (!player || !block || !isSignBlock(block)) return;
	if (isInteractionOnCooldown(player)) return;

	const shopData = parseShopDataFromSign(block);
	if (!shopData) return;

	const { itemConfig, requiredCoins, requiredWins } = shopData;

	if (player.hasTag(itemConfig.ownershipTag)) {
		const alreadyEquipped = !!itemConfig.equipTag && player.hasTag(itemConfig.equipTag);
		if (alreadyEquipped) {
			sendRawText(player, "§3You already own this bro");
			return;
		}

		const didEquip = equipOwnedItem(player, itemConfig);
		if (!didEquip) {
			sendRawText(player, "§3You already own this bro");
		}
		return;
	}

	if (itemConfig.requiresWins) {
		const winsObjectiveId = resolveObjectiveId(WINS_OBJECTIVE_IDS);
		if (!winsObjectiveId) {
			player.sendMessage("§cShop error: wins objective not found.");
			return;
		}

		const currentWins = getObjectiveScore(player, winsObjectiveId);
		if (currentWins < requiredWins) {
			const isNetheriteItem =
				typeof itemConfig.key === "string" && itemConfig.key.toLowerCase().includes("netherite");

			if (isNetheriteItem) {
				player.sendMessage("§4Not enough wins.. You wouldn't even make it this far, lol");
			} else {
				player.sendMessage("§4Not enough Wins");
			}

			player.runCommand("playsound note.bass @s");
			return;
		}
	}

	if (itemConfig.requiresCoins) {
		const currencyObjectiveId = resolveObjectiveId(CURRENCY_OBJECTIVE_IDS);
		if (!currencyObjectiveId) {
			player.sendMessage("§cShop error: coins objective not found.");
			return;
		}

		const currentCoins = getObjectiveScore(player, currencyObjectiveId);

		if (currentCoins < requiredCoins) {
			player.sendMessage("§4Not enough Coins");
			player.runCommand("playsound note.bass @s");
			return;
		}

		const shouldSpendCoins = !player.hasTag(FREE_COINS_TAG);
		if (shouldSpendCoins) {
			const updatedCoins = currentCoins - requiredCoins;
			const scoreUpdated = setObjectiveScore(player, currencyObjectiveId, updatedCoins);
			if (!scoreUpdated) {
				player.sendMessage("§cShop error: coins objective not found.");
				return;
			}
		}
	}

	player.addTag(itemConfig.ownershipTag);
	equipOwnedItem(player, itemConfig);
	player.sendMessage(`§aPurchased §f${itemConfig.displayName}`);
	sendPurchaseAnnouncement(player, itemConfig.announcementMessage);
	player.runCommand("playsound random.orb @s");
}

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
	const player = event.player;
	const block = event.block;
	system.run(() => {
		handleShopSignInteraction(player, block);
	});
});

world.afterEvents.playerInteractWithBlock.subscribe((event) => {
	handleShopSignInteraction(event.player, event.block);
});