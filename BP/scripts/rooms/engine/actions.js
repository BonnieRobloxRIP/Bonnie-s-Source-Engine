// Runs room actions. Every action is a small object, for example:
//   { load: "easy/room1/1_ruined_bridge:EMR1V1M1", at: [-2, 2, -5], anim: 1 }
// Positions are offsets from the room entity, exactly like ~x ~y ~z in an mcfunction.
// See docs/ROOMS.md for the full list.

import { rel } from "./util.js";
import { setSubtitle, setTitleTimes, showTitle, showToast } from "../../hud.js";
import { TOASTS } from "../room_types.js";

const ROTATIONS = { 0: "0_degrees", 90: "90_degrees", 180: "180_degrees", 270: "270_degrees" };

function structureLoad(action) {
	let cmd = `structure load "${action.load}" ${rel(action.at ?? [0, 0, 0])} ${ROTATIONS[action.rotation ?? 0]} ${action.mirror ?? "none"}`;
	if (action.anim) {
		cmd += ` ${action.animMode === "layers" ? "layer_by_layer" : "block_by_block"} ${action.anim}`;
	}
	return cmd;
}

function playsound(room, action) {
	const target = action.everyone ? "@a" : room.playerSelector;
	let cmd = `playsound ${action.sound} ${target}`;
	if (action.at || action.volume !== undefined || action.pitch !== undefined) {
		cmd += ` ${rel(action.at ?? [0, 0, 0])}`;
		if (action.volume !== undefined || action.pitch !== undefined) cmd += ` ${action.volume ?? 1}`;
		if (action.pitch !== undefined) cmd += ` ${action.pitch}`;
	}
	return cmd;
}

function rawtext(text) {
	return JSON.stringify({ rawtext: [{ text }] });
}

// Checks `if` / `unless` against the room's flags.
export function conditionsPass(room, action) {
	if (action.if) {
		for (const [flag, value] of Object.entries(action.if)) if (room.getFlag(flag) !== value) return false;
	}
	if (action.unless) {
		for (const [flag, value] of Object.entries(action.unless)) if (room.getFlag(flag) === value) return false;
	}
	return true;
}

export function runAction(room, action) {
	if (!conditionsPass(room, action)) return;
	const players = room.playerSelector;

	if (action.load !== undefined) {
		room.run(structureLoad(action));
		room.session.noteStructure?.(action);
	}
	if (action.fill !== undefined) {
		room.run(`fill ${rel(action.from)} ${rel(action.to)} ${action.fill}${action.mode ? ` ${action.mode}` : ""}`);
		room.session.noteBox?.(action.from, action.to);
	}
	if (action.setblock !== undefined) room.run(`setblock ${rel(action.at)} ${action.setblock}${action.mode ? ` ${action.mode}` : ""}`);
	if (action.particle !== undefined) room.run(`particle ${action.particle} ${rel(action.at ?? [0, 0, 0])}`);
	if (action.sound !== undefined) room.run(playsound(room, action));
	if (action.stopsound !== undefined) room.run(`stopsound ${players} ${action.stopsound}`);
	if (action.message !== undefined) room.run(`tellraw ${action.everyone ? "@a" : players} ${rawtext(room.text(action.message))}`);
	// Titles and toasts are drawn by the custom HUD (hud.js), not /title.
	if (action.times !== undefined) for (const p of room.players()) setTitleTimes(p, ...action.times);
	if (action.title !== undefined) {
		const subtitle = action.subtitle !== undefined ? room.text(action.subtitle) : undefined;
		for (const p of room.players()) showTitle(p, room.text(action.title), subtitle);
	} else if (action.subtitle !== undefined) {
		for (const p of room.players()) setSubtitle(p, room.text(action.subtitle));
	}
	if (action.toast !== undefined) {
		const toast = typeof action.toast === "string" ? TOASTS[action.toast] : action.toast;
		if (toast) {
			for (const p of room.players()) showToast(p, toast.icon ?? "info", room.text(toast.heading ?? ""), room.text(toast.subline ?? ""));
			if (toast.sound) room.run(`playsound ${toast.sound} ${players}`);
		}
	}
	if (action.actionbar !== undefined) room.run(`title ${players} actionbar ${room.text(action.actionbar)}`);
	if (action.command !== undefined) {
		for (const cmd of [].concat(action.command)) room.run(room.text(cmd));
	}
	if (action.function !== undefined) room.run(`function ${action.function}`);
	if (action.kill_players) room.run(`kill ${players}`);
	if (action.move_players !== undefined) room.movePlayers(action.move_players);

	// Lasers (brr:flood_room entities named "laser", see laser_system.js)
	if (action.summon_laser !== undefined) {
		const p = rel(action.summon_laser);
		room.run(`setblock ${p} air`);
		room.run(`summon brr:flood_room ${p} ~ ~ * laser`);
		room.run(`execute positioned ${p} run tag @e[type=brr:flood_room, name=laser, r=1] add ${room.tag}`);
	}
	if (action.laser !== undefined) {
		const p = rel(action.laser);
		const lasers = `@e[type=brr:flood_room, name=laser, tag=${room.tag}, r=1]`;
		if (action.spin !== undefined) room.run(`execute positioned ${p} run scoreboard players set ${lasers} laser_spin_speed ${action.spin}`);
		if (action.visible !== undefined) room.run(`execute positioned ${p} run scoreboard players set ${lasers} laser_visibility ${action.visible ? 1 : 0}`);
	}
	if (action.remove_laser !== undefined) room.run(`execute positioned ${rel(action.remove_laser)} run kill @e[type=brr:flood_room, name=laser, r=2]`);
	if (action.remove_lasers) room.run(`kill @e[type=brr:flood_room, name=laser, tag=${room.tag}]`);

	// Room logic
	if (action.set !== undefined) for (const [flag, value] of Object.entries(action.set)) room.setFlag(flag, value);
	if (action.add !== undefined) for (const [flag, value] of Object.entries(action.add)) room.setFlag(flag, (room.getFlag(flag) ?? 0) + value);
	if (action.play !== undefined) room.playSequence(action.play);
	if (action.stop !== undefined) room.stopSequence(action.stop);
	if (action.press !== undefined) room.pressButton(action.press);
	if (action.rearm !== undefined) room.rearmButton(action.rearm);
}

export function runActions(room, actions) {
	for (const action of actions) runAction(room, action);
}

// Groups a list of actions by their `tick` (default 1) -> Map<tick, actions[]>
export function scheduleByTick(actions = [], offset = 0) {
	const map = new Map();
	for (const action of actions) {
		const tick = (action.tick ?? 1) + offset;
		if (!map.has(tick)) map.set(tick, []);
		map.get(tick).push(action);
	}
	return map;
}

export function lastTick(schedule) {
	let max = 0;
	for (const tick of schedule.keys()) max = Math.max(max, tick);
	return max;
}
