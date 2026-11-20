// Room system entry point.
//
// mcfunctions control it with script events:
//   /scriptevent brr:rooms start easy      (decider: pick + load the rooms; room 1 begins when "started easy" = 1)
//   /scriptevent brr:rooms start endless   (endless lowering: begin the first Endless room)
//   /scriptevent brr:rooms stop easy       (reset functions)
//   /scriptevent brr:rooms test hard r3 tesla_power   (test one room where you stand; end it with "stop test")

import { system, world } from "@minecraft/server";
import { EndlessSession, GameSession, TestSession, clearLeftoverTestRooms } from "./engine/session.js";
import { getScore } from "./engine/util.js";

const NORMAL_MODES = ["easy", "medium", "hard"];
const WATCHDOG_INTERVAL = 40;

/** @type {Map<string, GameSession | EndlessSession>} */
const sessions = new Map();
let registered = false;

function startMode(mode) {
	const session = mode === "endless" ? new EndlessSession() : new GameSession(mode);
	sessions.set(mode, session);
	session.start();
}

function stopMode(mode) {
	sessions.delete(mode);
	// A reset of this difficulty also ends a test room of that difficulty.
	const test = sessions.get("test");
	if (test && test.mode === mode) stopTest("stopped");
}

function stopTest(reason) {
	const test = sessions.get("test");
	sessions.delete("test");
	if (test && test.state !== "finished") test.finish(reason);
	else if (clearLeftoverTestRooms()) world.sendMessage("§7[Flood Escape] Leftover test room cleared.");
}

// If the world or scripts reload mid-round, the room state is gone. Reset that mode instead of leaving players stuck.
function watchdog() {
	for (const mode of [...NORMAL_MODES, "endless"]) {
		if (sessions.has(mode)) continue;
		const running = mode === "endless"
			? getScore("endless", "started") === 1 && getScore("endless", "start") === 2
			: getScore(mode, "started") === 1;
		if (!running) continue;
		try {
			world.getDimension("overworld").runCommand(`function game_functions/mode_${mode}/reset`);
			world.sendMessage(`§7[Flood Escape] ${mode} mode was reset because the room scripts restarted.`);
		} catch (error) {
			console.warn(`[Flood Escape] Watchdog could not reset ${mode}: ${error}`);
		}
	}
}

export function registerRoomSystems() {
	if (registered) return;
	registered = true;

	system.afterEvents.scriptEventReceive.subscribe((event) => {
		if (event.id !== "brr:rooms") return;
		const [action, mode, ...rest] = event.message.trim().split(/\s+/);
		if (action === "test") {
			const player = event.sourceEntity?.typeId === "minecraft:player" ? event.sourceEntity : undefined;
			if (!player) return console.warn("[Flood Escape] brr:rooms test must be run by a player.");
			stopTest("replaced by a new test");
			const session = new TestSession(player, mode, rest[0], rest.slice(1).join("_"));
			sessions.set("test", session);
			session.start();
			return;
		}
		if (action === "stop" && mode === "test") return void stopTest("stopped");
		if (![...NORMAL_MODES, "endless"].includes(mode)) {
			console.warn(`[Flood Escape] brr:rooms: unknown mode "${mode}"`);
			return;
		}
		try {
			if (action === "start") startMode(mode);
			else if (action === "stop") stopMode(mode);
			else console.warn(`[Flood Escape] brr:rooms: unknown action "${action}"`);
		} catch (error) {
			console.warn(`[Flood Escape] brr:rooms ${action} ${mode} failed: ${error}`);
		}
	});

	system.runInterval(() => {
		for (const [mode, session] of sessions) {
			if (mode === "test" && session.state === "finished") {
				sessions.delete(mode);
				continue;
			}
			try {
				session.tick();
			} catch (error) {
				console.warn(`[Flood Escape] ${mode} room tick failed: ${error}\n${error?.stack ?? ""}`);
			}
		}
		if (system.currentTick % WATCHDOG_INTERVAL === 0) watchdog();
	}, 1);
}
