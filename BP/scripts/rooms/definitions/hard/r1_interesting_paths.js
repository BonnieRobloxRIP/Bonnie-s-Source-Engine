// Hard · Room 1 · Interesting Paths
export default {
	room_name: "Interesting Paths",
	room_type: "r1",
	difficulty: "hard",
	title: { tick: 74 },

	room_map: {
		structure: "hard/room1/2_interesting_paths:HardRoom1V2",
		at: [-14, 1, -7],
		nextRoomAnchor: [-14, 18, 3],
	},

	buttons: [
		{
			at: [6, 3, -5], facing: "south", type: "parkour",
			onPress: [
				{ sound: "sfx.doors.tunnelopen", at: [2, 3, -5.5] },
				{ load: "hard/room1/2_interesting_paths:HMR1V2M1", at: [2, 2, -6] },
				{ tick: 5, load: "hard/room1/2_interesting_paths:HMR1V2M1a", at: [2, 2, -6] },
				{ tick: 10, load: "hard/room1/2_interesting_paths:HMR1V2M1", at: [-2, 2, -6] },
				{ tick: 15, load: "hard/room1/2_interesting_paths:HMR1V2M1a", at: [-2, 2, -6] },
				{ tick: 15, sound: "sfx.doors.tunnelopen", at: [-2, 3, -5.5] },
			],
		},
		{
			at: [-5, 3, -6], facing: "east", type: "parkour",
			onPress: [
				{ sound: "sfx.doors.tunnelopen", at: [-5.5, 3, -2] },
				{ load: "hard/room1/2_interesting_paths:HMR1V2M1", at: [-6, 2, -2], rotation: 90 },
				{ tick: 5, load: "hard/room1/2_interesting_paths:HMR1V2M1a", at: [-6, 2, -2], rotation: 90 },
				{ tick: 10, load: "hard/room1/2_interesting_paths:HMR1V2M1", at: [-6, 2, 2], rotation: 90 },
				{ tick: 15, load: "hard/room1/2_interesting_paths:HMR1V2M1a", at: [-6, 2, 2], rotation: 90 },
				{ tick: 15, sound: "sfx.doors.tunnelopen", at: [-5.5, 3, 2] },
			],
		},
		{
			at: [-6, 3, 5], facing: "north", type: "parkour",
			onPress: [
				{ sound: "sfx.doors.tunnelopen", at: [-2, 3, 5.5] },
				{ load: "hard/room1/2_interesting_paths:HMR1V2M1", at: [-2, 2, 5] },
				{ tick: 5, load: "hard/room1/2_interesting_paths:HMR1V2M1a", at: [-2, 2, 5] },
				{ tick: 10, load: "hard/room1/2_interesting_paths:HMR1V2M1", at: [2, 2, 5] },
				{ tick: 15, load: "hard/room1/2_interesting_paths:HMR1V2M1a", at: [2, 2, 5] },
				{ tick: 15, sound: "sfx.doors.tunnelopen", at: [2, 3, 5.5] },
			],
		},
		{
			at: [5, 3, 6], facing: "west", type: "parkour",
			onPress: [
				{ sound: "sfx.doors.tunnelopen", at: [5.5, 3, 2] },
				{ load: "hard/room1/2_interesting_paths:HMR1V2M1", at: [5, 2, 2], rotation: 90 },
				{ tick: 5, load: "hard/room1/2_interesting_paths:HMR1V2M1a", at: [5, 2, 2], rotation: 90 },
				{ tick: 10, load: "hard/room1/2_interesting_paths:HMR1V2M3", at: [-1, 1, -1], rotation: 180 },
				{ tick: 10, sound: "sfx.elevator.lift" },
				{ tick: 13, load: "hard/room1/2_interesting_paths:HMR1V2M3a", at: [-1, 2, -1], rotation: 180 },
				{ tick: 16, load: "hard/room1/2_interesting_paths:HMR1V2M3b", at: [-1, 3, -1], rotation: 180 },
				{ tick: 19, load: "hard/room1/2_interesting_paths:HMR1V2M3c", at: [-1, 4, -1], rotation: 180 },
				{ tick: 21, load: "hard/room1/2_interesting_paths:HMR1V2M3d", at: [-1, 5, -1], rotation: 180 },
				{ tick: 21, sound: "sfx.elevator.stop" },
			],
		},
		{
			at: [6, 8, -5], facing: "west", type: "parkour",
			onPress: [
				{ sound: "sfx.doors.tunnelopen", at: [5.5, 7, -3] },
				{ load: "hard/room1/2_interesting_paths:HMR1V2M2", at: [5, 7, -3] },
				{ tick: 5, load: "hard/room1/2_interesting_paths:HMR1V2M2a", at: [5, 7, -3] },
				{ tick: 10, load: "hard/room1/2_interesting_paths:HMR1V2M3e", at: [-1, 6, -1], rotation: 180 },
				{ tick: 10, sound: "sfx.elevator.lift" },
				{ tick: 13, load: "hard/room1/2_interesting_paths:HMR1V2M3f", at: [-1, 7, -1], rotation: 180 },
				{ tick: 16, load: "hard/room1/2_interesting_paths:HMR1V2M3g", at: [-1, 8, -1], rotation: 180 },
				{ tick: 19, load: "hard/room1/2_interesting_paths:HMR1V2M3h", at: [-1, 9, -1], rotation: 180 },
				{ tick: 21, load: "hard/room1/2_interesting_paths:HMR1V2M3i", at: [-1, 10, -1], rotation: 180 },
				{ tick: 21, sound: "sfx.elevator.stop" },
			],
		},
		{
			at: [-6, 13, 6], facing: "up", type: "exit",
			onPress: [
				{ fill: "air", from: [-7, 18, 3], to: [-7, 18, 4] },
				{ tick: 10, fill: "air", from: [-7, 19, 3], to: [-7, 19, 4] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "hard/room1/2_interesting_paths:HMR1V2F", stages: 17, beginsAt: [-6, 2, -6], startModeDelay: 14, floodIntervalSec: 3, message: null },

	exit: {
		zone: { at: [-14, 18, 3], size: [4, 1, 1] },
		leaveZone: { at: [-7, 18, 3], size: [0, 1, 1] },
		door: "hard:HardTunnelDoor",
		doorPos: [-8, 18, 3],
		doorRotation: 90,
	},

	events: [
		{ on: "flood", stage: 1, tick: 0, message: "§3Water is rising§k!" },
	],
};
