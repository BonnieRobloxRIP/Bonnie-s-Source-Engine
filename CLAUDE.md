# Flood Escape: project memory

Minecraft Bedrock add-on (plain BP/RP folders edited in VS Code; **bridge. is no longer used**, and its leftovers were
removed 2026-11-17. The project folder still lives under `AppData\Local\com.bridge.dev\bridge\projects\` only for
historical reasons). Players are locked in a flooding facility and have to press buttons,
find the way out and crack the exit code before the water gets them. Author: BonnieRobloxRIP. Namespace: `brr`.

> This file exists because old Claude Code session logs get auto-deleted (30-day cleanup) and were lost once
> (noticed 2026-11-17). **Keep it up to date:** after any meaningful change, update "Current state" and add a
> line to the "Log" at the bottom. Anything important should be written here, not only in chat.

## Layout

| Path | What |
|---|---|
| `BP/` | Behavior pack (v1.0.24, min engine 1.26.0, `@minecraft/server` 2.9.0, `server-ui` 2.0.0) |
| `RP/` | Resource pack (custom HUD in `RP/ui/hud_screen.json`, textures, models, particles) |
| `BP/scripts/main.js` | Script entry: registers all systems, death ambiance, Endless respawn handling, player-leave scoreboard cleanup |
| `BP/scripts/rooms/` | **Room engine**: every room is a JS data file. Full guide: [docs/ROOMS.md](docs/ROOMS.md) |
| `BP/scripts/hud.js` + `tools/build_hud.mjs` | Custom HUD (wins, toasts, titles). Edit the LOOK section of `build_hud.mjs`, then `node tools/build_hud.mjs` to regenerate `hud_screen.json` |
| `BP/scripts/laser_system.js`, `flood_button.js`, `flood_exit_button.js`, `items.js` | Lasers, room buttons, code-lock switches, lobby items |
| `BP/scripts/lift.js` | Entity-based lift. **Currently disabled** (commented out in main.js); lifts are structure based |
| `BP/functions/` | mcfunctions still run the lobby, lifts, music, scoreboards and mode control. `tick.json` runs `lobby_functions/lobby` + `game_functions/game_controller` |
| `BP/functions/fe_setup.mcfunction` | One-time world setup: gamerules, scoreboards, spawn `0 86 -16` |
| `BP/functions/fe_brr.mcfunction` | Dev shortcut: test a single room (currently Hard r3 Tesla Power) |
| `BP/structures/` | Room structures, doors, flood stages (`easy:`, `hard/room3:` etc.) |
| `_old_room_mcfunctions/` | **Archive.** The old per-room mcfunctions from before the script engine. Not part of the pack; kept for reference |
| `archive/` | Old release builds kept for reference: `Flood Escape 2026-09-05.mcaddon`, `Flood Escape 2026-08-23.zip` (older than the October work) |
| `.vscode/settings.json` | Config for the VS Code Bedrock sync plugin (BP/RP folders), same as Horrific Housing's |
| `craftalog/badges.js` | Craftalog badge system, currently not registered in main.js |
| `BP/gluon_gun.js`, `BP/gluon_beam_visual.js` | Loose files in the BP root, not imported by main.js (a copy of the beam visual is in `scripts/`). Purpose unclear; ask before deleting |

## How the game runs

- **Each difficulty has its own theme** (judge and build rooms against it): **Easy = warehouses**, **Medium =
  construction**, **Hard = harsh steel environments**. Each also has its own shell colour (Easy green, Medium
  yellow/orange, Hard red).
- **Modes:** easy, medium, hard, endless (extreme and training scoreboards exist too). Each mode has its own
  scoreboard objective (`start`, `started`, `reset`, `lift`... are fake players on it) and a player tag (`easy`, `hard`...).
- mcfunctions talk to the room script with `scriptevent brr:rooms start|stop <mode>` and `brr:rooms test <difficulty> <type> <name>`.
- Visible titles go through `scriptevent brr:hud title|subtitle|times|toast ...`. **Don't use `/title` for visible text**
  (it blanks the custom HUD). `/title ... actionbar` is fine.
- A watchdog in `rooms/index.js` resets a mode if scripts reload mid-round.
- Rooms in rotation (`BP/scripts/rooms/room_list.js`): easy has 9 r1, 4 r2, 4 r3, plus an exit (code room) and a finale
  (Almost There). Medium and hard have 3/3/3 and 2/2/2.

## Lobby (design intent, from the user 2026-11-17)

- Inspirations: Flood Escape Classic's lobby layout as a base, re-imagined and hyper-realistic; **Crowbar Collective's
  Black Mesa** facility (Earthbound chapters 1-14); the **RMS Titanic** for luxury public areas (deck levels, grand
  staircase, reading/writing room, Café Parisien, engine room); two screenshots of an abandoned Flood Escape Classic
  rework for the surface.
- Setting: a fictional mountainside; a river flows into an open lake, and the facility's canal connects to it.
- **Deck levels** (e.g. "B DECK") in wood/Titanic style. The **Elevator Deck** has coloured floor lanes leading to
  each mode's lift. **Each mode's elevator shaft is a column in the mode's colour (Easy green, Medium yellow, Hard red...)
  that is meant to be seen openly through every deck**: don't treat those strong colours as clashing.
  Why: players resting in the lobby get to watch others descend into the chaos they're avoiding. And the lift is open
  on purpose: riders can change their mind and **jump off during the descent** until the point of no return at the
  **engine room deck**, and players on any deck can **jump into the descending lift** at the last second. Any change to
  lift logic (`game_controller` lift volumes such as `x=5.5,y=23,z=49.5,dx=5,dy=68,dz=5`, the `easylift`/`easylift2` tags,
  "Exiting Lift..." actionbar) must keep both of these working.
- **Each mode's lift ride is unique** and previews the mode: **Easy** is the intended straight descent; **Medium**
  detours along a **monorail segment** (Medium couldn't physically fit straight down, so the detour is a deliberate
  creative solution); **Hard**'s lift **glitches out** and feels like it could collapse any moment, projecting the
  mode's difficulty right away.
- **Start timer + ready-up (2026-11-17)**, the answer to players' only complaint (too long to start a mode). Waits
  measured from the code: room 1 starts at lift tick 540 (Easy, 27 s), 940 (Medium, 47 s), 840 (Hard, 42 s) after the
  start timer. The timer went **20 s -> 10 s** for all five lifts (`timer_s` in `game_controller` + the mode `reset`
  functions). `BP/scripts/lift_ready.js`: players waiting in a lift (`<mode>lift` tag, `start <mode>` = 0) hold the
  locked **Ready** item `brr:fe_ready` (icon `RP/textures/items/ready.png`); using it toggles ready, and once **60% of
  the riders (rounded up)** are ready the lift launches instantly (`start <mode>` = 1, same as the timer running out).
  The 60% stops one player stalling a full lift (10 riders need 6; 1-2 riders need everyone). Counts are shown on the
  countdown actionbar from fake players `ready` / `ready_need`. Skipping the descent was rejected: it's the lobby's
  centrepiece (spectacle, jump in/out, mode previews).
- The elevator descent is a cinematic ride showing the full extent of the lobby. The engine room (Endless) is unfinished.
  The Extreme area is a large cave system with a waterfall, much bigger than the original's.
- In the world save, a 64x64 enclosure at x~34..97, z~-85..-23, y115-242 above the lobby holds a cave build (purple
  crystals) and a black-glass shaft (unconfirmed what exactly; likely the Extreme cave being built in the sky).

## Worlds and packs

- Dev world: `%APPDATA%\Minecraft Bedrock\Users\4289949900108059519\games\com.mojang\minecraftWorlds\spHGE4O6ymU=`
  (uses BP 1.0.24 + **Bonnie's Source Engine** BP `7f638fc9-...`). Older copies: `1srZzA2hN8I=` (BP 1.0.20) and
  `wcB7iHaGiR4=` ("Flood Escape 1.3.1", a release build).
- Dev packs in game: `%APPDATA%\Minecraft Bedrock\Users\Shared\games\com.mojang\development_*_packs\Flood Escape_bp|_rp`
  (the `_bp`/`_rp` names are left over from bridge.). BP/RP get there through the VS Code Bedrock sync plugin (like HH),
  or `node <bedrock-pack-checks>/scripts/deploy.mjs` from the project folder.
- World experiments (from the old bridge. config): Upcoming Creator Features, Experimental Creator Camera Features,
  GameTest Framework, Render Dragon Features. Target/min engine version 1.26.0.
- Music lives in a separate project: **Flood Escape Music**.
- **Bonnie's Source Engine (BSE)** is part of every Bedrock map the user makes, this one included (BP `7f638fc9-...`,
  RP `3a601308-...`, project folder `..\Bonnie's Source Engine`). It provides props, anti-cheat, the chat system,
  emojis/glyphs and dev tools. Before building something new, check how BSE (or Horrific Housing, which shares this
  HUD's design) already does it and reuse the concept.
- Git repo at the project root (branch `main`, created 2026-11-17, like HH's). **No commits yet**, so nothing is
  backed up by git until the user asks for a first commit.

## Skills to use (Bedrock-specific, made by the user)

- **bedrock-ui-preview**: render `RP/ui/hud_screen.json` to a PNG with a made-up title payload (wins, title frame,
  toast frame...). Use it **after every HUD change**, before asking the user to check in game. Build payloads with the
  `HUD_LAYOUT` byte table below.
- **bedrock-pack-checks**: load the BP scripts in Node with stubbed `@minecraft` modules, check every JSON and every
  referenced texture/model/sound exists (exact filename case), and copy BP/RP into the game's development packs. Run after
  script or asset changes.
- **bedrock-test-server**: boot the packs on a headless Bedrock Dedicated Server, send commands (`/scriptevent brr:rooms
  test ...`, `brr:hud ...`), read script/content-log errors, run GameTest tests. Use to test room logic without the game.
- **minecraft-world-tools**: read the Flood Escape world save (signs, command blocks, structures, maps).
- **Looking at rooms without the game** (used for the 2026-11-17 room review): room shells are closed boxes, so render
  them as dollhouse cuts. Best results: a copy of minecraft-world-tools' `player_view.mjs` patched to read a
  `.mcstructure` instead of a world (its three world-loading lines replaced; blocks keep their states; an `FE_CLIP` box
  hides one half), viewed from outside at a slight angle, 4 cuts per room (each half along X and Z). Horrific Housing's
  `tools/render_structure.js` (raytracer with corner/top/section views) also works for quick sections. Room list with
  shell files: import `BP/scripts/rooms/room_list.js` with bedrock-pack-checks' `stubs.mjs`.

## Working notes / gotchas

- Files are UTF-8 **without BOM** and use `§` colour codes. Windows PowerShell 5.1 shows them as `Â§`; that's a display
  issue, not file corruption. Never write these files with `Set-Content`/`Out-File` (that can re-encode them). Use the editor tools.
- After editing scripts or functions: `/reload` in game. Room files are validated on load; typos show in the content log as `[Flood Escape] Room "...": ...`.
- Test a room: `/scriptevent brr:rooms test <difficulty> <r1|r2|r3|exit|finale> <room_name_snake_case>`, end with `/scriptevent brr:rooms stop test`.

## Custom HUD (what we're actively working on)

How it works: `BP/scripts/hud.js` sends each player **one fixed-width string** (715 bytes) through the vanilla title
channel whenever it changes, and at least every 4 ticks. `RP/ui/hud_screen.json` cuts it apart by **byte offset**
(JSON UI can't do anything smarter). It's the same design as Horrific Housing's HUD (HH's was ported from this one, and
on 2026-11-17 HH's widgets were ported back). The byte layout is `HUD_LAYOUT` in hud.js:

| Bytes | Field |
|---|---|
| 0-3 | marker `FE:` (UI only shows anything for titles starting with this) |
| 3 | title fade step (`-` hidden, `a`-`d` faintest to full) |
| 4-64 / 64-124 | title / subtitle text (60 bytes each, centred) |
| 124 | toast slide frame (`-` hidden, `a`-`f`) |
| 125 | toast icon (`d` door, `w` water, `i` info, which uses `drop.png`) |
| 126 | toast row: how many widget rows are above the toast (`a`-`d` = 0-3) |
| 127-175 / 175-223 | toast heading / subline (48 bytes each) |
| 223-715 | widgets: 3 rows x 4 slots, each 1 style byte (`-` empty) + 40 text bytes |

Rules:
- **Never hand-edit `hud_screen.json`.** Change `HUD_LAYOUT`/styles in hud.js and/or the LOOK section of
  `tools/build_hud.mjs`, then run `node tools/build_hud.mjs` (`--textures` also redraws `toast_door`, `toast_water`, `drop`).
  Then preview it (bedrock-ui-preview, root `hud.fe_hud_static`) and run bedrock-pack-checks.
- Text is padded with invisible `§r` (3 bytes) so labels size to the real text, and every field starts with `§r`
  (`labelText`), since Bedrock may not render a label that's only digits/spaces. Widths are **bytes, not characters**:
  `§` is 2 bytes. Too-long text is cut off.
- **Gate on letters, never digits or `-`.** A digit cut from the string becomes a number and never equals text (this
  is why HH's title never showed, and FE's title steps were digits until 2026-11-17). Comparing a slice with `'-'`
  never matches either, so an empty widget slot is detected by OR-ing its style letters.
- Keep bindings short: one that ORs a huge number of comparisons is silently ignored in game.
- **Never chain 3+ checks in one condition** (`a or b or c`, `a and b and c`): in game only some of them count
  (2026-11-17: the 6-way OR on widget slots showed only the Endless widget, and a 3-way AND showed an empty toast box;
  the preview renderer evaluates chains correctly, so it can't catch this). Use one check, or two nested in brackets
  (`both()` in build_hud.mjs). Empty widget slots use the letter `EMPTY_STYLE` ('z') so they're hidden with a single
  `not (style = 'z')`; the root `fe_hud_static` checks the marker once for everything. Verified in the generated file:
  no condition outside the debug readout chains 3+ checks.
- `DEBUG_HUD` in build_hud.mjs adds a readout top left (raw bytes, frames, every slot, condition-form tests).
  **It's on as of 2026-11-17 for the in-game check; turn it off (and rebuild) once the HUD is confirmed.**

What exists:
- **Widgets**, top right corner, like HH's: a pill per widget (9-sliced background, icon, text), as wide as its text.
  They fill rows of up to 4 by an estimated width (`ROW_BUDGET` 400 in hud.js); the next row goes underneath. Within a
  row they read left to right. Styles (`WIDGET_STYLES`): `easy`, `medium`, `hard`, `extreme`, `endless` (their own
  background + trophy icon) and `plain` (`background_hud` + water drop).
  - Everyone always sees the 5 win widgets (`BP/scripts/hud_widgets.js`): Easy/Medium/Hard/Extreme Wins and Endless Best,
    from the `storage_*` objectives. This fits in 2 rows (3 + 2).
  - Per-player widgets: `setWidget(player, key, style, text)` / `removeWidget` in scripts, or from mcfunctions
    `scriptevent brr:hud widget <key> <style> <text>` / `brr:hud unwidget <key>` (run as the player). Good for timers.
- **Toasts** sit under the last widget row (24 copies in the UI: 4 row positions x 6 slide frames), 196x38, slide in,
  rest 70 ticks, slide out, queue per player. Text is clipped at the toast's edge instead of wrapping.
  Presets `gate`/`water` live in `BP/scripts/rooms/room_types.js`.
- **Big titles** with 4-step fade, `brr:hud times` like `/title times`.
- The HUD root `fe_hud_static` is built once and reads the title through the global binding (like HH's
  `hh_hud_static`). It used to be created by the title factory.
- All mcfunctions have been moved off `/title title|subtitle|times` (7 uses of `brr:hud` in functions, 0 old ones left).
- Before 2026-11-17 the wins were a fixed column on the right edge (`WINS_SCALE` 1.3). It went off the top of the screen at
  GUI scale 3 and the toasts covered it, so it was replaced by the widgets.

## Current state (as of 2026-11-17)

Last real work was **2026-10-12**: room logic moved from mcfunctions into the script room engine (all easy/medium/hard
rooms ported, old functions archived), the custom HUD above was built, and the `lowering.mcfunction` files plus
`game_controller` were updated to drive the new engine.

On 2026-11-17 the wins column was replaced with HH-style widgets (see Custom HUD). The new HUD was checked in the
preview renderer at GUI scales 2/3/4 and passes bedrock-pack-checks, but **hasn't been tested in game yet**.

**Open items / to-do:**
- Test the new HUD in game: widgets, toasts under them, and especially **the big title** (its fade steps changed from
  digits to letters, so it may only now start showing; ask the user whether FE titles ever showed before).
- At GUI scale 4 (1080p), a toast under 2 widget rows can touch the corner of the big title when both are on screen.
- Make sure the new HUD has reached the dev packs (VS Code sync plugin, or the pack-checks deploy script) before testing.

**Room review 2026-11-17: read with care.** It came from files + rendered structures only, nothing played. The user
has playtested these rooms with **30+ players and never hit these problems**, so real play outranks this list: most
items are theoretical (players press buttons long before the water, jump better than a block-data solver, etc.).
Don't present them as bugs; only raise one if it's new since the October script-engine port or a player reports it.
Playtest history: many 30+ player tests on the old mcfunction version, fewer after the migration to the script
engine; the game runs much smoother since the migration.
**Playtests are rare on purpose:** the user only runs one when there's enough new content (especially resource-pack
side) to justify players downloading an update. So don't suggest playtests to check small changes; verify with the
tools instead (bedrock-ui-preview, bedrock-pack-checks, bedrock-test-server) and the user's own solo testing.
The new HUD (2026-11-17) is working well in the user's own testing.
✔ = the file/structure fact was re-checked (the fact is true; whether it matters in play is a different question):
- ✔ **Flood slices with pressed buttons**: 37 buttons in 15 rooms (mostly Easy; no Hard room) are saved *pressed* inside
  flood-stage structures, so they fire by themselves when the water reaches them. The engine polls `brr:pressed`. Ask the
  user whether that's an intended safety net; if not, re-save those slices with structure void at button cells.
- Flood slices / moving parts without void also erase mechanisms (Power Failure's bridge, Broken System lift cuts air
  pockets into the water and its `move_players` zone covers the whole travel volume, Master Lift cage leaves lanterns).
- ✔ **Power Core**: exit zone at z2 but door/gate at z3-4 (off by one, from the old mcfunction); pressing the exit sets
  `core_safe` regardless of blaster hits; missing it by stage 12 (~75 s) is a hidden team wipe on Easy, with no countdown.
- ✔ **Tesla Power** blackout (event at tick 61) loads `medium/room2:MediumRoom2Offline` (15x23x22), which stamps blocks
  outside the room (z -14). Needs its own lights-off structure.
- Unreachable-without-water first buttons: Storage Low b1, Crazyblox's Warehouse b1. Warehouse's exit ledge may be too low.
- Exit Room kill loop kills everyone in the mode (also those on the lift); ~1/64 codes start already solved.
- Plenty of Space loads `MMR1V2M2d`, which doesn't exist. Finale title says "BONUS ROOM" but is required; stage 11 missing.
- Spawn-point pillars: Interesting Paths and Side Floors load blocks at the room centre where players stand.
- Ventilation Failure plays a metal sound to `@a` (lobby too) and has chat typos.
- Theme fit (against the per-difficulty themes above): weakest fits are Ruined Bridge (reads medieval ruin, not
  warehouse), Power Core (sci-fi reactor), Labyrinth (cellblock), Trapped and Interesting Paths (red concrete box /
  deepslate fortress rather than steel). Medium could lean harder into construction (scaffolding, cranes, cones from
  BSE). Hard's palette is mostly red concrete/terracotta + deepslate, with little actual steel.
- Design: most presses are "button spawns platforms", often silent and far from the button; Medium has two luck rooms
  (Dusty Bridges, Better Chances); Medium/Hard pools are small (3 and 2 per slot); Hard r3 clocks are longer than Medium's.

## Log

- 2026-10-12: Script room engine + custom HUD (reconstructed from file dates; the original session log is lost).
- 2026-11-17: Old sessions found deleted. Wrote this CLAUDE.md from the project files.
- 2026-11-17: Wins column replaced with HH-style widgets (`hud.js` rewritten, new `hud_widgets.js`, `build_hud.mjs`
  regenerated). Title steps are now letters, the HUD root is static, toast text is clipped, and there are per-player widgets.
  Fixed `%sm` in the bedrock-ui-preview renderer (it used the parent's size instead of the largest sibling's).
- 2026-11-17: Lift start timer 20 s -> 10 s; new Ready item + `lift_ready.js` (launch at 60% ready). Not tested in game yet.
- 2026-11-17: Removed bridge. leftovers: `.bridge/`, `config.json`, `deno.json`, `builds/` (old releases moved to
  `archive/`), the empty `BP/.git`, and the manifests' `generated_with`. New HH-style `.gitignore`, `git init` at the root.
