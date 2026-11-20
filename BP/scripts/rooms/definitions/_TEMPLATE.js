// TEMPLATE: copy this file to make a new room, then add it to room_list.js.
// This file itself is not loaded by the game.
//
// Every position is [x, y, z] measured from the room's brr:flood_room entity,
// exactly the numbers you would write after ~ or ^ in an mcfunction:  ~-7 ~1 ~-7  ->  [-7, 1, -7]
//
// "tick" = when an action happens. tick 1 = right away, tick 20 = one second later.
// Leave tick out and it happens on tick 1.
// Full reference: docs/ROOMS.md

export default {
	room_name: "My New Room",   // shown as the subtitle ("ROOM 1" is added automatically)
	room_type: "r1",            // r1 | r2 | r3 | exit | finale  (which room slot it can be picked for)
	difficulty: "easy",         // easy | medium | hard  (title colours, timers, door structures)

	room_map: {
		structure: "easy/room1/9_my_room:EasyRoom1V10",
		at: [-7, 1, -7],
		// Rooms 2/3 only: where this room's entity is summoned, measured from the previous room's nextRoomAnchor.
		// spawnFromPrevious: [3, -2, 8],
		// Where the next room attaches (the far end of this room's exit tunnel). Not needed for the last room.
		nextRoomAnchor: [3, 18, 14],
	},

	buttons: [
		{
			at: [6, 6, 5], facing: "west", type: "parkour",   // facing: up/down/north/south/east/west, type: parkour/exit/mechanical
			onPress: [
				{ load: "easy/room1/9_my_room:Bridge1", at: [-2, 2, -5], anim: 1 },            // anim = block_by_block seconds
				{ tick: 10, load: "easy/room1/9_my_room:Bridge2", at: [-2, 2, -5] },
				{ tick: 10, sound: "random.click", at: [-2, 3, -5] },
			],
		},
		{
			at: [-6, 20, 6], facing: "down", type: "exit",
			onPress: [
				{ fill: "air", from: [3, 18, 7], to: [4, 18, 7] },
				{ tick: 10, fill: "air", from: [3, 19, 7], to: [4, 19, 7] },
				{ tick: 10, toast: "gate" },   // "TUNNEL GATE OPENED" notification (presets in room_types.js)
			],
		},
	],

	// Stage N loads "<prefix>N" at beginsAt + N-1 blocks up, every floodIntervalSec seconds,
	// starting startModeDelay seconds after the room starts.
	flood: {
		prefix: "easy/room1/9_my_room:EMR1V10F",
		stages: 17,
		beginsAt: [-6, 2, -6],
		startModeDelay: 31,
		floodIntervalSec: 4,
	},

	exit: {
		zone: { at: [3, 18, 9], size: [1, 1, 4] },        // like x=~3,y=~18,z=~9,dx=1,dy=1,dz=4
		leaveZone: { at: [3, 18, 7], size: [1, 1, 0] },   // walking back here un-counts you
		door: "easy:EasyTunnelDoor",
		doorPos: [3, 18, 8],
	},

	// Rooms 2/3 only: the door players came in through. Opens when the room starts, shuts after the first flood.
	// entrance: { doorPos: [-4, 2, -8], barrier: [-4, 2, -13] },

	// Anything else on a timer: on "start" (room start), "flood" (after flood stage N) or "end" (exit door closing).
	events: [
		{ on: "start", tick: 40, message: "§aSomething creaks..." },
		{ on: "flood", stage: 5, sound: "sfx.ambiance.metal.1" },
	],

	// Endless mode: where the entrance tunnel goes and where players start (rooms 2/3).
	// endless: { tunnelAt: [-5, 1, -14], start: [-3.5, 2, -11], facing: [-3.5, 2, -8] },
};
