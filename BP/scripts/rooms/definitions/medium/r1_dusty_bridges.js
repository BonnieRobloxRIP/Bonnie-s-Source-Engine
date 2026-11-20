// Medium · Room 1 · Dusty Bridges
export default {
	room_name: "Dusty Bridges",
	room_type: "r1",
	difficulty: "medium",

	room_map: {
		structure: "medium/room1/3_dusty_bridges:MediumRoom1V3",
		at: [-7, 1, -14],
		nextRoomAnchor: [3, 18, -14],
	},

	// Support blocks behind the wall-mounted button spots
	on_load: [
		{ setblock: "chiseled_stone_bricks", at: [-7, 4, 5] },
		{ setblock: "chiseled_stone_bricks", at: [7, 4, -5] },
	],

	buttons: [
		{
			// A button is placed at every spot below, but only one random spot is the real exit button.
			type: "exit",
			randomPositions: [
				{ at: [-1, 2, 2], facing: "up" },
				{ at: [5, 2, 6], facing: "up" },
				{ at: [5, 2, -2], facing: "up" },
				{ at: [-2, 2, -5], facing: "north" },
				{ at: [-6, 4, 5], facing: "east" },
				{ at: [6, 4, -5], facing: "west" },
				{ at: [6, 8, 0], facing: "up" },
			],
			onPress: [
				{ load: "medium/room1/3_dusty_bridges:MMR1V3M1", at: [-3, 11, -2], anim: 1 },
				{ fill: "air", from: [3, 18, -7], to: [4, 18, -7] },
				{ tick: 10, fill: "air", from: [3, 19, -7], to: [4, 19, -7] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "medium/room1/3_dusty_bridges:MMR1V3F", stages: 17, beginsAt: [-6, 2, -6], startModeDelay: 16, floodIntervalSec: 4 },

	exit: {
		zone: { at: [3, 18, -14], size: [1, 1, 4] },
		leaveZone: { at: [3, 18, -7], size: [1, 1, 0] },
		door: "medium:MediumTunnelDoor",
		doorPos: [3, 18, -8],
	},
};
