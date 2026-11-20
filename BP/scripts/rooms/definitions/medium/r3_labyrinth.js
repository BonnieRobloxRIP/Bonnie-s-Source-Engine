// Medium · Room 3 · Labyrinth
export default {
	room_name: "Labyrinth",
	room_type: "r3",
	difficulty: "medium",

	room_map: {
		structure: "medium/room3/1_labyrinth:MediumRoom3V1",
		at: [-16, 1, -7],
		spawnFromPrevious: [-3, -2, -8],
	},

	buttons: [
		{
			at: [-6, 3, 3], facing: "east", type: "parkour",
			onPress: [
				{ sound: "heavy_metal_door.open", at: [2, 3, -4.5] },
				{ load: "medium/room3/1_labyrinth:MMR3V1M1", at: [2, 3, -5] },
				{ tick: 3, load: "medium/room3/1_labyrinth:MMR3V1M1", at: [2, 2, -5] },
				{ tick: 5, load: "medium/room3/1_labyrinth:MMR3V1M1", at: [2, 1, -5] },
			],
		},
		{
			at: [-1, 6, -2], facing: "east", type: "parkour",
			onPress: [
				{ sound: "heavy_metal_door.open", at: [-3.5, 10, 0] },
				{ load: "medium/room3/1_labyrinth:MMR3V1M2", at: [-5, 6, 2] },
				{ tick: 3, load: "medium/room3/1_labyrinth:MMR3V1M2", at: [-5, 7, 2] },
				{ tick: 5, load: "medium/room3/1_labyrinth:MMR3V1M2", at: [-5, 8, 2] },
			],
		},
		// Two pillars: only one can be up. Raising one lowers the other.
		{
			id: "pillar_a", at: [-6, 11, 4], facing: "east", type: "mechanical",
			onPress: [
				{ play: "lower_b", if: { b_up: 1 } },
				{ load: "medium/room3/1_labyrinth:MMR3V1M3a", at: [0, 10, 4] },
				{ tick: 3, load: "medium/room3/1_labyrinth:MMR3V1M3a", at: [0, 11, 4] },
				{ tick: 5, load: "medium/room3/1_labyrinth:MMR3V1M3a", at: [0, 12, 4] },
				{ tick: 7, load: "medium/room3/1_labyrinth:MMR3V1M3a", at: [0, 13, 4] },
				{ tick: 10, set: { a_up: 1 } },
			],
		},
		{
			id: "pillar_b", at: [6, 11, 5], facing: "west", type: "mechanical",
			onPress: [
				{ play: "lower_a", if: { a_up: 1 } },
				{ load: "medium/room3/1_labyrinth:MMR3V1M3a", at: [4, 10, 3] },
				{ tick: 3, load: "medium/room3/1_labyrinth:MMR3V1M3a", at: [4, 11, 3] },
				{ tick: 5, load: "medium/room3/1_labyrinth:MMR3V1M3a", at: [4, 12, 3] },
				{ tick: 10, set: { b_up: 1 } },
			],
		},
		{
			// Switch: raises whichever pillar is down. Re-arms itself after 1 second.
			id: "switch", at: [2, 16, 6], facing: "north", type: "mechanical", repeatable: true,
			onPress: [
				{ press: "pillar_b", unless: { b_up: 1 } },
				{ press: "pillar_a", if: { b_up: 1 } },
				{ tick: 20 },
			],
		},
		{
			at: [6, 20, 6], facing: "north", type: "exit",
			onPress: [
				{ load: "medium/room3/1_labyrinth:MMR3V1M4", at: [0, 16, -6], anim: 1 },
				{ fill: "air", from: [-7, 19, -4], to: [-7, 19, -5] },
				{ tick: 10, fill: "air", from: [-7, 20, -4], to: [-7, 20, -5] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "medium/room3/1_labyrinth:MMR3V1F", stages: 18, beginsAt: [-6, 2, -6], startModeDelay: 16, floodIntervalSec: 4 },

	exit: {
		zone: { at: [-15, 19, -5], size: [5, 1, 1] },
		leaveZone: { at: [-7, 19, -5], size: [0, 1, 1] },
		doorSound: [-8, 19.5, -4.5],
		door: "medium:MediumTunnelDoor",
		doorPos: [-8, 19, -5],
		doorRotation: 270,
	},

	sequences: {
		lower_a: [
			{ load: "medium/room3/1_labyrinth:MMR3V1M3", at: [0, 13, 4] },
			{ tick: 3, load: "medium/room3/1_labyrinth:MMR3V1M3", at: [0, 12, 4] },
			{ tick: 5, load: "medium/room3/1_labyrinth:MMR3V1M3", at: [0, 11, 4] },
			{ tick: 7, load: "medium/room3/1_labyrinth:MMR3V1M3", at: [0, 10, 4] },
			{ tick: 9, set: { a_up: 0 } },
			{ tick: 9, rearm: "pillar_a" },
		],
		lower_b: [
			{ load: "medium/room3/1_labyrinth:MMR3V1M3", at: [4, 12, 3] },
			{ tick: 3, load: "medium/room3/1_labyrinth:MMR3V1M3", at: [4, 11, 3] },
			{ tick: 5, load: "medium/room3/1_labyrinth:MMR3V1M3", at: [4, 10, 3] },
			{ tick: 9, set: { b_up: 0 } },
			{ tick: 9, rearm: "pillar_b" },
		],
	},

	entrance: { doorPos: [3, 2, 8], barrier: [3, 2, 9] },


	endless: { tunnelAt: [2, 1, 8], start: [3.5, 2, 11], facing: [3.5, 2, 8] },
};
