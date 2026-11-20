// Hard · Room 2 · Broken System
export default {
	room_name: "Broken System",
	room_type: "r2",
	difficulty: "hard",

	room_map: {
		structure: "hard/room2/2_broken_system:HardRoom2V2",
		at: [-14, 1, -7],
		spawnFromPrevious: [-8, -2, -3],
		nextRoomAnchor: [-14, 19, 3],
	},

	buttons: [
		{
			at: [3, 4, -2], facing: "up", type: "parkour",
			onPress: [
				{ setblock: "lever[\"lever_direction\"=\"down_east_west\", \"open_bit\"=true]", at: [3, 1, -1] },
				{ load: "hard/room2/2_broken_system:HMR2V2M1", at: [-1, 2, 6], anim: 1 },
				{ tick: 5, sound: "tile.piston.out", at: [5, 2, 6] },
				{ tick: 10, sound: "tile.piston.out", at: [3, 3, 6] },
				{ tick: 15, sound: "tile.piston.out", at: [1, 4, 6] },
				{ tick: 20, sound: "tile.piston.out", at: [-1, 5, 6] },
			],
		},
		{
			// Lift button: first press brings the lift down, next press sends it back up (and so on).
			// The button re-arms itself after each trip. Players standing on the platform ride along.
			at: [3, 9, -5], facing: "south", type: "mechanical", repeatable: true,
			onPress: [
				{ message: "§4§lALERT: §r§4Lift Called!" },
				{ tick: 5, sound: "sfx.elevator.platform.start" },
				{ tick: 5, load: "hard/room2/2_broken_system:HMR2V2M2", at: [-5, 21, -6] },
				{ tick: 5, load: "hard/room2/2_broken_system:HMR2V2M2b", at: [-5, 8, 1] },
				{ tick: 5, move_players: { zone: { at: [-5, 9, 1], size: [9, 9, 4] }, by: [1, -1, 0] } },
				{ tick: 10, load: "hard/room2/2_broken_system:HMR2V2M2", at: [-4, 21, -6] },
				{ tick: 10, load: "hard/room2/2_broken_system:HMR2V2M2c", at: [-5, 8, 1] },
				{ tick: 10, move_players: { zone: { at: [-5, 9, 1], size: [9, 9, 4] }, by: [1, -1, 0] } },
				{ tick: 15, load: "hard/room2/2_broken_system:HMR2V2M2", at: [-3, 21, -6] },
				{ tick: 15, load: "hard/room2/2_broken_system:HMR2V2M2d", at: [-5, 8, 1] },
				{ tick: 15, move_players: { zone: { at: [-5, 9, 1], size: [9, 9, 4] }, by: [1, -1, 0] } },
				{ tick: 20, load: "hard/room2/2_broken_system:HMR2V2M2", at: [-2, 21, -6] },
				{ tick: 20, load: "hard/room2/2_broken_system:HMR2V2M2e", at: [-5, 8, 1] },
				{ tick: 20, move_players: { zone: { at: [-5, 9, 1], size: [9, 9, 4] }, by: [1, -1, 0] } },
				{ tick: 25, load: "hard/room2/2_broken_system:HMR2V2M2", at: [-1, 21, -6] },
				{ tick: 25, load: "hard/room2/2_broken_system:HMR2V2M2f", at: [-5, 8, 1] },
				{ tick: 25, move_players: { zone: { at: [-5, 9, 1], size: [9, 9, 4] }, by: [1, -1, 0] } },
				{ tick: 30, load: "hard/room2/2_broken_system:HMR2V2M2", at: [0, 21, -6] },
				{ tick: 30, load: "hard/room2/2_broken_system:HMR2V2M2g", at: [-5, 8, 1] },
				{ tick: 30, move_players: { zone: { at: [-5, 9, 1], size: [9, 9, 4] }, by: [1, -1, 0] } },
				{ tick: 30, stopsound: "sfx.elevator.platform.start" },
				{ tick: 30, sound: "sfx.elevator.platform.stop" },
				{ tick: 40 },
			],
			onPressAgain: [
				{ message: "§4§lALERT: §r§4Lift will rise in.. §l3" },
				{ tick: 21, message: "§4§lALERT: §r§4Lift will rise in.. §l2" },
				{ tick: 41, message: "§4§lALERT: §r§4Lift will rise in.. §l1" },
				{ tick: 61, sound: "sfx.elevator.platform.start" },
				{ tick: 61, load: "hard/room2/2_broken_system:HMR2V2M2", at: [-1, 21, -6] },
				{ tick: 61, load: "hard/room2/2_broken_system:HMR2V2M2f", at: [-5, 8, 1] },
				{ tick: 61, move_players: { zone: { at: [-5, 9, 1], size: [9, 9, 4] }, by: [-1, 1, 0] } },
				{ tick: 66, load: "hard/room2/2_broken_system:HMR2V2M2", at: [-2, 21, -6] },
				{ tick: 66, load: "hard/room2/2_broken_system:HMR2V2M2e", at: [-5, 8, 1] },
				{ tick: 66, move_players: { zone: { at: [-5, 9, 1], size: [9, 9, 4] }, by: [-1, 1, 0] } },
				{ tick: 71, load: "hard/room2/2_broken_system:HMR2V2M2", at: [-3, 21, -6] },
				{ tick: 71, load: "hard/room2/2_broken_system:HMR2V2M2d", at: [-5, 8, 1] },
				{ tick: 71, move_players: { zone: { at: [-5, 9, 1], size: [9, 9, 4] }, by: [-1, 1, 0] } },
				{ tick: 76, load: "hard/room2/2_broken_system:HMR2V2M2", at: [-4, 21, -6] },
				{ tick: 76, load: "hard/room2/2_broken_system:HMR2V2M2c", at: [-5, 8, 1] },
				{ tick: 76, move_players: { zone: { at: [-5, 9, 1], size: [9, 9, 4] }, by: [-1, 1, 0] } },
				{ tick: 81, load: "hard/room2/2_broken_system:HMR2V2M2", at: [-5, 21, -6] },
				{ tick: 81, load: "hard/room2/2_broken_system:HMR2V2M2b", at: [-5, 8, 1] },
				{ tick: 81, move_players: { zone: { at: [-5, 9, 1], size: [9, 9, 4] }, by: [-1, 1, 0] } },
				{ tick: 86, load: "hard/room2/2_broken_system:HMR2V2M2", at: [-6, 21, -6] },
				{ tick: 86, load: "hard/room2/2_broken_system:HMR2V2M2a", at: [-5, 8, 1] },
				{ tick: 86, move_players: { zone: { at: [-5, 9, 1], size: [9, 9, 4] }, by: [-1, 1, 0] } },
				{ tick: 86, stopsound: "sfx.elevator.platform.start" },
				{ tick: 86, sound: "sfx.elevator.platform.stop" },
				{ tick: 95 },
			],
		},
		{
			at: [6, 18, -4], facing: "up", type: "exit",
			onPress: [
				{ fill: "air", from: [-7, 19, 3], to: [-7, 19, 4] },
				{ tick: 10, fill: "air", from: [-7, 20, 3], to: [-7, 20, 4] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "hard/room2/2_broken_system:HMR2V2F", stages: 18, beginsAt: [-6, 2, -6], startModeDelay: 11, floodIntervalSec: 3, message: null },

	exit: {
		zone: { at: [-14, 19, 3], size: [4, 1, 1] },
		leaveZone: { at: [-7, 19, 3], size: [0, 1, 1] },
		doorSound: [-8, 19, 3.5],
		door: "hard:HardTunnelDoor",
		doorPos: [-8, 19, 3],
		doorRotation: 90,
	},

	entrance: { doorPos: [8, 2, 3], rotation: 90, barrier: [9, 2, 3] },

	events: [
		{ on: "flood", stage: 1, tick: 0, message: "§3Water is r§kis§r§3ing§k!" },
	],


	endless: { tunnelAt: [8, 1, 2], start: [11, 2, 3.5], facing: [9, 2, 3.5] },
};
