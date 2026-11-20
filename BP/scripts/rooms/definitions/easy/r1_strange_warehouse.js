// Easy · Room 1 · Warehouse
export default {
	room_name: "Warehouse",
	room_type: "r1",
	difficulty: "easy",

	room_map: {
		structure: "easy/room1/2_warehouse:EasyRoom1V2",
		at: [-7, 1, -7],
		nextRoomAnchor: [3, 18, 14],
	},

	buttons: [
		{
			at: [6, 2, 6], facing: "up", type: "parkour",
			onPress: [
				{ sound: "sfx.doors.tunnelopen", at: [-3, 3, 4.5] },
				{ load: "easy/room1/2_warehouse:EMR1V2M1", at: [-3, 2, 4] },
				{ tick: 3, load: "easy/room1/2_warehouse:EMR1V2M1a", at: [-3, 2, 4] },
				{ tick: 5, load: "easy/room1/2_warehouse:EMR1V2M1b", at: [-3, 2, 4] },
			],
		},
		{
			at: [-6, 3, 3], facing: "south", type: "parkour",
			onPress: [
				{ sound: "sfx.doors.tunnelopen", at: [-3, 3, -4.5] },
				{ load: "easy/room1/2_warehouse:EMR1V2M1", at: [-3, 2, -5] },
				{ tick: 3, load: "easy/room1/2_warehouse:EMR1V2M1a", at: [-3, 2, -5] },
				{ tick: 5, load: "easy/room1/2_warehouse:EMR1V2M1b", at: [-3, 2, -5] },
			],
		},
		{
			at: [-6, 3, -3], facing: "north", type: "parkour",
			onPress: [
				{ load: "easy/room1/2_warehouse:EMR1V2M2", at: [-6, 4, -1], anim: 1 },
			],
		},
		{
			at: [6, 11, 6], facing: "up", type: "parkour",
			onPress: [
				{ load: "easy/room1/2_warehouse:EMR1V2M3", at: [-5, 5, -6] },
				{ tick: 4, load: "easy/room1/2_warehouse:EMR1V2M3a", at: [-5, 5, -6] },
				{ tick: 7, load: "easy/room1/2_warehouse:EMR1V2M3b", at: [-5, 5, -6] },
			],
		},
		{
			at: [-6, 16, -6], facing: "east", type: "parkour",
			onPress: [
				{ load: "easy/room1/2_warehouse:EMR1V2M4", at: [-4, 13, -4], anim: 1 },
			],
		},
		{
			at: [-6, 18, 6], facing: "north", type: "exit",
			onPress: [
				{ load: "easy/room1/2_warehouse:EMR1V2M5", at: [6, 16, -3], anim: 1 },
				{ fill: "air", from: [3, 18, 7], to: [4, 18, 7] },
				{ tick: 10, fill: "air", from: [3, 19, 7], to: [4, 19, 7] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "easy/room1/2_warehouse:EMR1V2F", stages: 17, beginsAt: [-6, 2, -6], startModeDelay: 31, floodIntervalSec: 4 },

	exit: {
		zone: { at: [3, 18, 9], size: [1, 1, 4] },
		leaveZone: { at: [3, 18, 7], size: [1, 1, 0] },
		door: "easy:EasyTunnelDoor",
		doorPos: [3, 18, 8],
	},
};
