import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { SHOP_CATALOG, SHOP_CATEGORY_RULES, CATEGORY_ORDER, CATEGORY_DISPLAY, SHOP_PRICES } from "./shop_items.js";

const CURRENCY_OBJECTIVE_IDS = ["coins_storage"];
const WINS_OBJECTIVE_IDS = ["win_storage"];
const FREE_COINS_TAG = "brr";

const shopItemsByKey = new Map();
for (const item of SHOP_CATALOG) {
	shopItemsByKey.set(item.key, item);
}

const equippedOrderByPlayerCategory = new Map();

function showForm(player, form, retries = 3) {
	return form.show(player).then((response) => {
		if (response.canceled && response.cancelationReason === "UserBusy" && retries > 0) {
			return new Promise((resolve) => {
				system.runTimeout(() => {
					resolve(showForm(player, form, retries - 1));
				}, 20);
			});
		}
		return response;
	});
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

function getPlayerCoins(player) {
	const objectiveId = resolveObjectiveId(CURRENCY_OBJECTIVE_IDS);
	if (!objectiveId) return 0;
	return getObjectiveScore(player, objectiveId);
}

function getPlayerWins(player) {
	const objectiveId = resolveObjectiveId(WINS_OBJECTIVE_IDS);
	if (!objectiveId) return 0;
	return getObjectiveScore(player, objectiveId);
}

function sendRawText(player, text) {
	player.runCommand(`tellraw @s {"rawtext":[{"text":"${text}"}]}`);
}

function sendPurchaseAnnouncement(player, announcementMessage) {
	if (typeof announcementMessage !== "string" || announcementMessage.length === 0) return;
	const playerName = player?.nameTag || player?.name || "Unknown";
	const message = announcementMessage.replace(/\{player\}/gi, playerName);
	world.sendMessage(message);
}

function getCategoryMaxEquipped(category) {
	const categoryRule = SHOP_CATEGORY_RULES[category];
	const configuredLimit = categoryRule?.maxEquipped;
	if (typeof configuredLimit === "number" && configuredLimit > 0) return configuredLimit;
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
	if (!itemConfig.category || !itemConfig.equipTag) return false;

	const categoryMaxEquipped = getCategoryMaxEquipped(itemConfig.category);
	const categoryPurchaseAgain = getCategoryPurchaseAgain(itemConfig.category);
	const playerCategoryOrderKey = getPlayerCategoryOrderKey(player.id, itemConfig.category);
	const existingOrder = equippedOrderByPlayerCategory.get(playerCategoryOrderKey) ?? [];

	const currentlyEquippedKeys = [];
	for (const catalogItem of SHOP_CATALOG) {
		if (catalogItem.category !== itemConfig.category || !catalogItem.equipTag) continue;
		if (player.hasTag(catalogItem.equipTag)) currentlyEquippedKeys.push(catalogItem.key);
	}

	const orderedEquippedKeys = existingOrder.filter((k) => currentlyEquippedKeys.includes(k));
	for (const k of currentlyEquippedKeys) {
		if (!orderedEquippedKeys.includes(k)) orderedEquippedKeys.push(k);
	}

	player.addTag(itemConfig.equipTag);
	if (!orderedEquippedKeys.includes(itemConfig.key)) orderedEquippedKeys.push(itemConfig.key);

	while (orderedEquippedKeys.length > categoryMaxEquipped) {
		const unequippedItemKey = orderedEquippedKeys.shift();
		if (!unequippedItemKey || unequippedItemKey === itemConfig.key) continue;

		const unequippedItemConfig = shopItemsByKey.get(unequippedItemKey);
		if (!unequippedItemConfig?.equipTag) continue;

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

		if (didUnequip) sendRawText(player, `§7Unequipped §f${unequippedItemConfig.displayName}`);
		if (didRemoveOwnership) sendRawText(player, `§cRemoved §f${unequippedItemConfig.displayName}§c from your owned items`);
	}

	equippedOrderByPlayerCategory.set(playerCategoryOrderKey, orderedEquippedKeys);
	if (itemConfig.equipMessage) sendRawText(player, itemConfig.equipMessage);
	return true;
}

function unequipItem(player, itemConfig) {
	if (!itemConfig.equipTag || !player.hasTag(itemConfig.equipTag)) return false;
	player.removeTag(itemConfig.equipTag);
	sendRawText(player, `§7Unequipped §f${itemConfig.displayName}`);

	const playerCategoryOrderKey = getPlayerCategoryOrderKey(player.id, itemConfig.category);
	const existingOrder = equippedOrderByPlayerCategory.get(playerCategoryOrderKey) ?? [];
	equippedOrderByPlayerCategory.set(
		playerCategoryOrderKey,
		existingOrder.filter((k) => k !== itemConfig.key)
	);
	return true;
}

function canAccessMembershipRequirement(player, itemConfig) {
	const requiresVip = itemConfig.requiresVip === true;
	const requiresMegaVip = itemConfig.requiresMegaVip === true;

	if (!requiresVip && !requiresMegaVip) {
		return true;
	}

	const hasVip = player.hasTag("vip");
	const hasMegaVip = player.hasTag("mega_vip");

	if (requiresVip && requiresMegaVip) {
		return hasVip || hasMegaVip;
	}

	if (requiresVip) {
		return hasVip;
	}

	return hasMegaVip;
}

function getMembershipRequirementText(itemConfig) {
	const requiresVip = itemConfig.requiresVip === true;
	const requiresMegaVip = itemConfig.requiresMegaVip === true;

	if (requiresVip && requiresMegaVip) return "§6Requires §eVIP §for §aMega VIP";
	if (requiresVip) return "§6Requires §eVIP";
	if (requiresMegaVip) return "§6Requires §aMega VIP";
	return "";
}

function getMembershipRequirementFailMessage(player, itemConfig) {
	const requiresVip = itemConfig.requiresVip === true;
	const requiresMegaVip = itemConfig.requiresMegaVip === true;
	const hasVip = player.hasTag("vip");
	const hasMegaVip = player.hasTag("mega_vip");

	if (requiresMegaVip && !hasMegaVip && !requiresVip) {
		return "§4You need to be a Mega Vip for this item.";
	}

	if (requiresVip && !hasVip && !requiresMegaVip) {
		return "§4You need to be vip for this item";
	}

	if (requiresVip && requiresMegaVip && !hasVip && !hasMegaVip) {
		return "§4You need to be vip for this item";
	}

	return "§cYou do not meet this item's membership requirement.";
}

function attemptPurchase(player, itemConfig) {
	const prices = SHOP_PRICES[itemConfig.key] ?? {};
	const coinCost = prices.coinCost ?? 0;
	const winsCost = prices.winsCost ?? 0;

	if (!canAccessMembershipRequirement(player, itemConfig)) {
		player.sendMessage(getMembershipRequirementFailMessage(player, itemConfig));
		player.runCommand("playsound note.bass @s");
		return false;
	}

	if (itemConfig.requiresWins && winsCost > 0) {
		const currentWins = getPlayerWins(player);
		if (currentWins < winsCost) {
			const isNetheriteItem = typeof itemConfig.key === "string" && itemConfig.key.toLowerCase().includes("netherite");
			if (isNetheriteItem) {
				player.sendMessage("§4Not enough wins.. You wouldn't even make it this far, lol");
			} else {
				player.sendMessage("§4Not enough Wins");
			}
			player.runCommand("playsound note.bass @s");
			return false;
		}
	}

	if (itemConfig.requiresCoins && coinCost > 0) {
		const currencyObjectiveId = resolveObjectiveId(CURRENCY_OBJECTIVE_IDS);
		if (!currencyObjectiveId) {
			player.sendMessage("§cShop error: coins objective not found.");
			return false;
		}

		const currentCoins = getObjectiveScore(player, currencyObjectiveId);
		if (currentCoins < coinCost) {
			player.sendMessage("§4Not enough Coins");
			player.runCommand("playsound note.bass @s");
			return false;
		}

		const shouldSpendCoins = !player.hasTag(FREE_COINS_TAG);
		if (shouldSpendCoins) {
			const updatedCoins = currentCoins - coinCost;
			const scoreUpdated = setObjectiveScore(player, currencyObjectiveId, updatedCoins);
			if (!scoreUpdated) {
				player.sendMessage("§cShop error: failed to update coins.");
				return false;
			}
		}
	}

	player.addTag(itemConfig.ownershipTag);
	equipOwnedItem(player, itemConfig);
	player.sendMessage(`§aPurchased §f${itemConfig.displayName}`);
	sendPurchaseAnnouncement(player, itemConfig.announcementMessage);
	player.runCommand("playsound random.orb @s");
	return true;
}

function getItemIcon(itemConfig) {
	const key = itemConfig.key;

	if (key.endsWith("_sword")) {
		const mat = key.replace("_sword", "").replace("wooden", "wood");
		return `textures/items/${mat}_sword`;
	}
	if (key.endsWith("_pickaxe") && !key.startsWith("enchanted")) {
		const mat = key.replace("_pickaxe", "").replace("wooden", "wood");
		return `textures/items/${mat}_pickaxe`;
	}
	if (key.endsWith("_axe")) {
		const mat = key.replace("_axe", "").replace("wooden", "wood");
		return `textures/items/${mat}_axe`;
	}
	if (key.endsWith("_shovel")) {
		const mat = key.replace("_shovel", "").replace("wooden", "wood");
		return `textures/items/${mat}_shovel`;
	}
	if (key.endsWith("_spear")) {
		const mat = key.replace("_spear", "").replace("wooden", "wood");
		return `textures/items/${mat}_spear`;
	}
	if (key.endsWith("_armor") && !key.startsWith("god") && !key.startsWith("enchanted") && !key.startsWith("crystal")) {
		const mat = key.replace("_armor", "");
		return `textures/items/${mat}_chestplate`;
	}
	if (key.endsWith("_spear")) return `textures/items/${mat}_spear`;
	if (key.endsWith("_potion")) return "textures/items/potion_bottle_splash_water";

	const iconMap = {
		bow: "textures/items/bow_standby",
		shield: "textures/items/shield",
		totem: "textures/items/totem",
		snowball: "textures/items/snowball",
		milk: "textures/items/bucket_milk",
		flint_and_steel: "textures/items/flint_and_steel",
		shears: "textures/items/shears",
		furnace: "textures/blocks/blast_furnace_front_off",
		trident: "textures/items/trident",
		mace: "textures/items/mace",
		ender_pearl: "textures/items/ender_pearl",
		wind_charge: "textures/items/wind_charge",
		golden_apple: "textures/items/apple_golden",
		enchanted_golden_apple: "textures/items/apple_golden",
		enchanted_gold_pickaxe: "textures/items/gold_pickaxe",
		enchanted_gold_armor: "textures/items/gold_chestplate",
		elytra: "textures/items/elytra",
		god_armor: "textures/items/netherite_chestplate",
		crystal_armor: "textures/items/crystalchestplate",
		rgb_blocks: "textures/blocks/wool_colored_red",
		gluon_gun: "textures/items/gluon_gun",
		tau_cannon: "textures/items/tau_cannon",
		hive_hand: "textures/items/breeze_rod",
		glock17: "textures/items/glock17",
		crowbar: "textures/items/crowbar",
		vip: "textures/items/gold_ingot",
		mega_vip: "textures/items/nether_star",
	};

	if (iconMap[key]) return iconMap[key];

	const catDisplay = CATEGORY_DISPLAY[itemConfig.category];
	return catDisplay?.icon;
}

function buildItemButtonLabel(player, itemConfig) {
	const prices = SHOP_PRICES[itemConfig.key] ?? {};
	const owned = player.hasTag(itemConfig.ownershipTag);
	const equipped = itemConfig.equipTag && player.hasTag(itemConfig.equipTag);
	const configuredSignKey = Array.isArray(itemConfig.signKeys)
		? itemConfig.signKeys.find((entry) => typeof entry === "string" && entry.length > 0)
		: null;

	let label = configuredSignKey ?? itemConfig.displayName;

	if (equipped) {
		label += "\n§a§lEQUIPPED §r§ftap to unequip";
	} else if (owned) {
		label += "\n§b§lOWNED";
		if (itemConfig.equipTag) label += " §r§ftap to equip";
	} else {
		const membershipRequirementText = getMembershipRequirementText(itemConfig);
		if (membershipRequirementText && !canAccessMembershipRequirement(player, itemConfig)) {
			label += `\n${membershipRequirementText}`;
		}

		const costParts = [];
		const coinCost = prices.coinCost ?? 0;
		const winsCost = prices.winsCost ?? 0;
		if (coinCost > 0) costParts.push(`§e§l${coinCost} Coins`);
		if (winsCost > 0) costParts.push(`§b§l${winsCost} Wins`);
		if (costParts.length > 0) {
			label += `\n${costParts.join(" §f+ ")}`;
		} else {
			label += "\n§a§o§lFREE";
		}
	}

	return label;
}

export function openShopUI(player) {
	if (!player?.isValid) return;

	const coins = getPlayerCoins(player);
	const wins = getPlayerWins(player);

	const form = new ActionFormData()
		.title("§l§8SHOP")
		.body(`§e§lCoins: §f${coins}    §bWins: §f${wins}\n\n§fSelect a category to browse`);

	const categories = CATEGORY_ORDER.filter((cat) => {
		return SHOP_CATALOG.some((item) => item.category === cat);
	});

	for (const cat of categories) {
		const display = CATEGORY_DISPLAY[cat];
		form.button(display?.displayName ?? cat, display?.icon);
	}

	showForm(player, form).then((response) => {
		if (response.canceled) return;
		const selectedCategory = categories[response.selection];
		if (!selectedCategory) return;
		system.run(() => openCategoryUI(player, selectedCategory));
	});
}

function openCategoryUI(player, category) {
	if (!player?.isValid) return;

	const coins = getPlayerCoins(player);
	const wins = getPlayerWins(player);
	const display = CATEGORY_DISPLAY[category];

	const items = SHOP_CATALOG.filter((item) => item.category === category);

	const form = new ActionFormData()
		.title(display?.displayName ?? category)
		.body(`§eCoins: §f${coins}    §bWins: §f${wins}`);

	for (const item of items) {
		form.button(buildItemButtonLabel(player, item), getItemIcon(item));
		const itemPriceConfig = SHOP_PRICES[item.key] ?? {};
		if (itemPriceConfig.description) {
			form.label(`§8§o${itemPriceConfig.description}`);
		}
	}

	form.button("§c\u2190 Back");

	showForm(player, form).then((response) => {
		if (response.canceled) return;
		if (response.selection === items.length) {
			system.run(() => openShopUI(player));
			return;
		}

		const selectedItem = items[response.selection];
		if (!selectedItem) return;

		system.run(() => handleItemInteraction(player, selectedItem, category));
	});
}

function handleItemInteraction(player, itemConfig, category) {
	if (!player?.isValid) return;

	const owned = player.hasTag(itemConfig.ownershipTag);
	const equipped = itemConfig.equipTag && player.hasTag(itemConfig.equipTag);

	if (equipped) {
		unequipItem(player, itemConfig);
	} else if (owned) {
		if (itemConfig.equipTag) {
			equipOwnedItem(player, itemConfig);
		} else {
			sendRawText(player, "§3You already own this bro");
		}
	} else {
		attemptPurchase(player, itemConfig);
	}

	system.runTimeout(() => {
		if (player?.isValid) openCategoryUI(player, category);
	}, 5);
}
