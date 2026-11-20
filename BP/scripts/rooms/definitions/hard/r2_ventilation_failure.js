// Hard · Room 2 · Ventilation Failure
export default {
	room_name: "Ventilation Failure",
	room_type: "r2",
	difficulty: "hard",
	title: { tick: 110 },

	room_map: {
		structure: "hard/room2/1_ventilation_failure:HardRoom2V1",
		at: [-14, 1, -7],
		spawnFromPrevious: [-8, -2, -3],
		nextRoomAnchor: [-14, 19, 3],
	},

	buttons: [
		{
			at: [-3, 3, 4], facing: "north", type: "parkour",
			onPress: [
				{ sound: "tile.piston.in", at: [3, 3, 4] },
				{ load: "hard/room2/1_ventilation_failure:HMR2V1M1d", at: [-6, 2, 2] },
				{ tick: 5, load: "hard/room2/1_ventilation_failure:HMR2V1M1e", at: [-6, 2, 2], anim: 1 },
				{ tick: 5, sound: "tile.piston.out", at: [3, 3, 4] },
			],
		},
		{
			at: [-6, 2, -6], facing: "up", type: "parkour",
			onPress: [
				{ sound: "sfx.moving_part.start" },
				{ load: "hard/room2/1_ventilation_failure:HMR2V1M2", at: [-4, 2, -1] },
				{ tick: 3, load: "hard/room2/1_ventilation_failure:HMR2V1M2a", at: [-4, 2, -1] },
				{ tick: 5, load: "hard/room2/1_ventilation_failure:HMR2V1M2b", at: [-4, 2, -1] },
				{ tick: 7, load: "hard/room2/1_ventilation_failure:HMR2V1M2c", at: [-4, 2, -1] },
				{ tick: 9, load: "hard/room2/1_ventilation_failure:HMR2V1M2d", at: [-4, 2, -1] },
				{ tick: 11, load: "hard/room2/1_ventilation_failure:HMR2V1M2e", at: [-4, 2, -1] },
				{ tick: 13, load: "hard/room2/1_ventilation_failure:HMR2V1M2f", at: [-4, 2, -1] },
				{ tick: 13, sound: "sfx.moving_part.stop" },
				{ tick: 13, stopsound: "sfx.moving_part.start" },
			],
		},
		{
			at: [6, 16, 5], facing: "west", type: "exit",
			onPress: [
				{ fill: "air", from: [-7, 19, 3], to: [-7, 19, 4] },
				{ tick: 10, fill: "air", from: [-7, 20, 3], to: [-7, 20, 4] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "hard/room2/1_ventilation_failure:HMR2V1F", stages: 18, beginsAt: [-6, 2, -6], startModeDelay: 16, floodIntervalSec: 3, message: null },

	exit: {
		zone: { at: [-14, 19, 3], size: [4, 1, 1] },
		leaveZone: { at: [-7, 19, 3], size: [0, 1, 1] },
		doorSound: [-8, 19, 3.5],
		door: "hard:HardTunnelDoor",
		doorPos: [-8, 19, 3],
		doorRotation: 90,
	},

	entrance: { doorPos: [8, 2, 3], rotation: 90, barrier: [9, 2, 3] },

	events: [
		{ on: "start", tick: 61, load: "hard:HardTunnelDoor2", at: [-8, 2, 3], rotation: 90 },
		{ on: "start", tick: 61, sound: "sfx.doors.tunnelopen", at: [-8, 3, 3.5] },
		{ on: "start", tick: 65, sound: "sfx.powerdown" },
		{ on: "start", tick: 65, command: "scoreboard players random metal lobby 1 7" },
		{ on: "start", tick: 65, load: "hard/room2/1_ventilation_failure:HMR2V1M1a", at: [-6, 2, 2] },
		{ on: "start", tick: 67, load: "hard/room2/1_ventilation_failure:HMR2V1M1", at: [-6, 2, 2] },
		{ on: "start", tick: 69, load: "hard/room2/1_ventilation_failure:HMR2V1M1a", at: [-6, 2, 2] },
		{ on: "start", tick: 78, load: "hard/room2/1_ventilation_failure:HMR2V1M1b", at: [-6, 2, 2] },
		{ on: "start", tick: 78, sound: "tile.piston.in", at: [-3, 3, 4] },
		{ on: "start", tick: 81, sound: "tile.piston.out", at: [-3, 3, 4] },
		{ on: "start", tick: 81, load: "hard/room2/1_ventilation_failure:HMR2V1M1c", at: [-6, 2, 2] },
		{ on: "start", tick: 81, message: "§4§lAdditional Objective: §r§4Ventilation Failure, Detected. Room destination re-routed. Proceed thought the emergency hatch." },
		{ on: "flood", stage: 1, tick: 0, message: "§3Water is r§kis§r§3ing§k!" },
	],

	endless: { tunnelAt: [8, 1, 2], start: [11, 2, 3.5], facing: [9, 2, 3.5] },
};
