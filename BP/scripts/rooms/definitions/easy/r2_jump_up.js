// Easy · Room 2 · Jump Up!
export default {
	room_name: "Jump Up!",
	room_type: "r2",
	difficulty: "easy",

	room_map: {
		structure: "easy/room2/1_jump_up:EasyRoom2V1",
		at: [-7, 1, -7],
		spawnFromPrevious: [3, -4, 8],
		nextRoomAnchor: [3, 19, 14],
	},

	buttons: [
		{
			at: [6, 8, -6], facing: "up", type: "parkour",
			onPress: [
				{ load: "easy/room2/1_jump_up:EMR2V1M1", at: [-4, 4, -2], anim: 1 },
			],
		},
		{
			at: [-3, 9, 3], facing: "up", type: "parkour",
			onPress: [
				{ load: "easy/room2/1_jump_up:EMR2V1M2a", at: [6, 7, -2], anim: 1 },
				{ tick: 10, load: "easy/room2/1_jump_up:EMR2V1M2", at: [5, 7, -2], anim: 1 },
			],
		},
		{
			at: [-6, 14, -6], facing: "east", type: "parkour",
			onPress: [
				{ load: "easy/room2/1_jump_up:EMR2V1M3b", at: [-2, 12, 4], anim: 1 },
				{ tick: 10, load: "easy/room2/1_jump_up:EMR2V1M3a", at: [-2, 12, 4], anim: 1 },
				{ tick: 20, load: "easy/room2/1_jump_up:EMR2V1M3", at: [-2, 12, 4], anim: 1 },
			],
		},
		{
			at: [-6, 15, 6], facing: "up", type: "parkour",
			onPress: [
				{ load: "easy/room2/1_jump_up:EMR2V1M4a", at: [4, 12, -6], anim: 1 },
				{ tick: 10, load: "easy/room2/1_jump_up:EMR2V1M4", at: [4, 12, -6], anim: 1 },
			],
		},
		{
			at: [-6, 20, 6], facing: "down", type: "parkour",
			onPress: [
				{ load: "easy/room2/1_jump_up:EMR2V1M5a", at: [6, 18, -4], anim: 1 },
				{ tick: 10, load: "easy/room2/1_jump_up:EMR2V1M5", at: [5, 18, -4], anim: 1 },
			],
		},
		{
			at: [-6, 19, -6], facing: "east", type: "exit",
			onPress: [
				{ fill: "air", from: [3, 19, 7], to: [4, 19, 7] },
				{ tick: 10, fill: "air", from: [3, 20, 7], to: [4, 20, 7] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "easy/room2/1_jump_up:EMR2V1F", stages: 17, beginsAt: [-6, 3, -6], startModeDelay: 31, floodIntervalSec: 4 },

	exit: {
		zone: { at: [3, 19, 8], size: [1, 1, 5] },
		leaveZone: { at: [3, 19, 7], size: [1, 1, 0] },
		door: "easy:EasyTunnelDoor",
		doorPos: [3, 19, 8],
	},

	entrance: { doorPos: [-3, 4, -8], barrier: [-3, 4, -13] },

	events: [
		{ on: "flood", stage: 1, tick: 0, fill: "air", from: [3, 3, 3], to: [-3, 3, -3], mode: "destroy" },
		{ on: "flood", stage: 1, tick: 0, sound: "sfx.glassbreaking" },
	],

	endless: { tunnelAt: [-4, 3, -14], start: [-2.5, 4, -11], facing: [-2.5, 4, -8] },
};
