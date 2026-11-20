// Medium · Room 1 · Stone Platforms
export default {
	room_name: "Stone Platforms",
	room_type: "r1",
	difficulty: "medium",

	room_map: {
		structure: "medium/room1/1_stone_platforms:MediumRoom1V1",
		at: [-7, 1, -14],
		nextRoomAnchor: [3, 18, -14],
	},

	buttons: [
		{
			at: [-6, 3, 6], facing: "north", type: "parkour",
			onPress: [
				{ load: "medium/room1/1_stone_platforms:MMR1V1M1", at: [3, 2, -5] },
				{ tick: 10, load: "medium/room1/1_stone_platforms:MMR1V1M1a", at: [3, 2, -5] },
				{ tick: 20, load: "medium/room1/1_stone_platforms:MMR1V1M1b", at: [3, 2, -5] },
			],
		},
		{
			at: [6, 11, -6], facing: "west", type: "parkour",
			onPress: [
				{ tick: 2, load: "medium/room1/1_stone_platforms:MMR1V1M2", at: [1, 1, -1] },
				{ tick: 4, load: "medium/room1/1_stone_platforms:MMR1V1M2", at: [1, 2, -1] },
				{ tick: 6, load: "medium/room1/1_stone_platforms:MMR1V1M2", at: [1, 3, -1] },
				{ tick: 8, load: "medium/room1/1_stone_platforms:MMR1V1M2", at: [1, 4, -1] },
				{ tick: 10, load: "medium/room1/1_stone_platforms:MMR1V1M2", at: [1, 5, -1] },
				{ tick: 12, load: "medium/room1/1_stone_platforms:MMR1V1M2", at: [1, 6, -1] },
				{ tick: 14, load: "medium/room1/1_stone_platforms:MMR1V1M2", at: [1, 7, -1] },
				{ tick: 16, load: "medium/room1/1_stone_platforms:MMR1V1M2", at: [1, 8, -1] },
				{ tick: 20, load: "medium/room1/1_stone_platforms:MMR1V1M2", at: [1, 9, -1] },
				{ tick: 20, setblock: "chiseled_stone_bricks", at: [1, 2, -1] },
				{ tick: 25, load: "medium/room1/1_stone_platforms:MMR1V1M2a", at: [0, 9, -2] },
				{ tick: 30, load: "medium/room1/1_stone_platforms:MMR1V1M2b", at: [0, 9, -2] },
			],
		},
		{
			at: [-6, 19, -6], facing: "up", type: "exit",
			onPress: [
				{ fill: "air", from: [3, 18, -7], to: [4, 18, -7] },
				{ tick: 10, fill: "air", from: [3, 19, -7], to: [4, 19, -7] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "medium/room1/1_stone_platforms:MMR1V1F", stages: 17, beginsAt: [-6, 2, -6], startModeDelay: 16, floodIntervalSec: 4 },

	exit: {
		zone: { at: [3, 18, -14], size: [1, 1, 4] },
		leaveZone: { at: [3, 18, -7], size: [1, 1, 0] },
		door: "medium:MediumTunnelDoor",
		doorPos: [3, 18, -8],
	},
};
