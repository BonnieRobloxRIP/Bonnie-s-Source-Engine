// Generates RP/ui/hud_screen.json (+ _ui_defs.json) for the custom HUD: widgets in the top right corner
// (the win counters...), toasts under them and the big centred title. The widgets are built like
// Horrific Housing's (tools/build_hud.mjs there), with an icon added in front of the text.
// The byte layout is read from BP/scripts/hud.js, so the UI always matches what the script sends.
//
//   node tools/build_hud.mjs              rebuild the UI
//   node tools/build_hud.mjs --textures   also redraw the generated toast icons (toast_door, toast_water, drop)
//
// Edit the LOOK section below to restyle, then run it again.
// Hand-made textures live in RP/textures/ui/fe_hud (backgrounds are 9-sliced through their .json files).

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// hud.js imports @minecraft/server (only available in game), so read its layout constants as text.
function readConst(name) {
	const src = fs.readFileSync(path.join(root, "BP/scripts/hud.js"), "utf8");
	const match = new RegExp(`export const ${name} = ([\\[{][\\s\\S]*?\\n[\\]}]);`).exec(src) ?? new RegExp(`export const ${name} = (.*);`).exec(src);
	if (!match) throw new Error(`hud.js has no ${name}`);
	return Function(`return (${match[1].replace(/\/\/.*$/gm, "")});`)();
}
const L = readConst("HUD_LAYOUT");
const ICONS = readConst("TOAST_ICONS");
const FRAMES = readConst("TOAST_FRAMES");
const STEPS = [...readConst("TITLE_STEPS")]; // title fade steps, faintest first
const TOAST_ROWS = [...readConst("TOAST_ROWS")];
const STYLES = readConst("WIDGET_STYLES");
const EMPTY = readConst("EMPTY_STYLE");
if (Object.values(STYLES).includes(EMPTY)) throw new Error(`EMPTY_STYLE "${EMPTY}" is also a widget style`);

// ---------------------------------------------------------------- LOOK
const TEX = "textures/ui/fe_hud";
const PANEL = `${TEX}/background_hud`; // plain background (toasts, "plain" widgets)
// Widget look per style in WIDGET_STYLES: background (9-sliced) and icon in front of the text.
const WIDGET_LOOKS = {
	easy: { background: "easy_background_hud", icon: "easy_trophy_icon" },
	medium: { background: "medium_background_hud", icon: "medium_trophy_icon" },
	hard: { background: "hard_background_hud", icon: "hard_trophy_icon" },
	extreme: { background: "extreme_hud_background", icon: "extreme_trophy_icon" },
	endless: { background: "endless_background_hud", icon: "endless_trophy_icon" },
	plain: { background: "background_hud", icon: "drop" },
};
// Keep SCALE and the sizes in sync with WIDGET_SCALE / WIDGET_PADDING in hud.js (row wrapping).
const SCALE = 1.2;
const WIDGET = { height: Math.round(18 * SCALE), padding: 6, gap: 3, icon: 16, iconGap: 3 };
const ROW_GAP = 3;
const CORNER = [-4, 4]; // from the top right corner of the screen (widgets and toasts)
const TOAST = { width: 196, height: 38, gap: 4 }; // gap: between the last widget row and the toast
// Slide-in steps: frame letter -> [x offset from resting position, alpha]
const TOAST_STEPS = { a: [210, 0], b: [140, 0.35], c: [80, 0.6], d: [36, 0.85], e: [10, 1], f: [0, 1] };
// A readout top left of what the UI reads from the title (raw bytes, key fields, every slot) plus tests of
// condition forms. For diagnosing the HUD in game; keep false otherwise.
const DEBUG_HUD = true;

// ---------------------------------------------------------------- helpers
const DATA = "#fe_data";
const slice = (start, end) => `(('%.${end}s' * ${DATA}) - ('%.${start}s' * ${DATA}))`;
const charAt = (i) => slice(i, i + 1);
const is = (i, letter) => `(${charAt(i)} = '${letter}')`;
// IN GAME, A CONDITION CHAINING 3+ CHECKS IS EVALUATED WRONGLY ("a or b or c", "a and b and c"): only some of the
// checks count. Every condition must be one check, or two nested in brackets: both(a, b) = "(a and b)".
const both = (a, b) => `(${a} and ${b})`;
const isOurs = `(('%.${L.marker.length}s' * ${DATA}) = '${L.marker}')`;
const blank = (width) => {
	// labelText() output for an empty string
	const pads = Math.floor(width / 3);
	return "§r".repeat(pads) + " ".repeat(width - pads * 3);
};
const dataBindings = (extra) => [
	{ binding_name: "#hud_title_text_string", binding_name_override: DATA, binding_type: "global", binding_condition: "always" },
	...extra.map(([source, target]) => ({ binding_type: "view", source_property_name: source, target_property_name: target, binding_condition: "always" })),
];
const withData = (element, extra) => ({ ...element, property_bag: { [DATA]: "" }, bindings: dataBindings(extra) });
const textOf = (field) => slice(field.start, field.start + field.width);
const spacer = (name, width, height = "100%") => ({ [name]: { type: "panel", size: [width, height] } });

for (const style of Object.keys(STYLES)) if (!WIDGET_LOOKS[style]) throw new Error(`no WIDGET_LOOKS entry for style "${style}"`);

const ui = { namespace: "hud" };

// ---------------------------------------------------------------- widgets
// One slot per payload slot. A slot is as wide as its content: the background holder is sized from its
// sibling (the icon + text stack, "%sm") and the slot from its children ("%cm"). Empty slots are hidden,
// so the row's stack panel closes the gap. Rows are stacks anchored to the right edge holding their
// slots in reverse, so slot 0 sits in the corner (hud.js fills a row's slots back to front, so the
// widgets read left to right).
const W = L.widgets;
const slotSize = W.styleWidth + W.textWidth;
function widgetSlot(row, index) {
	const start = W.start + (row * W.perRow + index) * slotSize;
	const text = slice(start + W.styleWidth, start + slotSize);
	// visible unless the slot is empty: one comparison (the root already checks the marker)
	const filled = `(not ${is(start, EMPTY)})`;
	return {
		[`slot_${index}`]: withData({
			type: "panel", size: [`100%cm + ${WIDGET.gap}px`, WIDGET.height],
			controls: [
				{
					background: {
						type: "panel", size: [`100%sm + ${WIDGET.padding * 2}px`, "100%"], anchor_from: "right_middle", anchor_to: "right_middle",
						controls: Object.entries(STYLES).map(([style, byte]) => ({
							[`bg_${style}`]: withData({ type: "image", texture: `${TEX}/${WIDGET_LOOKS[style].background}`, size: ["100%", "100%"], layer: 1 }, [[is(start, byte), "#visible"]]),
						})),
					},
				},
				{
					content: {
						type: "stack_panel", orientation: "horizontal", size: ["100%c", "100%"], anchor_from: "right_middle", anchor_to: "right_middle",
						offset: [-WIDGET.padding, 0], layer: 2,
						controls: [
							{
								icon_slot: {
									type: "panel", size: [WIDGET.icon, "100%"],
									controls: Object.entries(STYLES).map(([style, byte]) => ({
										[`icon_${style}`]: withData({ type: "image", texture: `${TEX}/${WIDGET_LOOKS[style].icon}`, size: [WIDGET.icon, WIDGET.icon], layer: 3 }, [[is(start, byte), "#visible"]]),
									})),
								},
							},
							spacer("icon_gap", WIDGET.iconGap),
							{
								label_slot: {
									type: "panel", size: ["100%c", "100%"],
									controls: [{
										label: withData({
											type: "label", text: "#text", localize: false, shadow: true, color: [1, 1, 1], text_alignment: "left",
											anchor_from: "left_middle", anchor_to: "left_middle", offset: [0, 1], size: ["default", "default"],
											font_scale_factor: SCALE, layer: 3,
										}, [[text, "#text"]]),
									}],
								},
							},
						],
					},
				},
			],
		}, [[filled, "#visible"]]),
	};
}
for (let row = 0; row < W.rows; row++) {
	ui[`fe_widget_row_${row}`] = {
		type: "stack_panel", orientation: "horizontal", size: ["100%c", WIDGET.height], layer: 50,
		anchor_from: "top_right", anchor_to: "top_right", offset: [CORNER[0], CORNER[1] + row * (WIDGET.height + ROW_GAP)],
		controls: Array.from({ length: W.perRow }, (_, i) => widgetSlot(row, W.perRow - 1 - i)),
	};
}

// ---------------------------------------------------------------- toast: one copy per (widget rows above it) x (slide frame)
// The text sits in clipping panels, unwrapped: long text is cut off at the edge of the toast instead of
// wrapping out of it.
const iconImage = (key, file) => ({
	[`icon_${key}`]: withData({
		type: "image", texture: `${TEX}/${file}`, size: [26, 26], anchor_from: "left_middle", anchor_to: "left_middle", offset: [6, 0], layer: 4,
	}, [[is(L.toastIcon, ICONS[key]), "#visible"]]),
});
const toastLine = (name, field, y, look) => ({
	[`${name}_clip`]: {
		type: "panel", size: [TOAST.width - 46, 12], anchor_from: "top_left", anchor_to: "top_left", offset: [40, y], clips_children: true, layer: 4,
		controls: [{
			[name]: withData({
				type: "label", text: "#text", localize: false, shadow: true, color: [1, 1, 1], text_alignment: "left",
				anchor_from: "left_middle", anchor_to: "left_middle", size: ["default", "default"], layer: 4, ...look,
			}, [[textOf(field), "#text"]]),
		}],
	},
});
ui.fe_toast_body = {
	type: "panel", size: ["100%", "100%"],
	controls: [
		{ background: { type: "image", texture: PANEL, size: ["100%", "100%"], layer: 1 } },
		{ icon_frame: { type: "image", texture: PANEL, size: [30, 30], anchor_from: "left_middle", anchor_to: "left_middle", offset: [4, 0], layer: 3 } },
		iconImage("door", "toast_door"),
		iconImage("water", "toast_water"),
		iconImage("info", "drop"),
		toastLine("heading", L.toastHeading, 6, { font_type: "MinecraftTen" }),
		toastLine("subline", L.toastSubline, 21, {}),
	],
};
const toastNames = [];
TOAST_ROWS.forEach((rowByte, rows) => {
	const y = CORNER[1] + rows * (WIDGET.height + ROW_GAP) + (rows ? TOAST.gap - ROW_GAP : 0);
	for (const frame of FRAMES) {
		const [dx, alpha] = TOAST_STEPS[frame];
		const name = `fe_toast_${rows}_${frame}`;
		toastNames.push(name);
		ui[name] = withData({
			type: "panel", anchor_from: "top_right", anchor_to: "top_right", size: [TOAST.width, TOAST.height],
			offset: [CORNER[0] + dx, y], layer: 60, alpha, propagate_alpha: true,
			controls: [{ "body@hud.fe_toast_body": {} }],
		}, [[both(is(L.toastFrame, frame), is(L.toastRow, rowByte)), "#visible"]]);
	}
});

// ---------------------------------------------------------------- big centred title + subtitle (vanilla look), one copy per fade step
const titleText = textOf(L.title);
const subtitleText = textOf(L.subtitle);
STEPS.forEach((letter, i) => {
	const step = i + 1;
	ui[`fe_title_${step}`] = withData({
		type: "panel", anchor_from: "center", anchor_to: "center", size: ["100%", 60], offset: [0, -40], layer: 40, alpha: step / STEPS.length, propagate_alpha: true,
		controls: [
			{
				title_frame: {
					type: "panel", size: ["100%", "100%cm"], anchor_from: "top_middle", anchor_to: "top_middle",
					controls: [
						{ title_background: withData({ type: "image", size: ["100%sm + 30px", "100%sm + 6px"], texture: "textures/ui/hud_tip_text_background", alpha: 0.6 }, [[`(not (${titleText} = '${blank(L.title.width)}'))`, "#visible"]]) },
						{
							title: withData({
								type: "label", text: "#text", localize: false, shadow: true, font_size: "extra_large", color: [1, 1, 1],
								text_alignment: "center", anchor_from: "top_middle", anchor_to: "top_middle", offset: [0, 6], layer: 31,
							}, [[titleText, "#text"]]),
						},
					],
				},
			},
			{
				subtitle_frame: {
					type: "panel", size: ["100%", "100%cm"], anchor_from: "top_middle", anchor_to: "top_middle", offset: [0, 34],
					controls: [
						{ subtitle_background: withData({ type: "image", size: ["100%sm + 20px", "100%sm + 5px"], texture: "textures/ui/hud_tip_text_background", alpha: 0.6 }, [[`(not (${subtitleText} = '${blank(L.subtitle.width)}'))`, "#visible"]]) },
						{
							subtitle: withData({
								type: "label", text: "#text", localize: false, shadow: true, font_size: "large", color: [1, 1, 1],
								text_alignment: "center", anchor_from: "top_middle", anchor_to: "top_middle", offset: [0, 3], layer: 31,
							}, [[subtitleText, "#text"]]),
						},
					],
				},
			},
		],
	}, [[is(L.titleFrame, letter), "#visible"]]);
});

// ---------------------------------------------------------------- debug readout (DEBUG_HUD), top left
// Lines that print what the UI reads, then "test" lines that only show when their condition is true in game,
// comparing a chained condition with the one-check and nested forms.
const debugBound = (name, text, extra = []) => ({
	[name]: withData({ type: "label", text: "#text", localize: false, shadow: true, color: [1, 1, 0.4], size: ["default", "default"], layer: 70 }, [[text, "#text"], ...extra]),
});
const debugTest = (name, label, condition) => ({
	[name]: withData({ type: "label", text: `§r§a${label}`, localize: false, shadow: true, color: [0.4, 1, 0.4], size: ["default", "default"], layer: 70, visible: false }, [[condition, "#visible"]]),
});
const slotAt = (row, index) => W.start + (row * W.perRow + index) * slotSize;
ui.fe_hud_debug = {
	type: "stack_panel", orientation: "vertical", anchor_from: "top_left", anchor_to: "top_left", offset: [4, 30], size: [320, "100%c"], layer: 70,
	controls: [
		{ static: { type: "label", text: "§rFE HUD debug (DEBUG_HUD in tools/build_hud.mjs)", localize: false, shadow: true, color: [1, 1, 1], size: ["default", "default"], layer: 70 } },
		debugBound("raw", `('§rraw: [' + ('%.24s' * ${DATA}) + ']')`),
		debugBound("frames", `('§rtitle [' + ${charAt(L.titleFrame)} + '] toast [' + ${charAt(L.toastFrame)} + '] icon [' + ${charAt(L.toastIcon)} + '] row [' + ${charAt(L.toastRow)} + ']')`),
		...Array.from({ length: W.rows * W.perRow }, (_, i) => {
			const row = Math.floor(i / W.perRow), index = i % W.perRow, at = slotAt(row, index);
			return debugBound(`slot_${row}_${index}`, `('§rr${row}s${index} [' + ${charAt(at)} + '] ' + ${slice(at + 1, at + slotSize)})`);
		}),
		debugTest("t_single", "TEST single: r0s0 style is a letter we sent", `(not ${is(slotAt(0, 0), EMPTY)})`),
		debugTest("t_chain_or", "TEST chain-or (e or m or h or x or n or p) on r0s0", `(${Object.values(STYLES).map((b) => is(slotAt(0, 0), b)).join(" or ")})`),
		debugTest("t_nested_and", "TEST nested and (marker and r0s0 not empty)", both(isOurs, `(not ${is(slotAt(0, 0), EMPTY)})`)),
		debugTest("t_chain_and", "TEST chain-and (marker and r0s0 not empty and marker)", `(${isOurs} and (not ${is(slotAt(0, 0), EMPTY)}) and ${isOurs})`),
	],
};

// ---------------------------------------------------------------- root: built once and always there (like Horrific Housing's
// hh_hud_static), reading the title text through the global binding, so a refresh only changes what it shows.
// (It used to be made by the title factory, which re-creates it on every title.)
ui.fe_hud_static = withData({
	type: "panel",
	size: ["100%", "100%"],
	controls: [
		...Array.from({ length: W.rows }, (_, row) => ({ [`widget_row_${row}@hud.fe_widget_row_${row}`]: {} })),
		...toastNames.map((name) => ({ [`${name.slice(3)}@hud.${name}`]: {} })),
		...STEPS.map((_, i) => ({ [`title_${i + 1}@hud.fe_title_${i + 1}`]: {} })),
		...(DEBUG_HUD ? [{ "debug@hud.fe_hud_debug": {} }] : []),
	],
}, [[isOurs, "#visible"]]);
ui.root_panel = {
	modifications: [{ array_name: "controls", operation: "insert_back", value: [{ "fe_hud_static@hud.fe_hud_static": {} }] }],
};
// The vanilla title would print the raw data string. Pack definitions are MERGED into vanilla ones,
// but arrays are replaced whole: emptying "controls" removes the vanilla title and subtitle labels.
ui.hud_title_text = { controls: [] };

const uiDir = path.join(root, "RP/ui");
fs.mkdirSync(uiDir, { recursive: true });
fs.writeFileSync(path.join(uiDir, "hud_screen.json"), JSON.stringify(ui, null, "\t"));
const defsPath = path.join(uiDir, "_ui_defs.json");
const defs = fs.existsSync(defsPath) ? JSON.parse(fs.readFileSync(defsPath, "utf8")) : { ui_defs: [] };
if (!defs.ui_defs.includes("ui/hud_screen.json")) defs.ui_defs.push("ui/hud_screen.json");
fs.writeFileSync(defsPath, JSON.stringify(defs, null, "\t"));

// ---------------------------------------------------------------- textures
const texDir = path.join(root, "RP", TEX);
fs.mkdirSync(texDir, { recursive: true });
const missing = [...new Set(Object.values(WIDGET_LOOKS).flatMap((look) => [look.background, look.icon]).concat("background_hud"))]
	.filter((n) => n !== "drop" && !fs.existsSync(path.join(texDir, `${n}.png`)));
if (missing.length) console.warn(`missing textures in ${TEX}: ${missing.join(", ")}`);

// Generated toast icons (only written if missing, or with --textures)
function png(width, height, pixel) {
	const raw = Buffer.alloc((width * 4 + 1) * height);
	for (let y = 0; y < height; y++) {
		raw[y * (width * 4 + 1)] = 0;
		for (let x = 0; x < width; x++) raw.set(pixel(x, y), y * (width * 4 + 1) + 1 + x * 4);
	}
	const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
	const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
	const chunk = (type, data) => {
		const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
		const body = Buffer.concat([Buffer.from(type), data]);
		const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body));
		return Buffer.concat([len, body, sum]);
	};
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr.set([8, 6, 0, 0, 0], 8);
	return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
const write = (name, buf) => {
	const file = path.join(texDir, `${name}.png`);
	if (!fs.existsSync(file) || process.argv.includes("--textures")) fs.writeFileSync(file, buf);
};
const T = [0, 0, 0, 0];
// water drop (toast "info" icon, "plain" widget icon)
write("drop", png(16, 16, (x, y) => {
	const cx = 7.5, cy = 10;
	const inCircle = (x - cx) ** 2 + (y - cy) ** 2 <= 4.6 ** 2;
	const inTip = y >= 2 && y <= 9 && Math.abs(x - cx) <= (y - 1.5) * 0.62;
	if (!(inCircle || inTip)) return T;
	const shine = x >= 5 && x <= 6 && y >= 8 && y <= 10;
	return shine ? [220, 240, 255, 255] : [70, 150, 240, 255];
}));
// tunnel door: grey frame, dark door, green light
write("toast_door", png(16, 16, (x, y) => {
	if (x < 2 || x > 13 || y < 1 || y > 15) return T;
	if (y <= 2 && x >= 6 && x <= 9) return [70, 230, 90, 255];
	if (x <= 3 || x >= 12 || y <= 3) return [150, 150, 158, 255];
	if (x === 7 || x === 8) return [55, 55, 60, 255];
	if (y === 8 || y === 9) return [95, 95, 102, 255];
	return [75, 75, 82, 255];
}));
// rising water: waves
write("toast_water", png(16, 16, (x, y) => {
	const wave = (row) => y === row + (Math.floor((x + row) / 2) % 2);
	if (y >= 12) return [30, 90, 200, 255];
	if (wave(3)) return [170, 220, 255, 255];
	if (wave(7)) return [90, 170, 255, 255];
	if (wave(10)) return [50, 120, 230, 255];
	if (y > 10) return [40, 110, 220, 255];
	if (y > 7) return [80, 160, 245, 160];
	return T;
}));

console.log(`hud_screen.json written (${Object.keys(ui).length} elements, payload ${L.length} bytes, ${W.rows}x${W.perRow} widget slots, ${toastNames.length} toast copies)`);
