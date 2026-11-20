// Hard · Room 3 · Master Lift
export default {
	room_name: "Master Lift",
	room_type: "r3",
	difficulty: "hard",

	room_map: {
		structure: "hard/room3/1_master_lift:HardRoom3V1",
		at: [-8, 1, -7],
		spawnFromPrevious: [-8, -3, 2],
	},

	buttons: [
		{
			at: [-6, 4, 5], facing: "east", type: "parkour",
			onPress: [
				{ fill: "air", from: [-5, 3, 4], to: [-5, 5, 4], mode: "destroy" },
				{ message: "§4§lALERT: §r§4Lift will rise in §l3§r§4." },
				{ tick: 21, message: "§4§lALERT: §r§4Lift will rise in §l2§r§4.." },
				{ tick: 41, message: "§4§lALERT: §r§4Lift will rise in §l1§r§4..." },
				{ tick: 41, sound: "sfx.elevator.platform.start" },
				{ tick: 61, load: "hard/room3/1_master_lift:HMR3V1M1", at: [-2, 3, -2] },
				{ tick: 61, move_players: { zone: { at: [-2, 4, -2], size: [4, 2, 4] }, by: [0, 1, 0], smooth: false } },
				{ tick: 71, load: "hard/room3/1_master_lift:HMR3V1M1", at: [-2, 4, -2] },
				{ tick: 71, move_players: { zone: { at: [-2, 5, -2], size: [4, 2, 4] }, by: [0, 1, 0], smooth: false } },
				{ tick: 81, stopsound: "sfx.elevator.platform.start" },
				{ tick: 81, sound: "sfx.elevator.platform.stop" },
				{ tick: 81, load: "hard/room3/1_master_lift:HMR3V1M1", at: [-2, 5, -2] },
				{ tick: 81, move_players: { zone: { at: [-2, 6, -2], size: [4, 2, 4] }, by: [0, 1, 0], smooth: false } },
			],
		},
		{
			at: [-6, 9, 6], facing: "east", type: "parkour",
			onPress: [
				{ fill: "air", from: [-5, 7, 4], to: [-5, 9, 4], mode: "destroy" },
				{ message: "§4§lALERT: §r§4Lift will rise in §l3§r§4." },
				{ tick: 21, message: "§4§lALERT: §r§4Lift will rise in §l2§r§4.." },
				{ tick: 41, message: "§4§lALERT: §r§4Lift will rise in §l1§r§4..." },
				{ tick: 41, sound: "sfx.elevator.platform.start" },
				{ tick: 61, load: "hard/room3/1_master_lift:HMR3V1M1", at: [-2, 6, -2] },
				{ tick: 61, move_players: { zone: { at: [-2, 7, -2], size: [4, 2, 4] }, by: [0, 1, 0], smooth: false } },
				{ tick: 71, load: "hard/room3/1_master_lift:HMR3V1M1", at: [-2, 7, -2] },
				{ tick: 71, move_players: { zone: { at: [-2, 8, -2], size: [4, 2, 4] }, by: [0, 1, 0], smooth: false } },
				{ tick: 81, load: "hard/room3/1_master_lift:HMR3V1M1", at: [-2, 8, -2] },
				{ tick: 81, move_players: { zone: { at: [-2, 9, -2], size: [4, 2, 4] }, by: [0, 1, 0], smooth: false } },
				{ tick: 91, stopsound: "sfx.elevator.platform.start" },
				{ tick: 91, sound: "sfx.elevator.platform.stop" },
				{ tick: 91, load: "hard/room3/1_master_lift:HMR3V1M1", at: [-2, 9, -2] },
				{ tick: 91, move_players: { zone: { at: [-2, 10, -2], size: [4, 2, 4] }, by: [0, 1, 0], smooth: false } },
			],
		},
		{
			at: [-6, 13, 5], facing: "east", type: "parkour",
			onPress: [
				{ fill: "air", from: [-5, 11, 4], to: [-5, 13, 4], mode: "destroy" },
				{ message: "§4§lALERT: §r§4Lift will rise in §l3§r§4." },
				{ tick: 21, message: "§4§lALERT: §r§4Lift will rise in §l2§r§4.." },
				{ tick: 41, message: "§4§lALERT: §r§4Lift will rise in §l1§r§4..." },
				{ tick: 41, sound: "sfx.elevator.platform.start" },
				{ tick: 61, load: "hard/room3/1_master_lift:HMR3V1M1", at: [-2, 10, -2] },
				{ tick: 61, move_players: { zone: { at: [-2, 11, -2], size: [4, 2, 4] }, by: [0, 1, 0], smooth: false } },
				{ tick: 71, load: "hard/room3/1_master_lift:HMR3V1M1", at: [-2, 11, -2] },
				{ tick: 71, move_players: { zone: { at: [-2, 12, -2], size: [4, 2, 4] }, by: [0, 1, 0], smooth: false } },
				{ tick: 81, load: "hard/room3/1_master_lift:HMR3V1M1", at: [-2, 12, -2] },
				{ tick: 81, move_players: { zone: { at: [-2, 13, -2], size: [4, 2, 4] }, by: [0, 1, 0], smooth: false } },
				{ tick: 91, stopsound: "sfx.elevator.platform.start" },
				{ tick: 91, sound: "sfx.elevator.platform.stop" },
				{ tick: 91, load: "hard/room3/1_master_lift:HMR3V1M1", at: [-2, 13, -2] },
				{ tick: 91, move_players: { zone: { at: [-2, 14, -2], size: [4, 2, 4] }, by: [0, 1, 0], smooth: false } },
			],
		},
		{
			at: [-5, 17, 6], facing: "north", type: "parkour",
			onPress: [
				{ fill: "air", from: [-5, 15, 4], to: [-5, 17, 4], mode: "destroy" },
				{ message: "§4§lALERT: §r§4Lift will rise in §l3§r§4." },
				{ tick: 21, message: "§4§lALERT: §r§4Lift will rise in §l2§r§4.." },
				{ tick: 41, message: "§4§lALERT: §r§4Lift will rise in §l1§r§4..." },
				{ tick: 41, sound: "sfx.elevator.platform.start" },
				{ tick: 61, load: "hard/room3/1_master_lift:HMR3V1M1", at: [-2, 14, -2] },
				{ tick: 61, move_players: { zone: { at: [-2, 15, -2], size: [4, 2, 4] }, by: [0, 1, 0], smooth: false } },
				{ tick: 71, load: "hard/room3/1_master_lift:HMR3V1M1", at: [-2, 15, -2] },
				{ tick: 71, move_players: { zone: { at: [-2, 16, -2], size: [4, 2, 4] }, by: [0, 1, 0], smooth: false } },
				{ tick: 81, load: "hard/room3/1_master_lift:HMR3V1M1", at: [-2, 16, -2] },
				{ tick: 81, move_players: { zone: { at: [-2, 17, -2], size: [4, 2, 4] }, by: [0, 1, 0], smooth: false } },
				{ tick: 91, load: "hard/room3/1_master_lift:HMR3V1M1", at: [-2, 17, -2] },
				{ tick: 91, move_players: { zone: { at: [-2, 18, -2], size: [4, 2, 4] }, by: [0, 1, 0], smooth: false } },
				{ tick: 101, stopsound: "sfx.elevator.platform.start" },
				{ tick: 101, sound: "sfx.elevator.platform.stop" },
				{ tick: 101, load: "hard/room3/1_master_lift:HMR3V1M1", at: [-2, 18, -2] },
				{ tick: 101, move_players: { zone: { at: [-2, 19, -2], size: [4, 2, 4] }, by: [0, 1, 0], smooth: false } },
			],
		},
		{
			at: [6, 22, 6], facing: "north", type: "exit",
			onPress: [
				{ fill: "air", from: [4, 21, 5], to: [4, 22, 5], mode: "destroy" },
				{ fill: "air", from: [0, 20, 7], to: [-1, 20, 7] },
				{ tick: 10, fill: "air", from: [0, 21, 7], to: [-1, 21, 7] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "hard/room3/1_master_lift:HMR3V1F", stages: 18, beginsAt: [-6, 3, -6], startModeDelay: 20, floodIntervalSec: 5, message: null },

	exit: {
		zone: { at: [-1, 20, 8], size: [1, 1, 5] },
		leaveZone: { at: [-1, 20, 7], size: [1, 1, 0] },
		doorSound: [-0.5, 21.5, 8],
		door: "hard:HardTunnelDoor",
		doorPos: [-1, 20, 8],
		floodFill: { from: [-6, 3, -6], to: [6, 22, 6] },
	},

	entrance: { doorPos: [8, 3, -2], rotation: 90, barrier: [8, 2, -3], soundAt: [8, 3, -1.5] },

	events: [
		{ on: "flood", stage: 1, tick: 21, message: "§3Wa§kter is §r§3r§kis§r§3ing§k!" },
		{ on: "flood", stage: 1, tick: 30, message: "§5Wat§ker §r§5is r§kis§r§5i§kng!" },
		{ on: "flood", stage: 1, tick: 34, message: "§6§kWate§r§5r is §r§6r§kising§k!" },
		{ on: "flood", stage: 1, tick: 35, message: "§4§kWater is rising!" },
		{ on: "flood", stage: 1, tick: 37, message: "§4§k!!§r§4Die§k!!" },
	],

	// The machinery in the walls keeps moving while the room is running
	loops: [
		{ every: 6, actions: [
			{ load: "hard/room3:HardRoom3a", at: [-8, 1, -7] },
			{ tick: 3, load: "hard/room3:HardRoom3b", at: [-8, 1, -7] },
			{ tick: 5, load: "hard/room3:HardRoom3c", at: [-8, 1, -7] },
		] },
	],

	endless: { tunnelAt: [8, 2, -3], start: [11, 3, -1.5], facing: [9, 3, -1.5] },
};
