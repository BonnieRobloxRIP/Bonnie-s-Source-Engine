import { BlockVolume, GameMode, system, world } from "@minecraft/server";
import { startHud } from "./hud.js";
import { startTrophies } from "./trophies.js";
import { ITEM_BLOCKS, ITEM_BLOCK_PARTICLES, ITEM_TO_BLOCK } from "./item_blocks.js";
import { CHARACTER_START_PARTICLES } from "./character_starts_data.js";
import { startCharacterSpawns } from "./character_spawns.js";
import { hideTutorCaption, noteSoundsStopped, startBeginning } from "./beginning.js";
import { startMathNotebook, startQuestionGame } from "./notebook_games.js";
import { NEIGHBOR_OFFSETS } from "./core/math.js";
import { floorTypeUnder, invalidateBlock } from "./core/block_cache.js";
import { giveToHotbar, hotbarItem, selectedHotbarSlot, startHotbar, swapIntoHotbar } from "./core/hotbar.js";
import { addScore, getScore } from "./core/scoreboard.js";
import { CREDIT_CARD_TAG, NOTEBOOK_GOAL } from "./core/game_state.js";
import { beginEscape, registerEscapeComponents, startEscape } from "./escape.js";
import { gameTick, isPaused } from "./core/pause.js";
import { playRandomMeme } from "./memes.js";
import { memesEnabled } from "./core/settings.js";
import "./main_menu.js";
import "./world_setup.js";
import { registerDoorComponents } from "./doors.js";
import { registerJailComponents } from "./jail.js";
import { isTargetablePlayer } from "./characters/perception.js";
import { startCharacters } from "./characters/registry.js";
import { registerCrafterComponents } from "./characters/crafters.js";
import { registerVanJailComponents } from "./characters/van_jail.js";
import "./characters/vanman.js";
import { pickupGlock, stashDroppedGlockAmmo, startItemFunctionality } from "./item_functionality.js";
import { finishMysteryTape, isMysteryTapePlaying, playMysteryTape } from "./characters/raldi.js";
import "./characters/chipfloke.js";
import "./characters/british_bloke.js";
import "./characters/pinto_beans.js";
import "./characters/present.js";
import "./characters/first_prize.js";
import "./characters/gotta_weep.js";
import "./characters/neil.js";
import { registerWalterComponents } from "./characters/walter.js";
import { noteCreditCard, registerBeastComponents } from "./characters/mrbeast.js";
import { registerPolishCowComponents } from "./characters/polish_cow.js";
import { registerPolishMarkerComponents } from "./polish_marker.js";
import { registerBathroomComponents } from "./bathroom.js";
import { registerRadioComponents } from "./radio.js";
import { registerVendingComponents } from "./vending.js";
import { registerLightComponents } from "./core/light_registry.js";
import { registerCafeteriaTableComponents } from "./cafeteria_table.js";
import { forgetPhoneNotebook, notePhoneNotebook, registerPhoneComponents, startPhone } from "./phone.js";
import { registerBallsPosterComponents, startBallsPosters } from "./balls_posters.js";
import { registerBlindsComponents, removeBlindsAround } from "./blinds.js";
import { startGameboy } from "./gameboy.js";
import { startBeastBattleSystem } from "./beast_battle.js";
import { startAlarmClocks } from "./alarm_clock.js";
import { onRunStart, startRuns } from "./run.js";
import { startMonkenator } from "./monke.js";
import { setWindowBreaker } from "./core/windows.js";
import { registerMenuCameraComponents, startMenuCamera } from "./menu_camera.js";
import { registerExitComponents, startExits } from "./exits.js";
import { startWinScreens } from "./win_screen.js";
import { MAP_BOUNDS, isMapLoading } from "./map.js";

const NOTEBOOK_OBJECTIVE = "notebooks";

const blockParticles = {
    "brr:polish_cow_marker": "brr:polish_cow_marker",
    // invisible teleport destination / spawner markers, labelled the same way as the logic
    // blocks in Bonnie's Source Engine so builders can tell them apart at a glance
    "brr:arts_mexicano_crafters_player_tp": "brr:tp_crafters_player",
    "brr:arts_mexicano_crafters_raldi_tp": "brr:tp_crafters_raldi",
    "brr:beast_player_tp": "brr:tp_beast_player",
    "brr:beast_player_confinment_tp": "brr:tp_beast_confinment",
    "brr:mrbeast_card_spot": "brr:mrbeast_card_spot_icon",
    "brr:menu_camera": "brr:tp_menu_camera",
    "brr:player_spawn": "brr:tp_player_spawn",
    "brr:chipfloke_player_tp": "brr:tp_chipfloke_player",
    "brr:chipfloke_van_tp": "brr:tp_chipfloke_van",
    "brr:polish_cow_player_tp": "brr:tp_polishcow_player",
    "brr:character_spawner": "brr:character_spawner_icon",
    "brr:walter_pickup_spot": "brr:walter_pickup_spot_icon",
    "brr:exit_wall": "brr:exit_wall_icon",
    "brr:exit_trigger": "brr:exit_trigger_icon",
    "brr:2d_plant_block": "brr:2d_plant",
    "brr:2d_plant_xmas_block": "brr:2d_plant_xmas",
    "brr:2d_exitsign_block": "brr:2d_exitsign",
    "brr:2d_books_block": "brr:2d_books",
    "brr:2d_books2_block": "brr:2d_books2",
    "brr:2d_paper_block": "brr:2d_paper",
    "brr:2d_food_block": "brr:2d_food",
    "brr:2d_baldycryin_block": "brr:2d_baldycryin",
    "brr:2d_bladder_block": "brr:2d_bladder",
    "brr:2d_cheezits_block": "brr:2d_cheezits",
    "brr:2d_colorful_ball_block": "brr:2d_colorful_ball",
    "brr:2d_mystical_tree_block": "brr:2d_mystical_tree",
    "brr:2d_jailbed_block": "brr:2d_jailbed",
    "brr:2d_donus_block": "brr:2d_donus",
    "brr:2d_donus2_block": "brr:2d_donus2",
    "brr:2d_tapeplayer_block": "brr:2d_tapeplayer",
    "brr:2d_tapeplayer_open_block": "brr:2d_tapeplayer_open",
    "brr:2d_tree_block": "brr:2d_tree",
    "brr:2d_nb_black_block": "brr:2d_nb_black",
    "brr:2d_nb_blue_block": "brr:2d_nb_blue",
    "brr:2d_nb_checkers_block": "brr:2d_nb_checkers",
    "brr:2d_nb_cyan_block": "brr:2d_nb_cyan",
    "brr:2d_nb_gradient_block": "brr:2d_nb_gradient",
    "brr:2d_nb_green_block": "brr:2d_nb_green",
    "brr:2d_nb_poop_block": "brr:2d_nb_poop",
    "brr:2d_nb_red_block": "brr:2d_nb_red",
    "brr:2d_nb_salmon_block": "brr:2d_nb_salmon",
    "brr:2d_nb_white_block": "brr:2d_nb_white",
    "brr:2d_nb_yellow_block": "brr:2d_nb_yellow",
    "brr:2d_theball_block": "brr:2d_theball",
    "brr:2d_beastbed_block": "brr:2d_beastbed",
    "brr:2d_beastradio_block": "brr:2d_beastradio",
    "brr:2d_empty_potion_block": "brr:2d_empty_potion",
    "brr:2d_kinda_filled_purple_potion_block": "brr:2d_kinda_filled_purple_potion",
    "brr:2d_cupcake_block": "brr:2d_cupcake",
    "brr:2d_weird_rubix_cube_block": "brr:2d_weird_rubix_cube",
    "brr:2d_woody_block": "brr:2d_woody",
    "brr:2d_trophyobject_block": "brr:2d_trophyobject",
    "brr:2d_lostcards_block": "brr:2d_lostcards",
    "brr:2d_baldplush_block": "brr:2d_baldplush",
    // the hoop and the bus only ever face the way they were placed, one particle per cardinal direction
    "brr:2d_hoop_block": {
        north: "brr:2d_hoop_north",
        south: "brr:2d_hoop_south",
        east: "brr:2d_hoop_east",
        west: "brr:2d_hoop_west"
    },
    "brr:2d_bus_block": {
        north: "brr:2d_bus_north",
        south: "brr:2d_bus_south",
        east: "brr:2d_bus_east",
        west: "brr:2d_bus_west"
    },
    ...ITEM_BLOCK_PARTICLES,
    ...CHARACTER_START_PARTICLES
};

// marker blocks whose icon is a build time label rather than part of the scene
const MARKER_ICON_BLOCKS = new Set([
    "brr:arts_mexicano_crafters_player_tp",
    "brr:arts_mexicano_crafters_raldi_tp",
    "brr:beast_player_tp",
    "brr:beast_player_confinment_tp",
    "brr:mrbeast_card_spot",
    "brr:menu_camera",
    "brr:player_spawn",
    "brr:chipfloke_player_tp",
    "brr:chipfloke_van_tp",
    "brr:polish_cow_player_tp",
    "brr:character_spawner",
    "brr:walter_pickup_spot",
    "brr:exit_wall",
    "brr:exit_trigger",
    ...Object.keys(CHARACTER_START_PARTICLES)
]);

// The first two notebooks have their own screens, like the original (notebook_games.js); every one
// after that plays a meme, the original's YCTP videos.
function collectNotebook(player, block) {
    addScore(player, NOTEBOOK_OBJECTIVE, 1, "Notebooks");
    const count = getScore(player, NOTEBOOK_OBJECTIVE);
    const reachedGoal = count >= NOTEBOOK_GOAL;
    forgetPhoneNotebook(block);
    block.setType("minecraft:air");
    invalidateBlock(block.dimension, block.location);
    hideTutorCaption();
    // every notebook shuts out whatever was playing around the player before its screen comes up
    try { player.runCommand("stopsound @s"); } catch { }
    noteSoundsStopped(player);
    if (count === 1) startMathNotebook(player);
    else if (count === 2) startQuestionGame(player);
    else if (memesEnabled(player)) playRandomMeme(player);
    if (reachedGoal) beginEscape();
}

// ------------------------------------------------------------- windows ----

const HAMMER_ID = "brr:item_hammer";

// Breaking a window only flips brr:broken, so both parts of the multi-block stay intact.
const BREAKABLE_MULTI_WINDOWS = new Set(["brr:window_left", "brr:window_right", "brr:window_obligatory"]);

const WINDOW_RIGHT_OFFSET = {
    north: { x: -1, z: 0 }, south: { x: 1, z: 0 },
    east: { x: 0, z: -1 }, west: { x: 0, z: 1 }
};

function updateWindowPartner(block) {
    if (block.typeId !== "brr:window_right" || block.permutation.getState("minecraft:multi_block_part") === 1) return;
    const direction = block.permutation.getState("minecraft:cardinal_direction");
    const offset = WINDOW_RIGHT_OFFSET[direction];
    if (!offset) return;
    const top = block.dimension.getBlock({ x: block.x, y: block.y + 1, z: block.z });
    if (top?.typeId !== block.typeId || top.permutation.getState("minecraft:multi_block_part") !== 1) return;
    const neighbor = block.dimension.getBlock({ x: block.x - offset.x, y: block.y, z: block.z - offset.z });
    const partnered = neighbor?.typeId === "brr:window_obligatory"
        && neighbor.permutation.getState("minecraft:cardinal_direction") === direction;
    for (const part of [block, top]) {
        if (part.permutation.getState("brr:obligatory_partner") !== partnered) {
            part.setPermutation(part.permutation.withState("brr:obligatory_partner", partnered));
        }
    }
}

function isIntactWindow(block) {
    return BREAKABLE_MULTI_WINDOWS.has(block.typeId) && block.permutation.getState("brr:broken") === false;
}

// wall directly under a smashed window loses its collision so you can climb through
const WALL_NOCOLLIDE = {
    "brr:wall01": "brr:wall01_nocollide"
};

function findWindowGroup(startBlock) {
    if (!isIntactWindow(startBlock)) return [];

    const dimension = startBlock.dimension;
    const found = [];
    const visited = new Set();
    const stack = [startBlock];

    while (stack.length > 0) {
        const current = stack.pop();
        const key = `${current.x},${current.y},${current.z}`;
        if (visited.has(key)) continue;
        visited.add(key);
        if (!isIntactWindow(current)) continue;
        found.push(current);

        for (const offset of NEIGHBOR_OFFSETS) {
            const neighbor = dimension.getBlock({
                x: current.x + offset.x,
                y: current.y + offset.y,
                z: current.z + offset.z
            });
            if (neighbor) stack.push(neighbor);
        }
    }

    return found;
}

// smashes the whole window instance containing startBlock; shared by the hammer,
// the glock (TODO: call this from the glock projectile hit handler) and the
// anything running into a window (core/windows.js: the monke, Neil, a hammered First Prize)
function breakWindowGroup(startBlock) {
    const group = findWindowGroup(startBlock);
    if (group.length === 0) return false;

    const dimension = startBlock.dimension;
    let lowestY = Infinity;
    for (const block of group) lowestY = Math.min(lowestY, block.y);

    for (const block of group) {
        block.setPermutation(block.permutation.withState("brr:broken", true));
        invalidateBlock(dimension, block.location);

        if (block.y !== lowestY) continue;
        const below = dimension.getBlock({ x: block.x, y: block.y - 1, z: block.z });
        const walkThrough = below && WALL_NOCOLLIDE[below.typeId];
        if (!walkThrough) continue;
        below.setType(walkThrough);
        invalidateBlock(dimension, below.location);
    }

    removeBlindsAround(group);
    dimension.playSound("glass", { x: startBlock.x + 0.5, y: startBlock.y + 0.5, z: startBlock.z + 0.5 });
    return true;
}

// ------------------------------------------------------------- stamina ----

const STAMINA_OBJECTIVE = "stamina";
const STAMINA_FULL = 100;
const STAMINA_OVERFLOW_CAP = 420;
const SPRINT_DRAIN_PER_SECOND = 10;
const REGEN_PER_SECOND = 10;
const GRASS_REGEN_PER_SECOND = 20;
const IDLE_REGEN_DELAY_TICKS = 20;
const GRASS_BLOCK = "brr:grass";
const STAMINA_TICK_INTERVAL = 2;
const MOVING_SPEED_THRESHOLD = 0.02;

const ENERGY_ITEM = "brr:item_energy";
const ZESTY_ITEM = "brr:item_zestybar";
const PEPPERMINT_BAR_ITEM = "brr:item_peppermint_bar";
const DRINK_STAMINA_VALUE = 200;
const ENERGY_SPEED_DURATION_TICKS = 300;
const DONUT_ITEM = "brr:item_donut";
const DONUT_BITTEN_ITEM = "brr:item_donut_bitten";
// 30% of a full bar per bite; it tops up to 100% but never eats into grass/peppermint overflow
const DONUT_STAMINA_VALUE = 30;

const staminaStates = new Map();

function staminaObjective() {
    let objective = world.scoreboard.getObjective(STAMINA_OBJECTIVE);
    if (!objective) objective = world.scoreboard.addObjective(STAMINA_OBJECTIVE, "Stamina");
    return objective;
}

function getStaminaState(player) {
    let state = staminaStates.get(player.id);
    if (!state) {
        let stored = STAMINA_FULL;
        try { stored = staminaObjective().getScore(player) ?? STAMINA_FULL; } catch { }
        state = { value: stored, score: undefined, lastMoveTick: 0, speedUntil: 0, movement: undefined };
        staminaStates.set(player.id, state);
    }
    return state;
}

// sprinting is "removed" by dropping walk speed so a sprint is no faster than a normal walk
function applyMovement(player, state) {
    const boosted = gameTick() < state.speedUntil;
    const exhausted = state.value <= 0;
    const event = boosted
        ? (exhausted ? "brr:speed_boost_exhausted" : "brr:speed_boost")
        : (exhausted ? "brr:speed_exhausted" : "brr:speed_normal");
    if (state.movement === event) return;
    state.movement = event;
    try { player.triggerEvent(event); } catch { }
}

function updateStamina(player, seconds) {
    const state = getStaminaState(player);
    const velocity = player.getVelocity();
    const moving = Math.hypot(velocity.x, velocity.z) > MOVING_SPEED_THRESHOLD;
    if (moving) state.lastMoveTick = gameTick();

    const onGrass = floorTypeUnder(player) === GRASS_BLOCK;

    if (player.isSprinting && moving) {
        if (!onGrass && isTargetablePlayer(player)) {
            state.value = Math.max(0, state.value - SPRINT_DRAIN_PER_SECOND * seconds);
        }
    } else if (onGrass) {
        // grass overflows past 100% up to the cap, but only at the default rate once full
        const overflowing = state.value >= STAMINA_FULL;
        const rate = overflowing ? REGEN_PER_SECOND : (moving ? REGEN_PER_SECOND : GRASS_REGEN_PER_SECOND);
        state.value = Math.min(STAMINA_OVERFLOW_CAP, state.value + rate * seconds);
    } else if (gameTick() - state.lastMoveTick >= IDLE_REGEN_DELAY_TICKS && state.value < STAMINA_FULL) {
        state.value = Math.min(STAMINA_FULL, state.value + REGEN_PER_SECOND * seconds);
    }

    applyMovement(player, state);

    const score = Math.round(state.value);
    if (score !== state.score) {
        state.score = score;
        try { staminaObjective().setScore(player, score); } catch { }
    }
}

// a hammer that smashed a window or a vault is gone (not in creative)
function useHammer(player) {
    try { if (player.getGameMode() !== GameMode.Creative) consumeSelectedItem(player); } catch { }
}

function consumeSelectedItem(player) {
    const inventory = player.getComponent("minecraft:inventory");
    const container = inventory?.container;
    if (!container) return;
    const item = container.getItem(player.selectedSlotIndex);
    if (!item) return;
    if (item.amount > 1) {
        item.amount--;
        container.setItem(player.selectedSlotIndex, item);
    } else {
        container.setItem(player.selectedSlotIndex);
    }
}

// the donut takes two bites: the first leaves the bitten donut behind, the second finishes it
function eatDonut(player, itemStack) {
    const state = getStaminaState(player);
    state.value = Math.min(STAMINA_OVERFLOW_CAP, Math.max(state.value, Math.min(STAMINA_FULL, state.value + DONUT_STAMINA_VALUE)));
    applyMovement(player, state);
    consumeSelectedItem(player);
    if (itemStack.typeId === DONUT_ITEM) {
        const container = player.getComponent("minecraft:inventory")?.container;
        const slot = player.selectedSlotIndex;
        if (container && !container.getItem(slot)) container.setItem(slot, hotbarItem(DONUT_BITTEN_ITEM));
        else giveItem(player, DONUT_BITTEN_ITEM);
    }
    player.dimension.playSound("item.nom", player.location);
}

world.afterEvents.itemUse.subscribe((event) => {
    const { itemStack, source: player } = event;
    if (itemStack.typeId === DONUT_ITEM || itemStack.typeId === DONUT_BITTEN_ITEM) {
        eatDonut(player, itemStack);
        return;
    }
    if (itemStack.typeId !== ENERGY_ITEM && itemStack.typeId !== ZESTY_ITEM
        && itemStack.typeId !== PEPPERMINT_BAR_ITEM) return;

    const state = getStaminaState(player);
    state.value = itemStack.typeId === PEPPERMINT_BAR_ITEM
        ? Math.min(STAMINA_OVERFLOW_CAP, state.value + STAMINA_FULL)
        : DRINK_STAMINA_VALUE;
    if (itemStack.typeId === ENERGY_ITEM) state.speedUntil = gameTick() + ENERGY_SPEED_DURATION_TICKS;
    applyMovement(player, state);
    consumeSelectedItem(player);
    player.dimension.playSound(itemStack.typeId === ENERGY_ITEM ? "random.drink" : "item.nom", player.location);
});

system.runInterval(() => {
    if (isPaused()) return;
    const seconds = STAMINA_TICK_INTERVAL / 20;
    const active = new Set();
    for (const player of world.getAllPlayers()) {
        active.add(player.id);
        try { updateStamina(player, seconds); } catch { }
    }
    for (const id of staminaStates.keys()) {
        if (!active.has(id)) staminaStates.delete(id);
    }
}, STAMINA_TICK_INTERVAL);

// --------------------------------------------------------- item blocks ----

const ITEM_BLOCK_SEARCH_RADIUS = 3;
const ITEM_SWEEP_INTERVAL_TICKS = 100;

// every offset in the search cube, nearest first (stable sort keeps the old x,y,z tie order)
const FREE_SPOT_OFFSETS = [];
for (let x = -ITEM_BLOCK_SEARCH_RADIUS; x <= ITEM_BLOCK_SEARCH_RADIUS; x++) {
    for (let y = -ITEM_BLOCK_SEARCH_RADIUS; y <= ITEM_BLOCK_SEARCH_RADIUS; y++) {
        for (let z = -ITEM_BLOCK_SEARCH_RADIUS; z <= ITEM_BLOCK_SEARCH_RADIUS; z++) {
            FREE_SPOT_OFFSETS.push({ x, y, z, distance: x * x + y * y + z * z });
        }
    }
}
FREE_SPOT_OFFSETS.sort((a, b) => a.distance - b.distance);

// one item into the first free one of the five slots (core/hotbar.js); false when they're all taken
function giveItem(player, itemId) {
    return giveToHotbar(player, itemId);
}

// ItemManager.CollectItem with all five slots full: the pickup trades places with the selected item,
// which is put down here as its item block instead. False if that item has no block to become.
function swapPickup(block, player, itemId) {
    const held = player.getComponent("minecraft:inventory")?.container?.getItem(selectedHotbarSlot(player));
    const heldBlock = held && ITEM_TO_BLOCK[held.typeId];
    if (!heldBlock) {
        try { player.onScreenDisplay.setActionBar("Your hands are full!"); } catch { }
        return false;
    }
    swapIntoHotbar(player, itemId);
    block.setType(heldBlock);
    invalidateBlock(block.dimension, block.location);
    emitBlockParticle(block.dimension, block, heldBlock);
    if (held.typeId === "brr:item_glock") stashDroppedGlockAmmo(block, player.location);
    return true;
}

// an item put down as its floating item block (vending machines); false if it has none
function placeItemBlock(block, itemId) {
    const blockId = ITEM_TO_BLOCK[itemId];
    if (!blockId) return false;
    block.setType(blockId);
    invalidateBlock(block.dimension, block.location);
    emitBlockParticle(block.dimension, block, blockId);
    return true;
}

// nearest air block to origin, so dropping never overwrites something that is already there
function findFreeSpot(dimension, origin) {
    for (const offset of FREE_SPOT_OFFSETS) {
        let block;
        try { block = dimension.getBlock({ x: origin.x + offset.x, y: origin.y + offset.y, z: origin.z + offset.z }); } catch { }
        if (block?.isAir) return block;
    }
    return undefined;
}

// a dropped item never stays an entity: it becomes its floating block variant instead
function convertDroppedItem(entity) {
    const itemId = entity.getComponent("minecraft:item")?.itemStack?.typeId;
    const blockId = itemId && ITEM_TO_BLOCK[itemId];
    if (!blockId) return;

    const target = findFreeSpot(entity.dimension, {
        x: Math.floor(entity.location.x),
        y: Math.floor(entity.location.y),
        z: Math.floor(entity.location.z)
    });
    if (!target) return;

    target.setType(blockId);
    invalidateBlock(target.dimension, target.location);
    emitBlockParticle(target.dimension, target, blockId);
    if (itemId === "brr:item_glock") stashDroppedGlockAmmo(target, entity.location);
    entity.remove();
}

world.afterEvents.entitySpawn.subscribe((event) => {
    if (event.entity.typeId !== "minecraft:item") return;
    try { convertDroppedItem(event.entity); } catch { }
});

// safety net for item entities the spawn event missed (chunk loads, deaths, /give overflow)
system.runInterval(() => {
    for (const dimensionId of ["overworld", "nether", "the_end"]) {
        for (const entity of world.getDimension(dimensionId).getEntities({ type: "minecraft:item" })) {
            try { convertDroppedItem(entity); } catch { }
        }
    }
}, ITEM_SWEEP_INTERVAL_TICKS);

// --------------------------------------------------------------- money ----

const MONEY_OBJECTIVE = "money";
const QUARTER_BLOCK_ID = "brr:item_quarter_block";
const GOLDQUARTER_BLOCK_ID = "brr:item_goldquarter_block";
const QUARTER_VALUE = 25;
const GOLD_MULTIPLIER_FACTOR = 7;
const GOLD_MULTIPLIER_DURATION_TICKS = 1200; // 1 minute

// player id -> { multiplier, expireAt }; absent/expired entries mean a 1x multiplier
const moneyMultipliers = new Map();

function moneyObjective() {
    let objective = world.scoreboard.getObjective(MONEY_OBJECTIVE);
    if (!objective) objective = world.scoreboard.addObjective(MONEY_OBJECTIVE, "Money");
    return objective;
}

function addMoney(player, amount) {
    const objective = moneyObjective();
    let current = 0;
    try { current = objective.getScore(player) ?? 0; } catch { }
    try { objective.setScore(player, current + amount); } catch { }
}

function getMoneyMultiplier(player) {
    const entry = moneyMultipliers.get(player.id);
    if (!entry || gameTick() >= entry.expireAt) return 1;
    return entry.multiplier;
}

// stacks onto the current multiplier (7 -> 49 -> 343...) and resets the 1 minute timer
function grantGoldMultiplier(player) {
    const current = getMoneyMultiplier(player);
    moneyMultipliers.set(player.id, {
        multiplier: current * GOLD_MULTIPLIER_FACTOR,
        expireAt: gameTick() + GOLD_MULTIPLIER_DURATION_TICKS
    });
}

// a new run starts on a full stamina bar (re-read from the reset scoreboard) and a 1x multiplier
onRunStart((player) => {
    staminaStates.delete(player.id);
    moneyMultipliers.delete(player.id);
    try { player.removeTag(CREDIT_CARD_TAG); } catch { }
});

// ---------------------------------------------------------------- vault ----

const VAULT_PAYOUT = 200;
const VAULT_COLUMNS = ["brr:vault_left", "brr:vault_middle", "brr:vault_right"];
// the vault's front faces `direction`; a viewer's left is that direction turned clockwise
const VAULT_LEFT = {
    north: { x: 1, z: 0 },
    east: { x: 0, z: 1 },
    south: { x: -1, z: 0 },
    west: { x: 0, z: -1 }
};

const CRACKED_VAULTS_PROPERTY = "brr:cracked_vaults";

function vaultPieces(block) {
    const column = VAULT_COLUMNS.indexOf(block.typeId);
    const direction = block.permutation.getState("minecraft:cardinal_direction");
    const left = VAULT_LEFT[direction];
    if (column < 0 || !left) return undefined;
    const part = block.permutation.getState("minecraft:multi_block_part") ?? 0;
    const base = { x: block.x, y: block.y - part, z: block.z };
    // the middle column's bottom block identifies the whole vault
    const key = `${block.dimension.id}:${base.x + left.x * (column - 1)},${base.y},${base.z + left.z * (column - 1)}`;
    const pieces = [];
    for (let c = 0; c < VAULT_COLUMNS.length; c++) {
        // column 0 sits one step to the viewer's left of the middle one
        const shift = column - c;
        for (let row = 0; row < 3; row++) {
            let piece;
            try { piece = block.dimension.getBlock({ x: base.x + left.x * shift, y: base.y + row, z: base.z + left.z * shift }); } catch { }
            if (piece?.typeId !== VAULT_COLUMNS[c]) continue;
            if (piece.permutation.getState("minecraft:cardinal_direction") !== direction) continue;
            pieces.push(piece);
        }
    }
    return { key, pieces };
}

function getCrackedVaults() {
    try { return new Set(JSON.parse(world.getDynamicProperty(CRACKED_VAULTS_PROPERTY) ?? "[]")); }
    catch { return new Set(); }
}

function isVaultCracked(block) {
    const vault = vaultPieces(block);
    if (!vault) return true;
    if (vault.pieces.some((piece) => piece.permutation.getState("brr:cracked") === true)) return true;
    return getCrackedVaults().has(vault.key);
}

function crackVault(block) {
    const vault = vaultPieces(block);
    if (!vault) return false;
    for (const piece of vault.pieces) {
        try { piece.setPermutation(piece.permutation.withState("brr:cracked", true)); } catch { }
    }
    const cracked = getCrackedVaults();
    cracked.add(vault.key);
    world.setDynamicProperty(CRACKED_VAULTS_PROPERTY, JSON.stringify([...cracked]));
    block.dimension.playSound("glass", { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 });
    return true;
}

// ----------------------------------------------------------- particles ----

const PARTICLE_VIEW_DISTANCE = 48;

let playerSnapshotTick = -1;
let playerSnapshot = [];

// one getAllPlayers per tick no matter how many particle blocks tick
function playersThisTick() {
    if (playerSnapshotTick !== system.currentTick) {
        playerSnapshotTick = system.currentTick;
        playerSnapshot = world.getAllPlayers().map((player) => {
            let creative = false;
            try { creative = player.getGameMode() === GameMode.Creative; } catch { }
            return { player, creative, dimensionId: player.dimension.id, ...player.location };
        });
    }
    return playerSnapshot;
}

function anyPlayerNear(dimensionId, x, y, z, radius) {
    const radiusSquared = radius * radius;
    for (const player of playersThisTick()) {
        if (player.dimensionId !== dimensionId) continue;
        const dx = player.x - x;
        const dy = player.y - y;
        const dz = player.z - z;
        if (dx * dx + dy * dy + dz * dz <= radiusSquared) return true;
    }
    return false;
}

// Marker icons label invisible blocks for whoever is building the map, so they are spawned
// per player and only creative builders ever see them.
function emitMarkerIcon(particleId, dimensionId, location) {
    const radiusSquared = PARTICLE_VIEW_DISTANCE * PARTICLE_VIEW_DISTANCE;
    for (const entry of playersThisTick()) {
        if (entry.dimensionId !== dimensionId) continue;
        const dx = entry.x - location.x;
        const dy = entry.y - location.y;
        const dz = entry.z - location.z;
        if (dx * dx + dy * dy + dz * dz > radiusSquared) continue;
        if (!entry.creative) continue;
        try { entry.player.spawnParticle(particleId, location); } catch { }
    }
}

function particleFor(block, typeId = block.typeId) {
    const particleId = blockParticles[typeId];
    return typeof particleId === "object" ? particleId[block.permutation.getState("minecraft:cardinal_direction")] : particleId;
}

// Sprites are re-emitted by their block tick (20 ticks for decor, 40 for items and notebooks, 4 for
// the radio and tape player, which tick for their own components too); each
// emission is one particle that lives a little longer than that, so they never pile up or blink.
function emitBlockParticle(dimension, block, typeId = block.typeId) {
    const particleId = particleFor(block, typeId);
    if (!particleId) return;
    const location = { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 };
    if (MARKER_ICON_BLOCKS.has(typeId)) {
        emitMarkerIcon(particleId, dimension.id, location);
        return;
    }
    if (!anyPlayerNear(dimension.id, location.x, location.y, location.z, PARTICLE_VIEW_DISTANCE)) return;
    try { dimension.spawnParticle(particleId, location); } catch { }
}

// Marker blocks have no block tick. While a creative builder is online, one interval draws the icons
// around them from a list of marker spots: found with one search of the map (again after a map
// reload and every MARKER_RESCAN_TICKS) and kept up to date as builders place and break markers.
const MARKER_ICON_INTERVAL_TICKS = 20; // the icons live 1.25 s (RP/particles/tp_blocks)
const MARKER_RESCAN_TICKS = 1200;
const markerSpots = new Map(); // "dimension|x,y,z" -> { dimensionId, location, particleId }
let markersScannedAt; // undefined: search the map (again)
let markerScanWarned = false;

const markerKey = (dimensionId, { x, y, z }) => `${dimensionId}|${x},${y},${z}`;

function noteMarker(block) {
    const key = markerKey(block.dimension.id, block.location);
    const particleId = MARKER_ICON_BLOCKS.has(block.typeId) ? particleFor(block) : undefined;
    if (!particleId) {
        markerSpots.delete(key);
        return;
    }
    markerSpots.set(key, {
        dimensionId: block.dimension.id,
        location: { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 },
        particleId
    });
}

function scanMarkers() {
    const dimension = world.getDimension("overworld");
    let found;
    try {
        found = dimension.getBlocks(new BlockVolume(MAP_BOUNDS.min, MAP_BOUNDS.max), { includeTypes: [...MARKER_ICON_BLOCKS] });
    } catch (error) {
        // usually not loaded yet, tried again next time; anything else is worth one warning
        if (!markerScanWarned && !/unloaded/i.test(String(error))) {
            markerScanWarned = true;
            console.warn(`[markers] Marker search failed: ${error}`);
        }
        return;
    }
    const { min, max } = MAP_BOUNDS;
    for (const [key, spot] of markerSpots) {
        const { x, y, z } = spot.location;
        if (spot.dimensionId === dimension.id && x >= min.x && x <= max.x + 1 && y >= min.y && y <= max.y + 1
            && z >= min.z && z <= max.z + 1) markerSpots.delete(key);
    }
    for (const location of found.getBlockLocationIterator()) {
        let block;
        try { block = dimension.getBlock(location); } catch { }
        if (block) noteMarker(block);
    }
    markersScannedAt = system.currentTick;
}

function drawMarkerIcons() {
    if (isMapLoading()) {
        markersScannedAt = undefined;
        return;
    }
    const builders = world.getAllPlayers().filter((player) => {
        try { return player.getGameMode() === GameMode.Creative; } catch { return false; }
    });
    // survival only sessions pay nothing for marker icons
    if (builders.length === 0) return;
    if (markersScannedAt === undefined || system.currentTick - markersScannedAt >= MARKER_RESCAN_TICKS) scanMarkers();
    const radiusSquared = PARTICLE_VIEW_DISTANCE * PARTICLE_VIEW_DISTANCE;
    for (const builder of builders) {
        let dimensionId;
        let origin;
        try {
            dimensionId = builder.dimension.id;
            origin = builder.location;
        } catch { continue; }
        for (const spot of markerSpots.values()) {
            if (spot.dimensionId !== dimensionId) continue;
            const dx = origin.x - spot.location.x;
            const dy = origin.y - spot.location.y;
            const dz = origin.z - spot.location.z;
            if (dx * dx + dy * dy + dz * dz > radiusSquared) continue;
            try { builder.spawnParticle(spot.particleId, spot.location); } catch { }
        }
    }
}

world.afterEvents.playerPlaceBlock.subscribe(({ block }) => {
    if (MARKER_ICON_BLOCKS.has(block.typeId)) noteMarker(block);
});
world.afterEvents.playerBreakBlock.subscribe(({ block, brokenBlockPermutation }) => {
    if (MARKER_ICON_BLOCKS.has(brokenBlockPermutation?.type?.id)) markerSpots.delete(markerKey(block.dimension.id, block.location));
});
system.runInterval(drawMarkerIcons, MARKER_ICON_INTERVAL_TICKS);

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("brr:particle_emitter", {
        onTick({ block, dimension }) {
            notePhoneNotebook(block);
            emitBlockParticle(dimension, block);
            // MrBeast remembers where his credit card was, so he notices when it is gone
            if (block.typeId === "brr:item_card_block") noteCreditCard(dimension, block.location);
        }
    });

    blockComponentRegistry.registerCustomComponent("brr:notebook", {
        onPlayerInteract({ block, player }) {
            if (player) collectNotebook(player, block);
        }
    });

    blockComponentRegistry.registerCustomComponent("brr:tape_player", {
        onTick({ block }) {
            if (block.typeId === "brr:2d_tapeplayer_block") finishMysteryTape(block.dimension, block.location);
        },
        onPlayerInteract({ block, player }) {
            const container = player?.getComponent("minecraft:inventory")?.container;
            const slot = player?.selectedSlotIndex;
            const held = container?.getItem(slot);
            if (block.typeId === "brr:2d_tapeplayer_block" && !held && player && !isMysteryTapePlaying(block.dimension, block.location)) {
                block.setType("brr:2d_tapeplayer_open_block");
                invalidateBlock(block.dimension, block.location);
                return;
            }
            if (block.typeId !== "brr:2d_tapeplayer_open_block" || held?.typeId !== "brr:item_tape") return;
            block.setType("brr:2d_tapeplayer_block");
            invalidateBlock(block.dimension, block.location);
            if (player.getGameMode() !== GameMode.Creative) {
                if (held.amount > 1) {
                    held.amount--;
                    container.setItem(slot, held);
                } else container.setItem(slot);
            }
            playMysteryTape(block.dimension, block.location);
            block.dimension.playSound("tape.vhs", { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 });
        }
    });

    // item block variants: picking one up hands the real item back
    blockComponentRegistry.registerCustomComponent("brr:item_block", {
        onPlayerInteract({ block, player }) {
            if (!player) return;

            const soundAt = { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 };
            const dimension = block.dimension;

            if (block.typeId === QUARTER_BLOCK_ID) {
                addMoney(player, QUARTER_VALUE * getMoneyMultiplier(player));
                block.setType("minecraft:air");
                invalidateBlock(dimension, block.location);
                dimension.playSound("item.pickup", soundAt);
                return;
            }
            if (block.typeId === GOLDQUARTER_BLOCK_ID) {
                grantGoldMultiplier(player);
                block.setType("minecraft:air");
                invalidateBlock(dimension, block.location);
                dimension.playSound("item.pickup", soundAt);
                return;
            }

            // MrBeast's credit card isn't an item in the original: the player just has it now (a tag),
            // and an invisible spot stays behind so he can still tell it was taken
            if (block.typeId === "brr:item_card_block") {
                if (player.hasTag(CREDIT_CARD_TAG)) return;
                player.addTag(CREDIT_CARD_TAG);
                block.setType("brr:mrbeast_card_spot");
                invalidateBlock(dimension, block.location);
                dimension.playSound("item.pickup", soundAt);
                return;
            }

            const itemId = ITEM_BLOCKS[block.typeId];
            if (!itemId) return;
            if (itemId === "brr:item_glock") {
                const pickupKind = pickupGlock(player, block, () => swapPickup(block, player, itemId));
                if (pickupKind === "ammo" || pickupKind === "item") {
                    block.setType("minecraft:air");
                    invalidateBlock(dimension, block.location);
                }
                if (pickupKind) dimension.playSound(pickupKind === "ammo" ? "item.ammo" : "item.pickup", soundAt);
                return;
            }
            if (giveItem(player, itemId)) {
                block.setType("minecraft:air");
                invalidateBlock(dimension, block.location);
                dimension.playSound("item.pickup", soundAt);
            } else if (swapPickup(block, player, itemId)) {
                dimension.playSound("item.pickup", soundAt);
            }
        }
    });

    registerDoorComponents(blockComponentRegistry);
    registerJailComponents(blockComponentRegistry);
    registerVanJailComponents(blockComponentRegistry);
    registerCrafterComponents(blockComponentRegistry);
    registerBeastComponents(blockComponentRegistry);
    registerPolishCowComponents(blockComponentRegistry);
    registerWalterComponents(blockComponentRegistry);
    registerPolishMarkerComponents(blockComponentRegistry);
    registerPhoneComponents(blockComponentRegistry);
    registerBallsPosterComponents(blockComponentRegistry);
    registerBathroomComponents(blockComponentRegistry);
    registerRadioComponents(blockComponentRegistry);
    registerVendingComponents(blockComponentRegistry, { placeItemBlock });
    registerLightComponents(blockComponentRegistry);
    registerEscapeComponents(blockComponentRegistry);
    registerCafeteriaTableComponents(blockComponentRegistry);
    registerBlindsComponents(blockComponentRegistry, { hammerId: HAMMER_ID, isIntactWindow, breakWindowGroup, useHammer });
    registerMenuCameraComponents(blockComponentRegistry);
    registerExitComponents(blockComponentRegistry);

    blockComponentRegistry.registerCustomComponent("brr:donus", {
        onPlayerInteract({ block, player }) {
            if (!player || !giveItem(player, DONUT_ITEM)) return;
            block.setType("brr:2d_donus2_block");
            invalidateBlock(block.dimension, block.location);
            block.dimension.playSound("item.pickup", { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 });
        }
    });

    // hammering any piece of the vault cracks the whole 3x3 open for a payout; a cracked vault takes
    // more hammers and pays out every time (there are only so many hammers in the school)
    blockComponentRegistry.registerCustomComponent("brr:vault", {
        onPlayerInteract({ block, player }) {
            if (!player) return;
            const held = player.getComponent("minecraft:inventory")?.container?.getItem(player.selectedSlotIndex);
            if (held?.typeId !== HAMMER_ID) return;
            if (isVaultCracked(block)) {
                if (!vaultPieces(block)) return;
                block.dimension.playSound("glass", { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 });
            } else if (!crackVault(block)) return;
            addMoney(player, VAULT_PAYOUT);
            useHammer(player);
        }
    });

    blockComponentRegistry.registerCustomComponent("brr:fountain", {
        onPlayerInteract({ block, player }) {
            if (!player) return;
            const state = getStaminaState(player);
            state.value = STAMINA_FULL;
            applyMovement(player, state);
            block.dimension.playSound("block.sip", { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 });
        }
    });

    // breakable windows: right-clicking with the hammer smashes the whole window instance, using it up
    blockComponentRegistry.registerCustomComponent("brr:window_interact", {
        onPlayerInteract({ block, player }) {
            const held = player?.getComponent("minecraft:inventory")?.container?.getItem(player.selectedSlotIndex);
            if (held?.typeId !== HAMMER_ID) return;
            if (breakWindowGroup(block)) useHammer(player);
        }
    });

    blockComponentRegistry.registerCustomComponent("brr:window_partner", {
        onTick({ block }) {
            updateWindowPartner(block);
        }
    });
});

startEscape();
startExits();
startWinScreens();
startCharacters();
startCharacterSpawns();
startBeginning();
startItemFunctionality({ breakWindowGroup });
startHotbar();
setWindowBreaker({ breakWindowGroup, isIntactWindow });
startMonkenator();
startPhone();
startGameboy();
startBallsPosters();
startBeastBattleSystem();
startAlarmClocks();
startRuns();
startMenuCamera();

startHud();
startTrophies();