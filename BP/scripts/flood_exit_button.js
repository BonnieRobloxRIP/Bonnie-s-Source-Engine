import { system, world } from "@minecraft/server";

const FLOOD_EXIT_BUTTON_ID = "brr:flood_exit_button";
const FLOOD_EXIT_BUTTON_PRESSED_STATE = "brr:pressed";
const FLOOD_EXIT_BUTTON_EXIT_SOUND_VARIANT_COUNT = 9;
const FLOOD_EXIT_BUTTON_SHARED_SOUND_VARIANT_COUNT = 9;

let floodExitButtonSystemsInitialized = false;

function isFloodExitButtonPressed(block) {
	try {
		return block.permutation.getState(FLOOD_EXIT_BUTTON_PRESSED_STATE) === true;
	} catch {
		return false;
	}
}

function setFloodExitButtonPressedState(block, pressed) {
	if (block.typeId !== FLOOD_EXIT_BUTTON_ID) {
		return false;
	}

	try {
		block.setPermutation(block.permutation.withState(FLOOD_EXIT_BUTTON_PRESSED_STATE, pressed));
		return true;
	} catch (error) {
		console.warn(`[Flood Escape] Failed to set flood exit button state: ${error}`);
		return false;
	}
}

function getRandomFloodExitButtonExitSoundId() {
	const soundIndex = Math.floor(Math.random() * FLOOD_EXIT_BUTTON_EXIT_SOUND_VARIANT_COUNT) + 1;
	return `flood_button.${soundIndex}`;
}

function getRandomFloodExitButtonSharedSoundId() {
	const soundIndex = Math.floor(Math.random() * FLOOD_EXIT_BUTTON_SHARED_SOUND_VARIANT_COUNT) + 1;
	return `flood_button.${soundIndex}`;
}

function playFloodExitButtonActivationSounds(block) {
	try {
		const soundLocation = {
			x: block.location.x + 0.5,
			y: block.location.y + 0.5,
			z: block.location.z + 0.5,
		};

		block.dimension.playSound(getRandomFloodExitButtonExitSoundId(), soundLocation);
		block.dimension.playSound(getRandomFloodExitButtonSharedSoundId(), soundLocation);
	} catch (error) {
		console.warn(`[Flood Escape] Failed to play flood exit button activation sounds: ${error}`);
	}
}

function handleFloodExitButtonInteract(event) {
	const isFirstEvent = event.isFirstEvent;
	if (isFirstEvent === false) {
		return;
	}

	const block = event.block;
	if (!block || block.typeId !== FLOOD_EXIT_BUTTON_ID) {
		return;
	}

	if ("cancel" in event) {
		event.cancel = true;
	}

	const targetDimension = block.dimension;
	const targetLocation = {
		x: block.location.x,
		y: block.location.y,
		z: block.location.z,
	};

	system.run(() => {
		try {
			const latestBlock = targetDimension.getBlock(targetLocation);
			if (!latestBlock || latestBlock.typeId !== FLOOD_EXIT_BUTTON_ID) {
				return;
			}

			const nextPressedState = !isFloodExitButtonPressed(latestBlock);
			if (!setFloodExitButtonPressedState(latestBlock, nextPressedState)) {
				return;
			}

			playFloodExitButtonActivationSounds(latestBlock);
		} catch (error) {
			console.warn(`[Flood Escape] Flood exit button interaction toggle failed: ${error}`);
		}
	});
}

function handleFloodExitButtonPlaced(event) {
	const block = event.block;
	if (!block || block.typeId !== FLOOD_EXIT_BUTTON_ID) {
		return;
	}

	system.run(() => {
		setFloodExitButtonPressedState(block, false);
	});
}

export function registerFloodExitButtonSystems() {
	if (floodExitButtonSystemsInitialized) {
		return;
	}
	floodExitButtonSystemsInitialized = true;

	const blockInteractSignal = world.beforeEvents?.playerInteractWithBlock ?? world.afterEvents.playerInteractWithBlock;

	blockInteractSignal.subscribe((event) => {
		try {
			handleFloodExitButtonInteract(event);
		} catch (error) {
			console.warn(`[Flood Escape] Flood exit button interaction failed: ${error}`);
		}
	});

	world.afterEvents.playerPlaceBlock.subscribe((event) => {
		try {
			handleFloodExitButtonPlaced(event);
		} catch (error) {
			console.warn(`[Flood Escape] Flood exit button placement handling failed: ${error}`);
		}
	});
}
