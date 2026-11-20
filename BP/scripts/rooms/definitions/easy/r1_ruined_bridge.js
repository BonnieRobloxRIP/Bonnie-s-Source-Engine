// Easy · Room 1 · Ruined Bridge
export default {
	room_name: "Ruined Bridge",
	room_type: "r1",
	difficulty: "easy",

	room_map: {
		structure: "easy/room1/1_ruined_bridge:EasyRoom1V1",
		at: [-7, 1, -7],
		nextRoomAnchor: [3, 18, 14],
	},

	buttons: [
		{
			at: [6, 6, 5], facing: "west", type: "parkour",
			onPress: [
				{ load: "easy/room1/1_ruined_bridge:EMR1V1M1", at: [-2, 2, -5], anim: 1 },
			],
		},
		{
			at: [-6, 7, 6], facing: "up", type: "parkour",
			onPress: [
				{ load: "easy/room1/1_ruined_bridge:EMR1V1M2", at: [4, 7, -6], anim: 2 },
			],
		},
		{
			at: [6, 14, -2], facing: "up", type: "parkour",
			onPress: [
				{ load: "easy/room1/1_ruined_bridge:EMR1V1M3a", at: [-1, 13, 6], anim: 1 },
				{ tick: 10, load: "easy/room1/1_ruined_bridge:EMR1V1M3", at: [-1, 13, 5], anim: 1 },
			],
		},
		{
			at: [-6, 20, 6], facing: "down", type: "exit",
			onPress: [
				{ fill: "air", from: [3, 18, 7], to: [4, 18, 7] },
				{ tick: 10, fill: "air", from: [3, 19, 7], to: [4, 19, 7] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "easy/room1/1_ruined_bridge:EMR1V1F", stages: 17, beginsAt: [-6, 2, -6], startModeDelay: 31, floodIntervalSec: 4 },

	exit: {
		zone: { at: [3, 18, 9], size: [1, 1, 4] },
		leaveZone: { at: [3, 18, 7], size: [1, 1, 0] },
		door: "easy:EasyTunnelDoor",
		doorPos: [3, 18, 8],
	},
};
