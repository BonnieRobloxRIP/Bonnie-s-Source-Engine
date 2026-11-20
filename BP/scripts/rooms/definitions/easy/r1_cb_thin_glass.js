// Easy · Room 1 · Thin Glass
export default {
	room_name: "Thin Glass",
	room_type: "r1",
	difficulty: "easy",

	room_map: {
		structure: "easy/room1/8_cb_thin_glass:EasyRoom1V8",
		at: [-7, 1, -7],
		nextRoomAnchor: [3, 18, 14],
	},

	buttons: [
		{
			at: [0, 8, 0], facing: "up", type: "exit",
			onPress: [
				{ sound: "sfx.moving_part.start" },
				{ fill: "air", from: [-2, 7, -3], to: [2, 8, 3], mode: "destroy" },
				{ fill: "air", from: [3, 18, 7], to: [4, 18, 7] },
				{ tick: 10, fill: "air", from: [3, 19, 7], to: [4, 19, 7] },
				{ tick: 10, toast: "gate" },
				// the bridge slides across, one block every 2 ticks
				{ tick: 1, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 12, 6], rotation: 270 },
				{ tick: 3, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 12, 5], rotation: 270 },
				{ tick: 5, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 12, 4], rotation: 270 },
				{ tick: 7, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 12, 3], rotation: 270 },
				{ tick: 9, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 12, 2], rotation: 270 },
				{ tick: 11, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 12, 1], rotation: 270 },
				{ tick: 13, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 12, 0], rotation: 270 },
				{ tick: 15, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 12, -1], rotation: 270 },
				{ tick: 17, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 12, -2], rotation: 270 },
				{ tick: 19, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 12, -3], rotation: 270 },
				{ tick: 21, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 12, -4], rotation: 270 },
				{ tick: 23, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 12, -5], rotation: 270 },
				{ tick: 25, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 12, -6], rotation: 270 },
				{ tick: 25, setblock: "polished_andesite", at: [0, 12, 6] },
				{ tick: 25, stopsound: "sfx.moving_part.start" },
				{ tick: 25, sound: "sfx.moving_part.stop" },
			],
		},
	],

	flood: { prefix: "easy/room1/8_cb_thin_glass:EMR1V8F", stages: 17, beginsAt: [-6, 2, -6], startModeDelay: 31, floodIntervalSec: 4 },

	exit: {
		zone: { at: [3, 18, 9], size: [1, 1, 4] },
		leaveZone: { at: [3, 18, 7], size: [1, 1, 0] },
		door: "easy:EasyTunnelDoor",
		doorPos: [3, 18, 8],
	},

	events: [
		{ on: "start", tick: 5, fill: "air", from: [-2, 7, -3], to: [2, 8, 3], mode: "destroy" },
		{ on: "start", tick: 5, sound: "sfx.glassbreaking" },
		{ on: "start", tick: 25, load: "easy/room1/8_cb_thin_glass:EMR1V8M1", at: [-2, 7, -3], anim: 2 },
	],

};
