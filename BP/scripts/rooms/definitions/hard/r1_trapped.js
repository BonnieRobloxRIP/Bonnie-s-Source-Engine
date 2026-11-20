// Hard · Room 1 · Trapped
export default {
	room_name: "Trapped",
	room_type: "r1",
	difficulty: "hard",

	room_map: {
		structure: "hard/room1/1_trapped:HardRoom1V1",
		at: [-14, 1, -7],
		nextRoomAnchor: [-14, 18, 3],
	},

	buttons: [
		{
			at: [-6, 3, 0], facing: "east", type: "parkour",
			onPress: [
				{ sound: "sfx.moving_part.start" },
				{ load: "hard/room1/1_trapped:HMR1V1M1", at: [-2, 2, -2] },
				{ tick: 10, load: "hard/room1/1_trapped:HMR1V1M1a", at: [-2, 2, -2] },
				{ tick: 20, load: "hard/room1/1_trapped:HMR1V1M1b", at: [-2, 2, -2] },
				{ tick: 20, sound: "sfx.moving_part.stop" },
				{ tick: 20, stopsound: "sfx.moving_part.start" },
			],
		},
		{
			at: [-6, 2, -6], facing: "up", type: "parkour",
			onPress: [
				{ load: "hard/room1/1_trapped:HMR1V1M2a", at: [-3, 6, -3] },
				{ load: "hard/room1/1_trapped:HMR1V1M2", at: [-2, 2, -7] },
				{ tick: 2, load: "hard/room1/1_trapped:HMR1V1M2", at: [1, 3, -7] },
				{ tick: 3, load: "hard/room1/1_trapped:HMR1V1M2", at: [4, 4, -7] },
				{ tick: 4, load: "hard/room1/1_trapped:HMR1V1M2", at: [-5, 6, -7] },
				{ tick: 5, load: "hard/room1/1_trapped:HMR1V1M2", at: [-2, 7, -7] },
				{ tick: 6, load: "hard/room1/1_trapped:HMR1V1M2", at: [2, 8, -7] },
				{ tick: 7, load: "hard/room1/1_trapped:HMR1V1M2", at: [6, 9, -7] },
				{ tick: 10, load: "hard/room1/1_trapped:HMR1V1M2b", at: [-3, 6, -3] },
				{ tick: 10, load: "hard/room1/1_trapped:HMR1V1M2", at: [-2, 2, -6] },
				{ tick: 11, load: "hard/room1/1_trapped:HMR1V1M2", at: [1, 3, -6] },
				{ tick: 12, load: "hard/room1/1_trapped:HMR1V1M2", at: [4, 4, -6] },
				{ tick: 13, load: "hard/room1/1_trapped:HMR1V1M2", at: [-5, 6, -6] },
				{ tick: 14, load: "hard/room1/1_trapped:HMR1V1M2", at: [-2, 7, -6] },
				{ tick: 15, load: "hard/room1/1_trapped:HMR1V1M2", at: [2, 8, -6] },
				{ tick: 16, load: "hard/room1/1_trapped:HMR1V1M2", at: [6, 9, -6] },
				{ tick: 20, load: "hard/room1/1_trapped:HMR1V1M2c", at: [-3, 6, -3] },
				{ tick: 20, load: "hard/room1/1_trapped:HMR1V1M2", at: [-2, 2, -5] },
				{ tick: 21, load: "hard/room1/1_trapped:HMR1V1M2", at: [1, 3, -5] },
				{ tick: 22, load: "hard/room1/1_trapped:HMR1V1M2", at: [4, 4, -5] },
			],
		},
		{
			at: [6, 18, 6], facing: "west", type: "exit",
			onPress: [
				{ fill: "air", from: [-7, 18, 3], to: [-7, 18, 4] },
				{ tick: 10, fill: "air", from: [-7, 19, 3], to: [-7, 19, 4] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "hard/room1/1_trapped:HMR1V1F", stages: 17, beginsAt: [-6, 2, -6], startModeDelay: 11, floodIntervalSec: 3, message: null },

	exit: {
		zone: { at: [-14, 18, 3], size: [4, 1, 1] },
		leaveZone: { at: [-7, 18, 3], size: [0, 1, 1] },
		door: "hard:HardTunnelDoor",
		doorPos: [-8, 18, 3],
		doorRotation: 90,
	},

	events: [
		{ on: "flood", stage: 1, tick: 0, message: "§3Water is rising§k!" },
	],
};
