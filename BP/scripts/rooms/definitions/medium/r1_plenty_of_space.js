// Medium · Room 1 · Plenty of Space
export default {
	room_name: "Plenty of Space",
	room_type: "r1",
	difficulty: "medium",

	room_map: {
		structure: "medium/room1/2_plenty_of_space:MediumRoom1V2",
		at: [-7, 1, -14],
		nextRoomAnchor: [3, 18, -14],
	},

	buttons: [
		{
			at: [6, 4, 3], facing: "west", type: "parkour",
			onPress: [
				{ sound: "sfx.moving_part.start" },
				{ load: "medium/room1/2_plenty_of_space:MMR1V2M1", at: [5, 2, -2] },
				{ tick: 4, load: "medium/room1/2_plenty_of_space:MMR1V2M1a", at: [5, 2, -2] },
				{ tick: 7, load: "medium/room1/2_plenty_of_space:MMR1V2M1b", at: [5, 2, -2] },
				{ tick: 10, load: "medium/room1/2_plenty_of_space:MMR1V2M1c", at: [5, 2, -2] },
				{ tick: 13, load: "medium/room1/2_plenty_of_space:MMR1V2M1d", at: [5, 2, -2] },
				{ tick: 16, load: "medium/room1/2_plenty_of_space:MMR1V2M1e", at: [5, 2, -2] },
				{ tick: 16, stopsound: "sfx.moving_part.start" },
				{ tick: 16, sound: "sfx.moving_part.stop" },
			],
		},
		{
			at: [-6, 20, 6], facing: "down", type: "exit",
			onPress: [
				{ load: "medium/room1/2_plenty_of_space:MMR1V2M2", at: [-3, 17, 0] },
				{ fill: "air", from: [3, 18, -7], to: [4, 18, -7] },
				{ tick: 3, load: "medium/room1/2_plenty_of_space:MMR1V2M2a", at: [-3, 17, 0] },
				{ tick: 5, load: "medium/room1/2_plenty_of_space:MMR1V2M2b", at: [-3, 17, 0] },
				{ tick: 7, load: "medium/room1/2_plenty_of_space:MMR1V2M2c", at: [-3, 17, 0] },
				{ tick: 9, load: "medium/room1/2_plenty_of_space:MMR1V2M2d", at: [-3, 17, 0] },
				{ tick: 10, fill: "air", from: [3, 19, -7], to: [4, 19, -7] },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	flood: { prefix: "medium/room1/2_plenty_of_space:MMR1V2F", stages: 17, beginsAt: [-6, 2, -6], startModeDelay: 16, floodIntervalSec: 4 },

	exit: {
		zone: { at: [3, 18, -14], size: [1, 1, 4] },
		leaveZone: { at: [3, 18, -7], size: [1, 1, 0] },
		door: "medium:MediumTunnelDoor",
		doorPos: [3, 18, -8],
	},
};
