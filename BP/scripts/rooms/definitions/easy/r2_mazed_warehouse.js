// Easy · Room 2 · Mazed Warehouse
export default {
	room_name: "Mazed Warehouse",
	room_type: "r2",
	difficulty: "easy",

	room_map: {
		structure: "easy/room2/3_mazed_warehouse:EasyRoom2V3",
		at: [-7, 1, -7],
		spawnFromPrevious: [3, -2, 8],
		nextRoomAnchor: [3, 19, 14],
	},

	buttons: [
		{
			at: [-5, 11, -6], facing: "south", type: "exit",
			onPress: [
				{ fill: "air", from: [3, 19, 7], to: [4, 19, 7] },
				{ tick: 10, fill: "air", from: [3, 20, 7], to: [4, 20, 7] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "easy/room2/3_mazed_warehouse:EMR2V3F", stages: 18, beginsAt: [-6, 2, -6], startModeDelay: 31, floodIntervalSec: 4 },

	exit: {
		zone: { at: [3, 19, 8], size: [1, 1, 5] },
		leaveZone: { at: [3, 19, 7], size: [1, 1, 0] },
		door: "easy:EasyTunnelDoor",
		doorPos: [3, 19, 8],
	},

	entrance: { doorPos: [-3, 2, -8], barrier: [-3, 2, -13] },

	endless: { tunnelAt: [-4, 1, -14], start: [-2.5, 2, -11], facing: [-2.5, 2, -8] },
};
