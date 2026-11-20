// Shared settings for every difficulty and room type.
// A room definition only needs to set what differs from these defaults.

export const DIFFICULTIES = {
	easy: {
		titleColor: "§a",
		subtitleColor: "§2",
		gateColor: "§a",
		// Where the room 1 entity is summoned when Easy mode starts (same as the old decider).
		firstRoomSpawn: [8, -59, 52],
		// The order rooms are played in.
		sequence: ["r1", "r2", "r3", "exit", "finale"],
		tunnelDoor: "easy:EasyTunnelDoor",
		barrier: "easy:NuhUh",
	},
	medium: {
		titleColor: "§e",
		subtitleColor: "§6",
		gateColor: "§e",
		firstRoomSpawn: [0, -59, 31],
		sequence: ["r1", "r2", "r3"],
		tunnelDoor: "medium:MediumTunnelDoor",
		barrier: "easy:NuhUh",
	},
	hard: {
		titleColor: "§4§l",
		subtitleColor: "§4",
		gateColor: "§4",
		firstRoomSpawn: [-8, -59, 52],
		sequence: ["r1", "r2", "r3"],
		tunnelDoor: "hard:HardTunnelDoor",
		barrier: "easy:NuhUh",
	},
};

// Per difficulty + room type defaults.
//   number:         shown in the "ROOM N" title
//   endlessShell:   structures loaded before the room in Endless mode, to wipe the previous room
//   endlessTunnel:  the entrance tunnel loaded in Endless mode (its position is set per room)
//   endlessStart:   where Endless players are teleported when the room loads
//   floodFill:      the water fill that drowns the room once everyone has left
export const ROOM_TYPES = {
	easy: {
		r1: {
			number: 1,
			endlessShell: [{ load: "easy/room1:EasyRoom1", at: [-7, 1, -7] }],
			endlessStart: { at: [0, 2, 0] },
			floodFill: { from: [-6, 2, -6], to: [6, 21, 6] },
		},
		r2: {
			number: 2,
			endlessShell: [{ load: "easy/room2:EasyRoom2", at: [-7, 1, -7] }],
			endlessTunnel: { load: "easy:EasyTunnel" },
			floodFill: { from: [-6, 2, -6], to: [6, 21, 6] },
		},
		r3: {
			number: 3,
			endlessShell: [{ load: "easy/room3:EasyRoom3", at: [-7, 1, -7] }],
			endlessTunnel: { load: "easy:EasyTunnel" },
			floodFill: { from: [-6, 2, -6], to: [6, 21, 6] },
		},
		exit: { number: 4, inEndless: false },
		finale: { number: 5, inEndless: false },
	},
	medium: {
		r1: {
			number: 1,
			endlessShell: [{ load: "medium/room1:MediumRoom1", at: [-7, 1, -14] }],
			endlessStart: { at: [0, 2, 0] },
			floodFill: { from: [-6, 2, -6], to: [6, 21, 6] },
		},
		r2: {
			number: 2,
			endlessShell: [{ load: "medium/room2:MediumRoom2", at: [-7, 1, -14] }],
			endlessTunnel: { load: "medium:MediumTunnel" },
			floodFill: { from: [-6, 2, -6], to: [6, 21, 6] },
		},
		r3: {
			number: 3,
			endlessShell: [{ load: "medium/room3:MediumRoom3", at: [-16, 1, -7] }],
			endlessTunnel: { load: "medium:MediumTunnel" },
			floodFill: { from: [-6, 2, -6], to: [6, 21, 6] },
		},
	},
	hard: {
		r1: {
			number: 1,
			endlessShell: [{ load: "hard/room1:HardRoom1", at: [-14, 1, -7] }],
			endlessStart: { at: [0, 2, 0] },
			floodFill: { from: [-6, 2, -6], to: [6, 21, 6] },
		},
		r2: {
			number: 2,
			endlessShell: [{ load: "hard/room2:HardRoom2", at: [-14, 1, -7] }],
			endlessTunnel: { load: "hard:HardTunnel", rotation: 90 },
			floodFill: { from: [-6, 2, -6], to: [6, 21, 6] },
		},
		r3: {
			number: 3,
			endlessShell: [{ load: "hard/room3:HardRoom3", at: [-8, 1, -7] }],
			endlessTunnel: { load: "hard:HardTunnel", rotation: 90 },
			floodFill: { from: [-6, 2, -6], to: [6, 21, 6] },
		},
	},
};

// Endless mode settings.
export const ENDLESS = {
	anchorName: "endless",
	anchorSpawn: [76, -59, 37],
	// Ticks after a room's exit door closes before the next Endless room loads.
	nextRoomDelay: 31,
	titleColor: { easy: "§a", medium: "§e", hard: "§4§l" },
};

// Default timings (ticks) shared by all rooms.
export const TIMINGS = {
	titleTick: 10,
	// Exit door: half-closed on tick 1 of the room ending, fully closed + room flooded on this tick.
	exitDoorCloseTick: 10,
	// Entrance door (rooms 2/3): opens on these ticks after the room starts.
	entranceOpenTicks: [1, 10],
	// Entrance door closes this many ticks after the first flood stage (half, then fully closed + barrier).
	entranceCloseTicks: [20, 25],
	// The room ends this many ticks after its final flood stage.
	endAfterLastStage: 10,
};

// Toast notifications (top right). Use in a room with { toast: "gate" } or your own { toast: { icon, heading, subline, sound } }.
// icon: door | water | info.  sound: played to everyone in the room (optional).
// Placeholders: {color} (difficulty colour), {room_name}, {mode}.
export const TOASTS = {
	gate: { icon: "door", heading: "{color}TUNNEL GATE OPENED", subline: "Get to the exit tunnel!", sound: "sfx.tunnel_door_opened" },
	water: { icon: "water", heading: "§bWATER IS RISING", subline: "{room_name}", sound: "sfx.water_rising" },
};
