// Easy · Room 3 · Wooden Highground
export default {
	room_name: "Wooden Highground",
	room_type: "r3",
	difficulty: "easy",

	room_map: {
		structure: "easy/room3/4_wooden_highground:EasyRoom3V4",
		at: [-7, 1, -7],
		spawnFromPrevious: [-1, -2, 8],
		nextRoomAnchor: [9, 19, 4],
	},

	buttons: [
		{
			at: [-6, 7, -6], facing: "south", type: "parkour",
			onPress: [
				{ load: "easy/room3/4_wooden_highground:EMR3V4M1", at: [-3, 2, -3] },
				{ tick: 5, load: "easy/room3/4_wooden_highground:EMR3V4M1a", at: [-3, 2, -3] },
				{ tick: 10, load: "easy/room3/4_wooden_highground:EMR3V4M1b", at: [-3, 2, -3] },
			],
		},
		{
			at: [6, 6, -6], facing: "south", type: "parkour",
			onPress: [
				{ load: "easy/room3/4_wooden_highground:EMR3V4M2", at: [-6, 12, 2] },
				{ tick: 5, load: "easy/room3/4_wooden_highground:EMR3V4M2", at: [-6, 11, 2] },
				{ tick: 9, load: "easy/room3/4_wooden_highground:EMR3V4M2", at: [-6, 10, 2] },
				{ tick: 14, load: "easy/room3/4_wooden_highground:EMR3V4M2", at: [-6, 9, 2] },
				{ tick: 19, load: "easy/room3/4_wooden_highground:EMR3V4M2", at: [-6, 8, 2] },
				{ tick: 24, load: "easy/room3/4_wooden_highground:EMR3V4M2", at: [-6, 7, 2] },
				{ tick: 29, load: "easy/room3/4_wooden_highground:EMR3V4M2a", at: [-6, 6, 2] },
			],
		},
		{
			at: [0, 10, 6], facing: "north", type: "parkour",
			onPress: [
				{ load: "easy/room3/4_wooden_highground:EMR3V4M3", at: [1, 9, -6] },
				{ tick: 5, load: "easy/room3/4_wooden_highground:EMR3V4M3a", at: [1, 9, -6] },
				{ tick: 10, load: "easy/room3/4_wooden_highground:EMR3V4M3b", at: [1, 9, -6] },
			],
		},
		{
			at: [-6, 20, 6], facing: "north", type: "exit",
			onPress: [
				{ load: "easy/room3/4_wooden_highground:EMR3V4M4", at: [5, 17, 2] },
				{ fill: "air", from: [7, 19, 4], to: [4, 19, 5] },
				{ tick: 5, load: "easy/room3/4_wooden_highground:EMR3V4M4a", at: [5, 17, 2] },
				{ tick: 9, load: "easy/room3/4_wooden_highground:EMR3V4M4b", at: [5, 17, 2] },
				{ tick: 10, fill: "air", from: [7, 20, 4], to: [4, 20, 5] },
				{ tick: 10, toast: "gate" },
				{ tick: 14, load: "easy/room3/4_wooden_highground:EMR3V4M4c", at: [5, 17, 2] },
			],
		},
	],

	flood: { prefix: "easy/room3/4_wooden_highground:EMR3V4F", stages: 18, beginsAt: [-6, 2, -6], startModeDelay: 31, floodIntervalSec: 4 },

	exit: {
		zone: { at: [8, 19, 4], size: [6, 1, 1] },
		leaveZone: { at: [7, 19, 4], size: [0, 1, 1] },
		doorSound: [8, 19.5, 4.5],
		door: "easy:EasyTunnelDoor",
		doorPos: [8, 19, 4],
		doorRotation: 270,
		floodFill: null,
	},

	entrance: { doorPos: [1, 2, -8], barrier: [1, 2, -13] },

	endless: { tunnelAt: [0, 1, -14], start: [1.5, 2, -11], facing: [1.5, 2, -8] },
};
