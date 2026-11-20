// Medium · Room 3 · Electric Tower
export default {
	room_name: "Electric Tower",
	room_type: "r3",
	difficulty: "medium",

	room_map: {
		structure: "medium/room3/3_electric_tower:MediumRoom3V3",
		at: [-16, 1, -7],
		spawnFromPrevious: [-3, -2, -8],
	},

	buttons: [
		{
			at: [-6, 9, 6], facing: "east", type: "parkour",
			onPress: [
				{ load: "medium/room3/3_electric_tower:MMR3V3M1", at: [-1, 7, -1], anim: 2 },
			],
		},
		{
			at: [-6, 15, -6], facing: "south", type: "parkour",
			onPress: [
				{ load: "medium/room3/3_electric_tower:MMR3V3M2", at: [-1, 11, -1], anim: 3 },
			],
		},
		{
			at: [6, 20, -6], facing: "down", type: "exit",
			onPress: [
				{ fill: "air", from: [-7, 19, -4], to: [-7, 19, -5] },
				{ tick: 10, fill: "air", from: [-7, 20, -4], to: [-7, 20, -5] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "medium/room3/3_electric_tower:MMR3V3F", stages: 18, beginsAt: [-6, 2, -6], startModeDelay: 16, floodIntervalSec: 4 },

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
