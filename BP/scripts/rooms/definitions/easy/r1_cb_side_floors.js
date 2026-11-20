// Easy · Room 1 · Side Floors
export default {
	room_name: "Side Floors",
	room_type: "r1",
	difficulty: "easy",

	room_map: {
		structure: "easy/room1/7_cb_side_floors:EasyRoom1V7",
		at: [-7, 1, -7],
		nextRoomAnchor: [3, 18, 14],
	},

	buttons: [
		{
			at: [-6, 7, 6], facing: "up", type: "parkour",
			onPress: [
				{ load: "easy/room1/7_cb_side_floors:EMR1V7M1", at: [0, 2, 0] },
				{ tick: 5, load: "easy/room1/7_cb_side_floors:EMR1V7M1a", at: [0, 2, 0] },
				{ tick: 10, load: "easy/room1/7_cb_side_floors:EMR1V7M1b", at: [0, 2, 0] },
				{ tick: 10, load: "easy/room1/7_cb_side_floors:EMR1V7M1c", at: [-4, 7, -4], anim: 1 },
			],
		},
		{
			at: [0, 5, 0], facing: "up", type: "parkour",
			onPress: [
				{ sound: "sfx.moving_part.start" },
				{ load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 15, -7], rotation: 90 },
				{ load: "easy/room1/7_cb_side_floors:EMR1V7M2", at: [-3, 7, -3], anim: 1 },
				{ tick: 3, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 15, -6], rotation: 90 },
				{ tick: 5, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 15, -5], rotation: 90 },
				{ tick: 7, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 15, -4], rotation: 90 },
				{ tick: 9, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 15, -3], rotation: 90 },
				{ tick: 10, load: "easy/room1/7_cb_side_floors:EMR1V7M2a", at: [-3, 7, -3], anim: 1 },
				{ tick: 11, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 15, -2], rotation: 90 },
				{ tick: 13, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 15, -1], rotation: 90 },
				{ tick: 15, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 15, 0], rotation: 90 },
				{ tick: 17, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 15, 1], rotation: 90 },
				{ tick: 19, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 15, 2], rotation: 90 },
				{ tick: 20, load: "easy/room1/7_cb_side_floors:EMR1V7M2b", at: [-3, 7, -3], anim: 1 },
				{ tick: 21, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 15, 3], rotation: 90 },
				{ tick: 23, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 15, 4], rotation: 90 },
				{ tick: 25, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 15, 5], rotation: 90 },
				{ tick: 25, load: "easy/room1/7_cb_side_floors:EMR1V7M3", at: [-1, 15, -1], anim: 1 },
				{ tick: 25, setblock: "polished_andesite", at: [0, 15, -6] },
				{ tick: 25, stopsound: "sfx.moving_part.start" },
				{ tick: 25, sound: "sfx.moving_part.stop" },
				{ tick: 30, load: "easy/room1/7_cb_side_floors:EMR1V7M2c", at: [-3, 7, -3], anim: 1 },
				{ tick: 40, load: "easy/room1/7_cb_side_floors:EMR1V7M2d", at: [-3, 7, -3], anim: 1 },
				{ tick: 50, load: "easy/room1/7_cb_side_floors:EMR1V7M2e", at: [-3, 7, -3], anim: 1 },
			],
		},
		{
			at: [0, 20, -6], facing: "south", type: "exit",
			onPress: [
				{ fill: "air", from: [3, 18, 7], to: [4, 18, 7] },
				{ tick: 10, fill: "air", from: [3, 19, 7], to: [4, 19, 7] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "easy/room1/7_cb_side_floors:EMR1V7F", stages: 17, beginsAt: [-6, 2, -6], startModeDelay: 31, floodIntervalSec: 4 },

	exit: {
		zone: { at: [3, 18, 9], size: [1, 1, 4] },
		leaveZone: { at: [3, 18, 7], size: [1, 1, 0] },
		door: "easy:EasyTunnelDoor",
		doorPos: [3, 18, 8],
	},
};
