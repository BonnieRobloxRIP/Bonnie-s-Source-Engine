// Easy · Room 2 · Limited Time
export default {
	room_name: "Limited Time",
	room_type: "r2",
	difficulty: "easy",

	room_map: {
		structure: "easy/room2/2_limited_time:EasyRoom2V2",
		at: [-7, 1, -7],
		spawnFromPrevious: [4, -2, 8],
		nextRoomAnchor: [-5, 19, 14],
	},

	buttons: [
		{
			at: [-6, 6, 6], facing: "east", type: "parkour",
			onPress: [
				{ load: "easy/room2/2_limited_time:EMR2V2M1", at: [-2, 1, -2] },
				{ tick: 5, sound: "silo_door.opened", at: [0, 3, 0] },
				{ tick: 5, load: "easy/room2/2_limited_time:EMR2V2M1a", at: [-2, 1, -2] },
				{ tick: 10, load: "easy/room2/2_limited_time:EMR2V2M1b", at: [-2, 1, -2] },
			],
		},
		{
			at: [-6, 10, -6], facing: "south", type: "parkour",
			onPress: [
				{ load: "easy/room2/2_limited_time:EMR2V2M2", at: [-6, 7, 3], anim: 1 },
				{ tick: 6, load: "easy/room2/2_limited_time:EMR2V2M2a", at: [-6, 7, 3], anim: 1 },
			],
		},
		{
			at: [-6, 10, 6], facing: "north", type: "parkour",
			onPress: [
				{ sound: "sfx.glassbreaking" },
				{ fill: "air", from: [2, 7, -1], to: [2, 9, 1], mode: "destroy" },
				{ load: "easy/room2/2_limited_time:EMR2V2M3", at: [6, 7, 0], anim: 1 },
				{ tick: 6, load: "easy/room2/2_limited_time:EMR2V2M3a", at: [5, 7, 0], anim: 1 },
			],
		},
		{
			at: [6, 11, 6], facing: "north", type: "parkour",
			onPress: [
				{ load: "easy/room2/2_limited_time:EMR2V2M4", at: [6, 8, -6], anim: 1 },
				{ tick: 10, load: "easy/room2/2_limited_time:EMR2V2M4a", at: [5, 8, -6], anim: 1 },
			],
		},
		{
			at: [6, 11, -6], facing: "south", type: "exit",
			onPress: [
				{ load: "easy/room2/2_limited_time:EMR2V2M5", at: [-1, 7, -1], anim: 2 },
				{ fill: "air", from: [-4, 19, 7], to: [-5, 19, 7] },
				{ tick: 10, fill: "air", from: [-4, 20, 7], to: [-5, 20, 7] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "easy/room2/2_limited_time:EMR2V2F", stages: 18, beginsAt: [-6, 2, -6], startModeDelay: 31, floodIntervalSec: 4 },

	exit: {
		zone: { at: [-5, 19, 8], size: [1, 1, 5] },
		leaveZone: { at: [-5, 19, 7], size: [1, 1, 0] },
		doorSound: [-4.5, 19, 8],
		door: "easy:EasyTunnelDoor",
		doorPos: [-5, 19, 8],
	},

	entrance: { doorPos: [-4, 2, -8], barrier: [-4, 2, -13] },

	endless: { tunnelAt: [-5, 1, -14], start: [-3.5, 2, -11], facing: [-3.5, 2, -8] },
};
