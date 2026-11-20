// Easy · Bonus Room · Almost there!
// Starts when the exit room's lift arrives. Press the button to raise the lift, stand on it, escape.
export default {
	room_name: "Almost there!",
	room_type: "finale",
	difficulty: "easy",
	title: { title: "§aBONUS ROOM", subtitle: "§2Almost there!" },

	room_map: {
		structure: "easy/exit_room:EasyExitRoomFinale",
		at: [15, 10, -7],
		// Runs on the same brr:flood_room entity as the exit room (easy_exit).
		sharedAnchor: true,
	},

	buttons: [
		{
			at: [28, 28, 0], facing: "west", type: "exit",
			onPress: [
				{ sound: "sfx.elevator.lift" },
				{ load: "easy/exit_room:ExitLift", at: [21, 18, -1] },
				{ tick: 20, load: "easy/exit_room:ExitLift", at: [21, 19, -1] },
				{ tick: 30, load: "easy/exit_room:ExitLift", at: [21, 20, -1] },
				{ tick: 40, load: "easy/exit_room:ExitLift", at: [21, 21, -1] },
				{ tick: 50, load: "easy/exit_room:ExitLift", at: [21, 22, -1] },
				{ tick: 60, load: "easy/exit_room:ExitLift", at: [21, 23, -1] },
				{ tick: 70, load: "easy/exit_room:ExitLift", at: [21, 24, -1] },
				{ tick: 70, sound: "sfx.elevator.stop" },
				// The lift is up: standing on it now counts as escaping (see exit.if).
				{ tick: 70, set: { lift_up: 1 } },
			],
		},
	],

	flood: {
		startModeDelay: 21,
		floodIntervalSec: 2,
		message: null,
		endsAtStage: 25,
		// This room floods in different places, so every stage is listed.
		list: [
			{ stage: 1, load: "easy/exit_room:EMR4F", at: [-5, -2, -6], anim: 2 },
			{ stage: 2, load: "easy/exit_room:EMR5F1", at: [20, 9, -1], anim: 1 },
			{ stage: 3, load: "easy/exit_room:EMR5F1", at: [20, 10, -1], anim: 1 },
			{ stage: 4, load: "easy/exit_room:EMR5F2", at: [20, 11, -1], anim: 1 },
			{ stage: 5, load: "easy/exit_room:EMR5F3", at: [20, 12, -1], anim: 1 },
			{ stage: 6, load: "easy/exit_room:EMR5F4", at: [20, 13, -1], anim: 1 },
			{ stage: 7, load: "easy/exit_room:EMR5F5", at: [20, 14, -1], anim: 1 },
			{ stage: 8, load: "easy/exit_room:EMR5F1", at: [20, 15, -1], anim: 1 },
			{ stage: 9, load: "easy/exit_room:EMR5F2", at: [20, 16, -1], anim: 1 },
			{ stage: 10, load: "easy/exit_room/1_almost_there:EMR5V1F1", at: [16, 17, -6], anim: 1 },
			{ stage: 12, load: "easy/exit_room/1_almost_there:EMR5V1F2", at: [16, 18, -6], anim: 1 },
			{ stage: 13, load: "easy/exit_room/1_almost_there:EMR5V1F3", at: [16, 19, -6], anim: 1 },
			{ stage: 14, load: "easy/exit_room/1_almost_there:EMR5V1F4", at: [16, 20, -6], anim: 1 },
			{ stage: 15, load: "easy/exit_room/1_almost_there:EMR5V1F5", at: [16, 21, -6], anim: 1 },
			{ stage: 16, load: "easy/exit_room/1_almost_there:EMR5V1F6", at: [16, 22, -6], anim: 1 },
			{ stage: 17, load: "easy/exit_room/1_almost_there:EMR5V1F7", at: [16, 23, -6], anim: 1 },
			{ stage: 18, load: "easy/exit_room/1_almost_there:EMR5V1F8", at: [16, 24, -6], anim: 1 },
			{ stage: 19, load: "easy/exit_room/1_almost_there:EMR5V1F9", at: [16, 25, -6], anim: 1 },
			{ stage: 20, load: "easy/exit_room/1_almost_there:EMR5V1F10", at: [16, 26, -6], anim: 1 },
			{ stage: 21, load: "easy/exit_room/1_almost_there:EMR5V1F11", at: [16, 27, -6], anim: 1 },
			{ stage: 22, load: "easy/exit_room/1_almost_there:EMR5V1F12", at: [16, 28, -6], anim: 1 },
			{ stage: 23, load: "easy/exit_room/1_almost_there:EMR5V1F13", at: [16, 29, -6], anim: 1 },
			{ stage: 24, load: "easy/exit_room/1_almost_there:EMR5V1F14", at: [16, 30, -6], anim: 1 },
		],
	},

	exit: {
		// The top of the lift. Only counts once the lift is up; stepping off it un-tags you.
		zone: { at: [21, 26, -1], size: [2, 3, 2] },
		leaveZone: "outside",
		if: { lift_up: 1 },
		floodFill: null,
		// The escape ride below takes 115 ticks, then the mode is finished.
		nextRoomAt: 115,
	},

	events: [
		{ on: "flood", stage: 1, message: "§3Blast door has failed! The water is now flooding the exit room." },

		// Escape ride: the lift carries everyone on it up to the surface.
		{ on: "end", tick: 10, load: "easy/exit_room:ExitBorderClosed", at: [20, 48, -2] },
		{ on: "end", tick: 10, sound: "sfx.elevator.lift" },
		{ on: "end", tick: 10, sound: "sfx.elevator.move" },
		{ on: "end", tick: 10, load: "easy/exit_room:ExitLift", at: [21, 25, -1] },
		{ on: "end", tick: 10, move_players: { zone: { at: [21, 26, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 30, load: "easy/exit_room:ExitLift", at: [21, 26, -1] },
		{ on: "end", tick: 30, move_players: { zone: { at: [21, 27, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 40, load: "easy/exit_room:ExitLift", at: [21, 27, -1] },
		{ on: "end", tick: 40, move_players: { zone: { at: [21, 28, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 50, load: "easy/exit_room:ExitLift", at: [21, 28, -1] },
		{ on: "end", tick: 50, move_players: { zone: { at: [21, 29, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 55, load: "easy/exit_room:ExitLift", at: [21, 29, -1] },
		{ on: "end", tick: 55, move_players: { zone: { at: [21, 30, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 60, load: "easy/exit_room:ExitLift", at: [21, 30, -1] },
		{ on: "end", tick: 60, move_players: { zone: { at: [21, 31, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 65, load: "easy/exit_room:ExitLift", at: [21, 31, -1] },
		{ on: "end", tick: 65, move_players: { zone: { at: [21, 32, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 70, load: "easy/exit_room:ExitLift", at: [21, 32, -1] },
		{ on: "end", tick: 70, move_players: { zone: { at: [21, 33, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 75, load: "easy/exit_room:ExitLift", at: [21, 33, -1] },
		{ on: "end", tick: 75, move_players: { zone: { at: [21, 34, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 80, load: "easy/exit_room:ExitLift", at: [21, 34, -1] },
		{ on: "end", tick: 80, move_players: { zone: { at: [21, 35, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 85, load: "easy/exit_room:ExitLift", at: [21, 35, -1] },
		{ on: "end", tick: 85, move_players: { zone: { at: [21, 36, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 90, load: "easy/exit_room:ExitLift", at: [21, 36, -1] },
		{ on: "end", tick: 90, move_players: { zone: { at: [21, 37, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 90, command: "camera @a[tag={mode}] fade time 1 0 1 color 255 255 255" },
		{ on: "end", tick: 95, load: "easy/exit_room:ExitLift", at: [21, 37, -1] },
		{ on: "end", tick: 95, move_players: { zone: { at: [21, 38, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 100, load: "easy/exit_room:ExitLift", at: [21, 38, -1] },
		{ on: "end", tick: 100, move_players: { zone: { at: [21, 39, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 105, load: "easy/exit_room:ExitLift", at: [21, 39, -1] },
		{ on: "end", tick: 105, move_players: { zone: { at: [21, 40, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 110, load: "easy/exit_room:ExitLift", at: [21, 40, -1] },
		{ on: "end", tick: 110, move_players: { zone: { at: [21, 41, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },
		{ on: "end", tick: 115, load: "easy/exit_room:ExitLift", at: [21, 41, -1] },
		{ on: "end", tick: 115, move_players: { zone: { at: [21, 42, -1], size: [2, 3, 2] }, by: [0, 1, 0], tag: "{tunnel_tag}" } },

		// Victory: everyone who rode the lift out escaped.
		{ on: "end", tick: 115, command: [
			"scoreboard players set easy_victory lobby 1",
			"execute as @a[tag={tunnel_tag}] run scoreboard players add @s storage_easy 1",
			"execute as @a[tag={tunnel_tag}] run scoreboard players add p_won easy 1",
			"execute as @a[tag={tunnel_tag}] run tellraw @a {\"rawtext\":[{\"text\": \"§2§lEasy mode:§b \"}, {\"selector\": \"@s\"}, {\"text\": \" §r§aEscaped the Facility!\"}]}",
			"tp @a[tag={tunnel_tag}] -39 58 -18",
		] },
	],
};
