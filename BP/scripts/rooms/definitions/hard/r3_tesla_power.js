// Hard · Room 3 · Tesla Power
export default {
	room_name: "Tesla Power",
	room_type: "r3",
	difficulty: "hard",
	title: { tick: 90 },

	room_map: {
		structure: "hard/room3/2_tesla_power:HardRoom3V2",
		at: [-8, 1, -7],
		spawnFromPrevious: [-8, -3, 2],
	},

	// Three tesla lasers (see laser_system.js), one per floor of the tower.
	// They all start switched off; the intro turns on the bottom one, and each button
	// removes the current laser and switches on the next one up.
	on_load: [
		{ summon_laser: [0, 9, 0] },
		{ summon_laser: [0, 13, 0] },
		{ summon_laser: [0, 17, 0] },
		{ laser: [0, 9, 0], spin: 0, visible: false },
		{ laser: [0, 13, 0], spin: 0, visible: false },
		{ laser: [0, 17, 0], spin: 0, visible: false },
	],

	// Each button opens the next floor, shuts down the laser below and speeds up the one above.
	buttons: [
		{
			at: [2, 10, 5], facing: "up", type: "parkour",
			onPress: [
				{ fill: "air", from: [0, 9, 6], to: [0, 11, 6], mode: "destroy" },
				{ load: "hard/room3/2_tesla_power:HMR3V2M2", at: [-2, 9, 6] },
				{ tick: 10, load: "hard/room3/2_tesla_power:HMR3V2M1", at: [-2, 13, -2], anim: 1 },
				{ tick: 10, remove_laser: [0, 9, 0] },
				{ tick: 10, laser: [0, 13, 0], spin: 8, visible: true },
				{ tick: 10, command: "execute as @e[type=brr:flood_room, name=laser, tag={mode}] at @s run particle brr:electric_pulse ~ ~ ~" },
			],
		},
		{
			at: [2, 14, 5], facing: "up", type: "parkour",
			onPress: [
				{ fill: "air", from: [0, 13, 6], to: [0, 15, 6], mode: "destroy" },
				{ load: "hard/room3/2_tesla_power:HMR3V2M2", at: [-2, 13, 6] },
				{ tick: 10, load: "hard/room3/2_tesla_power:HMR3V2M1", at: [-2, 17, -2], anim: 1 },
				{ tick: 10, remove_laser: [0, 13, 0] },
				{ tick: 10, laser: [0, 17, 0], spin: 12, visible: true },
				{ tick: 10, command: "execute as @e[type=brr:flood_room, name=laser, tag={mode}] at @s run particle brr:electric_pulse ~ ~ ~" },
			],
		},
		{
			at: [2, 18, 5], facing: "up", type: "parkour",
			onPress: [
				{ fill: "air", from: [0, 17, 6], to: [0, 19, 6], mode: "destroy" },
				{ load: "hard/room3/2_tesla_power:HMR3V2M2", at: [-2, 16, 6] },
				{ tick: 10, laser: [0, 17, 0], spin: 15, visible: true },
				{ tick: 10, command: "execute as @e[type=brr:flood_room, name=laser, tag={mode}] at @s run particle brr:electric_pulse ~ ~ ~" },
			],
		},
		{
			at: [4, 22, 6], facing: "north", type: "exit",
			onPress: [
				{ fill: "air", from: [0, 20, 7], to: [-1, 20, 7] },
				{ tick: 10, fill: "air", from: [0, 21, 7], to: [-1, 21, 7] },
				{ tick: 10, remove_lasers: true },
				{ tick: 10, toast: "gate" },
			],
		},
	],

	// The machinery in the walls keeps moving while the room is running
	loops: [
		{ every: 6, actions: [
			{ load: "hard/room3:HardRoom3a", at: [-8, 1, -7] },
			{ tick: 3, load: "hard/room3:HardRoom3b", at: [-8, 1, -7] },
			{ tick: 5, load: "hard/room3:HardRoom3c", at: [-8, 1, -7] },
		] },
	],

	// Sea lanterns are electrified
	hazards: [{ block: "sea_lantern", damage: 18 }],

	flood: { prefix: "hard/room3/2_tesla_power:HMR3V2F", stages: 18, beginsAt: [-6, 3, -6], startModeDelay: 20, floodIntervalSec: 4, message: null },

	exit: {
		zone: { at: [-1, 20, 8], size: [1, 1, 5] },
		leaveZone: { at: [-1, 20, 7], size: [1, 1, 0] },
		doorSound: [-0.5, 21.5, 8],
		door: "hard:HardTunnelDoor",
		doorPos: [-1, 20, 8],
		floodFill: { from: [-6, 3, -6], to: [6, 22, 6] },
	},

	entrance: { doorPos: [8, 3, -2], rotation: 90, barrier: [8, 2, -3], soundAt: [8, 3, -1.5] },

	events: [
		// Intro cutscene: the camera swings to the tower while the lowest laser goes wild, then everything powers down.
		{ on: "start", tick: 11, command: "camera @a[tag={mode}] set minecraft:free ease 3 out_quad pos ~6 ~4 ~-2 facing ~ ~8 ~" },
		{ on: "start", tick: 21, command: "effect @a[tag={mode}] darkness 2 255 true" },
		{ on: "start", tick: 41, command: ["camera @a[tag={mode}] fov_set 45 1 in_quad", "camerashake add @a[tag={mode}] 0.4 2 positional"] },
		{ on: "start", tick: 41, laser: [0, 9, 0], spin: 45, visible: true },
		{ on: "start", tick: 61, command: "camera @a[tag={mode}] fov_set 100 3 out_quad" },
		{ on: "start", tick: 61, load: "medium/room2:MediumRoom2Offline", at: [-7, 2, -14], anim: 2 },
		{ on: "start", tick: 81, load: "hard/room3/2_tesla_power:HMR3V2M1a", at: [-2, 9, -2], anim: 1 },
		{ on: "start", tick: 81, laser: [0, 9, 0], spin: 0, visible: false },
		{ on: "start", tick: 86, load: "hard/room3/2_tesla_power:HMR3V2M1a", at: [-2, 13, -2], anim: 1 },
		{ on: "start", tick: 91, load: "hard/room3/2_tesla_power:HMR3V2M1a", at: [-2, 17, -2], anim: 1 },
		{ on: "start", tick: 121, command: "camera @a[tag={mode}] fov_set 30 1 in_quad" },
		{ on: "start", tick: 141, command: ["camera @a[tag={mode}] fov_clear 2 out_quad", "camera @a[tag={mode}] clear"] },
		{ on: "start", tick: 141, load: "hard/room3/2_tesla_power:HMR3V2M1", at: [-2, 9, -2], anim: 2 },
		{ on: "start", tick: 141, laser: [0, 9, 0], spin: 4, visible: true },

		{ on: "flood", stage: 1, tick: 1, message: "§3Wa§kter is §r§3r§kis§r§3ing§k!" },
		{ on: "flood", stage: 1, tick: 10, message: "§5Wat§ker §r§5is r§kis§r§5i§kng!" },
		{ on: "flood", stage: 1, tick: 14, message: "§6§kWate§r§5r is §r§6r§kising§k!" },
		{ on: "flood", stage: 1, tick: 15, message: "§4§kWater is rising!" },
		{ on: "flood", stage: 1, tick: 17, message: "§4§k!!§r§4Die§k!!" },

		{ on: "end", tick: 10, remove_lasers: true },
	],


	endless: { tunnelAt: [8, 2, -3], start: [11, 3, -1.5], facing: [9, 3, -1.5] },
};
