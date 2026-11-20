// Easy · Room 3 · Pipeline
export default {
	room_name: "Pipeline",
	room_type: "r3",
	difficulty: "easy",

	room_map: {
		structure: "easy/room3/2_pipeline:EasyRoom3V2",
		at: [-7, 1, -7],
		spawnFromPrevious: [2, -2, 8],
		nextRoomAnchor: [9, 19, 4],
	},

	buttons: [
		{
			at: [-6, 3, -5], facing: "east", type: "parkour",
			onPress: [
				{ load: "easy/room3/2_pipeline:EMR3V2M1", at: [1, 2, 4], anim: 1 },
			],
		},
		{
			at: [6, 18, -4], facing: "west", type: "parkour",
			onPress: [
				{ load: "easy/room3/2_pipeline:EMR3V2M2", at: [0, 16, -6] },
				{ tick: 5, load: "easy/room3/2_pipeline:EMR3V2M2a", at: [0, 16, -6] },
			],
		},
		{
			at: [2, 21, -6], facing: "south", type: "parkour",
			onPress: [
				{ sound: "sfx.elevator.loop" },
				{ load: "easy/room3/2_pipeline:EMR3V2M3", at: [-2, 17, -2] },
				{ tick: 8, load: "easy/room3/2_pipeline:EMR3V2M3a", at: [-2, 17, -2] },
				{ tick: 8, sound: "sfx.elevator.stop" },
				{ tick: 8, stopsound: "sfx.elevator.loop" },
			],
		},
		{
			at: [0, 18, 0], facing: "up", type: "exit",
			onPress: [
				{ fill: "air", from: [7, 19, 4], to: [4, 19, 5] },
				{ tick: 10, fill: "air", from: [7, 20, 4], to: [4, 20, 5] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "easy/room3/2_pipeline:EMR3V2F", stages: 18, beginsAt: [-6, 2, -6], startModeDelay: 31, floodIntervalSec: 4 },

	exit: {
		zone: { at: [8, 19, 4], size: [6, 1, 1] },
		leaveZone: { at: [7, 19, 4], size: [0, 1, 1] },
		doorSound: [8, 19.5, 4.5],
		door: "easy:EasyTunnelDoor",
		doorPos: [8, 19, 4],
		doorRotation: 270,
	},

	entrance: { doorPos: [-2, 2, -8], barrier: [-2, 2, -13], soundAt: [-3.5, 3, -8] },

	endless: { tunnelAt: [-3, 1, -14], start: [-1.5, 2, -11], facing: [-1.5, 2, -8] },
};
