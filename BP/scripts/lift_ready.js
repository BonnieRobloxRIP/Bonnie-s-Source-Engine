// Ready-up for the mode lifts. While a lift is waiting to launch (start <mode> = 0), everyone standing in it holds
// the Ready item (brr:fe_ready, locked in the inventory). Using it toggles that player's ready state; once at least
// READY_SHARE (60%, rounded up) of the players in the lift are ready, the lift launches at once, exactly as if the
// 10 s timer had run out (scoreboard players set start <mode> 1, which game_controller.mcfunction then runs with).
// The share keeps one player from holding everyone back by never readying: 10 riders need 6, 3 need 2, 1-2 need all.
// It's re-checked as players step on and off, so someone leaving can tip the lift over the line.
//
// Who is "in the lift" comes from game_controller.mcfunction: the <mode>lift tag, which it only gives non-spectators
// inside the lift and removes when they step out. The item disappears when a player leaves the lift or it launches.
// The number of ready players and how many are needed are kept in the fake players "ready" and "ready_need" on the
// mode's objective, shown on the lift's countdown actionbar (lobby_functions/misc/actionbar.mcfunction).

import { system, world } from "@minecraft/server";

const READY_ITEM_ID = "brr:fe_ready";
const READY_SHARE = 0.6;
const CHECK_TICKS = 4;

/** Ready players needed to launch a lift holding `riders` players. */
export const readyNeeded = (riders) => Math.max(1, Math.ceil(riders * READY_SHARE - 1e-9));

/** Every lift with a start timer: its scoreboard objective, the waiting-in-lift tag and its colour. */
const LIFTS = [
	{ mode: "easy", tag: "easylift", colour: "§a", name: "Easy" },
	{ mode: "medium", tag: "mediumlift", colour: "§e", name: "Medium" },
	{ mode: "hard", tag: "hardlift", colour: "§4", name: "Hard" },
	{ mode: "extremechallenge1", tag: "extremechallenge1lift", colour: "§5", name: "Extreme" },
	{ mode: "endless", tag: "endlesslift", colour: "§9", name: "Endless" },
];

/** mode -> ids of the players in that lift who are ready */
const ready = new Map(LIFTS.map((lift) => [lift.mode, new Set()]));
let registered = false;

function score(objectiveId, participant) {
	try {
		return world.scoreboard.getObjective(objectiveId)?.getScore(participant);
	} catch {
		return undefined;
	}
}

function setScore(objectiveId, participant, value) {
	try {
		world.scoreboard.getObjective(objectiveId)?.setScore(participant, value);
	} catch {
		// objective missing (world not set up yet)
	}
}

/** The lift this player is waiting in (tagged and not launched yet), or undefined. */
function waitingLift(player) {
	return LIFTS.find((lift) => player.hasTag(lift.tag) && score(lift.mode, "start") === 0);
}

function hasReadyItem(player) {
	const container = player.getComponent("minecraft:inventory")?.container;
	if (!container) return false;
	for (let slot = 0; slot < container.size; slot++) {
		if (container.getItem(slot)?.typeId === READY_ITEM_ID) return true;
	}
	return false;
}

function playersIn(lift) {
	return world.getAllPlayers().filter((player) => player.hasTag(lift.tag));
}

function launch(lift) {
	ready.get(lift.mode).clear();
	setScore(lift.mode, "ready", 0);
	setScore(lift.mode, "ready_need", 0);
	try {
		world.getDimension("overworld").runCommand(`scoreboard players set start ${lift.mode} 1`);
	} catch (error) {
		console.warn(`[Flood Escape] Could not launch the ${lift.mode} lift: ${error}`);
	}
}

function toggleReady(player) {
	const lift = waitingLift(player);
	if (!lift) return;
	const set = ready.get(lift.mode);
	const riders = playersIn(lift);
	if (set.has(player.id)) {
		set.delete(player.id);
		player.runCommand("playsound note.bass @s ~ ~ ~ 1 0.8");
	} else {
		set.add(player.id);
		player.runCommand("playsound random.orb @s ~ ~ ~ 1 1.4");
	}
	checkLaunch(lift, riders);
}

/** Updates the lift's ready counts and launches it once enough of its riders are ready. */
function checkLaunch(lift, riders) {
	const set = ready.get(lift.mode);
	const count = riders.filter((rider) => set.has(rider.id)).length;
	const needed = readyNeeded(riders.length);
	setScore(lift.mode, "ready", count);
	setScore(lift.mode, "ready_need", needed);
	if (riders.length > 0 && count >= needed) launch(lift);
}

function update() {
	const riders = new Map(LIFTS.map((lift) => [lift.mode, []]));
	for (const player of world.getAllPlayers()) {
		try {
			const lift = waitingLift(player);
			if (lift) {
				riders.get(lift.mode).push(player);
				if (!hasReadyItem(player)) {
					player.runCommand(`give @s ${READY_ITEM_ID} 1 0 {"minecraft:item_lock":{"mode":"lock_in_inventory"}}`);
				}
			} else if (hasReadyItem(player)) {
				player.runCommand(`clear @s ${READY_ITEM_ID}`);
			}
		} catch {
			// player not ready yet (still joining)
		}
	}
	// Forget players who left a lift; someone leaving can bring the rest over the line, so check each waiting lift.
	for (const lift of LIFTS) {
		const list = riders.get(lift.mode);
		const ids = new Set(list.map((player) => player.id));
		const set = ready.get(lift.mode);
		for (const id of set) if (!ids.has(id)) set.delete(id);
		if (list.length > 0 && set.size > 0) checkLaunch(lift, list);
		else {
			setScore(lift.mode, "ready", set.size);
			setScore(lift.mode, "ready_need", readyNeeded(list.length));
		}
	}
}

export function registerLiftReadySystems() {
	if (registered) return;
	registered = true;

	world.afterEvents.itemUse.subscribe((event) => {
		const player = event.source;
		if (player?.typeId !== "minecraft:player" || event.itemStack?.typeId !== READY_ITEM_ID) return;
		try {
			toggleReady(player);
		} catch (error) {
			console.warn(`[Flood Escape] Ready item failed: ${error}`);
		}
	});

	system.runInterval(update, CHECK_TICKS);
}
