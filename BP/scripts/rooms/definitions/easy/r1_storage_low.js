// Easy · Room 1 · Storage Low
export default {
	room_name: "Storage Low",
	room_type: "r1",
	difficulty: "easy",

	room_map: {
		structure: "easy/room1/3_storage_low:EasyRoom1V3",
		at: [-7, 1, -7],
		nextRoomAnchor: [3, 18, 14],
	},

	buttons: [
		{
			at: [-3, 5, -6], facing: "south", type: "parkour",
			onPress: [
				{ load: "easy/room1/3_storage_low:EMR1V3M1", at: [6, 6, -1], anim: 1 },
				{ load: "easy/room1/3_storage_low:EMR1V3M1b", at: [1, 4, -6] },
				{ tick: 10, load: "easy/room1/3_storage_low:EMR1V3M1a", at: [5, 6, -1], anim: 1 },
				{ tick: 10, load: "easy/room1/3_storage_low:EMR1V3M1c", at: [1, 4, -6] },
			],
		},
		{
			at: [6, 21, -6], facing: "west", type: "exit",
			onPress: [
				{ load: "easy/room1/3_storage_low:EMR1V3M2", at: [6, 18, -2], anim: 1 },
				{ load: "easy/room1/3_storage_low:EMR1V3M2b", at: [2, 16, 5], anim: 1 },
				{ fill: "air", from: [3, 18, 7], to: [4, 18, 7] },
				{ tick: 10, load: "easy/room1/3_storage_low:EMR1V3M2a", at: [5, 18, -2], anim: 1 },
				{ tick: 10, load: "easy/room1/3_storage_low:EMR1V3M2c", at: [2, 16, 5], anim: 1 },
				{ tick: 10, fill: "air", from: [3, 19, 7], to: [4, 19, 7] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "easy/room1/3_storage_low:EMR1V3F", stages: 17, beginsAt: [-6, 2, -6], startModeDelay: 31, floodIntervalSec: 4 },

	exit: {
		zone: { at: [3, 18, 9], size: [1, 1, 4] },
		leaveZone: { at: [3, 18, 7], size: [1, 1, 0] },
		door: "easy:EasyTunnelDoor",
		doorPos: [3, 18, 8],
	},
};
