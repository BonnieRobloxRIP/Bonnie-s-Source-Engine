// One running room. Everything it does is relative to its brr:flood_room entity (the "anchor"),
// so a room works anywhere in the world, exactly like the old mcfunction rooms.

import { BlockPermutation } from "@minecraft/server";
import { DIFFICULTIES, ENDLESS, ROOM_TYPES, TIMINGS } from "../room_types.js";
import { lastTick, runAction, runActions, scheduleByTick, conditionsPass } from "./actions.js";
import { blockAt, isInZone, isValid, rel, sumOffsets, warnOnce } from "./util.js";

const BUTTON_ID = "brr:flood_button";
const EXIT_BUTTON_ID = "brr:flood_exit_button";
const SECOND = 20;

export class Room {
	/**
	 * @param {object} options
	 * @param {object} options.session  the GameSession / EndlessSession running this room
	 * @param {object} options.def      the room definition (see definitions/)
	 * @param {import("@minecraft/server").Entity} options.anchor  the brr:flood_room entity
	 */
	constructor({ session, def, anchor }) {
		this.session = session;
		this.def = def;
		this.anchor = anchor;
		this.dimension = anchor.dimension;
		this.origin = { ...anchor.location };

		this.tag = session.mode;
		this.playerSelector = `@a[tag=${this.tag}]`;
		this.difficulty = DIFFICULTIES[def.difficulty];
		this.type = ROOM_TYPES[def.difficulty]?.[def.room_type] ?? {};
		this.tunnelTag = session.isEndless ? "endlesstunnel" : `${this.tag}tunnel${this.type.number}`;

		this.flags = new Map(Object.entries(def.flags ?? {}));
		this.state = "loaded"; // loaded -> running -> ending -> done
		this.clock = 0;
		this.endClock = 0;
		this.sequences = new Map();
		this.currentButton = null;

		this.buttons = (def.buttons ?? []).map((b, index) => ({
			def: b,
			id: b.id ?? `button${index + 1}`,
			choices: b.randomPositions ?? [{ at: b.at, facing: b.facing }],
			active: 0,
			running: false,
			counter: 0,
			presses: 0,
			done: false,
			schedule: null,
			last: 0,
		}));

		this.loops = (def.loops ?? []).map((loop) => ({ def: loop, schedule: scheduleByTick(loop.actions), counter: 0 }));
		this.lock = def.code_lock ? { def: def.code_lock, code: [], solved: false, lampState: [] } : null;

		this.buildTimelines();
	}

	// ---------------------------------------------------------------- setup

	buildTimelines() {
		const def = this.def;
		const flood = def.flood ?? {};
		this.startDelay = flood.startModeDelay ?? 31;
		this.interval = flood.floodIntervalSec ?? 4;

		// Room clock (ticks since the room started) -> actions
		this.timeline = new Map();
		const at = (tick, action) => {
			if (!this.timeline.has(tick)) this.timeline.set(tick, []);
			this.timeline.get(tick).push(action);
		};

		// Title
		if (def.title !== false) {
			const t = def.title ?? {};
			const titleColor = this.session.isEndless ? ENDLESS.titleColor[def.difficulty] : this.difficulty.titleColor;
			const number = this.session.isEndless ? "{room_count}" : this.type.number;
			at(t.tick ?? TIMINGS.titleTick, {
				subtitle: t.subtitle ?? `${this.difficulty.subtitleColor}${def.room_name}`,
				title: t.title ?? `${titleColor}ROOM ${number}`,
			});
		}

		// Flood stages
		const stages = this.floodStages();
		for (const s of stages) at(this.floodTick(s.stage), s.action);
		// "Water is rising" toast on the first flood stage (flood.toast: false to turn it off, or another preset/toast).
		if (stages.length && flood.toast !== false) at(this.floodTick(1), { toast: flood.toast ?? "water" });
		if (stages.length && flood.message) at(this.floodTick(1), { message: flood.message });
		this.endStage = flood.endsAtStage === false ? 0 : (flood.endsAtStage ?? (stages.length ? stages[stages.length - 1].stage : 0));
		this.endTick = this.endStage ? this.floodTick(this.endStage) + TIMINGS.endAfterLastStage : Infinity;

		// Entrance door (rooms 2 and 3): opens when the room starts, shuts after the first flood stage.
		if (def.entrance) {
			const e = def.entrance;
			const door = e.door ?? this.difficulty.tunnelDoor;
			const rotation = e.rotation ?? 0;
			const sound = e.soundAt ?? sumOffsets(e.doorPos, rotation % 180 ? [0, 1, 0.5] : [0.5, 1, 0]);
			const [open1, open2] = TIMINGS.entranceOpenTicks;
			const [close1, close2] = TIMINGS.entranceCloseTicks.map((t) => this.floodTick(1) + t);
			at(open1, { load: `${door}2`, at: e.doorPos, rotation });
			at(open2, { load: `${door}3`, at: e.doorPos, rotation });
			at(open2, { sound: "sfx.doors.tunnelopen", at: sound });
			at(close1, { sound: "sfx.doors.opened", at: sound, volume: 1, pitch: 0.7 });
			at(close1, { load: `${door}2`, at: e.doorPos, rotation });
			at(close2, { load: `${door}1`, at: e.doorPos, rotation });
			if (e.barrier) at(close2, { load: this.difficulty.barrier, at: e.barrier, rotation });
		}

		// Custom timed events
		for (const event of def.events ?? []) {
			if ((event.on ?? "start") === "start") at(event.tick ?? 1, event);
			else if (event.on === "flood") at(this.floodTick(event.stage) + (event.tick ?? 0), event);
		}

		// Ending (after everyone reached the exit, or the room fully flooded) -> actions
		this.endTimeline = new Map();
		const atEnd = (tick, action) => {
			if (!this.endTimeline.has(tick)) this.endTimeline.set(tick, []);
			this.endTimeline.get(tick).push(action);
		};
		const exit = def.exit ?? {};
		if (exit.doorPos) {
			const door = exit.door ?? this.difficulty.tunnelDoor;
			const rotation = exit.doorRotation ?? 0;
			atEnd(1, { sound: "sfx.doors.opened", at: exit.doorSound ?? exit.doorPos, volume: 1, pitch: 0.7 });
			atEnd(1, { load: `${door}2`, at: exit.doorPos, rotation });
			atEnd(TIMINGS.exitDoorCloseTick, { load: `${door}1`, at: exit.doorPos, rotation });
		}
		const fill = exit.floodFill === undefined ? this.type.floodFill : exit.floodFill;
		if (fill) atEnd(TIMINGS.exitDoorCloseTick, { fill: "water", from: fill.from, to: fill.to });
		for (const event of def.events ?? []) if (event.on === "end") atEnd(event.tick ?? 1, event);

		const nextAt = exit.nextRoomAt ?? TIMINGS.exitDoorCloseTick;
		this.nextRoomAt = this.session.isEndless ? Math.max(nextAt, ENDLESS.nextRoomDelay) : nextAt;
	}

	floodTick(stage) {
		return this.startDelay * SECOND + (stage - 1) * this.interval * SECOND;
	}

	floodStages() {
		const flood = this.def.flood;
		if (!flood) return [];
		if (flood.list) return flood.list.map((s) => ({ stage: s.stage, action: { ...s, stage: undefined } }));
		if (!flood.prefix || !flood.stages) return [];
		const stages = [];
		for (let k = 1; k <= flood.stages; k++) {
			stages.push({
				stage: k,
				action: { load: `${flood.prefix}${k}`, at: sumOffsets(flood.beginsAt, [0, k - 1, 0]), anim: flood.anim ?? 1 },
			});
		}
		return stages;
	}

	// Places the room. Called once when the mode starts (or when the Endless room loads).
	load() {
		const def = this.def;
		if (this.session.isEndless) {
			for (const shell of this.type.endlessShell ?? []) runAction(this, shell);
			if (this.type.endlessTunnel && def.endless?.tunnelAt) runAction(this, { ...this.type.endlessTunnel, at: def.endless.tunnelAt });
		}
		if (def.room_map?.structure) runAction(this, { load: def.room_map.structure, at: def.room_map.at ?? [0, 0, 0] });

		// Random-position buttons: place a button at every choice, only one of them is the real one.
		for (const button of this.buttons) {
			if (!button.def.randomPositions) continue;
			for (const choice of button.choices) this.placeButton(button, choice, false);
			button.active = Math.floor(Math.random() * button.choices.length);
		}

		if (this.lock) this.lock.code = this.lock.def.buttons.map(() => Math.random() < 0.5);

		runActions(this, def.on_load ?? []);

		if (this.session.isEndless) {
			const start = def.endless?.start ?? this.type.endlessStart?.at ?? [0, 2, 0];
			const facing = def.endless?.facing ?? this.type.endlessStart?.facing;
			this.run(`tp ${this.playerSelector} ${rel(start)}${facing ? ` facing ${rel(facing)}` : ""}`);
			this.run(`tag ${this.playerSelector} remove ${this.tunnelTag}`);
		}
	}

	start() {
		this.state = "running";
		this.clock = 0;
		for (const [name, seq] of Object.entries(this.def.sequences ?? {})) if (seq.autoplay) this.playSequence(name);
	}

	// ---------------------------------------------------------------- tick

	/** @param {import("@minecraft/server").Player[]} players  everyone playing this mode right now */
	tick(players) {
		this.currentPlayers = players;
		const playerCount = players.length;
		if (this.state === "running") {
			this.tagMusic();
			if (playerCount > 0) {
				this.clock++;
				const actions = this.timeline.get(this.clock);
				if (actions) runActions(this, actions);
			}
			this.tickButtons();
			this.tickLock();
			this.tickLoops();
			this.tickHazards();
			const inTunnel = this.tickExit();
			if (this.clock >= this.endTick || (playerCount > 0 && inTunnel >= playerCount)) this.beginEnding();
		} else if (this.state === "ending") {
			this.advanceEnding();
			this.tickButtons();
		}
		if (this.state === "running" || this.state === "ending") this.tickSequences();
	}

	beginEnding() {
		this.state = "ending";
		this.endClock = 0;
		this.advanceEnding();
	}

	advanceEnding() {
		this.endClock++;
		const actions = this.endTimeline.get(this.endClock);
		if (actions) runActions(this, actions);
		if (this.endClock >= this.nextRoomAt) this.state = "done";
	}

	tagMusic() {
		const musicTag = `${this.tag}_music`;
		for (const player of this.players()) if (!player.hasTag(musicTag)) player.addTag(musicTag);
	}

	// ---------------------------------------------------------------- buttons

	tickButtons() {
		for (const button of this.buttons) {
			if (button.done) continue;
			if (!button.running) {
				if (!this.isButtonPressed(button)) continue;
				this.startButton(button);
			}
			button.counter++;
			const actions = button.schedule.get(button.counter);
			if (actions) {
				this.currentButton = button;
				runActions(this, actions);
				this.currentButton = null;
			}
			if (button.running && button.counter >= button.last) this.finishButton(button);
		}
	}

	startButton(button) {
		const def = button.def;
		const useAgain = def.onPressAgain && button.presses % 2 === 1;
		button.schedule = scheduleByTick(useAgain ? def.onPressAgain : def.onPress);
		button.last = Math.max(1, lastTick(button.schedule));
		button.running = true;
		button.counter = 0;
		button.presses++;
	}

	finishButton(button) {
		button.running = false;
		if (button.def.repeatable) this.rearm(button);
		else button.done = true;
	}

	isButtonPressed(button) {
		const block = this.getBlock(button.choices[button.active].at);
		if (!block || block.typeId !== BUTTON_ID) return false;
		try {
			return block.permutation.getState("brr:pressed") === true;
		} catch {
			return false;
		}
	}

	findButton(id) {
		const button = id === "self" ? this.currentButton : this.buttons.find((b) => b.id === id);
		if (!button) warnOnce(`button:${this.def.room_name}:${id}`, `Room "${this.def.room_name}" has no button with id "${id}".`);
		return button;
	}

	placeButton(button, choice, pressed) {
		const block = this.getBlock(choice.at);
		if (!block) return;
		try {
			block.setPermutation(BlockPermutation.resolve(BUTTON_ID, {
				"brr:button_type": button.def.type ?? "parkour",
				"brr:pressed": pressed,
				"minecraft:block_face": choice.facing ?? "up",
			}));
		} catch (error) {
			warnOnce(`place:${this.def.room_name}`, `Room "${this.def.room_name}" could not place a button: ${error}`);
		}
	}

	setButtonPressed(button, pressed) {
		const choice = button.choices[button.active];
		const block = this.getBlock(choice.at);
		if (!block) return;
		if (block.typeId === BUTTON_ID) {
			try {
				block.setPermutation(block.permutation.withState("brr:pressed", pressed));
				return;
			} catch {
				// fall through and replace the block
			}
		}
		this.placeButton(button, choice, pressed);
	}

	pressButton(id) {
		const button = this.findButton(id);
		if (button) this.setButtonPressed(button, true);
	}

	rearm(button) {
		this.setButtonPressed(button, false);
		button.running = false;
		button.done = false;
		button.counter = 0;
	}

	rearmButton(id) {
		const button = this.findButton(id);
		if (!button) return;
		if (button === this.currentButton) {
			// Re-arming itself: finish the current press first.
			button.counter = button.last;
		}
		this.rearm(button);
	}

	// ---------------------------------------------------------------- code lock

	tickLock() {
		const lock = this.lock;
		if (!lock || lock.solved) return;
		const def = lock.def;
		const matches = def.buttons.map((at, i) => {
			const block = this.getBlock(at);
			if (!block || block.typeId !== EXIT_BUTTON_ID) return false;
			let pressed = false;
			try {
				pressed = block.permutation.getState("brr:pressed") === true;
			} catch {
				// unreadable counts as not pressed
			}
			return pressed === lock.code[i];
		});
		const matched = matches.filter(Boolean).length;

		(def.groups ?? []).forEach((group, g) => {
			const solved = group.buttons.every((i) => matches[i]);
			if (lock.lampState[g] === solved) return;
			lock.lampState[g] = solved;
			if (group.lamp) runAction(this, { setblock: solved ? group.lamp.on : group.lamp.off, at: group.lamp.at });
		});

		const total = def.buttons.length;
		if (def.progress && matched > 0) {
			const text = (matched === total ? def.progressDone ?? def.progress : def.progress)
				.replace("{matched}", matched).replace("{total}", total);
			runAction(this, { actionbar: text });
		}

		if (matched === total) {
			lock.solved = true;
			this.setFlag("code_solved", 1);
			if (def.onSolved) {
				this.sequences.set("__code_lock", { schedule: scheduleByTick(def.onSolved), last: lastTick(scheduleByTick(def.onSolved)), tick: 0 });
			}
		}
	}

	// ---------------------------------------------------------------- sequences, loops, hazards

	playSequence(name) {
		const def = this.def.sequences?.[name];
		if (!def) {
			warnOnce(`seq:${this.def.room_name}:${name}`, `Room "${this.def.room_name}" has no sequence "${name}".`);
			return;
		}
		const actions = Array.isArray(def) ? def : def.actions;
		const channel = Array.isArray(def) ? undefined : def.channel;
		if (channel) {
			for (const [other, seq] of this.sequences) if (seq.channel === channel) this.sequences.delete(other);
		}
		const schedule = scheduleByTick(actions);
		this.sequences.set(name, { schedule, last: lastTick(schedule), loop: def.loop, channel, tick: 0 });
	}

	stopSequence(name) {
		this.sequences.delete(name);
	}

	tickSequences() {
		for (const [name, seq] of [...this.sequences]) {
			if (this.sequences.get(name) !== seq) continue;
			seq.tick++;
			const actions = seq.schedule.get(seq.tick);
			if (actions) runActions(this, actions);
			if (this.sequences.get(name) !== seq) continue;
			if (seq.loop) {
				if (seq.tick >= seq.loop) seq.tick = 0;
			} else if (seq.tick >= seq.last) {
				this.sequences.delete(name);
			}
		}
	}

	tickLoops() {
		const stage = this.floodStageNow();
		for (const loop of this.loops) {
			const def = loop.def;
			if (def.fromTick !== undefined && this.clock < def.fromTick) continue;
			if (def.fromFlood !== undefined && stage < def.fromFlood) continue;
			if (def.untilFlood !== undefined && stage >= def.untilFlood) continue;
			if (!conditionsPass(this, def)) continue;
			loop.counter++;
			const actions = loop.schedule.get(loop.counter);
			if (actions) runActions(this, actions);
			if (loop.counter >= (def.every ?? 1)) loop.counter = 0;
		}
	}

	tickHazards() {
		const hazards = this.def.hazards;
		if (!hazards?.length) return;
		for (const player of this.players()) {
			const below = this.dimension.getBlock({ x: Math.floor(player.location.x), y: Math.floor(player.location.y) - 1, z: Math.floor(player.location.z) });
			if (!below) continue;
			for (const hazard of hazards) {
				if (below.typeId !== hazard.block && below.typeId !== `minecraft:${hazard.block}`) continue;
				try {
					if (hazard.kill) player.runCommand("kill @s");
					else if (hazard.damage) player.runCommand(`damage @s ${hazard.damage}`);
				} catch {
					// player left
				}
			}
		}
	}

	// ---------------------------------------------------------------- exit tunnel

	// Tags players who reached the exit tunnel; returns how many players are tagged.
	tickExit() {
		const exit = this.def.exit;
		if (!exit?.zone) return 0;
		const active = !exit.if || conditionsPass(this, { if: exit.if });
		let count = 0;
		for (const player of this.players()) {
			if (active) {
				const inside = isInZone(this.origin, exit.zone, player.location);
				const leaving = exit.leaveZone === "outside" ? !inside : exit.leaveZone ? isInZone(this.origin, exit.leaveZone, player.location) : false;
				if (inside) player.addTag(this.tunnelTag);
				else if (leaving) player.removeTag(this.tunnelTag);
			}
			if (player.hasTag(this.tunnelTag)) count++;
		}
		return count;
	}

	// ---------------------------------------------------------------- helpers used by actions

	run(command) {
		try {
			if (isValid(this.anchor)) this.anchor.runCommand(command);
			else this.dimension.runCommand(`execute positioned ${this.origin.x} ${this.origin.y} ${this.origin.z} run ${command}`);
		} catch (error) {
			// "No targets matched" just means nobody was there; only report real mistakes (typos, missing structures...).
			if (/no targets? matched|no entity was found/i.test(String(error))) return;
			warnOnce(`cmd:${command}`, `Room "${this.def.room_name}" command failed: ${command} (${error})`);
		}
	}

	text(value) {
		return String(value)
			.replaceAll("{mode}", this.tag)
			.replaceAll("{room_name}", this.def.room_name)
			.replaceAll("{color}", this.difficulty.titleColor.replace("§l", ""))
			.replaceAll("{tunnel_tag}", this.tunnelTag)
			.replaceAll("{room_count}", String(this.session.roomCount ?? ""))
			.replaceAll("{flood_seconds}", String(this.floodSecondsLeft()));
	}

	getFlag(name) {
		return this.flags.get(name) ?? 0;
	}

	setFlag(name, value) {
		this.flags.set(name, value);
	}

	players() {
		return this.currentPlayers ?? this.dimension.getPlayers({ tags: [this.tag] });
	}

	getBlock(offset) {
		try {
			return this.dimension.getBlock(blockAt(this.origin, offset));
		} catch {
			return undefined;
		}
	}

	floodStageNow() {
		if (this.clock < this.floodTick(1)) return 0;
		return Math.floor((this.clock - this.floodTick(1)) / (this.interval * SECOND)) + 1;
	}

	floodSecondsLeft() {
		if (this.clock < this.floodTick(1)) return this.startDelay - Math.floor(this.clock / SECOND);
		return this.interval - Math.floor(((this.clock - this.floodTick(1)) % (this.interval * SECOND)) / SECOND);
	}

	// { zone: { at, size }, by: [x, y, z], smooth: true, tag?: "{tunnel_tag}" }
	movePlayers(spec) {
		const requiredTag = spec.tag ? this.text(spec.tag) : null;
		const [dx, dy, dz] = spec.by;
		for (const player of this.players()) {
			if (!isInZone(this.origin, spec.zone, player.location)) continue;
			if (requiredTag && !player.hasTag(requiredTag)) continue;
			try {
				if (spec.smooth === false) {
					player.runCommand(`tp @s ${rel([dx, dy, dz])}`);
				} else {
					// Ride a temporary boat with teleport_rider: smoother than /tp (same trick the old player_tp functions used).
					const yaw = spec.boatYaw ?? 0;
					player.runCommand(`summon boat ${rel([dx, dy, dz])} ${yaw} 0`);
					player.runCommand(`execute positioned ${rel([dx, dy, dz])} run ride @s start_riding @e[type=boat, r=1, c=1] teleport_rider until_full`);
					player.runCommand(`execute positioned ${rel([dx, dy, dz])} run kill @e[type=boat, r=2]`);
				}
			} catch {
				// player left mid-move
			}
		}
	}
}

