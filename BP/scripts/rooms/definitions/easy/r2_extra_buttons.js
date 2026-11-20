// Easy · Room 2 · Extra Buttons
export default {
	room_name: "Extra Buttons",
	room_type: "r2",
	difficulty: "easy",

	room_map: {
		structure: "easy/room2/4_extra_buttons:EasyRoom2V4",
		at: [-7, 1, -7],
		spawnFromPrevious: [4, -2, 8],
		nextRoomAnchor: [-4, 19, 14],
	},

	buttons: [
		{
			at: [0, 7, 1], facing: "up", type: "parkour",
			onPress: [
				{ load: "easy/room2/4_extra_buttons:EMR2V4M1", at: [2, 1, 3] },
				{ tick: 3, load: "easy/room2/4_extra_buttons:EMR2V4M1", at: [2, 2, 3] },
				{ tick: 5, load: "easy/room2/4_extra_buttons:EMR2V4M1", at: [2, 3, 3] },
				{ tick: 7, load: "easy/room2/4_extra_buttons:EMR2V4M1", at: [2, 4, 3] },
				{ tick: 9, load: "easy/room2/4_extra_buttons:EMR2V4M1a", at: [2, 5, 3] },
			],
		},
		{
			at: [3, 7, 4], facing: "up", type: "parkour",
			onPress: [
				{ load: "easy/room2/4_extra_buttons:EMR2V4M1", at: [-1, 1, 3] },
				{ tick: 3, load: "easy/room2/4_extra_buttons:EMR2V4M1", at: [-1, 2, 3] },
				{ tick: 5, load: "easy/room2/4_extra_buttons:EMR2V4M1", at: [-1, 3, 3] },
				{ tick: 7, load: "easy/room2/4_extra_buttons:EMR2V4M1", at: [-1, 4, 3] },
				{ tick: 9, load: "easy/room2/4_extra_buttons:EMR2V4M1a", at: [-1, 5, 3] },
			],
		},
		{
			at: [0, 7, 4], facing: "up", type: "parkour",
			onPress: [
				{ load: "easy/room2/4_extra_buttons:EMR2V4M1", at: [-4, 1, 0] },
				{ tick: 3, load: "easy/room2/4_extra_buttons:EMR2V4M1", at: [-4, 2, 0] },
				{ tick: 5, load: "easy/room2/4_extra_buttons:EMR2V4M1", at: [-4, 3, 0] },
				{ tick: 7, load: "easy/room2/4_extra_buttons:EMR2V4M1", at: [-4, 4, 0] },
				{ tick: 9, load: "easy/room2/4_extra_buttons:EMR2V4M1a", at: [-4, 5, 0] },
			],
		},
		{
			at: [-3, 7, 1], facing: "up", type: "parkour",
			onPress: [
				{ load: "easy/room2/4_extra_buttons:EMR2V4M1", at: [-4, 1, 3] },
				{ tick: 3, load: "easy/room2/4_extra_buttons:EMR2V4M1", at: [-4, 2, 3] },
				{ tick: 5, load: "easy/room2/4_extra_buttons:EMR2V4M1", at: [-4, 3, 3] },
				{ tick: 7, load: "easy/room2/4_extra_buttons:EMR2V4M1", at: [-4, 4, 3] },
				{ tick: 9, load: "easy/room2/4_extra_buttons:EMR2V4M1a", at: [-4, 5, 3] },
			],
		},
		{
			at: [-3, 7, 4], facing: "up", type: "parkour",
			onPress: [
				{ load: "easy/room2/4_extra_buttons:EMR2V4M1", at: [2, 1, 0] },
				{ tick: 3, load: "easy/room2/4_extra_buttons:EMR2V4M1", at: [2, 2, 0] },
				{ tick: 5, load: "easy/room2/4_extra_buttons:EMR2V4M1", at: [2, 3, 0] },
				{ tick: 7, load: "easy/room2/4_extra_buttons:EMR2V4M1", at: [2, 4, 0] },
				{ tick: 9, load: "easy/room2/4_extra_buttons:EMR2V4M1a", at: [2, 5, 0] },
			],
		},
		{
			at: [3, 7, 1], facing: "up", type: "parkour",
			onPress: [
				{ load: "easy/room2/4_extra_buttons:EMR2V4M2", at: [6, 7, -1], anim: 1 },
				{ tick: 10, load: "easy/room2/4_extra_buttons:EMR2V4M2a", at: [5, 7, -1], anim: 1 },
			],
		},
		{
			at: [6, 19, -5], facing: "west", type: "exit",
			onPress: [
				{ fill: "air", from: [-3, 19, 7], to: [-4, 19, 7] },
				{ tick: 10, fill: "air", from: [-3, 20, 7], to: [-4, 20, 7] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "easy/room2/4_extra_buttons:EMR2V4F", stages: 18, beginsAt: [-6, 2, -6], startModeDelay: 31, floodIntervalSec: 4 },

	exit: {
		zone: { at: [-4, 19, 8], size: [1, 1, 5] },
		leaveZone: { at: [-4, 19, 7], size: [1, 1, 0] },
		door: "easy:EasyTunnelDoor",
		doorPos: [-4, 19, 8],
	},

	entrance: { doorPos: [-4, 2, -8], barrier: [-4, 2, -13] },

	endless: { tunnelAt: [-5, 1, -14], start: [-3.5, 2, -11], facing: [-3.5, 2, -8] },
};
