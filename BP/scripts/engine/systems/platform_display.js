import * as mc from "@minecraft/server";
import { system } from "@minecraft/server";
import { DISPLAY_SHAPES, DISPLAY_SKINS, DISPLAY_SLOTS } from "./display_blocks.js";

// SECTION: Platform Display
// A moving copy of a group of blocks that can turn smoothly: display entities each draw up to 16
// blocks (atlas index + offset in two int properties per slot, see tools/platforms/display_atlas.mjs)
// and ride one invisible carrier with every seat at its own position, so turning the carrier turns
// the whole group. Smooth trains draw their moving blocks with these (platforms.js), and invisible
// colliders give each drawn block something solid. /brr:platform_test displays shows a test copy.

export const DISPLAY = "brr:platform_display";
export const CARRIER = "brr:platform_carrier";
export const COLLIDER = "brr:platform_collider";
export const HALF_COLLIDER = "brr:platform_collider_half";
export const DISPLAY_PART_TYPES = new Set([DISPLAY, CARRIER, COLLIDER, HALF_COLLIDER]);
const TEST_TAG = "brr_display_test";
const tagsOf = (tag) => (Array.isArray(tag) ? tag : tag ? [tag] : []);

// SECTION: What a block looks like
// A slot holds (shape * 1000 + skin + 1) * 10 + axis: the shape (DISPLAY_SHAPES), the atlas index
// of the block's material, and for logs and pillars the axis they lie along (1: x, 2: z).
const slot = (shape, skin, axis = 0) => (DISPLAY_SHAPES[shape] * 1000 + skin + 1) * 10 + axis;
const SHAPED = /_(double_slab|slab|stairs|fence|wall)$/;
// Shaped blocks whose material isn't simply their name without the suffix.
const MATERIAL = {
    stone_stairs: "cobblestone", normal_stone_stairs: "stone", normal_stone_slab: "stone",
    brick: "brick_block", end_stone_brick: "end_bricks", smooth_stone: "smooth_stone",
    quartz: "quartz_block", purpur: "purpur_block", mud_brick: "mud_bricks", prismarine_brick: "prismarine_bricks",
    petrified_oak: "oak_planks", stone_brick: "stone_bricks", mossy_stone_brick: "mossy_stone_bricks",
    nether_brick: "nether_brick", red_nether_brick: "red_nether_brick", deepslate_brick: "deepslate_bricks",
    deepslate_tile: "deepslate_tiles", polished_blackstone_brick: "polished_blackstone_bricks", tuff_brick: "tuff_bricks",
    resin_brick: "resin_bricks", cut_copper: "cut_copper"
};

/** The atlas index of a shaped block's material (spruce_stairs -> spruce planks), or undefined. */
export function materialSkin(typeId) {
    const name = typeId.replace(/^minecraft:/, "");
    const base = name.replace(SHAPED, "");
    for (const candidate of [MATERIAL[name], MATERIAL[base], base, `${base}_planks`, `${base}s`, `${base}_block`]) {
        if (!candidate) continue;
        const skin = DISPLAY_SKINS.get(`minecraft:${candidate}`);
        if (skin !== undefined) return skin;
    }
    return undefined;
}

const STAIR_FACING = ["east", "west", "south", "north"];
const DIRECTIONS = { north: [0, -1], east: [1, 0], south: [0, 1], west: [-1, 0] };

function statesOf(permutation) {
    try {
        return permutation.getAllStates();
    } catch {
        return {};
    }
}

/**
 * The slot values that draw a block: usually one, a fence or wall one per post and arm. Empty when
 * the display can't draw it. `neighbour(dx, dz)` gives the platform's block beside it (fences join
 * fences, fence gates and full blocks; Bedrock doesn't store fence connections in the block).
 */
export function displayParts(permutation, neighbour = () => undefined) {
    const typeId = permutation.type.id;
    const states = statesOf(permutation);
    const own = DISPLAY_SKINS.get(typeId);
    if (own !== undefined) {
        const axis = states.pillar_axis === "x" ? 1 : states.pillar_axis === "z" ? 2 : 0;
        return [slot("cube", own, axis)];
    }
    const kind = SHAPED.exec(typeId)?.[1];
    const skin = kind ? materialSkin(typeId) : undefined;
    if (skin === undefined) return [];
    switch (kind) {
        case "double_slab":
            return [slot("cube", skin)];
        case "slab":
            return [slot(states["minecraft:vertical_half"] === "top" || states.top_slot_bit === true ? "slab_top" : "slab_bottom", skin)];
        case "stairs": {
            const facing = STAIR_FACING[states.weirdo_direction] ?? "north";
            return [slot(`${states.upside_down_bit ? "stairs_top" : "stairs"}_${facing}`, skin)];
        }
        case "fence": {
            const parts = [slot("fence_post", skin)];
            for (const [dir, [dx, dz]] of Object.entries(DIRECTIONS)) {
                const next = neighbour(dx, dz);
                const id = next?.type?.id ?? "";
                if (/fence/.test(id) || DISPLAY_SKINS.has(id)) parts.push(slot(`fence_${dir}`, skin));
            }
            return parts;
        }
        case "wall": {
            const parts = [];
            if (states.wall_post_bit !== false) parts.push(slot("wall_post", skin));
            for (const dir of Object.keys(DIRECTIONS)) {
                const type = states[`wall_connection_type_${dir}`];
                if (type === "short" || type === "tall") parts.push(slot(`wall_${type}_${dir}`, skin));
            }
            return parts.length ? parts : [slot("wall_post", skin)];
        }
        default:
            return [];
    }
}

/** For older callers: the first slot value, or 0 when the display can't draw the block. */
export function slotValue(permutation) {
    return displayParts(permutation)[0] ?? 0;
}

/**
 * What stands in for a drawn block's solid part: { half, lift } (a half-height collider, raised
 * `lift`), or a full block.
 */
export function colliderFor(permutation) {
    const typeId = permutation.type.id;
    const states = statesOf(permutation);
    const top = states["minecraft:vertical_half"] === "top" || states.top_slot_bit === true || states.upside_down_bit === true;
    if (/_slab$/.test(typeId) && !/double/.test(typeId)) return { half: true, lift: top ? 0.5 : 0 };
    if (/_stairs$/.test(typeId)) return { half: true, lift: top ? 0.5 : 0 };
    return { half: false, lift: 0 };
}

/** Offset property value for a block offset from the carrier (-50..49 on each axis). */
export function slotOffset(dx, dy, dz) {
    return (50 + dx) * 10000 + (50 + dy) * 100 + (50 - dz);
}

/**
 * Spawns a carrier at `at` (a block-bottom-centre spot) with displays for `blocks`
 * ([{ dx, dy, dz, permutation, neighbour? }], or { values } already worked out). Returns
 * { carrier, displays, skipped } or undefined.
 */
export function spawnDisplayGroup(dimension, at, blocks, tag) {
    const tags = tagsOf(tag);
    const drawable = [];
    let skipped = 0;
    for (const b of blocks) {
        const values = b.values ?? displayParts(b.permutation, b.neighbour);
        if (!values.length) skipped++;
        for (const value of values) drawable.push({ ...b, value });
    }
    let carrier;
    try {
        carrier = dimension.spawnEntity(CARRIER, at);
        tags.forEach((t) => carrier.addTag(t));
    } catch {
        return undefined;
    }
    const rideable = carrier.getComponent("minecraft:rideable");
    const displays = [];
    for (let i = 0; i < drawable.length; i += DISPLAY_SLOTS) {
        let display;
        try {
            display = dimension.spawnEntity(DISPLAY, at);
            tags.forEach((t) => display.addTag(t));
            drawable.slice(i, i + DISPLAY_SLOTS).forEach((b, slot) => {
                display.setProperty(`brr:a${slot}`, b.value);
                display.setProperty(`brr:p${slot}`, slotOffset(b.dx, b.dy, b.dz));
            });
            rideable?.addRider(display);
            displays.push(display);
        } catch {
            try {
                display?.remove();
            } catch { }
        }
    }
    return { carrier, displays, skipped };
}

/** Removes a group (carrier and its displays). */
export function removeDisplayGroup(group) {
    for (const entity of [...(group?.displays ?? []), group?.carrier]) {
        try {
            if (entity?.isValid) entity.remove();
        } catch { }
    }
}

/** Spawns an invisible solid box (a block, or half a block) whose bottom corner sits at `corner`, or undefined. */
export function spawnCollider(dimension, corner, tag, half = false) {
    try {
        const entity = dimension.spawnEntity(half ? HALF_COLLIDER : COLLIDER, { x: corner.x + 0.5, y: corner.y, z: corner.z + 0.5 });
        tagsOf(tag).forEach((t) => entity.addTag(t));
        return entity;
    } catch {
        return undefined;
    }
}

/** Puts a collider's block corner at `corner` (fractions allowed). */
export function moveCollider(entity, corner) {
    try {
        entity.teleport({ x: corner.x + 0.5, y: corner.y, z: corner.z + 0.5 });
        return true;
    } catch {
        return false;
    }
}

export function removeEntity(entity) {
    try {
        if (entity?.isValid) entity.remove();
    } catch { }
}

const rotateYaw = (v, yaw) => {
    // Minecraft yaw: 0 faces +z, 90 faces -x (clockwise seen from above).
    const r = (yaw * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
    return { x: v.x * c - v.z * s, y: v.y, z: v.x * s + v.z * c };
};

/**
 * Puts the group's origin at `at` facing `yaw`. Riders sit wherever the game puts a seat, so the
 * first call measures where the displays really are (in the carrier's own frame) and every move
 * makes up for it.
 */
export function moveDisplayGroup(group, at, yaw) {
    const { carrier, displays } = group;
    if (!carrier?.isValid) return false;
    if (!group.seatOffset) {
        const rider = displays.find((d) => d.isValid);
        if (!rider) return false;
        const here = carrier.location, seen = rider.location;
        group.seatOffset = rotateYaw({ x: seen.x - here.x, y: seen.y - here.y, z: seen.z - here.z }, -carrier.getRotation().y);
    }
    const shift = rotateYaw(group.seatOffset, yaw);
    try {
        carrier.teleport({ x: at.x - shift.x, y: at.y - shift.y, z: at.z - shift.z }, { rotation: { x: 0, y: yaw } });
    } catch {
        return false;
    }
    // A display that fell off (the game dismounts riders now and then) gets back on.
    const rideable = carrier.getComponent("minecraft:rideable");
    for (const display of displays) {
        try {
            if (display.isValid && !display.getComponent("minecraft:riding")) rideable?.addRider(display);
        } catch { }
    }
    return true;
}

/** Display entities, carriers and colliders left in loaded areas with a tag (e.g. after a reload). */
export function findTagged(tag) {
    const found = [];
    for (const id of ["overworld", "nether", "the_end"]) {
        try {
            for (const type of DISPLAY_PART_TYPES) found.push(...mc.world.getDimension(id).getEntities({ type, tags: [tag] }));
        } catch { }
    }
    return found;
}

// SECTION: Display Test
// /brr:platform_test displays: a small, lopsided build (so a mirror shows at once) placed for real,
// with its display copy beside it. The copy holds still for 5 seconds (it must match the real one
// block for block), then glides around a loop while turning, and comes back to hold again.
const TEST_BUILD = [
    [0, 0, 0, "minecraft:stone_bricks"], [1, 0, 0, "minecraft:oak_planks"], [2, 0, 0, "minecraft:red_wool"], [3, 0, 0, "minecraft:red_wool"],
    [0, 0, 1, "minecraft:gold_block"], [0, 0, 2, "minecraft:diamond_block"], [0, 0, 3, "minecraft:diamond_block"],
    [1, 0, 1, "minecraft:white_concrete"], [2, 0, 1, "minecraft:light_gray_concrete"], [1, 0, 2, "minecraft:gray_concrete"],
    [0, 1, 0, "minecraft:oak_log", { pillar_axis: "y" }], [0, 2, 0, "minecraft:glass"], [0, 3, 0, "minecraft:glowstone"],
    [1, 1, 0, "minecraft:oak_log", { pillar_axis: "x" }], [2, 1, 0, "minecraft:oak_log", { pillar_axis: "x" }],
    [0, 1, 1, "minecraft:spruce_log", { pillar_axis: "z" }], [0, 1, 2, "minecraft:spruce_log", { pillar_axis: "z" }],
    [3, 1, 0, "minecraft:lime_stained_glass"], [0, 1, 3, "minecraft:blue_stained_glass"], [2, 0, 2, "minecraft:grass_block"],
    // Shapes: stairs facing each way (and upside down), slabs, a fence run and a wall, as the tram uses.
    [4, 0, 0, "minecraft:polished_andesite_stairs", { weirdo_direction: 3 }], [5, 0, 0, "minecraft:polished_andesite_stairs", { weirdo_direction: 0 }],
    [6, 0, 0, "minecraft:polished_andesite_stairs", { weirdo_direction: 2 }], [7, 0, 0, "minecraft:polished_andesite_stairs", { weirdo_direction: 1 }],
    [4, 1, 0, "minecraft:spruce_stairs", { weirdo_direction: 3, upside_down_bit: true }], [5, 1, 0, "minecraft:spruce_stairs", { weirdo_direction: 0, upside_down_bit: true }],
    [4, 0, 1, "minecraft:polished_andesite_slab", { "minecraft:vertical_half": "bottom" }], [5, 0, 1, "minecraft:smooth_stone_slab", { "minecraft:vertical_half": "top" }],
    [4, 0, 2, "minecraft:birch_fence"], [5, 0, 2, "minecraft:birch_fence"], [6, 0, 2, "minecraft:birch_fence"], [6, 0, 3, "minecraft:birch_fence"],
    [4, 0, 3, "minecraft:sea_lantern"], [7, 0, 2, "minecraft:stone_brick_wall", { wall_post_bit: true, wall_connection_type_west: "short" }]
];
const HOLD_TICKS = 100, LOOP_TICKS = 400;
let testState;

export function clearDisplayTest() {
    if (testState?.interval !== undefined) system.clearRun(testState.interval);
    removeDisplayGroup(testState?.group);
    for (const entity of findTagged(TEST_TAG)) {
        try {
            entity.remove();
        } catch { }
    }
    for (const { dimension, at, previous } of testState?.placed ?? []) {
        try {
            dimension.getBlock(at)?.setPermutation(previous);
        } catch { }
    }
    testState = undefined;
}

/** Builds the test in front of the player. Returns a message. */
export function startDisplayTest(player) {
    clearDisplayTest();
    const dimension = player.dimension;
    const view = player.getViewDirection();
    const forward = Math.abs(view.x) > Math.abs(view.z) ? { x: Math.sign(view.x), z: 0 } : { x: 0, z: Math.sign(view.z) || 1 };
    const real = { x: Math.floor(player.location.x) + forward.x * 8, y: Math.floor(player.location.y), z: Math.floor(player.location.z) + forward.z * 8 };
    // The copy sits 6 blocks east of the real build (east = +x), in the same orientation.
    const copy = { x: real.x + 6.5, y: real.y, z: real.z + 0.5 };
    const placed = [], blocks = [];
    for (const [dx, dy, dz, typeId, states] of TEST_BUILD) {
        let permutation;
        try {
            permutation = mc.BlockPermutation.resolve(typeId, states ?? {});
        } catch {
            continue;
        }
        blocks.push({ dx, dy, dz, permutation });
        try {
            const block = dimension.getBlock({ x: real.x + dx, y: real.y + dy, z: real.z + dz });
            // Only into empty spots, so the test never overwrites part of the map.
            if (block?.isAir) {
                placed.push({ dimension, at: block.location, previous: block.permutation });
                block.setPermutation(permutation);
            }
        } catch { }
    }
    // Fences join the build's own fences and full blocks beside them.
    const at = new Map(blocks.map((b) => [`${b.dx},${b.dy},${b.dz}`, b.permutation]));
    for (const b of blocks) b.neighbour = (dx, dz) => at.get(`${b.dx + dx},${b.dy},${b.dz + dz}`);
    const group = spawnDisplayGroup(dimension, copy, blocks, TEST_TAG);
    if (!group) return "§cCould not spawn the display (is the area loaded?).";
    // An invisible collider under each block, so the copy can be stood on.
    const cornerAt = (b, spot, yaw) => {
        const centre = rotateYaw({ x: b.dx, y: b.dy + (b.lift ?? 0), z: b.dz }, yaw);
        return { x: spot.x + centre.x - 0.5, y: spot.y + centre.y, z: spot.z + centre.z - 0.5 };
    };
    const colliders = blocks.map((b) => {
        const { half, lift } = colliderFor(b.permutation);
        b.lift = lift;
        return { b, entity: spawnCollider(dimension, cornerAt(b, copy, 0), TEST_TAG, half) };
    }).filter((c) => c.entity);
    const pose = (at, yaw) => {
        moveDisplayGroup(group, at, yaw);
        for (const { b, entity } of colliders) moveCollider(entity, cornerAt(b, at, yaw));
    };
    testState = { placed, group };
    const begin = system.currentTick;
    testState.interval = system.runInterval(() => {
        // Every lap starts with a 5-second hold beside the real build, so the two can be compared.
        const t = (system.currentTick - begin) % (HOLD_TICKS + LOOP_TICKS);
        if (t < HOLD_TICKS) {
            pose(copy, 0);
            return;
        }
        // Then a loop that leaves from and returns to that spot, turning once per lap (20 seconds).
        const phase = (t - HOLD_TICKS) / LOOP_TICKS, angle = phase * Math.PI * 2;
        const at = { x: copy.x + Math.sin(angle) * 4, y: copy.y + Math.sin(angle) ** 2 * 1.5, z: copy.z + 4 - Math.cos(angle) * 4 };
        pose(at, phase * 360);
    }, 1);
    try {
        player.teleport({ x: real.x + 5, y: real.y + 4, z: real.z - 7 }, { facingLocation: { x: real.x + 5, y: real.y + 1, z: real.z + 2 } });
    } catch { }
    const skipped = group.skipped ? ` §e(${group.skipped} block(s) it can't draw yet were left out.)` : "";
    return `§aDisplay test: the real build is on the left, its moving copy on the right (${group.displays.length} display entit${group.displays.length === 1 ? "y" : "ies"}). Each lap starts with the copy holding still for 5 seconds, where it should match block for block and you can stand on it; then it glides and turns.${skipped} §f/brr:platform_test clear§7 removes it.`;
}

/** Display test entities from an earlier session have no script holding them: remove them. */
export function startDisplaySystem() {
    system.runTimeout(() => {
        if (!testState) for (const entity of findTagged(TEST_TAG)) {
            try {
                entity.remove();
            } catch { }
        }
    }, 40);
}
