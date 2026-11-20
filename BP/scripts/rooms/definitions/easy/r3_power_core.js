// Easy · Room 3 · Power Core
// Extra objective: fire all blasters at the core to stabilize it before the water reaches it (flood stage 12).
export default {
	room_name: "Power Core",
	room_type: "r3",
	difficulty: "easy",

	room_map: {
		structure: "easy/room3/3_power_core:EasyRoom3V3",
		at: [-7, 1, -7],
		spawnFromPrevious: [2, -3, 8],
		nextRoomAnchor: [9, 19, 3],
	},

	// Every blaster button: the blaster powers up (ticks 1, 25, 50), then hits the core and its laser turns on.
	buttons: [
		{
			at: [5, 8, 3], facing: "up", type: "parkour",
			onPress: [
				{ load: "easy/room3/3_power_core:EMR3V3M1", at: [6, 8, -2], anim: 1 },
				{ load: "easy/room3/3_power_core:CoreBlaster1", at: [0, 19, -6], rotation: 180 },
				{ tick: 25, load: "easy/room3/3_power_core:CoreBlaster2", at: [0, 19, -6], rotation: 180 },
				{ tick: 50, load: "easy/room3/3_power_core:CoreBlaster3", at: [0, 19, -6], rotation: 180 },
				{ tick: 50, set: { laser1: 1 } },
				{ tick: 50, play: "blaster_hit" },
			],
		},
		{
			at: [5, 13, -6], facing: "south", type: "parkour",
			onPress: [
				{ load: "easy/room3/3_power_core:CoreBlaster1", at: [3, 19, 0], rotation: 270 },
				{ tick: 25, load: "easy/room3/3_power_core:CoreBlaster2", at: [3, 19, 0], rotation: 270 },
				{ tick: 50, load: "easy/room3/3_power_core:CoreBlaster3", at: [3, 19, 0], rotation: 270 },
				{ tick: 50, set: { laser2: 1 } },
				{ tick: 50, play: "blaster_hit" },
			],
		},
		{
			at: [-5, 19, 5], facing: "up", type: "parkour",
			onPress: [
				{ load: "easy/room3/3_power_core:EMR3V3M2", at: [2, 15, -6], anim: 1 },
				{ load: "easy/room3/3_power_core:CoreBlaster1", at: [0, 19, 3] },
				{ tick: 25, load: "easy/room3/3_power_core:CoreBlaster2", at: [0, 19, 3] },
				{ tick: 50, load: "easy/room3/3_power_core:CoreBlaster3", at: [0, 19, 3] },
				{ tick: 50, set: { laser3: 1 } },
				{ tick: 50, play: "blaster_hit" },
			],
		},
		{
			// Exit button: also fires the last blaster and opens the tunnel gate.
			at: [-6, 20, -5], facing: "east", type: "exit",
			onPress: [
				{ load: "easy/room3/3_power_core:CoreBlaster1", at: [-6, 19, 0], rotation: 90 },
				{ tick: 25, load: "easy/room3/3_power_core:CoreBlaster2", at: [-6, 19, 0], rotation: 90 },
				{ tick: 40, set: { core_safe: 1 } },
				{ tick: 40, play: "stabilize", if: { hits: 3 } },
				{ tick: 40, play: "blaster_hit", unless: { hits: 3 } },
				{ tick: 40, fill: "air", from: [7, 20, 3], to: [4, 20, 4] },
				{ tick: 50, fill: "air", from: [7, 21, 3], to: [4, 21, 4] },
				{ tick: 50, toast: "gate" },
				{ tick: 50, load: "easy/room3/3_power_core:EMR3V3M2", at: [6, 17, 3], rotation: 90, anim: 1 },
				{ tick: 50, load: "easy/room3/3_power_core:CoreBlaster3", at: [-6, 19, 0], rotation: 90 },
				{ tick: 50, set: { laser4: 1 } },
			],
		},
	],

	// Core animations. They share the "core" channel, so starting one stops the others.
	sequences: {
		idle: {
			channel: "core", loop: 94, autoplay: true,
			actions: [
				{ load: "easy/room3/3_power_core:Core1", at: [-3, 11, -3] },
				{ tick: 25, load: "easy/room3/3_power_core:Core2", at: [-3, 11, -3] },
				{ tick: 35, load: "easy/room3/3_power_core:Core3", at: [-3, 11, -3] },
				{ tick: 50, load: "easy/room3/3_power_core:Core4", at: [-3, 11, -3] },
				{ tick: 66, load: "easy/room3/3_power_core:Core3", at: [-3, 11, -3] },
				{ tick: 80, load: "easy/room3/3_power_core:Core2", at: [-3, 11, -3] },
			],
		},
		// Picks the next hit animation (each hit is rotated a bit further) and counts the hit.
		blaster_hit: [
			{ play: "hit1", if: { hits: 0 } },
			{ play: "hit2", if: { hits: 1 } },
			{ play: "hit3", if: { hits: 2 } },
			{ play: "hit3", if: { hits: 3 } },
			{ add: { hits: 1 } },
		],
		hit1: {
			channel: "core",
			actions: [
				{ load: "easy/room3/3_power_core:CoreEmpty", at: [-3, 11, -3] },
				{ load: "easy/room3/3_power_core:CoreHit1", at: [-2, 12, -2] },
				{ tick: 3, load: "easy/room3/3_power_core:CoreHit2", at: [-2, 12, -2] },
				{ tick: 7, load: "easy/room3/3_power_core:CoreHit3", at: [-2, 12, -2] },
				{ tick: 11, load: "easy/room3/3_power_core:CoreHit4", at: [-2, 12, -2] },
				{ tick: 15, load: "easy/room3/3_power_core:CoreHit5", at: [-2, 12, -2] },
				{ tick: 20, load: "easy/room3/3_power_core:Core5", at: [-3, 11, -3] },
				{ tick: 25, load: "easy/room3/3_power_core:Core1", at: [-3, 11, -3] },
				{ tick: 49, play: "idle" },
			],
		},
		hit2: {
			channel: "core",
			actions: [
				{ load: "easy/room3/3_power_core:CoreEmpty", at: [-3, 11, -3], rotation: 90 },
				{ load: "easy/room3/3_power_core:CoreHit1", at: [-2, 12, -2], rotation: 90 },
				{ tick: 3, load: "easy/room3/3_power_core:CoreHit2", at: [-2, 12, -2], rotation: 90 },
				{ tick: 7, load: "easy/room3/3_power_core:CoreHit3", at: [-2, 12, -2], rotation: 90 },
				{ tick: 11, load: "easy/room3/3_power_core:CoreHit4", at: [-2, 12, -2], rotation: 90 },
				{ tick: 15, load: "easy/room3/3_power_core:CoreHit5", at: [-2, 12, -2], rotation: 90 },
				{ tick: 20, load: "easy/room3/3_power_core:Core5", at: [-3, 11, -3] },
				{ tick: 25, load: "easy/room3/3_power_core:Core1", at: [-3, 11, -3] },
				{ tick: 49, play: "idle" },
			],
		},
		hit3: {
			channel: "core",
			actions: [
				{ load: "easy/room3/3_power_core:CoreEmpty", at: [-3, 11, -3], rotation: 180 },
				{ load: "easy/room3/3_power_core:CoreHit1", at: [-2, 12, -2], rotation: 180 },
				{ tick: 3, load: "easy/room3/3_power_core:CoreHit2", at: [-2, 12, -2], rotation: 180 },
				{ tick: 7, load: "easy/room3/3_power_core:CoreHit3", at: [-2, 12, -2], rotation: 180 },
				{ tick: 11, load: "easy/room3/3_power_core:CoreHit4", at: [-2, 12, -2], rotation: 180 },
				{ tick: 15, load: "easy/room3/3_power_core:CoreHit5", at: [-2, 12, -2], rotation: 180 },
				{ tick: 20, load: "easy/room3/3_power_core:Core5", at: [-3, 11, -3] },
				{ tick: 25, load: "easy/room3/3_power_core:Core1", at: [-3, 11, -3] },
				{ tick: 49, play: "idle" },
			],
		},
		// All three blasters hit, then the exit blaster: the core is stable.
		stabilize: {
			channel: "core",
			actions: [
				{ load: "easy/room3/3_power_core:CoreEmpty", at: [-3, 11, -3], rotation: 270 },
				{ load: "easy/room3/3_power_core:CoreHit1", at: [-2, 12, -2], rotation: 270 },
				{ tick: 3, load: "easy/room3/3_power_core:CoreHit2", at: [-2, 12, -2], rotation: 270 },
				{ tick: 7, load: "easy/room3/3_power_core:CoreHit3", at: [-2, 12, -2], rotation: 270 },
				{ tick: 11, load: "easy/room3/3_power_core:CoreHit4", at: [-2, 12, -2], rotation: 270 },
				{ tick: 15, load: "easy/room3/3_power_core:CoreHit5", at: [-2, 12, -2], rotation: 270 },
				{ tick: 20, load: "easy/room3/3_power_core:Core3", at: [-3, 11, -3] },
				{ tick: 25, load: "easy/room3/3_power_core:Core4", at: [-3, 11, -3] },
				{ tick: 30, load: "easy/room3/3_power_core:Core3", at: [-3, 11, -3] },
				{ tick: 40, load: "easy/room3/3_power_core:Core2", at: [-3, 11, -3] },
				{ tick: 44, load: "easy/room3/3_power_core:Core1", at: [-3, 11, -3] },
				{ tick: 49, load: "easy/room3/3_power_core:Core5", at: [-3, 11, -3] },
				{ tick: 49, message: "§2Objective Complete: §aYou successfully stabilized the core!" },
				{ tick: 55, load: "easy/room3/3_power_core:CoreStable", at: [-3, 11, -3], anim: 1 },
			],
		},
		// The water reached the core in time: game over.
		meltdown: {
			channel: "core",
			actions: [
				{ message: "§2Objective Failed: §4You failed to contain the core!" },
				{ load: "easy/room3/3_power_core:CoreEmpty", at: [-3, 11, -3] },
				{ load: "easy/room3/3_power_core:CoreCritical1", at: [-3, 11, -3] },
				{ tick: 5, load: "easy/room3/3_power_core:CoreCritical2", at: [-3, 11, -3] },
				{ tick: 11, load: "easy/room3/3_power_core:CoreCritical3", at: [-3, 11, -3] },
				{ tick: 13, load: "easy/room3/3_power_core:CoreCritical4", at: [-3, 11, -3] },
				{ tick: 15, load: "easy/room3/3_power_core:CoreCritical5", at: [-3, 11, -3] },
				{ tick: 17, command: "camera @a[tag={mode}] fade time 0 3 3 color 144 0 0" },
				{ tick: 19, times: [40, 100, 20] },
				{ tick: 19, title: "§4Game Over" },
				{ tick: 35, kill_players: true },
				{ tick: 35, command: "tag @a[tag={mode}] remove {mode}" },
			],
		},
	},

	// Laser beams from each blaster into the core, every tick once that blaster has fired.
	loops: [
		{ if: { laser1: 1 }, actions: [{ particle: "brr:power_core_laser_beam3", at: [0, 20, -4] }, { particle: "brr:power_core_laser_spiral3", at: [0, 20, -4] }] },
		{ if: { laser2: 1 }, actions: [{ particle: "brr:power_core_laser_beam2", at: [4, 20, 0] }, { particle: "brr:power_core_laser_spiral2", at: [4, 20, 0] }] },
		{ if: { laser3: 1 }, actions: [{ particle: "brr:power_core_laser_beam4", at: [0, 20, 4] }, { particle: "brr:power_core_laser_spiral4", at: [0, 20, 4] }] },
		{ if: { laser4: 1 }, actions: [{ particle: "brr:power_core_laser_beam", at: [-4, 20, 0] }, { particle: "brr:power_core_laser_spiral", at: [-4, 20, 0] }] },
	],

	// Standing on the white glass parts kills you.
	hazards: [{ block: "white_stained_glass", kill: true }],

	flood: { prefix: "easy/room3/3_power_core:EMR3V3F", stages: 19, beginsAt: [-6, 2, -6], startModeDelay: 31, floodIntervalSec: 4 },

	exit: {
		zone: { at: [8, 20, 2], size: [6, 1, 1] },
		leaveZone: { at: [7, 20, 2], size: [0, 1, 1] },
		door: "easy:EasyTunnelDoor",
		doorPos: [8, 20, 3],
		doorRotation: 270,
		doorSound: [8, 20.5, 3.5],
		floodFill: { from: [-6, 3, -6], to: [6, 22, 6] },
	},

	entrance: { doorPos: [-2, 3, -8], barrier: [-2, 3, -13], soundAt: [-3.5, 4, -8] },

	events: [
		{ on: "start", tick: 10, message: "§aAdditional Objective: §2Stabilize the core before the water reaches it!" },
		// The water reaches the core at flood stage 12: meltdown unless the exit blaster already fired.
		{ on: "flood", stage: 12, play: "meltdown", unless: { core_safe: 1 } },
	],

	endless: { tunnelAt: [-3, 2, -14], start: [-1.5, 3, -11], facing: [-1.5, 3, -8] },
};
