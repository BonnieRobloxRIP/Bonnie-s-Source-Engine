import { system, world } from "@minecraft/server";
import { isEntityValid } from "../core/entity_utils.js";

const bridgeThrowableItemIds = new Set(["brr:bridge_maker"]);
const BRIDGE_BLOCK_TYPE_ID = "brr:dev_measurewall01a";
const BRIDGE_MAX_LENGTH = 20;
const BRIDGE_THROW_MEMORY_TICKS = 200;

const pendingBridgeThrowsByPlayerId = new Map();

function recordBridgeThrowStart(player) {
	const throwStart = {
		x: player.location.x,
		y: player.location.y,
		z: player.location.z,
		dimensionId: player.dimension.id,
		tick: system.currentTick,
	};

	const pendingThrows = pendingBridgeThrowsByPlayerId.get(player.id) ?? [];
	pendingThrows.push(throwStart);
	if (pendingThrows.length > 4) {
		pendingThrows.shift();
	}

	pendingBridgeThrowsByPlayerId.set(player.id, pendingThrows);
}

function getProjectileOwner(projectile) {
	if (!projectile) return undefined;

	try {
		const projectileComponent = projectile.getComponent?.("minecraft:projectile");
		const owner = projectileComponent?.owner;
		if (owner && isEntityValid(owner)) return owner;
	} catch {
	}

	const ownerCandidate = projectile.owner ?? projectile.source;
	if (ownerCandidate && isEntityValid(ownerCandidate)) {
		return ownerCandidate;
	}

	return undefined;
}

function getHitLocationFromEvent(event) {
	if (!event) return undefined;

	const directLocation = event.location ?? event.hitVector;
	if (directLocation) {
		return {
			x: directLocation.x,
			y: directLocation.y,
			z: directLocation.z,
		};
	}

	const blockLocation = event.getBlockHit?.()?.block?.location ?? event.blockHit?.block?.location ?? event.hitBlock?.location;
	if (blockLocation) {
		return {
			x: blockLocation.x + 0.5,
			y: blockLocation.y + 1,
			z: blockLocation.z + 0.5,
		};
	}

	const hitEntityLocation = event.getEntityHit?.()?.entity?.location ?? event.entityHit?.entity?.location ?? event.hitEntity?.location;
	if (hitEntityLocation) {
		return {
			x: hitEntityLocation.x,
			y: hitEntityLocation.y,
			z: hitEntityLocation.z,
		};
	}

	return undefined;
}

function isAirLike(typeId) {
	return typeId === "minecraft:air" || typeId === "minecraft:cave_air" || typeId === "minecraft:void_air";
}

function isVoidLanding(dimension, endLocation) {
	if (endLocation.y <= -63) return true;

	try {
		const belowBlock = dimension.getBlock({
			x: Math.floor(endLocation.x),
			y: Math.floor(endLocation.y) - 1,
			z: Math.floor(endLocation.z),
		});
		const belowTypeId = belowBlock?.typeId ?? "";
		return !belowTypeId || isAirLike(belowTypeId);
	} catch {
		return true;
	}
}

function placeBridgeLine(dimension, fromLocation, toLocation) {
	const dx = toLocation.x - fromLocation.x;
	const dz = toLocation.z - fromLocation.z;
	const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
	const steps = Math.max(1, Math.min(BRIDGE_MAX_LENGTH, Math.ceil(horizontalDistance)));

	for (let step = 0; step <= steps; step++) {
		const t = step / steps;
		const x = fromLocation.x + dx * t;
		const y = fromLocation.y + (toLocation.y - fromLocation.y) * t - 1;
		const z = fromLocation.z + dz * t;

		dimension.runCommand(
			`setblock ${Math.floor(x)} ${Math.floor(y)} ${Math.floor(z)} ${BRIDGE_BLOCK_TYPE_ID} keep`
		);
	}
}

function tryCreateBridgeFromProjectileImpact(event) {
	const projectile = event?.projectile ?? event?.source;
	if (!projectile) return;

	const owner = getProjectileOwner(projectile);
	if (!owner || owner.typeId !== "minecraft:player") return;

	const pendingThrows = pendingBridgeThrowsByPlayerId.get(owner.id);
	if (!pendingThrows || pendingThrows.length === 0) return;

	const throwStart = pendingThrows.shift();
	if (!throwStart) return;

	if (pendingThrows.length === 0) {
		pendingBridgeThrowsByPlayerId.delete(owner.id);
	} else {
		pendingBridgeThrowsByPlayerId.set(owner.id, pendingThrows);
	}

	const hitLocation = getHitLocationFromEvent(event);
	if (!hitLocation) return;

	const dimension = owner.dimension;
	if (throwStart.dimensionId !== dimension.id) return;
	if (isVoidLanding(dimension, hitLocation)) return;

	placeBridgeLine(dimension, throwStart, hitLocation);
}

world.afterEvents.itemUse.subscribe((event) => {
	const player = event.source;
	if (!player || player.typeId !== "minecraft:player") return;
	if (!isEntityValid(player)) return;

	const itemTypeId = event.itemStack?.typeId;
	if (!itemTypeId || !bridgeThrowableItemIds.has(itemTypeId)) return;

	recordBridgeThrowStart(player);
});

system.runInterval(() => {
	for (const [playerId, pendingThrows] of pendingBridgeThrowsByPlayerId.entries()) {
		const freshThrows = pendingThrows.filter((entry) => system.currentTick - entry.tick <= BRIDGE_THROW_MEMORY_TICKS);
		if (freshThrows.length === 0) {
			pendingBridgeThrowsByPlayerId.delete(playerId);
			continue;
		}

		pendingBridgeThrowsByPlayerId.set(playerId, freshThrows);
	}
}, 20);

try {
	world.afterEvents.projectileHitBlock.subscribe((event) => {
		tryCreateBridgeFromProjectileImpact(event);
	});
} catch {
}

try {
	world.afterEvents.projectileHitEntity.subscribe((event) => {
		tryCreateBridgeFromProjectileImpact(event);
	});
} catch {
}