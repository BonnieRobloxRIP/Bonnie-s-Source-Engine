// Easy · Room 1 · Box Trot
export default {
	room_name: "Box Trot",
	room_type: "r1",
	difficulty: "easy",

	room_map: {
		structure: "easy/room1/5_cb_box_trot:EasyRoom1V5",
		at: [-7, 1, -7],
		nextRoomAnchor: [3, 18, 14],
	},

	buttons: [
		{
			at: [-1, 3, -6], facing: "south", type: "parkour",
			onPress: [
				{ load: "easy/room1/5_cb_box_trot:EMR1V5M1", at: [0, 9, -3], anim: 2 },
			],
		},
		{
			at: [6, 7, 3], facing: "up", type: "parkour",
			onPress: [
				{ load: "easy/room1/5_cb_box_trot:EMR1V5M2", at: [6, 8, -3], anim: 2 },
			],
		},
		{
			at: [3, 10, 6], facing: "up", type: "parkour",
			onPress: [
				{ load: "easy/room1/5_cb_box_trot:EMR1V5M3b", at: [-2, 15, 6], anim: 1 },
				{ load: "easy/room1/5_cb_box_trot:EMR1V5M3", at: [6, 14, -1], anim: 1 },
				{ tick: 10, load: "easy/room1/5_cb_box_trot:EMR1V5M3a", at: [5, 14, -1], anim: 1 },
			],
		},
		{
			at: [-6, 18, 6], facing: "up", type: "exit",
			onPress: [
				{ fill: "air", from: [3, 18, 7], to: [4, 18, 7] },
				{ tick: 10, fill: "air", from: [3, 19, 7], to: [4, 19, 7] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "easy/room1/5_cb_box_trot:EMR1V5F", stages: 17, beginsAt: [-6, 2, -6], startModeDelay: 31, floodIntervalSec: 4 },

	exit: {
		zone: { at: [3, 18, 9], size: [1, 1, 4] },
		leaveZone: { at: [3, 18, 7], size: [1, 1, 0] },
		door: "easy:EasyTunnelDoor",
		doorPos: [3, 18, 8],
	},
};
