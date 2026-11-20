// Medium · Room 3 · Better Chances
export default {
	room_name: "Better Chances",
	room_type: "r3",
	difficulty: "medium",

	room_map: {
		structure: "medium/room3/2_better_chances:MediumRoom3V2",
		at: [-16, 1, -7],
		spawnFromPrevious: [-3, -2, -8],
	},

	// Support blocks behind the wall-mounted button spots
	on_load: [
		{ setblock: "chiseled_stone_bricks", at: [-1, 12, 7] },
		{ setblock: "chiseled_stone_bricks", at: [-7, 20, -1] },
	],

	buttons: [
		{
			// A button is placed at every spot below, but only one random spot is the real exit button.
			type: "exit",
			randomPositions: [
				{ at: [2, 4, -3], facing: "west" },
				{ at: [4, 4, -3], facing: "east" },
				{ at: [-2, 4, -4], facing: "south" },
				{ at: [-6, 4, 3], facing: "east" },
				{ at: [-1, 8, -3], facing: "west" },
				{ at: [6, 8, -5], facing: "west" },
				{ at: [-3, 12, -2], facing: "north" },
				{ at: [-1, 12, 6], facing: "north" },
				{ at: [6, 16, -6], facing: "up" },
				{ at: [-6, 20, -1], facing: "east" },
			],
			onPress: [
				{ fill: "air", from: [-7, 19, -4], to: [-7, 19, -5] },
				{ tick: 10, fill: "air", from: [-7, 20, -4], to: [-7, 20, -5] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "medium/room3/2_better_chances:MMR3V2F", stages: 18, beginsAt: [-6, 2, -6], startModeDelay: 16, floodIntervalSec: 4 },

	exit: {
		zone: { at: [-15, 19, -5], size: [5, 1, 1] },
		leaveZone: { at: [-7, 19, -5], size: [0, 1, 1] },
		doorSound: [-8, 19.5, -4.5],
		door: "medium:MediumTunnelDoor",
		doorPos: [-8, 19, -5],
		doorRotation: 270,
	},

	entrance: { doorPos: [3, 2, 8], barrier: [3, 2, 9] },

	endless: { tunnelAt: [2, 1, 8], start: [3.5, 2, 11], facing: [3.5, 2, 8] },
};
