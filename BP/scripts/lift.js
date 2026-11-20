// Moving lift support for brr:mainelevator.
//
// The elevator entity is only the visual (the lowering functions still move it with /tp).
// This script makes it something players can stand on:
//   1. A layer of invisible brr:lift_floor blocks follows the platform under its 5x5 footprint.
//      Its collision height (1/16 steps) matches the platform top, so standing on it is exact.
//      Block collision is predicted by the game client, so there is no rubber-banding, players can
//      walk around freely and step off the edge whenever they want.
//   2. Nothing is ever applied to the players themselves (no effects, no teleports), so they keep
//      full control of movement and camera.
//   3. The lift cables (lobby/elevators:lift_falls) are loaded above the platform every tick.
//   4. When the lift's doors are open (/event entity ... brr:open) there is no floor: players fall through.

import { system, world } from "@minecraft/server";

const LIFT_ENTITY = "brr:mainelevator";
const FLOOR_BLOCK = "brr:lift_floor";
const CABLES_STRUCTURE = "lobby/elevators:lift_falls";

const PLATFORM_HEIGHT = 1; // the entity's collision_box height: its top surface is y + 1
const FOOTPRINT = 5; // 5x5 blocks, centred on the entity

/** Per lift entity id: { floorY, height, minX, minZ } */
const lifts = new Map();

function overworld() {
	return world.getDimension("overworld");
}

function run(command) {
	try {
		overworld().runCommand(command);
	} catch {
		// unloaded area / nothing to replace
	}
}

function clearFloor(state) {
	if (state.floorY === undefined) return;
	const max = FOOTPRINT - 1;
	run(`fill ${state.minX} ${state.floorY} ${state.minZ} ${state.minX + max} ${state.floorY} ${state.minZ + max} air replace ${FLOOR_BLOCK}`);
	state.floorY = undefined;
	state.height = undefined;
}

function placeFloor(state, top) {
	// The floor block is the block containing the platform top, with a matching collision height.
	let floorY = Math.floor(top);
	let height = Math.round((top - floorY) * 16);
	if (height === 0) {
		floorY -= 1;
		height = 16;
	}
	if (floorY === state.floorY && height === state.height) return;
	if (floorY !== state.floorY) clearFloor(state);
	const max = FOOTPRINT - 1;
	run(`fill ${state.minX} ${floorY} ${state.minZ} ${state.minX + max} ${floorY} ${state.minZ + max} ${FLOOR_BLOCK}["brr:height"=${height}] replace air`);
	run(`fill ${state.minX} ${floorY} ${state.minZ} ${state.minX + max} ${floorY} ${state.minZ + max} ${FLOOR_BLOCK}["brr:height"=${height}] replace ${FLOOR_BLOCK}`);
	state.floorY = floorY;
	state.height = height;
}

// "closed" | "open" | "closing", set by /event entity @e[type=brr:mainelevator] brr:open / brr:close
function doorState(entity) {
	try {
		return entity.getProperty("brr:doors") ?? "closed";
	} catch {
		return "closed";
	}
}

function tickLift(entity) {
	const location = entity.location;
	const top = location.y + PLATFORM_HEIGHT;
	const minX = Math.round(location.x - FOOTPRINT / 2);
	const minZ = Math.round(location.z - FOOTPRINT / 2);

	let state = lifts.get(entity.id);
	if (!state) {
		state = { minX, minZ };
		lifts.set(entity.id, state);
	}
	if (state.minX !== minX || state.minZ !== minZ) {
		clearFloor(state);
		state.minX = minX;
		state.minZ = minZ;
	}
	const doors = doorState(entity);
	// Closing happens at the surface just before the block lift is loaded back: leave the cables
	// alone so they can't overwrite the restored structure.
	if (doors === "closing") {
		clearFloor(state);
		return;
	}

	// Cables above the platform (air row just above the floor, chains above that)
	try {
		entity.runCommand(`structure load "${CABLES_STRUCTURE}" ~-2 ~${PLATFORM_HEIGHT + 1} ~-2`);
	} catch {
		// missing structure
	}
	// Doors open (or closing): the floor panels have swung away, so there is nothing to stand on.
	// Players drop straight through (into room 1 at the bottom of the shaft).
	if (doors !== "closed") {
		clearFloor(state);
		return;
	}

	placeFloor(state, top);
}

export function registerLiftSystems() {
	system.runInterval(() => {
		const dimension = overworld();
		const seen = new Set();

		for (const entity of dimension.getEntities({ type: LIFT_ENTITY })) {
			seen.add(entity.id);
			try {
				tickLift(entity);
			} catch (error) {
				console.warn(`[Flood Escape] Lift tick failed: ${error}`);
			}
		}

		// Lifts that were removed (killed at the end of the lowering): take their floor away.
		for (const [id, state] of lifts) {
			if (seen.has(id)) continue;
			clearFloor(state);
			lifts.delete(id);
		}
	}, 1);
}
