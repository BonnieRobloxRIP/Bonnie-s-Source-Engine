// Easy · Room 1 · Crazyblox's Warehouse
export default {
	room_name: "Crazyblox's Warehouse",
	room_type: "r1",
	difficulty: "easy",

	room_map: {
		structure: "easy/room1/9_cb_warehouse:EasyRoom1V9",
		at: [-7, 1, -7],
		nextRoomAnchor: [3, 18, 14],
	},

	buttons: [
		{
			at: [-3, 7, 6], facing: "north", type: "parkour",
			onPress: [
				{ load: "easy/room1/9_cb_warehouse:EMR1V9M1", at: [-6, 6, -1], anim: 2 },
				{ load: "easy/room1/9_cb_warehouse:EMR1V9M1a", at: [-2, 2, -1], anim: 1 },
				{ tick: 5, load: "easy/room1/9_cb_warehouse:EMR1V9M1a", at: [-2, 3, -1], anim: 1 },
				{ tick: 10, load: "easy/room1/9_cb_warehouse:EMR1V9M1a", at: [-2, 4, -1], anim: 1 },
				{ tick: 15, load: "easy/room1/9_cb_warehouse:EMR1V9M1a", at: [-2, 5, -1], anim: 1 },
			],
		},
		{
			at: [-6, 17, -6], facing: "up", type: "exit",
			onPress: [
				{ fill: "air", from: [3, 18, 7], to: [4, 18, 7] },
				{ tick: 10, fill: "air", from: [3, 19, 7], to: [4, 19, 7] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "easy/room1/9_cb_warehouse:EMR1V9F", stages: 17, beginsAt: [-6, 2, -6], startModeDelay: 31, floodIntervalSec: 4 },

	exit: {
		zone: { at: [3, 18, 9], size: [1, 1, 4] },
		leaveZone: { at: [3, 18, 7], size: [1, 1, 0] },
		door: "easy:EasyTunnelDoor",
		doorPos: [3, 18, 8],
	},
};
