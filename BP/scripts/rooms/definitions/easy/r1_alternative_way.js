// Easy · Room 1 · Alternative Way
export default {
	room_name: "Alternative Way",
	room_type: "r1",
	difficulty: "easy",

	room_map: {
		structure: "easy/room1/4_alternative_way:EasyRoom1V4",
		at: [-7, 1, -7],
		nextRoomAnchor: [3, 18, 14],
	},

	buttons: [
		{
			at: [6, 6, 0], facing: "west", type: "parkour",
			onPress: [
				{ sound: "sfx.moving_part.start" },
				{ load: "easy/room1/4_alternative_way:EMR1V4M1", at: [-7, 5, 0] },
				{ tick: 3, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [-6, 5, 0] },
				{ tick: 5, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [-5, 5, 0] },
				{ tick: 7, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [-4, 5, 0] },
				{ tick: 9, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [-3, 5, 0] },
				{ tick: 11, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [-2, 5, 0] },
				{ tick: 13, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [-1, 5, 0] },
				{ tick: 15, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 5, 0] },
				{ tick: 17, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [1, 5, 0] },
				{ tick: 19, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [2, 5, 0] },
				{ tick: 21, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [3, 5, 0] },
				{ tick: 23, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [4, 5, 0] },
				{ tick: 25, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [5, 5, 0] },
				{ tick: 25, setblock: "polished_andesite", at: [-6, 5, 0] },
				{ tick: 25, stopsound: "sfx.moving_part.start" },
				{ tick: 25, sound: "sfx.moving_part.stop" },
			],
		},
		{
			at: [-6, 11, 0], facing: "east", type: "parkour",
			onPress: [
				{ sound: "sfx.moving_part.start" },
				{ load: "easy/room1/4_alternative_way:EMR1V4M1", at: [6, 10, 0], rotation: 180 },
				{ tick: 3, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [5, 10, 0], rotation: 180 },
				{ tick: 5, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [4, 10, 0], rotation: 180 },
				{ tick: 7, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [3, 10, 0], rotation: 180 },
				{ tick: 9, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [2, 10, 0], rotation: 180 },
				{ tick: 11, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [1, 10, 0], rotation: 180 },
				{ tick: 13, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [0, 10, 0], rotation: 180 },
				{ tick: 15, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [-1, 10, 0], rotation: 180 },
				{ tick: 17, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [-2, 10, 0], rotation: 180 },
				{ tick: 19, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [-3, 10, 0], rotation: 180 },
				{ tick: 21, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [-4, 10, 0], rotation: 180 },
				{ tick: 23, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [-5, 10, 0], rotation: 180 },
				{ tick: 25, load: "easy/room1/4_alternative_way:EMR1V4M1", at: [-6, 10, 0], rotation: 180 },
				{ tick: 25, setblock: "polished_andesite", at: [6, 10, 0] },
				{ tick: 25, stopsound: "sfx.moving_part.start" },
				{ tick: 25, sound: "sfx.moving_part.stop" },
			],
		},
		{
			at: [0, 19, -6], facing: "south", type: "exit",
			onPress: [
				{ fill: "air", from: [3, 18, 7], to: [4, 18, 7] },
				{ tick: 10, fill: "air", from: [3, 19, 7], to: [4, 19, 7] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "easy/room1/4_alternative_way:EMR1V4F", stages: 17, beginsAt: [-6, 2, -6], startModeDelay: 31, floodIntervalSec: 4 },

	exit: {
		zone: { at: [3, 18, 9], size: [1, 1, 4] },
		leaveZone: { at: [3, 18, 7], size: [1, 1, 0] },
		door: "easy:EasyTunnelDoor",
		doorPos: [3, 18, 8],
	},
};
