// Checks every room definition when the world loads and prints mistakes to the content log,
// e.g.  [Flood Escape] Room "Ruined Bridge" (easy/r1): buttons[2].onPress[0]: unknown key "laod"

const ACTION_KEYS = [
	"tick", "if", "unless",
	"load", "at", "rotation", "mirror", "anim", "animMode",
	"fill", "from", "to", "mode",
	"setblock", "particle",
	"sound", "everyone", "volume", "pitch", "stopsound",
	"message", "times", "title", "subtitle", "actionbar",
	"command", "function",
	"kill_players", "move_players",
	"summon_laser", "laser", "spin", "visible", "remove_laser", "remove_lasers",
	"set", "add", "play", "stop", "press", "rearm",
	"toast",
];
const DOES_SOMETHING = ACTION_KEYS.filter((k) => !["tick", "if", "unless", "at", "rotation", "mirror", "anim", "animMode", "from", "to", "mode", "everyone", "volume", "pitch", "spin", "visible"].includes(k));

const SHAPES = {
	room: ["room_name", "room_type", "difficulty", "title", "room_map", "on_load", "buttons", "flood", "exit", "entrance", "events", "sequences", "loops", "hazards", "code_lock", "flags", "endless", "enabled", "in_endless"],
	title: ["title", "subtitle", "tick"],
	room_map: ["structure", "at", "spawnFromPrevious", "nextRoomAnchor", "sharedAnchor"],
	button: ["id", "at", "facing", "type", "onPress", "onPressAgain", "repeatable", "randomPositions"],
	flood: ["prefix", "stages", "beginsAt", "startModeDelay", "floodIntervalSec", "anim", "endsAtStage", "message", "toast", "list"],
	exit: ["zone", "leaveZone", "if", "door", "doorPos", "doorRotation", "doorSound", "floodFill", "nextRoomAt"],
	entrance: ["door", "doorPos", "rotation", "barrier", "soundAt"],
	zone: ["at", "size"],
	loop: ["every", "if", "unless", "fromTick", "fromFlood", "untilFlood", "actions"],
	sequence: ["actions", "loop", "channel", "autoplay"],
	hazard: ["block", "damage", "kill"],
	code_lock: ["buttons", "groups", "progress", "progressDone", "onSolved"],
	endless: ["tunnelAt", "start", "facing"],
	move_players: ["zone", "by", "smooth", "tag", "boatYaw"],
};
const FACES = ["up", "down", "north", "south", "east", "west"];
const BUTTON_TYPES = ["parkour", "exit", "mechanical"];
const ROOM_TYPES = ["r1", "r2", "r3", "exit", "finale"];
const DIFFICULTIES = ["easy", "medium", "hard"];

function isVec(v) {
	return Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === "number" && Number.isFinite(n));
}

function checkRoom(def, where) {
	const problems = [];
	const say = (path, text) => problems.push(`${path}: ${text}`);
	const keys = (obj, shape, path) => {
		if (!obj || typeof obj !== "object") return;
		for (const key of Object.keys(obj)) if (!SHAPES[shape].includes(key)) say(path, `unknown key "${key}"`);
	};
	const vec = (v, path) => {
		if (v !== undefined && !isVec(v)) say(path, `should be [x, y, z] numbers, got ${JSON.stringify(v)}`);
	};
	const zone = (z, path) => {
		if (z === undefined || z === "outside") return;
		keys(z, "zone", path);
		vec(z.at, `${path}.at`);
		vec(z.size, `${path}.size`);
	};
	const sequences = def.sequences ?? {};
	const buttonIds = new Set((def.buttons ?? []).map((b, i) => b.id ?? `button${i + 1}`));
	const actions = (list, path, extra = []) => {
		if (list === undefined) return;
		if (!Array.isArray(list)) return say(path, "should be a list [ ... ]");
		list.forEach((a, i) => {
			const p = `${path}[${i}]`;
			if (!a || typeof a !== "object") return say(p, "should be an action { ... }");
			for (const key of Object.keys(a)) if (!ACTION_KEYS.includes(key) && !extra.includes(key)) say(p, `unknown key "${key}"`);
			if (a.tick !== undefined && (!Number.isInteger(a.tick) || a.tick < 0)) say(p, `tick should be a whole number, got ${a.tick}`);
			for (const k of ["at", "from", "to", "summon_laser", "laser", "remove_laser"]) vec(a[k], `${p}.${k}`);
			if (a.fill !== undefined && (!a.from || !a.to)) say(p, "fill needs from and to");
			if (a.setblock !== undefined && !a.at) say(p, "setblock needs at");
			if (a.play !== undefined && !sequences[a.play]) say(p, `play: no sequence named "${a.play}"`);
			if (a.stop !== undefined && !sequences[a.stop]) say(p, `stop: no sequence named "${a.stop}"`);
			for (const k of ["press", "rearm"]) if (a[k] !== undefined && a[k] !== "self" && !buttonIds.has(a[k])) say(p, `${k}: no button with id "${a[k]}"`);
			if (a.move_players) {
				keys(a.move_players, "move_players", `${p}.move_players`);
				zone(a.move_players.zone, `${p}.move_players.zone`);
				vec(a.move_players.by, `${p}.move_players.by`);
			}
			const does = DOES_SOMETHING.some((k) => a[k] !== undefined);
			const isEmptyMarker = Object.keys(a).every((k) => k === "tick");
			if (!does && !isEmptyMarker) say(p, "does nothing (missing load / fill / sound / message / command ...?)");
		});
	};

	keys(def, "room", "room");
	if (!def.room_name) say("room", "missing room_name");
	if (!ROOM_TYPES.includes(def.room_type)) say("room_type", `should be one of ${ROOM_TYPES.join(", ")}`);
	if (!DIFFICULTIES.includes(def.difficulty)) say("difficulty", `should be one of ${DIFFICULTIES.join(", ")}`);
	if (def.title && def.title !== false) keys(def.title, "title", "title");

	keys(def.room_map, "room_map", "room_map");
	vec(def.room_map?.at, "room_map.at");
	vec(def.room_map?.spawnFromPrevious, "room_map.spawnFromPrevious");
	vec(def.room_map?.nextRoomAnchor, "room_map.nextRoomAnchor");

	actions(def.on_load, "on_load");

	(def.buttons ?? []).forEach((b, i) => {
		const p = `buttons[${i}]`;
		keys(b, "button", p);
		if (b.randomPositions) {
			b.randomPositions.forEach((c, j) => {
				vec(c.at, `${p}.randomPositions[${j}].at`);
				if (c.facing && !FACES.includes(c.facing)) say(`${p}.randomPositions[${j}].facing`, `should be one of ${FACES.join(", ")}`);
			});
		} else {
			if (!isVec(b.at)) say(`${p}.at`, "missing or not [x, y, z]");
			if (b.facing && !FACES.includes(b.facing)) say(`${p}.facing`, `should be one of ${FACES.join(", ")}`);
		}
		if (b.type && !BUTTON_TYPES.includes(b.type)) say(`${p}.type`, `should be one of ${BUTTON_TYPES.join(", ")}`);
		actions(b.onPress, `${p}.onPress`);
		actions(b.onPressAgain, `${p}.onPressAgain`);
	});

	if (def.flood) {
		keys(def.flood, "flood", "flood");
		vec(def.flood.beginsAt, "flood.beginsAt");
		if (def.flood.prefix && !isVec(def.flood.beginsAt)) say("flood", "prefix needs beginsAt");
		actions(def.flood.list, "flood.list", ["stage"]);
	}

	if (def.exit) {
		keys(def.exit, "exit", "exit");
		zone(def.exit.zone, "exit.zone");
		zone(def.exit.leaveZone, "exit.leaveZone");
		vec(def.exit.doorPos, "exit.doorPos");
		vec(def.exit.doorSound, "exit.doorSound");
	}
	if (def.entrance) {
		keys(def.entrance, "entrance", "entrance");
		vec(def.entrance.doorPos, "entrance.doorPos");
		vec(def.entrance.barrier, "entrance.barrier");
		vec(def.entrance.soundAt, "entrance.soundAt");
	}

	actions(def.events, "events", ["on", "stage"]);
	(def.events ?? []).forEach((e, i) => {
		if (e.on && !["start", "flood", "end"].includes(e.on)) say(`events[${i}].on`, `should be "start", "flood" or "end"`);
		if (e.on === "flood" && !Number.isInteger(e.stage)) say(`events[${i}]`, "flood events need a stage");
	});

	for (const [name, seq] of Object.entries(sequences)) {
		if (Array.isArray(seq)) actions(seq, `sequences.${name}`);
		else {
			keys(seq, "sequence", `sequences.${name}`);
			actions(seq.actions, `sequences.${name}.actions`);
		}
	}
	(def.loops ?? []).forEach((loop, i) => {
		keys(loop, "loop", `loops[${i}]`);
		actions(loop.actions, `loops[${i}].actions`);
	});
	(def.hazards ?? []).forEach((h, i) => keys(h, "hazard", `hazards[${i}]`));
	if (def.code_lock) {
		keys(def.code_lock, "code_lock", "code_lock");
		(def.code_lock.buttons ?? []).forEach((b, i) => vec(b, `code_lock.buttons[${i}]`));
		actions(def.code_lock.onSolved, "code_lock.onSolved");
	}
	if (def.endless) {
		keys(def.endless, "endless", "endless");
		vec(def.endless.tunnelAt, "endless.tunnelAt");
		vec(def.endless.start, "endless.start");
		vec(def.endless.facing, "endless.facing");
	}

	for (const problem of problems) console.warn(`[Flood Escape] Room "${def.room_name ?? "?"}" (${where}): ${problem}`);
	return problems.length;
}

export function validateRooms(rooms) {
	let total = 0;
	for (const [difficulty, types] of Object.entries(rooms)) {
		for (const [type, list] of Object.entries(types)) {
			list.forEach((def, i) => {
				if (!def) {
					console.warn(`[Flood Escape] ${difficulty}/${type} #${i + 1}: room file did not export a room (missing "export default"?)`);
					total++;
					return;
				}
				if (def.difficulty !== difficulty || def.room_type !== type) {
					console.warn(`[Flood Escape] Room "${def.room_name}" is listed under ${difficulty}/${type} in room_list.js but says difficulty "${def.difficulty}", room_type "${def.room_type}".`);
					total++;
				}
				total += checkRoom(def, `${difficulty}/${type}`);
			});
		}
	}
	return total;
}
