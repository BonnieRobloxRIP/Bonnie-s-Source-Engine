// Easy · Room 3 · The Wall
export default {
	room_name: "The Wall",
	room_type: "r3",
	difficulty: "easy",

	room_map: {
		structure: "easy/room3/1_the_wall:EasyRoom3V1",
		at: [-7, 1, -7],
		spawnFromPrevious: [-3, -2, 8],
		nextRoomAnchor: [9, 19, 4],
	},

	buttons: [
		{
			at: [-2, 5, -6], facing: "up", type: "parkour",
			onPress: [
				{ sound: "sfx.doors.tunnelopen", at: [3.5, 3, 0] },
				{ load: "easy/room3/1_the_wall:EMR3V1M1", at: [3, 2, 0] },
				{ tick: 2, load: "easy/room3/1_the_wall:EMR3V1M1a", at: [3, 2, 0] },
				{ tick: 5, load: "easy/room3/1_the_wall:EMR3V1M1b", at: [3, 2, 0] },
			],
		},
		{
			at: [5, 10, 6], facing: "north", type: "parkour",
			onPress: [
				{ sound: "sfx.doors.tunnelopen", at: [-3.5, 10, 0] },
				{ load: "easy/room3/1_the_wall:EMR3V1M1", at: [-4, 9, 0] },
				{ tick: 2, load: "easy/room3/1_the_wall:EMR3V1M1a", at: [-4, 9, 0] },
				{ tick: 5, load: "easy/room3/1_the_wall:EMR3V1M1b", at: [-4, 9, 0] },
			],
		},
		{
			at: [-6, 20, 6], facing: "east", type: "parkour",
			onPress: [
				{ fill: "air", from: [-5, 19, 4], to: [-6, 20, 4], mode: "destroy" },
				{ load: "easy/room3/1_the_wall:EMR3V1M2", at: [-5, 18, -6], anim: 1 },
				{ tick: 10, load: "easy/room3/1_the_wall:EMR3V1M2a", at: [-5, 18, -6], anim: 1 },
			],
		},
		{
			at: [-5, 21, -6], facing: "down", type: "exit",
			onPress: [
				{ fill: "air", from: [7, 19, 4], to: [7, 19, 5] },
				{ tick: 10, fill: "air", from: [7, 20, 4], to: [7, 20, 5] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "easy/room3/1_the_wall:EMR3V1F", stages: 18, beginsAt: [-6, 2, -6], startModeDelay: 31, floodIntervalSec: 4 },

	exit: {
		zone: { at: [8, 19, 4], size: [6, 1, 1] },
		leaveZone: { at: [7, 19, 4], size: [0, 1, 1] },
		doorSound: [8, 19.5, 4.5],
		door: "easy:EasyTunnelDoor",
		doorPos: [8, 19, 4],
		doorRotation: 270,
	},

	entrance: { doorPos: [3, 2, -8], barrier: [3, 2, -13] },

	endless: { tunnelAt: [2, 1, -14], start: [3.5, 2, -11], facing: [3.5, 2, -8] },
};
