// Medium · Room 2 · Mechanical Bridges
export default {
	room_name: "Mechanical Bridges",
	room_type: "r2",
	difficulty: "medium",

	room_map: {
		structure: "medium/room2/3_mechanical_bridges:MediumRoom2V3",
		at: [-7, 1, -14],
		spawnFromPrevious: [-1, -2, -8],
		nextRoomAnchor: [-4, 19, -14],
	},

	buttons: [
		{
			at: [0, 10, -6], facing: "south", type: "parkour",
			onPress: [
				{ sound: "sfx.moving_part2.start" },
				{ load: "medium/room2/3_mechanical_bridges:MMR2V3M1", at: [-6, 8, -1] },
				{ tick: 4, load: "medium/room2/3_mechanical_bridges:MMR2V3M1a", at: [-6, 8, -1] },
				{ tick: 7, load: "medium/room2/3_mechanical_bridges:MMR2V3M1b", at: [-6, 8, -1] },
				{ tick: 10, load: "medium/room2/3_mechanical_bridges:MMR2V3M1c", at: [-6, 8, -1] },
				{ tick: 13, load: "medium/room2/3_mechanical_bridges:MMR2V3M1d", at: [-6, 8, -1] },
				{ tick: 16, load: "medium/room2/3_mechanical_bridges:MMR2V3M1e", at: [-6, 8, -1] },
				{ tick: 16, stopsound: "sfx.moving_part2.start" },
				{ tick: 16, sound: "sfx.moving_part2.stop" },
				{ tick: 20, load: "medium/room2/3_mechanical_bridges:MMR2V3M1f", at: [-6, 9, -1], anim: 1 },
				{ tick: 25, load: "medium/room2/3_mechanical_bridges:MMR2V3M1g", at: [-6, 9, -1], anim: 1 },
				{ tick: 30, load: "medium/room2/3_mechanical_bridges:MMR2V3M1h", at: [-6, 9, -1], anim: 1 },
			],
		},
		{
			at: [-6, 16, -1], facing: "east", type: "exit",
			onPress: [
				{ fill: "air", from: [-3, 19, -7], to: [-4, 19, -7] },
				{ sound: "sfx.moving_part2.start" },
				{ load: "medium/room2/3_mechanical_bridges:MMR2V3M1", at: [-1, 14, -6], rotation: 90 },
				{ tick: 4, load: "medium/room2/3_mechanical_bridges:MMR2V3M1a", at: [-1, 14, -6], rotation: 90 },
				{ tick: 7, load: "medium/room2/3_mechanical_bridges:MMR2V3M1b", at: [-1, 14, -6], rotation: 90 },
				{ tick: 10, fill: "air", from: [-3, 20, -7], to: [-4, 20, -7] },
				{ tick: 10, load: "medium/room2/3_mechanical_bridges:MMR2V3M1c", at: [-1, 14, -6], rotation: 90 },
				{ tick: 10, toast: "gate" },
				{ tick: 13, load: "medium/room2/3_mechanical_bridges:MMR2V3M1d", at: [-1, 14, -6], rotation: 90 },
				{ tick: 16, load: "medium/room2/3_mechanical_bridges:MMR2V3M1e", at: [-1, 14, -6], rotation: 90 },
				{ tick: 16, stopsound: "sfx.moving_part2.start" },
				{ tick: 16, sound: "sfx.moving_part2.stop" },
				{ tick: 20, load: "medium/room2/3_mechanical_bridges:MMR2V3M1f", at: [-1, 15, -6], rotation: 90, anim: 1 },
				{ tick: 25, load: "medium/room2/3_mechanical_bridges:MMR2V3M1g", at: [-1, 15, -6], rotation: 90, anim: 1 },
				{ tick: 30, load: "medium/room2/3_mechanical_bridges:MMR2V3M1h", at: [-1, 15, -6], rotation: 90, anim: 1 },
			],
		},
	],

	flood: { prefix: "medium/room2/3_mechanical_bridges:MMR2V3F", stages: 18, beginsAt: [-6, 2, -6], startModeDelay: 16, floodIntervalSec: 4 },

	exit: {
		zone: { at: [-4, 19, -14], size: [1, 1, 4] },
		leaveZone: { at: [-4, 19, -7], size: [1, 1, 0] },
		doorSound: [-3.5, 19, -8],
		door: "medium:MediumTunnelDoor",
		doorPos: [-4, 19, -8],
	},

	entrance: { doorPos: [1, 2, 8], barrier: [1, 2, 9] },

	endless: { tunnelAt: [0, 1, 8], start: [1.5, 2, 11], facing: [1.5, 2, 7] },
};
