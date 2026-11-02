import { BlockVolume, system, world } from "@minecraft/server";
import { applyEntityFilters, parseSelectorFilters } from "./selector_filters.js";

// SECTION: Block and Entity Helpers
function parseBlockPos(rawValue) {
	const coords = (rawValue || "").trim().split(/\s+/);
	if (coords.length !== 3) return null;

	const x = Number.parseInt(coords[0], 10);
	const y = Number.parseInt(coords[1], 10);
	const z = Number.parseInt(coords[2], 10);
	if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;

	return { x, y, z };
}

function getBlockAtPlayerDimension(player, pos) {
	try {
		return player.dimension.getBlock(pos);
	} catch {
		return undefined;
	}
}

// Whether a location is inside the blocks between two corners, both corners included, the way
// /fill reads an area: standing anywhere in the block at x=10 counts as x 10.
function isInBlockArea(location, corner1, corner2) {
	return ["x", "y", "z"].every(axis => {
		const block = Math.floor(location[axis]);
		return block >= Math.min(corner1[axis], corner2[axis]) && block <= Math.max(corner1[axis], corner2[axis]);
	});
}

const lastKnownHealthByEntity = new Map();
const lastDamageTickByEntity = new Map();
const lastDamageCauseByEntity = new Map();

// SECTION: Damage Tracking
function getEntityIdentity(entity) {
	if (!entity) return "";
	return `${entity.id ?? entity.nameTag ?? entity.name ?? ""}`;
}

try {
	world.afterEvents.entityHurt.subscribe((event) => {
		const hurtEntity = event?.hurtEntity;
		const id = getEntityIdentity(hurtEntity);
		if (!id) return;

		const tick = getCurrentTick();
		const cause = `${event?.damageSource?.cause ?? ""}`.trim().toLowerCase();
		lastDamageTickByEntity.set(id, tick);
		if (cause) lastDamageCauseByEntity.set(id, cause);
	});
} catch { }

try {
	world.afterEvents.entityRemove.subscribe((event) => {
		const id = `${event?.removedEntityId ?? ""}`;
		lastKnownHealthByEntity.delete(id);
		lastDamageTickByEntity.delete(id);
		lastDamageCauseByEntity.delete(id);
	});
} catch { }

// SECTION: Scoreboard and Tick Helpers
function getObjective(worldObj, objectiveName) {
	try {
		return worldObj.scoreboard.getObjective(objectiveName);
	} catch {
		return undefined;
	}
}

function getScoreByName(objective, participantName) {
	if (!objective || !participantName) return undefined;
	const needle = `${participantName}`.trim().toLowerCase();
	if (!needle) return undefined;

	try {
		for (const participant of objective.getParticipants()) {
			const display = `${participant.displayName ?? ""}`.trim().toLowerCase();
			const id = `${participant.id ?? ""}`.trim().toLowerCase();
			if (display === needle || id === needle) return objective.getScore(participant);
		}
	} catch { }

	return undefined;
}

function parseOptionalInt(value, fallback = undefined) {
	const parsed = Number.parseInt(`${value ?? ""}`.trim(), 10);
	return Number.isFinite(parsed) ? parsed : fallback;
}

// Script ticks rather than world time, which /time set moves and a frozen daylight cycle stops.
function getCurrentTick() {
	return system.currentTick;
}

function wasEntityRecentlyDamaged(entity, worldObj, windowTicks = 2) {
	// SECTION: Inventory and Selector Helpers
	const id = getEntityIdentity(entity);
	if (!id) return false;

	let healthValue = undefined;
	try {
		healthValue = entity.getComponent("health")?.currentValue;
	} catch { }
	if (!Number.isFinite(healthValue)) return false;

	const previous = lastKnownHealthByEntity.get(id);
	const now = getCurrentTick();
	if (Number.isFinite(previous) && healthValue < previous) {
		lastDamageTickByEntity.set(id, now);
	}
	lastKnownHealthByEntity.set(id, healthValue);

	const lastHitTick = lastDamageTickByEntity.get(id);
	if (!Number.isFinite(lastHitTick)) return false;

	return now - lastHitTick <= Math.max(1, windowTicks);
}

function wasEntityRecentlyDamagedFromSource(entity, worldObj, expectedSource, windowTicks = 2) {
	if (!wasEntityRecentlyDamaged(entity, worldObj, windowTicks)) return false;

	const id = getEntityIdentity(entity);
	if (!id) return false;

	const expected = `${expectedSource ?? ""}`.trim().toLowerCase();
	if (!expected) return false;

	const knownCause = `${lastDamageCauseByEntity.get(id) ?? ""}`.trim().toLowerCase();
	if (!knownCause) return false;

	return knownCause === expected || knownCause.includes(expected);
}

function normalizeItemTypeId(itemTypeId) {
	return (itemTypeId || "").trim().toLowerCase();
}

function countInventoryItems(entity, normalizedTypeId) {
	if (!entity || !normalizedTypeId) return 0;

	let total = 0;
	try {
		const inventory = entity.getComponent("inventory")?.container;
		if (inventory) {
			for (let i = 0; i < inventory.size; i++) {
				const item = inventory.getItem(i);
				if (item?.typeId?.toLowerCase() === normalizedTypeId) total += item.amount ?? 1;
			}
		}
	} catch { }

	return total;
}

function getPlayerItemCountLike(entity, itemTypeId) {
	const normalizedTypeId = normalizeItemTypeId(itemTypeId);
	if (!normalizedTypeId) return 0;

	return countInventoryItems(entity, normalizedTypeId);
}

function normalizeLiteralSelector(rawSelector) {
	const raw = `${rawSelector ?? ""}`.trim();
	const quoted = raw.match(/^(["'])(.*)\1$/);
	return `${quoted ? quoted[2] : raw}`.trim();
}

function getGameModeName(player) {
	try {
		return `${player.getGameMode()}`.toLowerCase();
	} catch {
		return "";
	}
}

function resolveEntitiesBySelector(player, selectorRaw, radiusRaw = "") {
	const selector = `${selectorRaw ?? ""}`.trim();
	const literalSelector = normalizeLiteralSelector(selector);
	if (!selector) return [];

	const optionalRadius = parseOptionalInt(radiusRaw);
	const location = player.location;
	const maxDistanceSq = Number.isFinite(optionalRadius) ? optionalRadius * optionalRadius : undefined;

	const withinRadius = (entity) => {
		if (!Number.isFinite(maxDistanceSq)) return true;
		const dx = entity.location.x - location.x;
		const dy = entity.location.y - location.y;
		const dz = entity.location.z - location.z;
		return (dx * dx + dy * dy + dz * dz) <= maxDistanceSq;
	};

	// @s/@a/@p/@r/@e, with or without [filters] (the same ones the engine's selector fields take).
	const filters = selector.startsWith("@") ? parseSelectorFilters(selector) : null;
	if (filters) {
		try {
			const base = selector.slice(0, 2).toLowerCase();
			let found;
			if (base === "@s") found = [player];
			else if (base === "@e") {
				found = Number.isFinite(maxDistanceSq)
					? player.dimension.getEntities({ location, maxDistance: optionalRadius })
					: player.dimension.getEntities();
			} else found = player.dimension.getPlayers().filter(withinRadius);
			found = applyEntityFilters(found, filters, getGameModeName);

			if (base === "@r") return found.length ? [found[Math.floor(Math.random() * found.length)]] : [];
			if (base !== "@p" || found.length <= 1) return found;
			const distanceSq = entity => {
				const dx = entity.location.x - location.x, dy = entity.location.y - location.y, dz = entity.location.z - location.z;
				return dx * dx + dy * dy + dz * dz;
			};
			return [found.reduce((nearest, entity) => distanceSq(entity) < distanceSq(nearest) ? entity : nearest)];
		} catch {
			return [];
		}
	}

	if (literalSelector.toLowerCase().startsWith("minecraft:")) {
		try {
			return player.dimension.getEntities({ type: literalSelector }).filter(withinRadius);
		} catch { }
	}

	try {
		const playersByName = player.dimension.getPlayers({ name: literalSelector }).filter(withinRadius);
		if (playersByName.length) return playersByName;
	} catch { }

	try {
		const expected = literalSelector.toLowerCase();
		return player.dimension.getEntities().filter(entity => {
			const nameTag = `${entity.nameTag ?? ""}`.trim().toLowerCase();
			const typeId = `${entity.typeId ?? ""}`.trim().toLowerCase();
			return (nameTag === expected || typeId === expected) && withinRadius(entity);
		});
	} catch {
		return [];
	}
}

// SECTION: Platform and Equipment Helpers
function isPlatformGroup(player, group) {
	const platform = `${player?.clientSystemInfo?.platformType ?? player?.clientSystemInfo?.platform ?? ""}`.toLowerCase();
	if (!platform) return false;

	const groups = {
		// The game reports "Console", "Mobile" or "Desktop"; the other names cover older versions.
		console: ["console", "xbox", "playstation", "ps", "switch", "nintendo"],
		mobile: ["android", "ios", "mobile", "iphone", "ipad"],
		desktop: ["windows", "win", "linux", "mac", "desktop", "osx"]
	};

	return (groups[group] ?? []).some(key => platform.includes(key));
}

function normalizeEquipmentSlot(rawSlot) {
	const key = (rawSlot || "").trim().toLowerCase();
	if (!key) return null;

	const aliases = {
		head: "Head",
		helmet: "Head",
		"slot.armor.head": "Head",
		"armor.head": "Head",
		chest: "Chest",
		chestplate: "Chest",
		elytra: "Chest",
		"slot.armor.chest": "Chest",
		"armor.chest": "Chest",
		legs: "Legs",
		leggings: "Legs",
		"slot.armor.legs": "Legs",
		"armor.legs": "Legs",
		feet: "Feet",
		boots: "Feet",
		"slot.armor.feet": "Feet",
		"armor.feet": "Feet",
		offhand: "Offhand",
		"off-hand": "Offhand",
		"off_hand": "Offhand",
		"slot.weapon.offhand": "Offhand",
		"slot.offhand": "Offhand",
		mainhand: "Mainhand",
		"main-hand": "Mainhand",
		"main_hand": "Mainhand",
		hand: "Mainhand",
		"slot.weapon.mainhand": "Mainhand",
		"slot.mainhand": "Mainhand"
	};

	return aliases[key] ?? null;
}

function getPlayerItemCount(player, itemTypeId) {
	const normalizedTypeId = normalizeItemTypeId(itemTypeId);
	if (!normalizedTypeId) return 0;

	let total = countInventoryItems(player, normalizedTypeId);

	try {
		const equip = player.getComponent("minecraft:equippable");
		const extraSlots = ["Head", "Chest", "Legs", "Feet", "Offhand"];
		for (const slot of extraSlots) {
			const equipped = equip?.getEquipment(slot);
			if (equipped?.typeId?.toLowerCase() === normalizedTypeId) total += equipped.amount ?? 1;
		}
	} catch { }

	return total;
}

// SECTION: Weather and Time Helpers
// Fallback for when Dimension.getWeather (beta) is unavailable; only updates once the weather changes.
let lastKnownWeather = "clear";
try {
	world.afterEvents.weatherChange.subscribe((event) => {
		lastKnownWeather = `${event.newWeather ?? ""}`.toLowerCase() || "clear";
	});
} catch { }

function readWeatherName(worldObj) {
	try {
		const overworld = worldObj.getDimension("overworld");
		if (typeof overworld.getWeather === "function") {
			const weatherValue = `${overworld.getWeather() ?? ""}`.toLowerCase();
			if (weatherValue.includes("thunder")) return "thunder";
			if (weatherValue.includes("rain")) return "rain";
			if (weatherValue.includes("clear")) return "clear";
		}
	} catch { }

	return lastKnownWeather;
}

export function evaluateCondition(blockData, player, worldObj) {
	if (!blockData || !blockData.executeCondition) return false;

	const condition = blockData.executeCondition;
	const v1 = blockData.conditionValue1 || "";
	const v2 = blockData.conditionValue2 || "";
	const v3 = blockData.conditionValue3 || "";

	try {
		switch (condition) {
			case "noCondition": return true;
			case "ifPlayerHasTag": return !v1 ? false : player.hasTag(v1);
			case "ifPlayerDoesNotHaveTag": return !v1 ? false : !player.hasTag(v1);
			case "ifPlayerNameIs": return !v1 ? false : player.name === v1;
			case "ifPlayerNameIsNot": return !v1 ? false : player.name !== v1;
			case "ifPlayerHealthIsHigher": return !v1 ? false : player.getComponent("health").currentValue > parseInt(v1);
			case "ifPlayerHealthIsLower": return !v1 ? false : player.getComponent("health").currentValue < parseInt(v1);
			case "ifPlayerHealthIsFull": return player.getComponent("health").currentValue === player.getComponent("health").maxValue;
			case "ifPlayerIsDead": return player.getComponent("health").currentValue <= 0;
			case "ifPlayerIsAlive": return player.getComponent("health").currentValue > 0;
			case "ifPlayerIsSneaking": return player.isSneaking;
			case "ifPlayerIsSwimming": return player.isSwimming;
			case "ifPlayerScoreIsHigher": {
				if (!v1 || !v2) return false;
				try { const score = worldObj.scoreboard.getObjective(v1)?.getScore(player); return score > parseInt(v2); } catch { return false; }
			}
			case "ifPlayerScoreIsLower": {
				if (!v1 || !v2) return false;
				try { const score = worldObj.scoreboard.getObjective(v1)?.getScore(player); return score < parseInt(v2); } catch { return false; }
			}
			case "ifPlayerScoreIs": {
				if (!v1 || !v2) return false;
				try { const score = worldObj.scoreboard.getObjective(v1)?.getScore(player); return score === parseInt(v2); } catch { return false; }
			}
			case "ifPlayerHasScore": {
				if (!v1) return false;
				try { const score = worldObj.scoreboard.getObjective(v1)?.getScore(player); return score !== undefined && score !== null; } catch { return false; }
			}
			case "ifPlayerHasNoScore": {
				if (!v1) return false;
				try { const score = worldObj.scoreboard.getObjective(v1)?.getScore(player); return score === undefined || score === null; } catch { return true; }
			}
			case "ifPlayerIsAt":
			case "ifPlayerIsNotAt": {
				const pos1 = parseBlockPos(v1); const pos2 = parseBlockPos(v2);
				if (!pos1 || !pos2) return false;
				return isInBlockArea(player.location, pos1, pos2) === (condition === "ifPlayerIsAt");
			}
			case "ifPlayerHasInInventory": {
				if (!v1) return false;
				const itemCount = parseInt(v2) || 1;
				return getPlayerItemCount(player, v1) >= itemCount;
			}
			case "ifPlayerDoesNotHaveInInventory": {
				if (!v1) return false;
				const itemCount = parseInt(v2) || 1;
				return getPlayerItemCount(player, v1) < itemCount;
			}
			case "ifPlayerIsWearing": {
				if (!v1) return false;
				try {
					const equip = player.getComponent("minecraft:equippable");
					const normalizedType = v1.trim().toLowerCase();
					const normalizedSlot = normalizeEquipmentSlot(v2);
					if (normalizedSlot) return equip?.getEquipment(normalizedSlot)?.typeId?.toLowerCase() === normalizedType;
					return ["Head", "Chest", "Legs", "Feet", "Offhand", "Mainhand"].some(slot => equip?.getEquipment(slot)?.typeId?.toLowerCase() === normalizedType);
				} catch { return false; }
			}
			case "ifPlayerIsRiding": {
				// "minecraft:riding" is on the rider; "minecraft:rideable" (which players always have,
				// for shoulder riding) is on the thing being ridden.
				let mount;
				try { mount = player.getComponent("minecraft:riding")?.entityRidingOn; } catch { }
				if (!mount) return false;
				if (!v1) return true;
				return resolveEntitiesBySelector(player, v1).some(entity => entity.id === mount.id);
			}
			case "ifPlayerIsOnConsole":
				return isPlatformGroup(player, "console");
			case "ifPlayerIsOnMobile":
				return isPlatformGroup(player, "mobile");
			case "ifPlayerisOnDesktop":
				return isPlatformGroup(player, "desktop");
			case "ifPlayerDamaged":
				return wasEntityRecentlyDamaged(player, worldObj);
			case "ifPlayerDamagedFromSource":
				if (!v1) return false;
				return wasEntityRecentlyDamagedFromSource(player, worldObj, v1);
			case "ifScoreIsHigher": {
				if (!v1 || !v2 || !v3) return false;
				const objective = getObjective(worldObj, v1);
				const score = getScoreByName(objective, v2);
				return Number.isFinite(score) && score > parseInt(v3, 10);
			}
			case "ifScoreIsLower": {
				if (!v1 || !v2 || !v3) return false;
				const objective = getObjective(worldObj, v1);
				const score = getScoreByName(objective, v2);
				return Number.isFinite(score) && score < parseInt(v3, 10);
			}
			case "ifScoreIs": {
				if (!v1 || !v2 || !v3) return false;
				const objective = getObjective(worldObj, v1);
				const score = getScoreByName(objective, v2);
				return Number.isFinite(score) && score === parseInt(v3, 10);
			}
			case "ifScoreIsNot": {
				if (!v1 || !v2 || !v3) return false;
				const objective = getObjective(worldObj, v1);
				const score = getScoreByName(objective, v2);
				return !Number.isFinite(score) || score !== parseInt(v3, 10);
			}
			case "ifEntityIs": {
				if (!v1) return false;
				return resolveEntitiesBySelector(player, v1).length > 0;
			}
			case "ifEntityIsNot": {
				if (!v1) return false;
				return resolveEntitiesBySelector(player, v1).length === 0;
			}
			case "ifEntityHasTag": {
				if (!v1 || !v2) return false;
				const entities = resolveEntitiesBySelector(player, v1);
				return entities.some(entity => {
					try { return entity.hasTag(v2); } catch { return false; }
				});
			}
			case "ifEntityDoesNotHaveTag": {
				if (!v1 || !v2) return false;
				const entities = resolveEntitiesBySelector(player, v1);
				return entities.length > 0 && entities.every(entity => {
					try { return !entity.hasTag(v2); } catch { return true; }
				});
			}
			case "ifEntityHasName": {
				if (!v1 || !v2) return false;
				const compareName = v2.trim().toLowerCase();
				return resolveEntitiesBySelector(player, v1).some(entity => `${entity.nameTag ?? ""}`.trim().toLowerCase() === compareName);
			}
			case "ifEntityDoesNotHaveName":
			case "ifEntityNameIsNot": {
				if (!v1 || !v2) return false;
				const compareName = v2.trim().toLowerCase();
				const entities = resolveEntitiesBySelector(player, v1);
				return entities.length > 0 && entities.every(entity => `${entity.nameTag ?? ""}`.trim().toLowerCase() !== compareName);
			}
			case "ifEntityScoreIsHigher": {
				if (!v1 || !v2 || !v3) return false;
				const objective = getObjective(worldObj, v2);
				const threshold = parseInt(v3, 10);
				const entities = resolveEntitiesBySelector(player, v1);
				return entities.some(entity => {
					try {
						const score = objective?.getScore(entity);
						return Number.isFinite(score) && score > threshold;
					} catch { return false; }
				});
			}
			case "ifEntityScoreIsLower": {
				if (!v1 || !v2 || !v3) return false;
				const objective = getObjective(worldObj, v2);
				const threshold = parseInt(v3, 10);
				const entities = resolveEntitiesBySelector(player, v1);
				return entities.some(entity => {
					try {
						const score = objective?.getScore(entity);
						return Number.isFinite(score) && score < threshold;
					} catch { return false; }
				});
			}
			case "ifEntityScoreIs": {
				if (!v1 || !v2 || !v3) return false;
				const objective = getObjective(worldObj, v2);
				const threshold = parseInt(v3, 10);
				const entities = resolveEntitiesBySelector(player, v1);
				return entities.some(entity => {
					try {
						const score = objective?.getScore(entity);
						return Number.isFinite(score) && score === threshold;
					} catch { return false; }
				});
			}
			case "ifEntityHasNoScore": {
				if (!v1 || !v2) return false;
				const objective = getObjective(worldObj, v2);
				const entities = resolveEntitiesBySelector(player, v1);
				return entities.length > 0 && entities.every(entity => {
					try {
						const score = objective?.getScore(entity);
						return score === undefined || score === null;
					} catch { return true; }
				});
			}
			case "ifEntityHasScore": {
				if (!v1 || !v2) return false;
				const objective = getObjective(worldObj, v2);
				const entities = resolveEntitiesBySelector(player, v1);
				return entities.some(entity => {
					try {
						const score = objective?.getScore(entity);
						return score !== undefined && score !== null;
					} catch { return false; }
				});
			}
			case "ifEntityHealthIsHigher": {
				if (!v1 || !v2) return false;
				const threshold = parseInt(v2, 10);
				return resolveEntitiesBySelector(player, v1).some(entity => {
					try { return entity.getComponent("health")?.currentValue > threshold; } catch { return false; }
				});
			}
			case "ifEntityHealthIsLower": {
				if (!v1 || !v2) return false;
				const threshold = parseInt(v2, 10);
				return resolveEntitiesBySelector(player, v1).some(entity => {
					try { return entity.getComponent("health")?.currentValue < threshold; } catch { return false; }
				});
			}
			case "ifEntityHealthIsFull": {
				if (!v1) return false;
				return resolveEntitiesBySelector(player, v1).some(entity => {
					try {
						const health = entity.getComponent("health");
						return health?.currentValue === health?.maxValue;
					} catch { return false; }
				});
			}
			case "ifEntityIsDead": {
				if (!v1) return false;
				const entities = resolveEntitiesBySelector(player, v1);
				if (!entities.length) return true;
				return entities.every(entity => {
					try { return (entity.getComponent("health")?.currentValue ?? 1) <= 0; } catch { return true; }
				});
			}
			case "ifEntityIsAlive": {
				if (!v1) return false;
				return resolveEntitiesBySelector(player, v1).some(entity => {
					try { return (entity.getComponent("health")?.currentValue ?? 0) > 0; } catch { return false; }
				});
			}
			case "ifEntityHasInInventory": {
				if (!v1 || !v2) return false;
				const needed = parseOptionalInt(v3, 1);
				return resolveEntitiesBySelector(player, v1).some(entity => getPlayerItemCountLike(entity, v2) >= needed);
			}
			case "ifEntityDoesNotHaveInInventory": {
				if (!v1 || !v2) return false;
				const entities = resolveEntitiesBySelector(player, v1);
				if (!entities.length) return true;
				return entities.every(entity => getPlayerItemCountLike(entity, v2) <= 0);
			}
			case "ifEntityExists": {
				if (!v1) return false;
				return resolveEntitiesBySelector(player, v1, v2).length > 0;
			}
			case "ifEntityDoesNotExist": {
				if (!v1) return false;
				return resolveEntitiesBySelector(player, v1, v2).length === 0;
			}
			case "ifEntityIsAt": {
				if (!v1 || !v2 || !v3) return false;
				const pos1 = parseBlockPos(v2); const pos2 = parseBlockPos(v3);
				if (!pos1 || !pos2) return false;
				return resolveEntitiesBySelector(player, v1).some(entity => isInBlockArea(entity.location, pos1, pos2));
			}
			case "ifEntityIsNotAt": {
				if (!v1 || !v2 || !v3) return false;
				const pos1 = parseBlockPos(v2); const pos2 = parseBlockPos(v3);
				if (!pos1 || !pos2) return false;
				const entities = resolveEntitiesBySelector(player, v1);
				return entities.length > 0 && entities.every(entity => !isInBlockArea(entity.location, pos1, pos2));
			}
			case "ifEntityDamaged": {
				if (!v1) return false;
				return resolveEntitiesBySelector(player, v1).some(entity => wasEntityRecentlyDamaged(entity, worldObj));
			}
			case "ifEntityDamagedFromSource":
				if (!v1 || !v2) return false;
				return resolveEntitiesBySelector(player, v1).some(entity => wasEntityRecentlyDamagedFromSource(entity, worldObj, v2));
			case "ifBlockIs": {
				if (!v1 || !v2) return false;
				const pos = parseBlockPos(v1); if (!pos) return false;
				const checkBlock = getBlockAtPlayerDimension(player, pos);
				return checkBlock?.typeId?.toLowerCase() === v2.trim().toLowerCase();
			}
			case "ifBlockIsNot": {
				if (!v1 || !v2) return false;
				const pos = parseBlockPos(v1); if (!pos) return false;
				const checkBlock = getBlockAtPlayerDimension(player, pos);
				return checkBlock?.typeId?.toLowerCase() !== v2.trim().toLowerCase();
			}
			case "ifBlockHas": {
				if (!v1 || !v2 || !v3) return false;
				const pos = parseBlockPos(v1); if (!pos) return false;
				const checkBlock = getBlockAtPlayerDimension(player, pos);
				if (!checkBlock || checkBlock.typeId?.toLowerCase() !== v2.trim().toLowerCase()) return false;
				const container = checkBlock.getComponent("inventory")?.container ?? checkBlock.getComponent("minecraft:inventory")?.container;
				if (!container) return false;
				const expectedItem = v3.trim().toLowerCase();
				for (let i = 0; i < container.size; i++) if (container.getItem(i)?.typeId?.toLowerCase() === expectedItem) return true;
				return false;
			}
			case "ifBlockDoesNotHave": {
				if (!v1 || !v2 || !v3) return false;
				const pos = parseBlockPos(v1); if (!pos) return false;
				const checkBlock = getBlockAtPlayerDimension(player, pos);
				if (!checkBlock || checkBlock.typeId?.toLowerCase() !== v2.trim().toLowerCase()) return false;
				const container = checkBlock.getComponent("inventory")?.container ?? checkBlock.getComponent("minecraft:inventory")?.container;
				if (!container) return false;
				const expectedItem = v3.trim().toLowerCase();
				for (let i = 0; i < container.size; i++) if (container.getItem(i)?.typeId?.toLowerCase() === expectedItem) return false;
				return true;
			}
			case "ifBlocksAre":
			case "ifBlocksAreNot":
			case "ifBlockAreaHas":
			case "ifBlockAreaDoesNotHave": {
				if (!v1 || !v2 || !v3) return false;
				const pos1 = parseBlockPos(v1); const pos2 = parseBlockPos(v2);
				if (!pos1 || !pos2) return false;
				const compareType = v3.trim().toLowerCase();

				// The game scans the area itself: a script loop over a big area every couple of ticks
				// would hang the server. An unknown block ID simply matches nothing.
				const volume = new BlockVolume(pos1, pos2);
				const containsBlockWhere = filter => {
					try { return player.dimension.containsBlock(volume, filter, true); } catch { return undefined; }
				};
				const hasAny = containsBlockWhere({ includeTypes: [compareType] }) ?? false;
				const allMatch = hasAny && containsBlockWhere({ excludeTypes: [compareType] }) === false;

				if (condition === "ifBlocksAre") return allMatch;
				if (condition === "ifBlocksAreNot") return !allMatch;
				if (condition === "ifBlockAreaHas") return hasAny;
				return !hasAny;
			}
			case "ifTimeIs": {
				if (!v1 || !v2) return false;
				const currentTime = worldObj.getTimeOfDay();
				const minTime = Math.min(parseInt(v1), parseInt(v2));
				const maxTime = Math.max(parseInt(v1), parseInt(v2));
				return currentTime >= minTime && currentTime <= maxTime;
			}
			case "ifTimeIsNot": {
				if (!v1 || !v2) return false;
				const currentTime = worldObj.getTimeOfDay();
				const minTime = Math.min(parseInt(v1), parseInt(v2));
				const maxTime = Math.max(parseInt(v1), parseInt(v2));
				return !(currentTime >= minTime && currentTime <= maxTime);
			}
			case "ifWeatherIs": {
				if (!v1) return false;
				const expected = v1.trim().toLowerCase();
				const current = readWeatherName(worldObj);
				if (expected === "rain") return current === "rain";
				if (expected === "thunder") return current === "thunder";
				if (expected === "clear") return current === "clear";
				return false;
			}
			case "ifWeatherIsNot": {
				if (!v1) return false;
				const expected = v1.trim().toLowerCase();
				const current = readWeatherName(worldObj);
				if (expected === "rain") return current !== "rain";
				if (expected === "thunder") return current !== "thunder";
				if (expected === "clear") return current !== "clear";
				return false;
			}
			case "ifItemDurabilityIs":
			case "ifItemDurabilityFull":
			case "ifItemDurabilityIsHigher":
			case "ifItemDurabilityIsLower": {
				if (!v1 || !v2 || (condition !== "ifItemDurabilityFull" && !v3)) return false;
				const itemTypeId = normalizeItemTypeId(v2);
				const expected = parseInt(v3, 10);
				// The first stack of that item in each matching entity's inventory.
				return resolveEntitiesBySelector(player, v1).some(entity => {
					try {
						const inv = entity.getComponent("inventory")?.container;
						for (let i = 0; i < (inv?.size ?? 0); i++) {
							const item = inv.getItem(i);
							if (item?.typeId?.toLowerCase() !== itemTypeId) continue;
							const durability = item.getComponent("minecraft:durability");
							if (!durability) return false;
							const remaining = durability.maxDurability - durability.damage;
							if (condition === "ifItemDurabilityIs") return remaining === expected;
							if (condition === "ifItemDurabilityFull") return durability.damage === 0;
							if (condition === "ifItemDurabilityIsHigher") return remaining > expected;
							return remaining < expected;
						}
					} catch { }
					return false;
				});
			}
			default:
				return false;
		}
	} catch {
		return false;
	}
}

export function validateConditionRequirements(condition, v1, v2, v3) {
	const value1 = `${v1 ?? ""}`.trim();
	const value2 = `${v2 ?? ""}`.trim();
	const value3 = `${v3 ?? ""}`.trim();

	const hasValue = (value) => value.length > 0;
	const hasAnyExtra = (...values) => values.some(hasValue);
	const isInteger = (value) => /^-?\d+$/.test(value);
	const isWeather = (value) => ["clear", "rain", "thunder"].includes(value.toLowerCase());
	const isBlockPos = (value) => parseBlockPos(value) !== null;

	const syntaxByCondition = {
		noCondition: "<no data>",
		ifPlayerHasTag: "<string>",
		ifPlayerDoesNotHaveTag: "<string>",
		ifPlayerNameIs: "<string>",
		ifPlayerNameIsNot: "<string>",
		ifPlayerHealthIsHigher: "<int>",
		ifPlayerHealthIsLower: "<int>",
		ifPlayerHealthIsFull: "<no data>",
		ifPlayerIsDead: "<no data>",
		ifPlayerIsAlive: "<no data>",
		ifPlayerIsSneaking: "<no data>",
		ifPlayerIsSwimming: "<no data>",
		ifPlayerScoreIsHigher: "<scoreobjective:name> <int>",
		ifPlayerScoreIsLower: "<scoreobjective:name> <int>",
		ifPlayerScoreIs: "<scoreobjective:name> <int>",
		ifPlayerHasNoScore: "<scoreobjective:name>",
		ifPlayerHasScore: "<scoreobjective:name>",
		ifPlayerIsAt: "<pos:XYZ1> <pos:XYZ2>",
		ifPlayerIsNotAt: "<pos:XYZ1> <pos:XYZ2>",
		ifPlayerHasInInventory: "<minecraft:item/blockID> <item:count(optional)>",
		ifPlayerDoesNotHaveInInventory: "<minecraft:item/blockID> <item:count(optional)>",
		ifPlayerIsWearing: "<minecraft:item/blockID> <minecraft:inventorySlotID>",
		ifPlayerIsRiding: "<entity:selector(optional)> <no data>",
		ifPlayerIsOnConsole: "<no data>",
		ifPlayerIsOnMobile: "<no data>",
		ifPlayerisOnDesktop: "<no data>",
		ifPlayerDamaged: "<no data>",
		ifPlayerDamagedFromSource: "<damage:source>",
		ifScoreIsHigher: "<scoreobjective:name> <entity:name> <int>",
		ifScoreIsLower: "<scoreobjective:name> <entity:name> <int>",
		ifScoreIs: "<scoreobjective:name> <entity:name> <int>",
		ifScoreIsNot: "<scoreobjective:name> <entity:name> <int>",
		ifEntityIs: "<entity:selector>",
		ifEntityIsNot: "<entity:selector>",
		ifEntityHasTag: "<entity:selector> <string>",
		ifEntityDoesNotHaveTag: "<entity:selector> <string>",
		ifEntityHasName: "<entity:selector> <string>",
		ifEntityDoesNotHaveName: "<entity:selector> <string>",
		ifEntityNameIsNot: "<entity:selector> <string>",
		ifEntityScoreIsHigher: "<entity:selector> <scoreobjective:name> <int>",
		ifEntityScoreIsLower: "<entity:selector> <scoreobjective:name> <int>",
		ifEntityScoreIs: "<entity:selector> <scoreobjective:name> <int>",
		ifEntityHasNoScore: "<entity:selector> <scoreobjective:name>",
		ifEntityHasScore: "<entity:selector> <scoreobjective:name>",
		ifEntityHealthIsHigher: "<entity:selector> <int>",
		ifEntityHealthIsLower: "<entity:selector> <int>",
		ifEntityHealthIsFull: "<entity:selector> <no data>",
		ifEntityIsDead: "<entity:selector> <no data>",
		ifEntityIsAlive: "<entity:selector> <no data>",
		ifEntityHasInInventory: "<entity:selector> <minecraft:item/blockID> <item:count(optional)>",
		ifEntityDoesNotHaveInInventory: "<entity:selector> <minecraft:item/blockID>",
		ifEntityExists: "<entity:selector> <radius:int(optional)>",
		ifEntityDoesNotExist: "<entity:selector> <radius:int(optional)>",
		ifEntityIsAt: "<entity:selector> <pos:XYZ1> <pos:XYZ2>",
		ifEntityIsNotAt: "<entity:selector> <pos:XYZ1> <pos:XYZ2>",
		ifEntityDamaged: "<entity:selector>",
		ifEntityDamagedFromSource: "<entity:selector> <damage:source>",
		ifBlockIs: "<pos:XYZ> <minecraft:blockID>",
		ifBlockIsNot: "<pos:XYZ> <minecraft:blockID>",
		ifBlockHas: "<pos:XYZ> <minecraft:blockID> <minecraft:item/blockID>",
		ifBlockDoesNotHave: "<pos:XYZ> <minecraft:blockID> <minecraft:item/blockID>",
		ifBlocksAre: "<pos:XYZ1> <pos:XYZ2> <minecraft:blockID>",
		ifBlocksAreNot: "<pos:XYZ1> <pos:XYZ2> <minecraft:blockID>",
		ifBlockAreaHas: "<pos:XYZ1> <pos:XYZ2> <minecraft:blockID>",
		ifBlockAreaDoesNotHave: "<pos:XYZ1> <pos:XYZ2> <minecraft:blockID>",
		ifTimeIs: "<int1> <int2>",
		ifTimeIsNot: "<int1> <int2>",
		ifWeatherIs: "<clear/rain/thunder>",
		ifWeatherIsNot: "<clear/rain/thunder>",
		ifItemDurabilityIs: "<minecraft:selector> <minecraft:itemID> <int>",
		ifItemDurabilityFull: "<minecraft:selector> <minecraft:itemID>",
		ifItemDurabilityIsHigher: "<minecraft:selector> <minecraft:itemID> <int>",
		ifItemDurabilityIsLower: "<minecraft:selector> <minecraft:itemID> <int>"
	};

	const syntax = syntaxByCondition[condition] ?? "See block system syntax list";
	const fail = (reason) => `"${condition}" ${reason}. Syntax: ${syntax}`;

	const noDataConditions = [
		"noCondition", "ifPlayerHealthIsFull", "ifPlayerIsDead", "ifPlayerIsAlive",
		"ifPlayerIsSneaking", "ifPlayerIsSwimming", "ifPlayerIsOnConsole", "ifPlayerIsOnMobile",
		"ifPlayerisOnDesktop", "ifPlayerDamaged"
	];

	if (noDataConditions.includes(condition)) {
		if (hasAnyExtra(value1, value2, value3)) return fail("does not accept any values");
		return null;
	}

	switch (condition) {
		case "ifPlayerHasTag":
		case "ifPlayerDoesNotHaveTag":
		case "ifPlayerNameIs":
		case "ifPlayerNameIsNot":
		case "ifPlayerHasNoScore":
		case "ifPlayerHasScore":
		case "ifPlayerDamagedFromSource":
		case "ifEntityIs":
		case "ifEntityIsNot":
		case "ifEntityDamaged":
			if (!hasValue(value1)) return fail("requires Value 1");
			if (hasAnyExtra(value2, value3)) return fail("only uses Value 1");
			return null;

		case "ifPlayerHealthIsHigher":
		case "ifPlayerHealthIsLower":
			if (!hasValue(value1)) return fail("requires Value 1");
			if (!isInteger(value1)) return fail("requires Value 1 to be an integer");
			if (hasAnyExtra(value2, value3)) return fail("only uses Value 1");
			return null;

		case "ifPlayerScoreIsHigher":
		case "ifPlayerScoreIsLower":
		case "ifPlayerScoreIs":
			if (!hasValue(value1) || !hasValue(value2)) return fail("requires Value 1 and Value 2");
			if (!isInteger(value2)) return fail("requires Value 2 to be an integer");
			if (hasValue(value3)) return fail("does not use Value 3");
			return null;

		case "ifPlayerHasInInventory":
		case "ifPlayerDoesNotHaveInInventory":
			if (!hasValue(value1)) return fail("requires Value 1");
			if (hasValue(value2) && !isInteger(value2)) return fail("requires Value 2 (item count) to be an integer when provided");
			if (hasValue(value3)) return fail("does not use Value 3");
			return null;

		case "ifPlayerIsAt":
		case "ifPlayerIsNotAt":
			if (!hasValue(value1) || !hasValue(value2)) return fail("requires Value 1 and Value 2");
			if (!isBlockPos(value1) || !isBlockPos(value2)) return fail("requires Value 1 and Value 2 as XYZ coordinates (for example: 0 64 -184)");
			if (hasValue(value3)) return fail("does not use Value 3");
			return null;

		case "ifPlayerIsWearing":
			if (!hasValue(value1) || !hasValue(value2)) return fail("requires Value 1 and Value 2");
			if (!normalizeEquipmentSlot(value2)) return fail("requires Value 2 to be a valid armor/hand slot (head, chest, legs, feet, offhand, mainhand)");
			if (hasValue(value3)) return fail("does not use Value 3");
			return null;

		case "ifPlayerIsRiding":
			if (hasAnyExtra(value2, value3)) return fail("only uses optional Value 1");
			return null;

		case "ifScoreIsHigher":
		case "ifScoreIsLower":
		case "ifScoreIs":
		case "ifScoreIsNot":
		case "ifEntityScoreIsHigher":
		case "ifEntityScoreIsLower":
		case "ifEntityScoreIs":
			if (!hasValue(value1) || !hasValue(value2) || !hasValue(value3)) return fail("requires Value 1, Value 2, and Value 3");
			if (!isInteger(value3)) return fail("requires Value 3 to be an integer");
			return null;

		case "ifEntityHasTag":
		case "ifEntityDoesNotHaveTag":
		case "ifEntityHasName":
		case "ifEntityDoesNotHaveName":
		case "ifEntityNameIsNot":
		case "ifEntityHasNoScore":
		case "ifEntityHasScore":
		case "ifEntityDamagedFromSource":
			if (!hasValue(value1) || !hasValue(value2)) return fail("requires Value 1 and Value 2");
			if (hasValue(value3)) return fail("does not use Value 3");
			return null;

		case "ifEntityHealthIsHigher":
		case "ifEntityHealthIsLower":
			if (!hasValue(value1) || !hasValue(value2)) return fail("requires Value 1 and Value 2");
			if (!isInteger(value2)) return fail("requires Value 2 to be an integer");
			if (hasValue(value3)) return fail("does not use Value 3");
			return null;

		case "ifEntityHealthIsFull":
		case "ifEntityIsDead":
		case "ifEntityIsAlive":
			if (!hasValue(value1)) return fail("requires Value 1");
			if (hasAnyExtra(value2, value3)) return fail("does not use Value 2 or Value 3");
			return null;

		case "ifEntityHasInInventory":
			if (!hasValue(value1) || !hasValue(value2)) return fail("requires Value 1 and Value 2");
			if (hasValue(value3) && !isInteger(value3)) return fail("requires Value 3 (item count) to be an integer when provided");
			return null;

		case "ifEntityDoesNotHaveInInventory":
			if (!hasValue(value1) || !hasValue(value2)) return fail("requires Value 1 and Value 2");
			if (hasValue(value3)) return fail("does not use Value 3");
			return null;

		case "ifEntityExists":
		case "ifEntityDoesNotExist":
			if (!hasValue(value1)) return fail("requires Value 1");
			if (hasValue(value2) && !isInteger(value2)) return fail("requires Value 2 (radius) to be an integer when provided");
			if (hasValue(value3)) return fail("does not use Value 3");
			return null;

		case "ifEntityIsAt":
		case "ifEntityIsNotAt":
			if (!hasValue(value1) || !hasValue(value2) || !hasValue(value3)) return fail("requires Value 1, Value 2, and Value 3");
			if (!isBlockPos(value2) || !isBlockPos(value3)) return fail("requires Value 2 and Value 3 as XYZ coordinates (for example: 0 64 -184)");
			return null;

		case "ifBlockIs":
		case "ifBlockIsNot":
			if (!hasValue(value1) || !hasValue(value2)) return fail("requires Value 1 and Value 2");
			if (!isBlockPos(value1)) return fail("requires Value 1 as XYZ coordinates (for example: 0 64 -184)");
			if (hasValue(value3)) return fail("does not use Value 3");
			return null;

		case "ifBlockHas":
		case "ifBlockDoesNotHave":
			if (!hasValue(value1) || !hasValue(value2) || !hasValue(value3)) return fail("requires Value 1, Value 2, and Value 3");
			if (!isBlockPos(value1)) return fail("requires Value 1 as XYZ coordinates (for example: 0 64 -184)");
			return null;

		case "ifBlocksAre":
		case "ifBlockAreaHas":
		case "ifBlocksAreNot":
		case "ifBlockAreaDoesNotHave":
			if (!hasValue(value1) || !hasValue(value2) || !hasValue(value3)) return fail("requires Value 1, Value 2, and Value 3");
			if (!isBlockPos(value1) || !isBlockPos(value2)) return fail("requires Value 1 and Value 2 as XYZ coordinates (for example: 0 64 -184)");
			return null;

		case "ifTimeIs":
		case "ifTimeIsNot":
			if (!hasValue(value1) || !hasValue(value2)) return fail("requires Value 1 and Value 2");
			if (!isInteger(value1) || !isInteger(value2)) return fail("requires Value 1 and Value 2 to be integers");
			if (hasValue(value3)) return fail("does not use Value 3");
			return null;

		case "ifWeatherIs":
		case "ifWeatherIsNot":
			if (!hasValue(value1)) return fail("requires Value 1");
			if (!isWeather(value1)) return fail("requires Value 1 to be one of: clear, rain, thunder");
			if (hasAnyExtra(value2, value3)) return fail("does not use Value 2 or Value 3");
			return null;

		case "ifItemDurabilityIs":
		case "ifItemDurabilityIsHigher":
		case "ifItemDurabilityIsLower":
			if (!hasValue(value1) || !hasValue(value2) || !hasValue(value3)) return fail("requires Value 1, Value 2, and Value 3");
			if (!isInteger(value3)) return fail("requires Value 3 to be an integer");
			return null;

		case "ifItemDurabilityFull":
			if (!hasValue(value1) || !hasValue(value2)) return fail("requires Value 1 and Value 2");
			if (hasValue(value3)) return fail("does not use Value 3");
			return null;

		default:
			return null;
	}
}