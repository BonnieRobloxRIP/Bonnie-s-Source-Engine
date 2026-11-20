# Flood Escape rooms

Rooms are run by the script in `BP/scripts/rooms/`. Each room is one file in `BP/scripts/rooms/definitions/<difficulty>/`.
You never need to touch the engine to build or change a room. Edit the room file, then `/reload`.

## How it fits together

| What | Where |
|---|---|
| One file per room | `BP/scripts/rooms/definitions/easy/r1_ruined_bridge.js` |
| List of rooms the game picks from | `BP/scripts/rooms/room_list.js` |
| Shared settings (title colours, door structures, endless shells, timings) | `BP/scripts/rooms/room_types.js` |
| Starter file for a new room | `BP/scripts/rooms/definitions/_TEMPLATE.js` |
| The engine (you shouldn't need to edit this) | `BP/scripts/rooms/engine/` |

The lift, lobby, music and scoreboards are still mcfunctions. They talk to the room script with script events:

```mcfunction
scriptevent brr:rooms start easy        # in the decider: picks + loads the rooms. Room 1 starts when "started easy" = 1
scriptevent brr:rooms start endless     # endless lowering
scriptevent brr:rooms stop easy         # in the reset functions
```

### Rooms still run from an entity

Like before, every room has a `brr:flood_room` entity (`easy_room1`, `easy_room2`, `easy_room3`, `easy_exit`, `endless`…)
and everything in the room happens relative to it. All positions in a room file are offsets from that entity: the same
numbers you'd type after `~` or `^`. Move the entity and the room works anywhere. Commands in a room run **as and at**
that entity, so `@s` and `~ ~ ~` mean the same thing they did in the old room functions.

### Testing one room

```mcfunction
/scriptevent brr:rooms test hard r3 tesla_power
/scriptevent brr:rooms stop test
```

This spawns the room 2 blocks below you, puts you at its entrance and starts it right away. The room name is
`room_name` in lowercase with `_` for spaces. `fe_brr` does this for Tesla Power.

A test room is **not** part of a game mode, so the mode's `reset` score doesn't affect it. It cleans itself up
(blocks it placed, its lasers, the `test_room` entity) and sends you to the lobby spawn when:

- you reach the exit (2 seconds after the exit door closes),
- you die or leave (after 2 seconds with no player in the test),
- you run `/scriptevent brr:rooms stop test`, start another test, or the reset function of that difficulty runs.

`stop test` also clears test rooms left over after a `/reload`.

### Mistakes are reported for you

When the world loads, every room file is checked. Typos show up in the content log, for example:

```
[Flood Escape] Room "Ruined Bridge" (easy/r1): buttons[2].onPress[0]: unknown key "laod"
[Flood Escape] Room "Ruined Bridge" (easy/r1): buttons[1].facing: should be one of up, down, north, south, east, west
```

## Making a new room

1. Copy `definitions/_TEMPLATE.js` to e.g. `definitions/easy/r1_my_room.js` and fill it in.
2. In `room_list.js`, add an import line and put the room in the right list:
   ```js
   import easy_r1_my_room from "./definitions/easy/r1_my_room.js";
   // ...
   r1: [easy_r1_ruined_bridge, /* ... */, easy_r1_my_room],
   ```
3. `/reload` and test it with `/scriptevent brr:rooms test easy r1 my_room`.

To take a room out of rotation without deleting it, add `enabled: false`. To keep it out of Endless only, add `in_endless: false`.

## Room file reference

```js
export default {
	room_name: "Ruined Bridge",  // subtitle
	room_type: "r1",             // r1 | r2 | r3 | exit | finale
	difficulty: "easy",          // easy | medium | hard
	title: { tick: 90 },         // optional: when the title shows (default tick 10), or your own text:
	                             // { title: "§aEXIT ROOM", subtitle: "§2Guess the code, then run.", tick: 30 }, or false for none
	room_map: { ... },
	on_load: [ ...actions ],     // optional: runs once when the room is placed (before anyone arrives)
	buttons: [ ... ],
	flood: { ... },
	exit: { ... },
	entrance: { ... },           // rooms 2/3
	events: [ ... ],             // optional
	sequences: { ... },          // optional
	loops: [ ... ],              // optional
	hazards: [ ... ],            // optional
	code_lock: { ... },          // optional
	endless: { ... },            // rooms 2/3 in Endless
};
```

### room_map

| Key | Meaning |
|---|---|
| `structure`, `at` | The room structure and where it loads (`structure load "..." ~-7 ~1 ~-7` → `at: [-7, 1, -7]`) |
| `spawnFromPrevious` | Rooms after room 1: where this room's entity is summoned, measured from the previous room's `nextRoomAnchor` |
| `nextRoomAnchor` | Where the next room attaches (end of this room's exit tunnel) |
| `sharedAnchor: true` | Use the previous room's entity instead of summoning a new one (the bonus room does this) |

### buttons

```js
{ at: [6, 6, 5], facing: "west", type: "parkour", onPress: [ ...actions ] }
```

- `onPress` runs once when a player steps on the button. Each action can have a `tick` (1 = immediately).
- `id: "pillar_a"` gives the button a name so other actions can `press` or `rearm` it.
- `repeatable: true` re-arms the button when its `onPress` finishes, so it can be pressed again.
- `onPressAgain: [...]` makes a toggle: odd presses run `onPress`, even presses run `onPressAgain` (Broken System's lift).
- `randomPositions: [{ at, facing }, ...]` places a button at every spot, but only one random spot is real (Dusty Bridges).

### flood

| Key | Meaning |
|---|---|
| `prefix`, `stages`, `beginsAt` | Stage N loads `<prefix>N` at `beginsAt` raised N-1 blocks |
| `startModeDelay` | Seconds from room start to the first stage |
| `floodIntervalSec` | Seconds between stages |
| `anim` | block_by_block seconds for each stage (default 1, 0 = instant) |
| `endsAtStage` | Room ends 10 ticks after this stage (default: the last stage). `false` = never ends by flooding |
| `toast` | Notification on the first stage (default `"water"` = WATER IS RISING, `false` = none) |
| `message` | Optional chat message on the first stage |
| `list` | Instead of prefix/stages: list every stage yourself, `[{ stage: 1, load, at, anim }, ...]` |

### exit

| Key | Meaning |
|---|---|
| `zone` | `{ at, size }` like `x=~3,y=~18,z=~9,dx=1,dy=1,dz=4`. Players inside get the tunnel tag (`easytunnel1`, …) |
| `leaveZone` | Walking into this zone removes the tag. `"outside"` = leaving the zone removes it |
| `if` | Only count players once a flag is set, e.g. `{ lift_up: 1 }` |
| `door`, `doorPos`, `doorRotation`, `doorSound` | The exit tunnel door. It closes behind everyone (`<door>2`, then `<door>1`) |
| `floodFill` | `{ from, to }` water fill once the door closes (default from room_types.js), `null` = none |
| `nextRoomAt` | Tick after the room ends when the next room starts (default 10) |

The room ends when **every player is in the exit tunnel**, or when it fully floods.

### entrance (rooms 2 and 3)

`{ doorPos, rotation, barrier, soundAt }`: the door opens when the room starts (ticks 1 and 10). It shuts 1 second after the first
flood stage, then the barrier structure (`easy:NuhUh`) is placed so nobody can go back.

### events

```js
{ on: "start", tick: 40, message: "..." }        // 40 ticks after the room starts
{ on: "flood", stage: 2, tick: 20, sound: "..." } // 20 ticks after flood stage 2
{ on: "end",   tick: 30, load: "...", at: [...] } // 30 ticks after everyone reached the exit
```

### Actions

Every action is one `{ ... }`. They can be used in `onPress`, `events`, `sequences`, `loops`, `on_load` and `code_lock.onSolved`.

| Action | Example |
|---|---|
| Load a structure | `{ load: "easy:EasyTunnelDoor2", at: [3, 18, 8], rotation: 270, anim: 1 }` |
| Fill | `{ fill: "air", from: [3, 18, 7], to: [4, 18, 7], mode: "destroy" }` (mode can be `"replace lantern"` etc.) |
| Setblock | `{ setblock: "polished_andesite", at: [0, 12, 6] }` |
| Sound (to the mode's players) | `{ sound: "sfx.doors.opened", at: [3, 18, 8], volume: 1, pitch: 0.7 }`, add `everyone: true` for all players |
| Stop a sound | `{ stopsound: "sfx.moving_part.start" }` |
| Chat message | `{ message: "§aTunnel Gate has been Opened!" }` |
| Title / subtitle / actionbar | `{ title: "§4Game Over" }`, `{ subtitle: "..." }`, `{ actionbar: "..." }`, `{ times: [40, 100, 20] }` (titles are drawn by the custom HUD) |
| Toast notification (top right) | `{ toast: "gate" }` (presets in `room_types.js`: `gate`, `water`) or `{ toast: { icon: "door", heading: "{color}POWER RESTORED", subline: "{room_name}", sound: "sfx.my_sound" } }`. Icons: `door`, `water`, `info`. `sound` plays to everyone in the room (`gate` plays `sfx.tunnel_door_opened`, `water` plays `sfx.water_rising`) |
| Particle | `{ particle: "brr:water_flow", at: [0, 8, 0] }` |
| Any command | `{ command: "camera @a[tag={mode}] fade time 0 3 3 color 144 0 0" }` (can be a list of commands) |
| Run an mcfunction | `{ function: "my_folder/my_function" }` |
| Kill the mode's players | `{ kill_players: true }` |
| Move players on a lift | `{ move_players: { zone: { at: [21, 2, -1], size: [2, 3, 2] }, by: [0, 1, 0] } }`. Smooth boat-ride trick by default, `smooth: false` for plain tp, `tag: "{tunnel_tag}"` to only move tagged players |
| Lasers | `{ summon_laser: [0, 9, 0] }`, `{ laser: [0, 13, 0], spin: 8, visible: true }`, `{ remove_laser: [0, 9, 0] }`, `{ remove_lasers: true }` |
| Flags (room variables) | `{ set: { lift_up: 1 } }`, `{ add: { hits: 1 } }` |
| Sequences | `{ play: "meltdown" }`, `{ stop: "idle" }` |
| Buttons | `{ press: "pillar_b" }`, `{ rearm: "pillar_a" }` (`"self"` = the button running this action) |

**Conditions:** any action can have `if: { flag: value }` and/or `unless: { flag: value }`. Flags start at 0.

**Text placeholders** (in messages, titles, toasts, commands): `{mode}` (`easy`, `endless`…), `{room_name}`, `{color}` (difficulty colour), `{tunnel_tag}` (`easytunnel1`…),
`{room_count}` (Endless room number), `{flood_seconds}` (seconds until the next flood stage).

### sequences

Named lists of actions you can start with `play`. Useful for animations that several buttons share.

```js
sequences: {
	lower_a: [ { load: "...", at: [0, 13, 4] }, { tick: 3, load: "...", at: [0, 12, 4] }, { tick: 9, rearm: "pillar_a" } ],
	idle: { loop: 94, channel: "core", autoplay: true, actions: [ ... ] },
}
```

- `loop: 94` restarts the sequence every 94 ticks.
- `autoplay: true` starts it when the room starts.
- `channel: "core"`: starting a sequence stops any other sequence on the same channel (Power Core's animations).

### loops

Actions that repeat while the room is running.

```js
loops: [
	{ every: 6, actions: [ { load: "hard/room3:HardRoom3a", at: [-8, 1, -7] }, { tick: 3, load: "..." } ] },
	{ if: { laser1: 1 }, actions: [ { particle: "...", at: [0, 20, -4] } ] },   // every tick while the flag is set
	{ fromTick: 20, untilFlood: 1, actions: [ { actionbar: "Doors fail in {flood_seconds}s" } ] },
]
```

Options: `every` (ticks per cycle, default 1), `if`/`unless`, `fromTick`, `fromFlood`, `untilFlood`.

### hazards

`hazards: [{ block: "sea_lantern", damage: 18 }, { block: "white_stained_glass", kill: true }]` hurts players standing on that block.

### code_lock

Switches (`brr:flood_exit_button`) that must be set to a random code. Used by the exit room and Advanced Tech.

```js
code_lock: {
	buttons: [[9, 3, -5], [9, 3, -4], [9, 3, -3]],
	groups: [{ buttons: [0, 1, 2], lamp: { at: [10, 4, -4], on: "verdant_froglight", off: "black_concrete" } }],
	progress: "§6{matched}/{total}", progressDone: "§e{matched}/{total}!",   // optional actionbar
	onSolved: [ ...actions ],
}
```

### endless (rooms 2 and 3)

`{ tunnelAt, start, facing }`: where the entrance tunnel loads in Endless mode, and where players are teleported to start.
Room 1s start players at `[0, 2, 0]` automatically.

## Custom HUD (wins, toasts, titles)

The win counters (top right), toast notifications and the big titles are drawn by `RP/ui/hud_screen.json`, fed by
`BP/scripts/hud.js` through the title channel. Because of that, **don't use `/title` for visible text anymore**: it would
blank the HUD and its text wouldn't show. From an mcfunction, run these as the player instead:

```mcfunction
execute as @a run scriptevent brr:hud title §5§lEXTREME MODE
execute as @a run scriptevent brr:hud subtitle §5§lis coming.
execute as @a run scriptevent brr:hud times 20 80 20
execute as @a[tag=easy] run scriptevent brr:hud toast door §aPOWER RESTORED|The lift works again
```

`/title ... actionbar` is a separate channel and still works as normal.

To restyle the HUD (sizes, colours, positions), edit the LOOK section of `tools/build_hud.mjs` and run `node tools/build_hud.mjs`.
It regenerates `hud_screen.json` from the byte layout in `hud.js`, so the two always match.
