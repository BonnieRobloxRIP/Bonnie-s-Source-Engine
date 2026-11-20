// Easy · Room 1 · Power Failure
export default {
	room_name: "Power Failure",
	room_type: "r1",
	difficulty: "easy",

	room_map: {
		structure: "easy/room1/6_cb_power_failure:EasyRoom1V6",
		at: [-7, 1, -7],
		nextRoomAnchor: [3, 18, 14],
	},

	buttons: [
		{
			at: [6, 7, 6], facing: "up", type: "parkour",
			onPress: [
				{ sound: "sfx.moving_part.start" },
				{ load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 7, 6], rotation: 270 },
				{ tick: 3, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 7, 5], rotation: 270 },
				{ tick: 5, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 7, 4], rotation: 270 },
				{ tick: 7, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 7, 3], rotation: 270 },
				{ tick: 9, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 7, 2], rotation: 270 },
				{ tick: 11, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 7, 1], rotation: 270 },
				{ tick: 13, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 7, 0], rotation: 270 },
				{ tick: 15, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 7, -1], rotation: 270 },
				{ tick: 17, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 7, -2], rotation: 270 },
				{ tick: 19, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 7, -3], rotation: 270 },
				{ tick: 21, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 7, -4], rotation: 270 },
				{ tick: 23, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 7, -5], rotation: 270 },
				{ tick: 25, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 7, -6], rotation: 270 },
				{ tick: 25, stopsound: "sfx.moving_part.start" },
				{ tick: 25, sound: "sfx.moving_part.stop" },
				{ tick: 25, setblock: "polished_andesite", at: [0, 7, 6] },
			],
		},
		{
			at: [-6, 9, -6], facing: "up", type: "parkour",
			onPress: [
				{ load: "easy/room1/6_cb_power_failure:EMR1V6M1", at: [-6, 10, 3], anim: 1 },
				{ tick: 10, load: "easy/room1/6_cb_power_failure:EMR1V6M1a", at: [-6, 10, 3], anim: 1 },
				{ tick: 10, load: "easy/room1/6_cb_power_failure:EMR1V6M2", at: [0, 14, -3] },
				{ tick: 20, load: "easy/room1/6_cb_power_failure:EMR1V6M1b", at: [-6, 10, 3], anim: 1 },
				{ tick: 20, load: "easy/room1/6_cb_power_failure:EMR1V6M2a", at: [0, 14, -3] },
			],
		},
		{
			at: [0, 16, -6], facing: "south", type: "exit",
			onPress: [
				{ fill: "air", from: [3, 18, 7], to: [4, 18, 7] },
				{ tick: 10, fill: "air", from: [3, 19, 7], to: [4, 19, 7] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "easy/room1/6_cb_power_failure:EMR1V6F", stages: 17, beginsAt: [-6, 2, -6], startModeDelay: 31, floodIntervalSec: 4 },

	exit: {
		zone: { at: [3, 18, 9], size: [1, 1, 4] },
		leaveZone: { at: [3, 18, 7], size: [1, 1, 0] },
		door: "easy:EasyTunnelDoor",
		doorPos: [3, 18, 8],
	},
};
