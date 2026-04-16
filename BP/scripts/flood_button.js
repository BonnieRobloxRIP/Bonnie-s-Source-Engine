import { BlockPermutation, MolangVariableMap, system, world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";

const FLOOD_BUTTON_ID = "brr:flood_button";
const FLOOD_BUTTON_PRESSED_STATE = "brr:pressed";
const FLOOD_BUTTON_TYPE_STATE = "brr:button_type";
const FLOOD_BUTTON_FACE_STATE = "minecraft:block_face";
const FLOOD_BUTTON_PARTICLE_1 = "brr:flood_button_particle1";
const FLOOD_BUTTON_STEP_CHECK_INTERVAL_TICKS = 1;
const FLOOD_BUTTON_SEARCH_RADIUS = 1;
const FLOOD_BUTTON_SEARCH_Y_MIN = -1;
const FLOOD_BUTTON_SEARCH_Y_MAX = 2;
const FLOOD_BUTTON_WORLD_MIN_Y = -64;
const FLOOD_BUTTON_WORLD_MAX_Y = 319;
const FLOOD_BUTTON_CONTACT_SURFACE_MARGIN = 3 / 16;
const FLOOD_BUTTON_CONTACT_SURFACE_EPSILON = 1 / 32;
const FLOOD_BUTTON_FALLBACK_PLAYER_HALF_WIDTH = 0.3;
const FLOOD_BUTTON_FALLBACK_PLAYER_HEIGHT = 1.8;
const FLOOD_BUTTON_CONFIG_TOOL_ITEM = "minecraft:blaze_rod";
const FLOOD_BUTTON_PRESS_SOUND_ID = "flood_button.press";
const FLOOD_BUTTON_SOUND_VARIANT_COUNT = 9;

const FLOOD_BUTTON_COLLISION_ORIGIN = { x: -7 / 16, y: 0, z: -7 / 16 };
const FLOOD_BUTTON_COLLISION_SIZE = { x: 14 / 16, y: 4 / 16, z: 14 / 16 };
const FLOOD_BUTTON_ROTATION_PIVOT = { x: 0, y: 0.5, z: 0 };

const FLOOD_BUTTON_FACE_ROTATIONS = {
	up: { x: 0, y: 0, z: 0 },
	down: { x: 180, y: 0, z: 0 },
	north: { x: -90, y: 0, z: 0 },
	south: { x: 90, y: 0, z: 0 },
	east: { x: 0, y: 0, z: -90 },
	west: { x: 0, y: 0, z: 90 },
};

const FLOOD_BUTTON_CONFIG_STATE_DEFINITIONS = [
	{
		id: FLOOD_BUTTON_TYPE_STATE,
		label: "Button Type",
		options: ["parkour", "exit", "mechanical"],
	},
	{
		id: FLOOD_BUTTON_PRESSED_STATE,
		label: "Pressed",
		options: [false, true],
	},
	{
		id: FLOOD_BUTTON_FACE_STATE,
		label: "Face",
		options: ["up", "down", "north", "south", "east", "west"],
	},
];

const floodButtonPlayersInConfigForm = new Set();
let floodButtonSystemsInitialized = false;

function getFloodButtonStateOptionLabel(option) {
	return typeof option === "boolean" ? `${option}` : option;
}

function getDefaultStateOptionIndex(options, currentValue) {
	const index = options.findIndex((option) => option === currentValue);
	return index >= 0 ? index : 0;
}

async function showFloodButtonConfigurationForm(player, targetDimension, targetLocation) {
	const currentBlock = targetDimension.getBlock(targetLocation);

	if (!currentBlock || currentBlock.typeId !== FLOOD_BUTTON_ID) {
		player.sendMessage("[Flood Escape] That flood button is no longer available.");
		return;
	}

	const form = new ModalFormData().title("Flood Button Config");
	const configurableStates = [];
	const currentStates = currentBlock.permutation.getAllStates();

	for (const stateDefinition of FLOOD_BUTTON_CONFIG_STATE_DEFINITIONS) {
		if (!stateDefinition.options.length) {
			continue;
		}

		const optionLabels = stateDefinition.options.map((option) => getFloodButtonStateOptionLabel(option));
		const defaultValueIndex = getDefaultStateOptionIndex(stateDefinition.options, currentStates[stateDefinition.id]);

		form.dropdown(`${stateDefinition.label} (${stateDefinition.id})`, optionLabels, {
			defaultValueIndex,
		});
		configurableStates.push(stateDefinition);
	}

	if (!configurableStates.length) {
		player.sendMessage("[Flood Escape] No configurable flood button states were found.");
		return;
	}

	const response = await form.show(player);
	if (response.canceled || !response.formValues) {
		return;
	}

	const latestBlock = targetDimension.getBlock(targetLocation);
	if (!latestBlock || latestBlock.typeId !== FLOOD_BUTTON_ID) {
		player.sendMessage("[Flood Escape] That flood button changed before the configuration could be saved.");
		return;
	}

	const nextStates = {
		...latestBlock.permutation.getAllStates(),
	};

	for (let index = 0; index < configurableStates.length; index++) {
		const selectedIndexValue = response.formValues[index];
		if (typeof selectedIndexValue !== "number") {
			continue;
		}

		const selectedOption = configurableStates[index].options[Math.floor(selectedIndexValue)];
		if (selectedOption === undefined) {
			continue;
		}

		nextStates[configurableStates[index].id] = selectedOption;
	}

	latestBlock.setPermutation(BlockPermutation.resolve(FLOOD_BUTTON_ID, nextStates));
	player.sendMessage(
		`[Flood Escape] Flood button updated: type=${nextStates[FLOOD_BUTTON_TYPE_STATE]}, pressed=${nextStates[FLOOD_BUTTON_PRESSED_STATE]}, face=${nextStates[FLOOD_BUTTON_FACE_STATE]}`
	);
}

function handleFloodButtonConfigurationInteract(event) {
	const isFirstEvent = event.isFirstEvent;
	if (isFirstEvent === false) {
		return;
	}

	if (event.block.typeId !== FLOOD_BUTTON_ID) {
		return;
	}

	const heldItem = event.itemStack ?? event.beforeItemStack;
	if (!heldItem || heldItem.typeId !== FLOOD_BUTTON_CONFIG_TOOL_ITEM) {
		return;
	}

	if ("cancel" in event) {
		event.cancel = true;
	}

	const player = event.player;
	const playerKey = player.id ?? player.name;
	if (floodButtonPlayersInConfigForm.has(playerKey)) {
		return;
	}

	floodButtonPlayersInConfigForm.add(playerKey);
	const targetDimension = event.block.dimension;
	const targetLocation = {
		x: event.block.location.x,
		y: event.block.location.y,
		z: event.block.location.z,
	};

	system.run(() => {
		void showFloodButtonConfigurationForm(player, targetDimension, targetLocation)
			.catch((error) => {
				console.warn(`[Flood Escape] Failed to show flood button configuration form: ${error}`);
			})
			.finally(() => {
				floodButtonPlayersInConfigForm.delete(playerKey);
			});
	});
}

function setFloodButtonPressedState(block, pressed) {
	if (block.typeId !== FLOOD_BUTTON_ID) {
		return false;
	}

	try {
		block.setPermutation(block.permutation.withState(FLOOD_BUTTON_PRESSED_STATE, pressed));
		return true;
	} catch (error) {
		try {
			const allStates = block.permutation.getAllStates();
			const nextStates = {
				...allStates,
				[FLOOD_BUTTON_PRESSED_STATE]: pressed,
				[FLOOD_BUTTON_TYPE_STATE]: allStates[FLOOD_BUTTON_TYPE_STATE] ?? "parkour",
			};

			block.setPermutation(BlockPermutation.resolve(FLOOD_BUTTON_ID, nextStates));
			return true;
		} catch (resolveError) {
			console.warn(`[Flood Escape] Failed to set flood button state: ${error} | fallback: ${resolveError}`);
			return false;
		}
	}
}

function isFloodButtonPressed(block) {
	try {
		return block.permutation.getState(FLOOD_BUTTON_PRESSED_STATE) === true;
	} catch {
		return false;
	}
}

function getFloodButtonFace(block) {
	try {
		return block.permutation.getState(FLOOD_BUTTON_FACE_STATE) ?? "up";
	} catch {
		return "up";
	}
}

function getFloodButtonFaceDirection(block) {
	switch (getFloodButtonFace(block)) {
		case "down":
			return { x: 0, y: -1, z: 0 };
		case "north":
			return { x: 0, y: 0, z: -1 };
		case "south":
			return { x: 0, y: 0, z: 1 };
		case "east":
			return { x: 1, y: 0, z: 0 };
		case "west":
			return { x: -1, y: 0, z: 0 };
		case "up":
		default:
			return { x: 0, y: 1, z: 0 };
	}
}

function getFloodButtonParticleFacingDirection(block) {
	const faceDirection = getFloodButtonFaceDirection(block);

	if (Math.abs(faceDirection.y) === 1) {
		return {
			x: 0,
			y: faceDirection.y,
			z: 0.001,
		};
	}

	return faceDirection;
}

function normalizedQuarterTurns(degrees) {
	return ((Math.round(degrees / 90) % 4) + 4) % 4;
}

function rotateX(point, turns) {
	switch (turns) {
		case 1:
			return { x: point.x, y: -point.z, z: point.y };
		case 2:
			return { x: point.x, y: -point.y, z: -point.z };
		case 3:
			return { x: point.x, y: point.z, z: -point.y };
		default:
			return point;
	}
}

function rotateY(point, turns) {
	switch (turns) {
		case 1:
			return { x: point.z, y: point.y, z: -point.x };
		case 2:
			return { x: -point.x, y: point.y, z: -point.z };
		case 3:
			return { x: -point.z, y: point.y, z: point.x };
		default:
			return point;
	}
}

function rotateZ(point, turns) {
	switch (turns) {
		case 1:
			return { x: -point.y, y: point.x, z: point.z };
		case 2:
			return { x: -point.x, y: -point.y, z: point.z };
		case 3:
			return { x: point.y, y: -point.x, z: point.z };
		default:
			return point;
	}
}

function rotatePointAroundPivot(point, rotation, pivot) {
	let rotated = {
		x: point.x - pivot.x,
		y: point.y - pivot.y,
		z: point.z - pivot.z,
	};

	rotated = rotateX(rotated, normalizedQuarterTurns(rotation.x));
	rotated = rotateY(rotated, normalizedQuarterTurns(rotation.y));
	rotated = rotateZ(rotated, normalizedQuarterTurns(rotation.z));

	return {
		x: rotated.x + pivot.x,
		y: rotated.y + pivot.y,
		z: rotated.z + pivot.z,
	};
}

function getEntityWorldBounds(entity) {
	try {
		const aabb = entity.getAABB();

		return {
			minX: aabb.center.x - aabb.extent.x,
			maxX: aabb.center.x + aabb.extent.x,
			minY: aabb.center.y - aabb.extent.y,
			maxY: aabb.center.y + aabb.extent.y,
			minZ: aabb.center.z - aabb.extent.z,
			maxZ: aabb.center.z + aabb.extent.z,
		};
	} catch {
		const location = entity.location;

		return {
			minX: location.x - FLOOD_BUTTON_FALLBACK_PLAYER_HALF_WIDTH,
			maxX: location.x + FLOOD_BUTTON_FALLBACK_PLAYER_HALF_WIDTH,
			minY: location.y,
			maxY: location.y + FLOOD_BUTTON_FALLBACK_PLAYER_HEIGHT,
			minZ: location.z - FLOOD_BUTTON_FALLBACK_PLAYER_HALF_WIDTH,
			maxZ: location.z + FLOOD_BUTTON_FALLBACK_PLAYER_HALF_WIDTH,
		};
	}
}

function getFloodButtonWorldBounds(block) {
	const minLocal = {
		x: FLOOD_BUTTON_COLLISION_ORIGIN.x,
		y: FLOOD_BUTTON_COLLISION_ORIGIN.y,
		z: FLOOD_BUTTON_COLLISION_ORIGIN.z,
	};
	const maxLocal = {
		x: FLOOD_BUTTON_COLLISION_ORIGIN.x + FLOOD_BUTTON_COLLISION_SIZE.x,
		y: FLOOD_BUTTON_COLLISION_ORIGIN.y + FLOOD_BUTTON_COLLISION_SIZE.y,
		z: FLOOD_BUTTON_COLLISION_ORIGIN.z + FLOOD_BUTTON_COLLISION_SIZE.z,
	};

	const face = getFloodButtonFace(block);
	const rotation = FLOOD_BUTTON_FACE_ROTATIONS[face] ?? FLOOD_BUTTON_FACE_ROTATIONS.up;
	const worldCenterX = block.location.x + 0.5;
	const worldCenterZ = block.location.z + 0.5;

	const corners = [
		{ x: minLocal.x, y: minLocal.y, z: minLocal.z },
		{ x: minLocal.x, y: minLocal.y, z: maxLocal.z },
		{ x: minLocal.x, y: maxLocal.y, z: minLocal.z },
		{ x: minLocal.x, y: maxLocal.y, z: maxLocal.z },
		{ x: maxLocal.x, y: minLocal.y, z: minLocal.z },
		{ x: maxLocal.x, y: minLocal.y, z: maxLocal.z },
		{ x: maxLocal.x, y: maxLocal.y, z: minLocal.z },
		{ x: maxLocal.x, y: maxLocal.y, z: maxLocal.z },
	];

	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let minZ = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;
	let maxZ = Number.NEGATIVE_INFINITY;

	for (const corner of corners) {
		const rotated = rotatePointAroundPivot(corner, rotation, FLOOD_BUTTON_ROTATION_PIVOT);
		const worldPoint = {
			x: worldCenterX + rotated.x,
			y: block.location.y + rotated.y,
			z: worldCenterZ + rotated.z,
		};

		minX = Math.min(minX, worldPoint.x);
		minY = Math.min(minY, worldPoint.y);
		minZ = Math.min(minZ, worldPoint.z);
		maxX = Math.max(maxX, worldPoint.x);
		maxY = Math.max(maxY, worldPoint.y);
		maxZ = Math.max(maxZ, worldPoint.z);
	}

	return { minX, minY, minZ, maxX, maxY, maxZ };
}

function intersectsAabb(a, b) {
	return (
		a.minX <= b.maxX &&
		a.maxX >= b.minX &&
		a.minY <= b.maxY &&
		a.maxY >= b.minY &&
		a.minZ <= b.maxZ &&
		a.maxZ >= b.minZ
	);
}

function rangesOverlap(minA, maxA, minB, maxB, epsilon = 0) {
	return minA <= maxB + epsilon && maxA >= minB - epsilon;
}

function isPlayerTouchingFloodButtonFace(playerBounds, buttonBounds, faceDirection) {
	const overlapEpsilon = FLOOD_BUTTON_CONTACT_SURFACE_EPSILON;
	const surfaceMargin = FLOOD_BUTTON_CONTACT_SURFACE_MARGIN;

	if (faceDirection.x > 0) {
		return (
			rangesOverlap(playerBounds.minY, playerBounds.maxY, buttonBounds.minY, buttonBounds.maxY, overlapEpsilon) &&
			rangesOverlap(playerBounds.minZ, playerBounds.maxZ, buttonBounds.minZ, buttonBounds.maxZ, overlapEpsilon) &&
			playerBounds.minX <= buttonBounds.maxX + overlapEpsilon &&
			playerBounds.minX >= buttonBounds.maxX - surfaceMargin
		);
	}

	if (faceDirection.x < 0) {
		return (
			rangesOverlap(playerBounds.minY, playerBounds.maxY, buttonBounds.minY, buttonBounds.maxY, overlapEpsilon) &&
			rangesOverlap(playerBounds.minZ, playerBounds.maxZ, buttonBounds.minZ, buttonBounds.maxZ, overlapEpsilon) &&
			playerBounds.maxX >= buttonBounds.minX - overlapEpsilon &&
			playerBounds.maxX <= buttonBounds.minX + surfaceMargin
		);
	}

	if (faceDirection.y > 0) {
		return (
			rangesOverlap(playerBounds.minX, playerBounds.maxX, buttonBounds.minX, buttonBounds.maxX, overlapEpsilon) &&
			rangesOverlap(playerBounds.minZ, playerBounds.maxZ, buttonBounds.minZ, buttonBounds.maxZ, overlapEpsilon) &&
			playerBounds.minY <= buttonBounds.maxY + overlapEpsilon &&
			playerBounds.minY >= buttonBounds.maxY - surfaceMargin
		);
	}

	if (faceDirection.y < 0) {
		return (
			rangesOverlap(playerBounds.minX, playerBounds.maxX, buttonBounds.minX, buttonBounds.maxX, overlapEpsilon) &&
			rangesOverlap(playerBounds.minZ, playerBounds.maxZ, buttonBounds.minZ, buttonBounds.maxZ, overlapEpsilon) &&
			playerBounds.maxY >= buttonBounds.minY - overlapEpsilon &&
			playerBounds.maxY <= buttonBounds.minY + surfaceMargin
		);
	}

	if (faceDirection.z > 0) {
		return (
			rangesOverlap(playerBounds.minX, playerBounds.maxX, buttonBounds.minX, buttonBounds.maxX, overlapEpsilon) &&
			rangesOverlap(playerBounds.minY, playerBounds.maxY, buttonBounds.minY, buttonBounds.maxY, overlapEpsilon) &&
			playerBounds.minZ <= buttonBounds.maxZ + overlapEpsilon &&
			playerBounds.minZ >= buttonBounds.maxZ - surfaceMargin
		);
	}

	if (faceDirection.z < 0) {
		return (
			rangesOverlap(playerBounds.minX, playerBounds.maxX, buttonBounds.minX, buttonBounds.maxX, overlapEpsilon) &&
			rangesOverlap(playerBounds.minY, playerBounds.maxY, buttonBounds.minY, buttonBounds.maxY, overlapEpsilon) &&
			playerBounds.maxZ >= buttonBounds.minZ - overlapEpsilon &&
			playerBounds.maxZ <= buttonBounds.minZ + surfaceMargin
		);
	}

	return false;
}

function shouldTriggerFloodButton(player, block) {
	if (isFloodButtonPressed(block)) {
		return false;
	}

	try {
		const playerBounds = getEntityWorldBounds(player);
		const buttonBounds = getFloodButtonWorldBounds(block);
		const faceDirection = getFloodButtonFaceDirection(block);

		if (!isPlayerTouchingFloodButtonFace(playerBounds, buttonBounds, faceDirection)) {
			return false;
		}

		return intersectsAabb(playerBounds, {
			minX: buttonBounds.minX - FLOOD_BUTTON_CONTACT_SURFACE_MARGIN,
			maxX: buttonBounds.maxX + FLOOD_BUTTON_CONTACT_SURFACE_MARGIN,
			minY: buttonBounds.minY - FLOOD_BUTTON_CONTACT_SURFACE_MARGIN,
			maxY: buttonBounds.maxY + FLOOD_BUTTON_CONTACT_SURFACE_MARGIN,
			minZ: buttonBounds.minZ - FLOOD_BUTTON_CONTACT_SURFACE_MARGIN,
			maxZ: buttonBounds.maxZ + FLOOD_BUTTON_CONTACT_SURFACE_MARGIN,
		});
	} catch {
		return false;
	}
}

function getFloodButtonParticleLocation(block) {
	const bounds = getFloodButtonWorldBounds(block);
	const direction = getFloodButtonFaceDirection(block);
	const surfaceOffset = 0.03;

	let x = (bounds.minX + bounds.maxX) / 2;
	let y = (bounds.minY + bounds.maxY) / 2;
	let z = (bounds.minZ + bounds.maxZ) / 2;

	if (direction.x > 0) {
		x = bounds.maxX + surfaceOffset;
	} else if (direction.x < 0) {
		x = bounds.minX - surfaceOffset;
	}

	if (direction.y > 0) {
		y = bounds.maxY + surfaceOffset;
	} else if (direction.y < 0) {
		y = bounds.minY - surfaceOffset;
	}

	if (direction.z > 0) {
		z = bounds.maxZ + surfaceOffset;
	} else if (direction.z < 0) {
		z = bounds.minZ - surfaceOffset;
	}

	return {
		x,
		y,
		z,
	};
}

function spawnFloodButtonActivationParticles(block) {
	try {
		const direction = getFloodButtonParticleFacingDirection(block);
		const particleMolang = new MolangVariableMap();
		particleMolang.setFloat("variable.brr_face_x", direction.x);
		particleMolang.setFloat("variable.brr_face_y", direction.y);
		particleMolang.setFloat("variable.brr_face_z", direction.z);

		const particleLocation = getFloodButtonParticleLocation(block);
		block.dimension.spawnParticle(FLOOD_BUTTON_PARTICLE_1, particleLocation, particleMolang);
	} catch (error) {
		console.warn(`[Flood Escape] Failed to spawn flood button activation particles: ${error}`);
	}
}

function getRandomFloodButtonSoundId() {
	const soundIndex = Math.floor(Math.random() * FLOOD_BUTTON_SOUND_VARIANT_COUNT) + 1;
	return `flood_button.${soundIndex}`;
}

function playFloodButtonActivationSound(block) {
	try {
		const soundLocation = {
			x: block.location.x + 0.5,
			y: block.location.y + 0.5,
			z: block.location.z + 0.5,
		};

		block.dimension.playSound(FLOOD_BUTTON_PRESS_SOUND_ID, soundLocation);
		block.dimension.playSound(getRandomFloodButtonSoundId(), soundLocation);
	} catch (error) {
		console.warn(`[Flood Escape] Failed to play flood button activation sounds: ${error}`);
	}
}

function getNearbyFloodButtons(player) {
	const playerBounds = getEntityWorldBounds(player);
	const minX = Math.floor(playerBounds.minX) - FLOOD_BUTTON_SEARCH_RADIUS;
	const maxX = Math.floor(playerBounds.maxX) + FLOOD_BUTTON_SEARCH_RADIUS;
	const minY = Math.max(Math.floor(playerBounds.minY) + FLOOD_BUTTON_SEARCH_Y_MIN, FLOOD_BUTTON_WORLD_MIN_Y);
	const maxY = Math.min(Math.floor(playerBounds.maxY) + FLOOD_BUTTON_SEARCH_Y_MAX, FLOOD_BUTTON_WORLD_MAX_Y);
	const minZ = Math.floor(playerBounds.minZ) - FLOOD_BUTTON_SEARCH_RADIUS;
	const maxZ = Math.floor(playerBounds.maxZ) + FLOOD_BUTTON_SEARCH_RADIUS;
	const seenPositions = new Set();
	const buttons = [];

	if (minY > maxY) {
		return buttons;
	}

	for (let x = minX; x <= maxX; x++) {
		for (let y = minY; y <= maxY; y++) {
			for (let z = minZ; z <= maxZ; z++) {
				const key = `${x},${y},${z}`;
				if (seenPositions.has(key)) {
					continue;
				}
				seenPositions.add(key);

				let block;
				try {
					block = player.dimension.getBlock({ x, y, z });
				} catch {
					continue;
				}

				if (!block || block.typeId !== FLOOD_BUTTON_ID) {
					continue;
				}

				buttons.push(block);
			}
		}
	}

	return buttons;
}

export function registerFloodButtonSystems() {
	if (floodButtonSystemsInitialized) {
		return;
	}
	floodButtonSystemsInitialized = true;

	const blockInteractSignal = world.beforeEvents?.playerInteractWithBlock ?? world.afterEvents.playerInteractWithBlock;

	blockInteractSignal.subscribe((event) => {
		try {
			handleFloodButtonConfigurationInteract(event);
		} catch (error) {
			console.warn(`[Flood Escape] Flood button configuration interaction failed: ${error}`);
		}
	});

	system.runInterval(() => {
		try {
			for (const player of world.getPlayers()) {
				try {
					for (const candidateButton of getNearbyFloodButtons(player)) {
						if (!shouldTriggerFloodButton(player, candidateButton)) {
							continue;
						}

						if (setFloodButtonPressedState(candidateButton, true)) {
							playFloodButtonActivationSound(candidateButton);
							spawnFloodButtonActivationParticles(candidateButton);
							break;
						}
					}
				} catch (error) {
					console.warn(`[Flood Escape] Failed flood button step activation for player ${player.name}: ${error}`);
				}
			}
		} catch (error) {
			console.warn(`[Flood Escape] Flood button tick loop error: ${error}`);
		}
	}, FLOOD_BUTTON_STEP_CHECK_INTERVAL_TICKS);
}
