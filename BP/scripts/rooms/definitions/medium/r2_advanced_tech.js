// Medium · Room 2 · Advanced Tech
// Crack the 5-switch code to raise the lift. At flood stage 2 the generator explodes and the room loses power.
export default {
	room_name: "Advanced Tech",
	room_type: "r2",
	difficulty: "medium",

	room_map: {
		structure: "medium/room2/2_advanced_tech:MediumRoom2V2",
		at: [-7, 1, -14],
		spawnFromPrevious: [-1, -2, -8],
		nextRoomAnchor: [-4, 19, -14],
	},

	buttons: [
		{
			at: [6, 3, -2], facing: "west", type: "parkour",
			onPress: [
				{ load: "medium/room2/2_advanced_tech:MMR2V2M1", at: [-6, 2, -3] },
				{ tick: 10, load: "medium/room2/2_advanced_tech:MMR2V2M1a", at: [-6, 2, -3] },
				{ tick: 20, load: "medium/room2/2_advanced_tech:MMR2V2M1b", at: [-6, 2, -3] },
			],
		},
	],

	// Five flood exit buttons (switches); each gets a random on/off target when the room loads.
	code_lock: {
		buttons: [[-4, 12, 4], [-4, 12, 3], [-4, 12, 2], [-5, 12, 1], [-6, 12, 1]],
		progress: "§6{matched}/{total}",
		progressDone: "§e{matched}/{total}!",
		// The lift rises
		onSolved: [
			{ actionbar: "§e5/5!" },
			{ sound: "sfx.alarm.lift", at: [0, 15, 0] },
			{ sound: "sfx.elevator.lift", at: [0, 15, 0] },
			{ tick: 5, load: "medium/room2/2_advanced_tech:MMR2V2M2", at: [-1, 1, -1] },
			{ tick: 10, load: "medium/room2/2_advanced_tech:MMR2V2M2", at: [-1, 2, -1] },
			{ tick: 15, load: "medium/room2/2_advanced_tech:MMR2V2M2", at: [-1, 3, -1] },
			{ tick: 20, load: "medium/room2/2_advanced_tech:MMR2V2M2", at: [-1, 4, -1] },
			{ tick: 25, load: "medium/room2/2_advanced_tech:MMR2V2M2a", at: [-1, 5, -1] },
			{ tick: 30, load: "medium/room2/2_advanced_tech:MMR2V2M2b", at: [-1, 6, -1] },
			{ tick: 35, load: "medium/room2/2_advanced_tech:MMR2V2M2c", at: [-1, 7, -1] },
			{ tick: 40, load: "medium/room2/2_advanced_tech:MMR2V2M2d", at: [-1, 8, -1] },
			{ tick: 45, load: "medium/room2/2_advanced_tech:MMR2V2M2e", at: [-1, 9, -1] },
			{ tick: 50, load: "medium/room2/2_advanced_tech:MMR2V2M2f", at: [-1, 10, -1] },
			{ tick: 55, load: "medium/room2/2_advanced_tech:MMR2V2M2g", at: [-1, 11, -1] },
			{ tick: 60, load: "medium/room2/2_advanced_tech:MMR2V2M2h", at: [-1, 12, -1] },
			{ tick: 65, load: "medium/room2/2_advanced_tech:MMR2V2M2i", at: [-1, 13, -1] },
		],
	},

	loops: [
		// Generator animation + hum, until it explodes at flood stage 2
		{ every: 4, untilFlood: 2, actions: [
			{ load: "medium/room2/2_advanced_tech:MMR2V2M3", at: [4, 2, 1] },
			{ tick: 3, load: "medium/room2/2_advanced_tech:MMR2V2M3a", at: [4, 2, 1] },
		] },
		{ every: 177, untilFlood: 2, actions: [{ sound: "sfx.ambiance.generator.1", at: [5, 3, 3] }] },
	],

	flood: { prefix: "medium/room2/2_advanced_tech:MMR2V2F", stages: 18, beginsAt: [-6, 2, -6], startModeDelay: 16, floodIntervalSec: 4 },

	exit: {
		zone: { at: [-4, 19, -14], size: [1, 1, 4] },
		leaveZone: { at: [-4, 19, -7], size: [1, 1, 0] },
		door: "medium:MediumTunnelDoor",
		doorPos: [-4, 19, -8],
		doorSound: [-3.5, 19, -8],
	},

	entrance: { doorPos: [1, 2, 8], barrier: [1, 2, 9] },

	events: [
		// Flood stage 2: the generator explodes, a flash lights the room...
		{ on: "flood", stage: 2, load: "medium/room2/2_advanced_tech:MMR2V2M3b", at: [4, 2, 1] },
		{ on: "flood", stage: 2, fill: "light_block_15", from: [-2, 2, -6], to: [6, 20, 6], mode: "replace air" },
		{ on: "flood", stage: 2, sound: "sfx.ambiance.generator.explode" },
		{ on: "flood", stage: 2, stopsound: "sfx.ambiance.generator.1" },
		{ on: "flood", stage: 2, command: ["scoreboard players random explosion lobby 1 6", "camerashake add @a[tag={mode}] 0.4 0.6 positional"] },
		{ on: "flood", stage: 2, tick: 1, particle: "brr:generator_explode", at: [5, 3, 3] },
		{ on: "flood", stage: 2, tick: 2, particle: "brr:generator_explode", at: [5, 3, 3] },
		{ on: "flood", stage: 2, tick: 2, fill: "air", from: [-6, 2, -6], to: [6, 20, 6], mode: "replace light_block_15" },
		{ on: "flood", stage: 2, tick: 3, particle: "brr:generator_explode", at: [5, 3, 3] },
		// ...then the power goes out
		{ on: "flood", stage: 2, tick: 20, sound: "sfx.powerdown" },
		{ on: "flood", stage: 2, tick: 20, load: "medium/room2:MediumRoom2Offline", at: [-7, 1, -14], anim: 1 },
		{ on: "flood", stage: 2, tick: 20, fill: "soul_lantern[\"hanging\"=true]", from: [-6, 2, -6], to: [6, 20, 6], mode: "replace lantern[\"hanging\"=true]" },
		{ on: "flood", stage: 2, tick: 20, fill: "soul_lantern[\"hanging\"=false]", from: [-6, 2, -6], to: [6, 20, 6], mode: "replace lantern[\"hanging\"=false]" },
	],

	endless: { tunnelAt: [0, 1, 8], start: [1.5, 2, 11], facing: [1.5, 2, 7] },
};
