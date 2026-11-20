// Easy · Exit Room · Guess the code, then run.
// Flip the six switches to match the hidden code to open the exit door, then reach the lift before the blast doors fail.
export default {
	room_name: "Exit Room",
	room_type: "exit",
	difficulty: "easy",
	title: { title: "§aEXIT ROOM", subtitle: "§2Guess the code, then run.", tick: 30 },

	room_map: {
		structure: "easy/exit_room:EasyExitRoom",
		at: [-6, -2, -7],
		spawnFromPrevious: [6, -14, 0],
	},

	// Six flood exit buttons (switches). Each one gets a random on/off target when the room loads.
	code_lock: {
		buttons: [[9, 3, -5], [9, 3, -4], [9, 3, -3], [9, 3, 3], [9, 3, 4], [9, 3, 5]],
		groups: [
			{ buttons: [0, 1, 2], lamp: { at: [10, 4, -4], on: "verdant_froglight[\"pillar_axis\"=\"z\"]", off: "black_concrete" } },
			{ buttons: [3, 4, 5], lamp: { at: [10, 4, 4], on: "verdant_froglight[\"pillar_axis\"=\"z\"]", off: "black_concrete" } },
		],
		// Exit door opens
		onSolved: [
			{ fill: "verdant_froglight[\"pillar_axis\"=\"z\"]", from: [9, 5, -1], to: [9, 5, 1] },
			{ sound: "sfx.alarm.lift", at: [9, 5, 0] },
			{ tick: 20, sound: "sfx.alarm.lift", at: [9, 5, 0] },
			{ tick: 30, load: "easy/exit_room:ExitDoor", at: [10, 2, -1] },
			{ tick: 40, sound: "sfx.alarm.lift", at: [9, 5, 0] },
			{ tick: 45, load: "easy/exit_room:ExitDoor", at: [10, 3, -1] },
			{ tick: 60, load: "easy/exit_room:ExitDoor", at: [10, 4, -1] },
		],
	},

	// No rising water here: after 31s the blast doors fail, 4s later the room floods, 4s after that it is over.
	flood: {
		startModeDelay: 31,
		floodIntervalSec: 4,
		message: null,
		endsAtStage: false,
		list: [{ stage: 2, load: "easy/exit_room:EMR4F", at: [-5, -2, -6], anim: 2 }],
	},

	loops: [
		// Countdown in the actionbar until the blast doors fail
		{ fromTick: 20, untilFlood: 1, actions: [{ actionbar: "§2Tunnel Blast Doors §fmight fail in: §a§l{flood_seconds}§r§2 Seconds." }] },
		// Water pouring in through the broken blast door
		{ fromFlood: 1, actions: [
			{ particle: "brr:water_flow", at: [0, 8, 0] },
			{ particle: "brr:water_flow", at: [1, 8, 0] },
			{ particle: "brr:water_flow", at: [0, 8, 1] },
			{ particle: "brr:water_flow", at: [1, 8, 1] },
		] },
		// Too late
		{ fromFlood: 3, untilFlood: 4, actions: [{ kill_players: true }] },
	],

	exit: {
		// The lift platform behind the exit door
		zone: { at: [21, 2, -1], size: [2, 3, 2] },
		leaveZone: { at: [20, 2, -1], size: [0, 3, 2] },
		floodFill: null,
		// The lift ride below takes 280 ticks, then the bonus room starts.
		nextRoomAt: 280,
	},

	events: [
		{ on: "flood", stage: 1, message: "§3Blast door has failed! The water is now flooding the exit room." },

		// Glass floor drops in, then breaks
		{ on: "start", tick: 2, load: "easy/exit_room:ExitGlassFloor", at: [-1, 13, 0] },
		{ on: "start", tick: 4, load: "easy/exit_room:ExitGlassFloor", at: [-1, 12, 0] },
		{ on: "start", tick: 6, load: "easy/exit_room:ExitGlassFloor", at: [-1, 11, 0] },
		{ on: "start", tick: 8, load: "easy/exit_room:ExitGlassFloor", at: [-1, 10, 0] },
		{ on: "start", tick: 10, load: "easy/exit_room:ExitGlassFloor", at: [-1, 9, 0] },
		{ on: "start", tick: 12, load: "easy/exit_room:ExitGlassFloor", at: [-1, 8, 0] },
		{ on: "start", tick: 14, load: "easy/exit_room:ExitGlassFloor", at: [-1, 7, 0] },
		{ on: "start", tick: 15, load: "easy/exit_room:ExitGlassFloor", at: [-1, 6, 0] },
		{ on: "start", tick: 16, load: "easy/exit_room:ExitGlassFloor", at: [-1, 5, 0] },
		{ on: "start", tick: 17, load: "easy/exit_room:ExitGlassFloor", at: [-1, 4, 0] },
		{ on: "start", tick: 18, load: "easy/exit_room:ExitGlassFloor", at: [-1, 3, 0] },
		{ on: "start", tick: 19, load: "easy/exit_room:ExitGlassFloor", at: [-1, 2, 0] },
		{ on: "start", tick: 20, fill: "air", from: [-1, 2, 0], to: [0, 2, 1], mode: "destroy" },

		// Everyone made it: barrier closes, exit door shuts, lift rides up to the bonus room
		{ on: "end", tick: 1, load: "easy/exit_room:ExitBorderClosed", at: [20, 48, -2] },
		{ on: "end", tick: 1, sound: "metal_door.pushbar", at: [0, 0, 0], volume: 1, pitch: 0.5 },
		{ on: "end", tick: 1, load: "easy/exit_room:ExitBarrier1", at: [20, 3, -1] },
		{ on: "end", tick: 10, load: "easy/exit_room:ExitBarrier2", at: [20, 3, -1] },
		{ on: "end", tick: 10, load: "easy/exit_room:ExitDoor", at: [10, 3, -1] },
		{ on: "end", tick: 20, load: "easy/exit_room:ExitBarrier3", at: [20, 3, -1] },
		{ on: "end", tick: 20, load: "easy/exit_room:ExitDoor", at: [10, 2, -1] },
		{ on: "end", tick: 30, load: "easy/exit_room:ExitDoor", at: [10, 1, -1] },
		{ on: "end", tick: 30, sound: "sfx.elevator.lift" },
		{ on: "end", tick: 30, sound: "sfx.elevator.move" },
		{ on: "end", tick: 30, load: "easy/exit_room:ExitLift", at: [21, 1, -1] },
		{ on: "end", tick: 30, move_players: { zone: { at: [21, 2, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 50, load: "easy/exit_room:ExitLift", at: [21, 2, -1] },
		{ on: "end", tick: 50, move_players: { zone: { at: [21, 3, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 70, load: "easy/exit_room:ExitLift", at: [21, 3, -1] },
		{ on: "end", tick: 70, move_players: { zone: { at: [21, 4, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 85, load: "easy/exit_room:ExitLift", at: [21, 4, -1] },
		{ on: "end", tick: 85, move_players: { zone: { at: [21, 5, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 100, load: "easy/exit_room:ExitLift", at: [21, 5, -1] },
		{ on: "end", tick: 100, move_players: { zone: { at: [21, 6, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 115, load: "easy/exit_room:ExitLift", at: [21, 6, -1] },
		{ on: "end", tick: 115, move_players: { zone: { at: [21, 7, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 130, load: "easy/exit_room:ExitLift", at: [21, 7, -1] },
		{ on: "end", tick: 130, move_players: { zone: { at: [21, 8, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 140, load: "easy/exit_room:ExitLift", at: [21, 8, -1] },
		{ on: "end", tick: 140, move_players: { zone: { at: [21, 9, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 150, load: "easy/exit_room:ExitLift", at: [21, 9, -1] },
		{ on: "end", tick: 150, move_players: { zone: { at: [21, 10, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 160, load: "easy/exit_room:ExitLift", at: [21, 10, -1] },
		{ on: "end", tick: 160, move_players: { zone: { at: [21, 11, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 170, load: "easy/exit_room:ExitLift", at: [21, 11, -1] },
		{ on: "end", tick: 170, move_players: { zone: { at: [21, 12, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 180, load: "easy/exit_room:ExitLift", at: [21, 12, -1] },
		{ on: "end", tick: 180, move_players: { zone: { at: [21, 13, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 190, load: "easy/exit_room:ExitLift", at: [21, 13, -1] },
		{ on: "end", tick: 190, move_players: { zone: { at: [21, 14, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 200, load: "easy/exit_room:ExitLift", at: [21, 14, -1] },
		{ on: "end", tick: 200, move_players: { zone: { at: [21, 15, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 210, load: "easy/exit_room:ExitLift", at: [21, 15, -1] },
		{ on: "end", tick: 210, move_players: { zone: { at: [21, 16, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 220, load: "easy/exit_room:ExitLift", at: [21, 16, -1] },
		{ on: "end", tick: 220, move_players: { zone: { at: [21, 17, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 230, load: "easy/exit_room:ExitLift", at: [21, 17, -1] },
		{ on: "end", tick: 230, move_players: { zone: { at: [21, 18, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 240, load: "easy/exit_room:ExitLift", at: [21, 18, -1] },
		{ on: "end", tick: 240, move_players: { zone: { at: [21, 19, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 240, command: "camerashake add @a[tag={mode}] 2 0.5 positional" },
		{ on: "end", tick: 240, stopsound: "sfx.elevator.move" },
		{ on: "end", tick: 240, sound: "sfx.elevator.stop" },
		{ on: "end", tick: 240, sound: "sfx.ambiance.distant_explosion.6" },
		{ on: "end", tick: 240, particle: "minecraft:critical_hit_emitter", at: [21, 18, -1] },
		{ on: "end", tick: 240, particle: "minecraft:critical_hit_emitter", at: [23, 18, -1] },
		{ on: "end", tick: 240, particle: "minecraft:critical_hit_emitter", at: [21, 18, 1] },
		{ on: "end", tick: 240, particle: "minecraft:critical_hit_emitter", at: [23, 18, 1] },
		{ on: "end", tick: 280, sound: "sfx.elevator.stop" },
		{ on: "end", tick: 280, load: "easy/exit_room:ExitLift", at: [21, 17, -1] },
		{ on: "end", tick: 280, load: "easy/exit_room:ExitBorderGone", at: [20, 48, -2] },
	],
};
