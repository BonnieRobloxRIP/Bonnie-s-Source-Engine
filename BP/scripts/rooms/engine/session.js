// A session runs one game mode: it picks the rooms, summons their brr:flood_room entities and plays them in order.

import { world } from "@minecraft/server";
import { DIFFICULTIES, ENDLESS, ROOM_TYPES } from "../room_types.js";
import { ROOMS } from "../room_list.js";
import { Room } from "./room.js";
import { runAction } from "./actions.js";
import { getScore, isValid, pickRandom, rel, setScore, sumOffsets, warnOnce } from "./util.js";

const ROOM_ENTITY = "brr:flood_room";

function overworld() {
	return world.getDimension("overworld");
}

function roomsFor(difficulty, type, { endless = false } = {}) {
	return (ROOMS[difficulty]?.[type] ?? []).filter((def) => def.enabled !== false && (!endless || def.in_endless !== false));
}

function findEntity(name) {
	return overworld().getEntities({ type: ROOM_ENTITY, name })[0];
}

function killEntities(name) {
	for (const entity of overworld().getEntities({ type: ROOM_ENTITY, name })) {
		try {
			entity.remove();
		} catch {
			// already gone
		}
	}
}

// Summons a room entity from a command source (the world for room 1, the previous room entity after that),
// using the same summon command the old deciders used.
function summonRoomEntity(source, position, name) {
	killEntities(name);
	try {
		source.runCommand(`summon ${ROOM_ENTITY} ${position} 0 0 * ${name}`);
		source.runCommand(`effect @e[type=${ROOM_ENTITY}, name=${name}] water_breathing infinite 255 true`);
	} catch (error) {
		warnOnce(`summon:${name}`, `Could not summon room entity ${name}: ${error}`);
	}
	return findEntity(name);
}

function entityName(mode, type) {
	if (type === "exit" || type === "finale") return `${mode}_exit`;
	return `${mode}_room${ROOM_TYPES[mode][type].number}`;
}

export class GameSession {
	constructor(mode) {
		this.mode = mode;
		this.isEndless = false;
		this.rooms = [];
		this.current = -1;
		this.state = "waiting"; // waiting -> playing -> finished
	}

	start() {
		const difficulty = DIFFICULTIES[this.mode];
		let previous = null;
		let previousEntity = null;
		difficulty.sequence.forEach((type, index) => {
			const pool = roomsFor(this.mode, type);
			if (!pool.length) return;
			const def = pickRandom(pool);
			const map = def.room_map ?? {};

			let entity;
			if (map.sharedAnchor && previousEntity) {
				entity = previousEntity;
			} else if (!previousEntity) {
				entity = summonRoomEntity(overworld(), difficulty.firstRoomSpawn.join(" "), entityName(this.mode, type));
			} else {
				const offset = sumOffsets(previous.room_map?.nextRoomAnchor, map.spawnFromPrevious);
				entity = summonRoomEntity(previousEntity, rel(offset), entityName(this.mode, type));
			}
			if (!isValid(entity)) {
				warnOnce(`entity:${this.mode}:${type}`, `${this.mode} ${type}: room entity missing, the room was skipped.`);
				return;
			}

			const room = new Room({ session: this, def, anchor: entity });
			room.load();
			this.rooms.push(room);
			if (index < 3) setScore(this.mode, `room${index + 1}`, pool.indexOf(def) + 1);
			previous = def;
			previousEntity = entity;
		});
	}

	tick() {
		if (this.state === "waiting") {
			if (getScore(this.mode, "started") !== 1 || !this.rooms.length) return;
			this.current = 0;
			this.rooms[0].start();
			this.state = "playing";
		}
		if (this.state !== "playing") return;

		const room = this.rooms[this.current];
		room.tick(overworld().getPlayers({ tags: [this.mode] }));
		if (room.state !== "done") return;

		this.current++;
		if (this.current < this.rooms.length) this.rooms[this.current].start();
		else this.state = "finished";
	}
}

export class EndlessSession {
	constructor() {
		this.mode = "endless";
		this.isEndless = true;
		this.roomCount = 0;
		this.room = null;
		this.state = "playing";
	}

	start() {
		this.anchor = findEntity(ENDLESS.anchorName) ?? summonRoomEntity(overworld(), ENDLESS.anchorSpawn.join(" "), ENDLESS.anchorName);
		this.nextRoom();
	}

	pickRoom() {
		const choices = [];
		for (const difficulty of Object.keys(DIFFICULTIES)) {
			const types = ["r1", "r2", "r3"].filter((type) => roomsFor(difficulty, type, { endless: true }).length);
			if (types.length) choices.push({ difficulty, types });
		}
		if (!choices.length) return null;
		const { difficulty, types } = pickRandom(choices);
		return pickRandom(roomsFor(difficulty, pickRandom(types), { endless: true }));
	}

	nextRoom() {
		if (!isValid(this.anchor)) {
			this.anchor = findEntity(ENDLESS.anchorName);
			if (!isValid(this.anchor)) {
				warnOnce("endless:anchor", "Endless room entity is missing.");
				this.state = "finished";
				return;
			}
		}
		const def = this.pickRoom();
		if (!def) {
			this.state = "finished";
			return;
		}
		this.roomCount++;
		setScore("endless", "room_count", this.roomCount);
		this.room = new Room({ session: this, def, anchor: this.anchor });
		this.room.load();
		this.room.start();
	}

	tick() {
		if (this.state !== "playing" || !this.room) return;
		this.room.tick(overworld().getPlayers({ tags: ["endless"] }));
		if (this.room.state === "done") this.nextRoom();
	}
}

// Test one room right where you stand: /scriptevent brr:rooms test <difficulty> <room type> <room name>
// e.g. /scriptevent brr:rooms test hard r3 tesla_power   (room name = room_name in lowercase, spaces as _)
// The test ends (and everything it placed is removed) when everyone reaches the exit, everyone dies,
// or you run /scriptevent brr:rooms stop test.
const TEST_ENTITY = "test_room";
const TEST_AREA_PROPERTY = "brr:test_area";
const TEST_END_DELAY = 40; // ticks to wait after the room ends / everyone died before cleaning up
const LOBBY_SPAWN = "0 86 -16";
const MAX_FILL = 32768;
// Area cleared around a leftover test room entity that has no saved area (made before cleanup existed).
const FALLBACK_AREA = { min: [-20, -5, -20], max: [20, 40, 20] };

const structureSizes = new Map();
function structureSize(name) {
	if (!structureSizes.has(name)) {
		let size = null;
		try {
			size = world.structureManager.get(name)?.size ?? null;
		} catch {
			// unknown structure
		}
		structureSizes.set(name, size);
	}
	return structureSizes.get(name);
}

// Replaces everything in an absolute box with air, in slices small enough for /fill.
function clearBox(min, max) {
	const dim = overworld();
	const layer = (max[0] - min[0] + 1) * (max[2] - min[2] + 1);
	const step = Math.max(1, Math.floor(MAX_FILL / layer));
	for (let y = min[1]; y <= max[1]; y += step) {
		const top = Math.min(max[1], y + step - 1);
		try {
			dim.runCommand(`fill ${min[0]} ${y} ${min[2]} ${max[0]} ${top} ${max[2]} air`);
		} catch (error) {
			warnOnce(`clear:${y}`, `Could not clear test room area: ${error}`);
		}
	}
	const [dx, dy, dz] = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
	try {
		dim.runCommand(`kill @e[type=brr:flood_room, name=laser, x=${min[0]}, y=${min[1]}, z=${min[2]}, dx=${dx}, dy=${dy}, dz=${dz}]`);
	} catch {
		// no lasers
	}
}

function clearTestEntity(entity) {
	let area = null;
	try {
		const saved = entity.getDynamicProperty(TEST_AREA_PROPERTY);
		if (typeof saved === "string") area = JSON.parse(saved);
	} catch {
		// nothing saved
	}
	if (!area) {
		const o = entity.location;
		const base = [Math.floor(o.x), Math.floor(o.y), Math.floor(o.z)];
		area = { min: base.map((v, i) => v + FALLBACK_AREA.min[i]), max: base.map((v, i) => v + FALLBACK_AREA.max[i]) };
	}
	clearBox(area.min, area.max);
	try {
		entity.remove();
	} catch {
		// already gone
	}
}

// Clears test rooms left behind with no running test (e.g. after a /reload). Returns how many were found.
export function clearLeftoverTestRooms() {
	const leftovers = overworld().getEntities({ type: ROOM_ENTITY, name: TEST_ENTITY });
	for (const entity of leftovers) clearTestEntity(entity);
	return leftovers.length;
}

export class TestSession {
	constructor(player, difficulty, type, slug) {
		this.mode = difficulty;
		this.isEndless = false;
		this.player = player;
		this.type = type;
		this.def = (ROOMS[difficulty]?.[type] ?? []).find((d) => roomSlug(d) === slug);
		this.state = "playing";
		this.area = null; // { min, max } offsets from the anchor
		this.idleTicks = 0;
	}

	start() {
		if (!this.def) {
			this.player?.sendMessage(`§c[Flood Escape] No ${this.mode} ${this.type} room called that. Use the room name in lowercase with _ for spaces.`);
			this.state = "finished";
			return;
		}
		clearLeftoverTestRooms();
		const p = this.player.location;
		const anchor = summonRoomEntity(overworld(), `${Math.floor(p.x)} ${Math.floor(p.y) - 2} ${Math.floor(p.z)}`, TEST_ENTITY);
		if (!isValid(anchor)) {
			this.state = "finished";
			return;
		}
		this.anchor = anchor;
		this.player.addTag(this.mode);
		this.room = new Room({ session: this, def: this.def, anchor });
		this.room.load();
		const type = ROOM_TYPES[this.def.difficulty]?.[this.def.room_type] ?? {};
		if (type.endlessTunnel && this.def.endless?.tunnelAt) runAction(this.room, { ...type.endlessTunnel, at: this.def.endless.tunnelAt });
		const start = this.def.endless?.start ?? type.endlessStart?.at ?? [0, 2, 0];
		const facing = this.def.endless?.facing;
		this.room.run(`tp ${this.room.playerSelector} ${rel(start)}${facing ? ` facing ${rel(facing)}` : ""}`);
		this.room.start();
		this.player.sendMessage(`§7[Flood Escape] Testing ${this.def.room_name}. It cleans itself up when you finish or die, or with /scriptevent brr:rooms stop test`);
	}

	// ---- area tracking (called by actions.js for every structure load / fill)
	noteBox(from, to) {
		const min = from.map((v, i) => Math.floor(Math.min(v, to[i])));
		const max = from.map((v, i) => Math.ceil(Math.max(v, to[i])));
		if (!this.area) this.area = { min, max };
		else {
			this.area.min = this.area.min.map((v, i) => Math.min(v, min[i]));
			this.area.max = this.area.max.map((v, i) => Math.max(v, max[i]));
		}
		this.saveArea();
	}

	noteStructure(action) {
		const size = structureSize(action.load) ?? { x: 16, y: 24, z: 16 };
		const turned = (action.rotation ?? 0) % 180 !== 0;
		const s = turned ? [size.z, size.y, size.x] : [size.x, size.y, size.z];
		const at = action.at ?? [0, 0, 0];
		this.noteBox(at, at.map((v, i) => v + s[i] - 1));
	}

	absoluteArea() {
		if (!this.area || !this.room) return null;
		const o = this.room.origin;
		const base = [Math.floor(o.x), Math.floor(o.y), Math.floor(o.z)];
		// one block of margin around everything the room placed
		return { min: base.map((v, i) => v + this.area.min[i] - 1), max: base.map((v, i) => v + this.area.max[i] + 1) };
	}

	saveArea() {
		const area = this.absoluteArea();
		if (!area || !isValid(this.anchor)) return;
		try {
			this.anchor.setDynamicProperty(TEST_AREA_PROPERTY, JSON.stringify(area));
		} catch {
			// can't save; cleanup still works while the session is running
		}
	}

	// ---- ending
	finish(reason) {
		if (this.state === "finished") return;
		this.state = "finished";
		const area = this.absoluteArea();
		if (area) clearBox(area.min, area.max);
		if (isValid(this.anchor)) {
			try {
				this.anchor.remove();
			} catch {
				// already gone
			}
		}
		for (const player of overworld().getPlayers({ tags: [this.mode] })) {
			if (this.room?.tunnelTag) player.removeTag(this.room.tunnelTag);
			// The lobby spawn point removes the mode tags (spawn.mcfunction)
			try {
				player.runCommand(`tp @s ${LOBBY_SPAWN}`);
			} catch {
				// left
			}
		}
		try {
			this.player?.removeTag("tester");
			this.player?.sendMessage(`§7[Flood Escape] Test room "${this.def?.room_name ?? ""}" ${reason}. Cleared.`);
		} catch {
			// player left
		}
	}

	tick() {
		if (this.state !== "playing" || !this.room) return;
		const players = overworld().getPlayers({ tags: [this.mode] });
		this.room.tick(players);
		const over = this.room.state === "done" || players.length === 0;
		this.idleTicks = over ? this.idleTicks + 1 : 0;
		if (this.idleTicks >= TEST_END_DELAY) this.finish(this.room.state === "done" ? "completed" : "failed (everyone died or left)");
	}
}

export function roomSlug(def) {
	return String(def.room_name).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}
