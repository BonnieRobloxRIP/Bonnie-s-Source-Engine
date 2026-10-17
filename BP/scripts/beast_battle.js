import { HudVisibility, InputPermissionCategory, system, world } from "@minecraft/server";
import { ActionFormData, FormCancelationReason, uiManager } from "@minecraft/server-ui";
import {
    advanceBattle, BATTLE, BATTLE_FORM as FORM, BATTLE_STAGE as STAGE, battleHearts, battleItemName, battlePercent,
    continueBattle, createBattle, isBattleItemUsable, selectBattleAction, STAGE_LETTERBOX, stageOrigin, stagePoint, STAGE_SPAN,
    strikeBattle, typeTicks, typewriter
} from "./core/beast_battle.js";
import { holdPause, releasePause } from "./core/pause.js";
import { BATTLE_STAGE_SPOT } from "./menu_room.js";
import { addScore } from "./core/scoreboard.js";
import { musicVolume, soundVolume } from "./core/settings.js";
import { awardTrophy } from "./trophies.js";
import { BATTLE_MUSIC_TICKS } from "./beast_battle_data.js";

const RESTORE_PROPERTY = "brr:beast_battle_restore";
const VISUAL_ID = "brr:beast_battle_visual";
const MUSIC = "mus_battle";
const VICTORY_MUSIC = "mus_congrats";
const MUSIC_DELAY_TICKS = 20;
// Sprite sizes (blocks) per projectile kind; money is 15% larger to match its hitbox.
const SHOT_SIZE = { money: [0.368, 0.115], patty: [0.32, 0.08] };
// Engine sound cues (state.events) and the sounds they play.
const EVENT_SOUNDS = { beastproj: "beastproj", fall: "fall2", splat: "splat" };
const GENERATED = "textures/ui/battle_beast/gen/";
// Texture indices of brr:beast_battle_visual (see scripts_gen/make_beast_battle.mjs).
const VISUAL = { heart: 0, money: 1, beast: 2, burger: 3, bottom: 4, patty: 5, top: 6, arena: 7,
    grid: 8, ghost: 9, black: 10, heartEmpty: 11, arenaFill: 12 };
const PAGES = ["fight", "act", "items", "mercy"];
const PHASE_PAGES = { menu: "main", qte: "qte", hit: "hit", result: "result", speech: "speech", victory: "victory", defeat: "defeat" };
// Where the hearts/PLAYER/action frame rests on each page: up, lowered or dropped off-screen.
const FRAME_TARGET = { main: "U", fight: "L", act: "L", items: "L", mercy: "L", qte: "L", hit: "L", result: "L",
    victory: "L", defeat: "L", speech: "G" };
const FRAME_VARIANTS = new Set(["GU", "LU", "UU", "UL", "LL", "LG", "GL"]);
const TYPED_PAGES = new Set(["main", "result", "victory", "defeat", "speech"]);
const DISPLAY_PAGES = new Set(["hit", "speech", "victory", "defeat"]);
let active;

export function isBeastBattleActive() {
    return active !== undefined;
}

function report(error, operation) {
    console.error(`[beast_battle] ${operation}: ${error}`);
}

function cameraLocation(session) {
    return { x: session.origin.x, y: session.origin.y, z: session.origin.z - STAGE.cameraBack };
}

// Sounds play at the stage camera: players are teleported in the same tick, so their own location is stale.
function playAt(session, player, sound, volume, pitch = 1) {
    player.playSound(sound, { location: cameraLocation(session), volume, pitch });
}

function sound(session, id, { volume = 1, pitch = 1, fighterOnly = false } = {}) {
    for (const { player } of session.viewers.values()) {
        if (!player.isValid || (fighterOnly && player.id !== session.player.id)) continue;
        try { playAt(session, player, id, soundVolume(player) * volume, pitch); }
        catch (error) { report(error, `playing ${id}`); }
    }
}

function snapshot(player) {
    const resistance = player.getEffect("resistance");
    const nightVision = player.getEffect("night_vision");
    return {
        location: { ...player.location }, rotation: player.getRotation(), dimensionId: player.dimension.id,
        slot: player.selectedSlotIndex,
        movement: player.inputPermissions.isPermissionCategoryEnabled(InputPermissionCategory.Movement),
        camera: player.inputPermissions.isPermissionCategoryEnabled(InputPermissionCategory.Camera),
        resistance: resistance ? {
            amplifier: resistance.amplifier, duration: resistance.duration
        } : undefined,
        nightVision: nightVision ? { amplifier: nightVision.amplifier, duration: nightVision.duration } : undefined,
        health: player.getComponent("minecraft:health").currentValue
    };
}

function enroll(session, player) {
    if (session.viewers.has(player.id)) return;
    recoverPlayer(player);
    if (player.getDynamicProperty(RESTORE_PROPERTY) !== undefined) {
        throw new Error(`Could not restore ${player.id} before enrolling in battle`);
    }
    const saved = snapshot(player);
    player.setDynamicProperty(RESTORE_PROPERTY, JSON.stringify(saved));
    session.viewers.set(player.id, { player, saved });
    player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, false);
    player.inputPermissions.setPermissionCategory(InputPermissionCategory.Camera, false);
    player.teleport({ ...session.origin, z: session.origin.z - 10 }, { dimension: session.dimension });
    player.clearVelocity();
    player.addEffect("resistance", 200, { amplifier: 255, showParticles: false });
    player.addEffect("night_vision", 400, { amplifier: 0, showParticles: false });
    player.camera.setCamera("minecraft:free", { location: cameraLocation(session), rotation: { x: 0, y: 0 } });
    player.runCommand(`camera @s fov_set ${STAGE.fov}`);
    player.onScreenDisplay.setHudVisibility(HudVisibility.Hide);
    // Before the delayed first play the music loop starts for everyone at once.
    if (session.music && session.musicStarted) playAt(session, player, session.music, musicVolume(player));
}

function restore(player, saved) {
    if (!player.isValid) return;
    let failed = false;
    const steps = [
        ["closing battle form", () => uiManager.closeAllForms(player)],
        ["showing HUD", () => player.onScreenDisplay.setHudVisibility(HudVisibility.Reset)],
        ["stopping music", () => player.runCommand(`stopsound @s ${MUSIC}`)],
        ["clearing camera", () => player.camera.clear()],
        ["clearing FOV", () => player.runCommand("camera @s fov_clear")],
        ["restoring location", () => {
            player.teleport(saved.location, { dimension: world.getDimension(saved.dimensionId), rotation: saved.rotation });
            player.clearVelocity();
        }],
        ...[["resistance", saved.resistance], ["night_vision", saved.nightVision]].map(([name, effect]) =>
            [`restoring ${name}`, () => {
                player.removeEffect(name);
                if (effect) player.addEffect(name, effect.duration, { amplifier: effect.amplifier, showParticles: false });
            }]),
        ["restoring health", () => {
            const health = player.getComponent("minecraft:health");
            if (health.currentValue > 0) health.setCurrentValue(saved.health);
        }],
        ["restoring held slot", () => { player.selectedSlotIndex = saved.slot; }],
        ["restoring movement", () => player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, saved.movement)],
        ["restoring camera input", () => player.inputPermissions.setPermissionCategory(InputPermissionCategory.Camera, saved.camera)]
    ];
    for (const [operation, run] of steps) {
        try { run(); }
        catch (error) {
            failed = true;
            report(error, `${operation} for ${player.id}`);
        }
    }
    if (!failed) player.setDynamicProperty(RESTORE_PROPERTY, undefined);
    else player.sendMessage("Some battle settings could not be restored. Rejoin to retry; see the content log.");
}

function visual(session, type, location, width = 1, height = width) {
    const entity = session.dimension.spawnEntity(VISUAL_ID, location);
    session.visuals.add(entity);
    // Sprites face the stage camera only while unrotated.
    entity.setRotation({ x: 0, y: 0 });
    entity.setProperty("brr:visual", type);
    entity.setProperty("brr:sx", width);
    entity.setProperty("brr:sy", height);
    return entity;
}

// Arena coordinates (0-100 on both axes) on the arena plane.
function point(session, x, y, z = 0) {
    return { x: session.origin.x + (50 - x) * 0.026,
        y: session.origin.y + (50 - y) * 0.026, z: session.origin.z + z };
}

function buildStage(session) {
    const at = (x, y, depth) => stagePoint(session.origin, x, y, depth);
    const window = STAGE.window;
    visual(session, VISUAL.black, at(0, 0, STAGE.backdropDepth), 80, 80);
    const middle = (window.top + window.bottom) / 2;
    visual(session, VISUAL.grid, at(0, middle, STAGE.gridDepth));
    visual(session, VISUAL.ghost, at(0, middle, STAGE.ghostDepth));
    // Black letterbox planes around the scrolling window, in front of the grid but behind every actor.
    const scale = STAGE_SPAN * STAGE.letterboxDepth;
    for (const [x, y, width, height] of STAGE_LETTERBOX) {
        visual(session, VISUAL.black, at(x, y, STAGE.letterboxDepth), width * scale, height * scale);
    }
}

function heartsRowType(session, index) {
    return index < battleHearts(session.state) ? VISUAL.heart : VISUAL.heartEmpty;
}

// The arena, the heart, the hearts row and the emitter exist only for one attack, so the arena's
// pop-in animation (driven by the entity's life time) replays every turn.
function spawnAttack(session) {
    const state = session.state;
    const add = (type, location, width, height) => {
        const entity = visual(session, type, location, width, height);
        session.attackVisuals.add(entity);
        return entity;
    };
    add(VISUAL.arena, point(session, 50, 50, 0), 2.7);
    add(VISUAL.arenaFill, point(session, 50, 50, 0.05), 2.6);
    session.heart = add(VISUAL.heart, point(session, state.heart.x, state.heart.y, -0.1), 0.16);
    session.emitter = state.attack === 0 ? add(VISUAL.beast, point(session, 170, 50, -0.1), 1.4, 1.6) : undefined;
    const hearts = STAGE.hearts;
    const size = hearts.size * STAGE_SPAN * STAGE.arenaDepth;
    session.heartsRow = Array.from({ length: 10 }, (_, index) => add(heartsRowType(session, index),
        stagePoint(session.origin, hearts.x + hearts.size / 2 + index * hearts.pitch, hearts.y, STAGE.arenaDepth - 0.05), size));
    session.shownHearts = battleHearts(state);
}

function clearAttack(session) {
    for (const entity of [...session.attackVisuals, ...session.shots.values()]) {
        session.visuals.delete(entity);
        if (entity.isValid) entity.remove();
    }
    session.attackVisuals.clear();
    session.shots.clear();
    session.heart = session.emitter = session.heartsRow = undefined;
}

function finish(session, result) {
    if (active !== session) return;
    active = undefined;
    session.token++;
    try {
        for (const { player, saved } of session.viewers.values()) {
            try { restore(player, saved); }
            catch (error) { report(error, `restoring ${player.id}`); }
        }
        for (const entity of session.visuals) {
            if (!entity.isValid) continue;
            try { entity.remove(); }
            catch (error) { report(error, "removing battle visual"); }
        }
        if (session.beast.isValid) {
            try {
                session.beast.teleport(session.beastSaved.location, {
                    dimension: session.dimension, rotation: session.beastSaved.rotation
                });
                session.beast.setProperty("brr:still", 0);
                session.beast.setDynamicProperty(RESTORE_PROPERTY, undefined);
            } catch (error) { report(error, "restoring MrBeast"); }
        }
        if (result === "defeat" && session.player.isValid) session.player.kill();
        const trophy = result === "spared" ? "pacibeast" : result === "defeated" ? "beasticide" : undefined;
        if (trophy) {
            try { awardTrophy(session.player, trophy); }
            catch (error) { report(error, "awarding the battle trophy"); }
        }
    } catch (error) {
        report(error, "ending battle");
    } finally {
        releasePause(session);
        session.onEnd(result);
    }
}

export function cancelBeastBattle(beastId) {
    if (active?.beast.id === beastId) finish(active, "aborted");
}

export function startBeastBattle(beast, player, onEnd) {
    if (active) throw new Error("Another MrBeast battle is already active");
    if (!beast.isValid || !player?.isValid) throw new Error("The battle needs a live MrBeast and shooter");
    const dimension = beast.dimension;
    // at the top of the world over the menu yard (menu_room.js), not over the school
    const origin = stageOrigin(BATTLE_STAGE_SPOT, dimension.heightRange);
    const held = player.getComponent("minecraft:inventory")?.container?.getItem(player.selectedSlotIndex)?.typeId ?? "";
    const session = {
        beast, player, onEnd, dimension, origin, viewers: new Map(), visuals: new Set(), attackVisuals: new Set(), shots: new Map(),
        beastSaved: { location: { ...beast.location }, rotation: beast.getRotation() },
        state: createBattle(Math.random, held), token: 0, formOpen: false, frameAt: "G", intro: true,
        uiPhase: "menu", shownHits: 0, music: MUSIC, musicStarted: false,
        // The music starts a second in, once the battle screen is up, so its opening is audible.
        nextMusicAt: system.currentTick + MUSIC_DELAY_TICKS, rewarded: false
    };
    active = session;
    holdPause(session);
    try {
        beast.setDynamicProperty(RESTORE_PROPERTY, JSON.stringify(session.beastSaved));
        for (const viewer of world.getAllPlayers()) enroll(session, viewer);
        buildStage(session);
        beast.setProperty("brr:still", 0);
        updateActors(session);
        openPage(session, "main");
        return true;
    } catch (error) {
        report(error, "starting battle");
        if (player.isValid) player.sendMessage("MrBeast's battle could not start. Check the content log.");
        finish(session, "aborted");
        return false;
    }
}

function shortName(typeId) {
    const name = battleItemName(typeId);
    return name.length > 16 ? name.slice(0, 13) + "..." : name;
}

function typedText(state, page) {
    if (page === "speech") return state.dialogue;
    return TYPED_PAGES.has(page) ? state.message : "";
}

function pageTitle(session, page, transition) {
    const flags = [`f${transition}`];
    if (page !== "main" && session.selected !== undefined) flags.push(`s${session.selected}`);
    if (page === "hit" && session.state.missed) flags.push("miss");
    if (page === "main" && session.intro) flags.push("intro");
    return `brr:battle:${page}|${flags.join("|")}|`;
}

function realButtons(session, page) {
    if (page === "main") return ["Fight", "Act", "Item", "Mercy", "Defend"];
    if (page === "fight") return ["* Whack", "Back"];
    if (page === "act") return ["* Check", "* Discuss", "Back"];
    if (page === "mercy") return ["* Spare", "Back"];
    if (page === "items") {
        const container = session.player.getComponent("minecraft:inventory")?.container;
        session.items = Array.from({ length: 5 }, (_, slot) => container?.getItem(slot)?.typeId ?? "");
        return [...session.items.map((typeId) => isBattleItemUsable(typeId) ? "* " + shortName(typeId) : ""), "Back"];
    }
    // The QTE fallback target and the result page's click-to-continue target.
    if (page === "qte" || page === "result") return [""];
    return [];
}

// Button indices are fixed (see BATTLE_FORM): textures and short texts, the clickable buttons, then one
// typewriter prefix per slot on typed pages, or the timing slots on the QTE page. Pages leave out the
// trailing buttons their UI never reads, since every button is another row the client has to build.
function buildForm(session, page, transition) {
    const state = session.state;
    const hp = battlePercent(state.hp, state.maxHp);
    const beast = battlePercent(state.beastHp, BATTLE.beastHp);
    const before = battlePercent(state.beastHpBefore, BATTLE.beastHp);
    const form = new ActionFormData().title(pageTitle(session, page, transition)).body("");
    const data = [
        ["", `${GENERATED}hearts_${battleHearts(state)}`],
        [`${state.hp} / ${state.maxHp}`, `${GENERATED}bar_${hp}`],
        [`${beast}%`, `${GENERATED}bar_${beast}`],
        [state.missed ? "MISS" : String(state.damage), `${GENERATED}bar_${before}`],
        [`${state.mercy}%`, `${GENERATED}mercy_${state.mercy}`]
    ];
    for (let index = FORM.data; index < FORM.real; index++) {
        const [text = "", icon] = data[index - FORM.data] ?? [];
        if (icon) form.button(text, icon);
        else form.button(text);
    }
    const real = realButtons(session, page);
    for (let index = FORM.real; index < FORM.typed; index++) form.button(real[index - FORM.real] ?? "");
    if (page === "qte") {
        for (let slot = 0; slot <= BATTLE.qteTicks; slot++) form.button("");
    } else if (TYPED_PAGES.has(page)) {
        const text = typedText(state, page);
        for (const prefix of text ? typewriter(text, page === "speech" ? "§f" : undefined)
            : new Array(BATTLE.typeSlots).fill("")) form.button(prefix);
    }
    return form;
}

function fail(session, error, operation) {
    if (active !== session) return;
    report(error, operation);
    if (session.player.isValid) session.player.sendMessage("MrBeast's battle UI failed. The game has been unfrozen.");
    finish(session, "aborted");
}

function openPage(session, page, reopened = false) {
    if (active !== session || !session.player.isValid) return;
    const to = FRAME_TARGET[page];
    let transition = reopened ? to + to : session.frameAt + to;
    if (!FRAME_VARIANTS.has(transition)) transition = to + to;
    session.frameAt = to;
    const token = ++session.token;
    session.page = page;
    session.formOpen = true;
    session.retrying = false;
    let shown;
    try {
        const form = buildForm(session, page, transition);
        if (page === "main") session.intro = false;
        if (page === "qte") session.qteShownAt = system.currentTick;
        const text = reopened ? "" : typedText(session.state, page);
        session.blips = text ? { next: system.currentTick + 2, until: system.currentTick + 1 + typeTicks(text), pitch: page === "speech" ? 0.8 : 1.6 } : undefined;
        shown = form.show(session.player);
    } catch (error) {
        session.formOpen = false;
        fail(session, error, "opening battle form");
        return;
    }
    shown.then((response) => {
        if (active !== session || token !== session.token) return;
        session.formOpen = false;
        try {
            if (response.cancelationReason !== FormCancelationReason.UserBusy) {
                respond(session, page, response);
                return;
            }
            // Another screen (chat, pause...) is up: the battle clock waits until this page can show.
            session.retrying = true;
            system.runTimeout(() => {
                if (active !== session || token !== session.token) return;
                // The marker never appeared, so the timing window starts over.
                if (page === "qte") session.state.elapsed = 0;
                openPage(session, page, true);
            }, 5);
        } catch (error) { fail(session, error, `answering battle ${page} form`); }
    }, (error) => {
        if (active !== session || token !== session.token) return;
        session.formOpen = false;
        fail(session, error, "battle form");
    });
}

// Display-only pages stay up until the battle moves on, even if the player closes them.
function keepOpen(session, page) {
    const phase = session.state.phase;
    system.runTimeout(() => {
        if (active === session && session.state.phase === phase && !session.formOpen) openPage(session, page, true);
    }, 1);
}

function respond(session, page, response) {
    const state = session.state;
    const choice = response.canceled ? undefined : response.selection - FORM.real;
    if (page === "qte") {
        strike(session, response);
    } else if (page === "result") {
        // Clicking (or closing) the result text moves on to MrBeast's turn.
        continueBattle(state);
    } else if (DISPLAY_PAGES.has(page)) {
        keepOpen(session, page);
        return;
    } else if (page === "main") {
        if (choice === undefined) openPage(session, "main", true);
        else if (choice === 4) {
            selectBattleAction(state, "defend");
            openPage(session, "main");
        } else if (PAGES[choice]) {
            session.selected = choice;
            openPage(session, PAGES[choice]);
        } else throw new Error(`Invalid battle option: ${response.selection}`);
        return;
    } else if (choice === undefined || choice === { fight: 1, act: 2, items: 5, mercy: 1 }[page]) {
        openPage(session, "main");
        return;
    } else if (page === "fight" && choice === 0) {
        selectBattleAction(state, "whack");
    } else if (page === "act" && (choice === 0 || choice === 1)) {
        selectBattleAction(state, choice === 0 ? "check" : "discuss");
        if (choice === 1) sound(session, "random.orb", { pitch: 1.4 });
    } else if (page === "items" && choice >= 0 && choice < 5) {
        if (!useItem(session, choice)) {
            openPage(session, "items", true);
            return;
        }
    } else if (page === "mercy" && choice === 0) {
        selectBattleAction(state, "spare");
        if (state.phase === "result") sound(session, "note.bass", { pitch: 0.7 });
    } else {
        throw new Error(`Invalid ${page} action: ${response.selection}`);
    }
    syncPage(session);
}

function strike(session, response) {
    const state = session.state;
    const slot = response.canceled ? undefined : response.selection - FORM.typed;
    if (!response.canceled && response.selection === FORM.real) {
        // Keyboard/controller press: server timing, minus the time the screen took to open.
        const elapsed = system.currentTick - session.qteShownAt - 2;
        strikeBattle(state, elapsed >= BATTLE.qteTicks ? undefined : Math.max(0, elapsed));
    } else if (slot !== undefined && slot >= 0 && slot < BATTLE.qteTicks) {
        strikeBattle(state, slot + 0.5);
    } else {
        strikeBattle(state);
    }
}

function useItem(session, slot) {
    const typeId = session.items?.[slot];
    if (!isBattleItemUsable(typeId)) return false;
    const container = session.player.getComponent("minecraft:inventory")?.container;
    const item = container?.getItem(slot);
    // The hotbar changed while the item page was open.
    if (item?.typeId !== typeId) return false;
    const effect = selectBattleAction(session.state, "item", typeId);
    if (effect.equip) session.player.selectedSlotIndex = slot;
    if (effect.consume) {
        if (item.amount > 1) {
            item.amount--;
            container.setItem(slot, item);
        } else container.setItem(slot, undefined);
    }
    const id = effect.sound ?? (effect.equip ? "armor.equip_generic" : undefined);
    if (id) sound(session, id, { volume: id === "random.explode" ? 0.4 : 1 });
    return true;
}

// Opens the page for the battle's current phase once it changes; the open form's handler is retired first.
function syncPage(session) {
    const phase = session.state.phase;
    if (phase === session.uiPhase) return;
    const previous = session.uiPhase;
    session.uiPhase = phase;
    session.token++;
    const wasOpen = session.formOpen;
    if (wasOpen) {
        session.formOpen = false;
        uiManager.closeAllForms(session.player);
    }
    changePhase(session, previous, phase);
    const page = PHASE_PAGES[phase];
    if (!page) return;
    if (!wasOpen) openPage(session, page);
    else system.runTimeout(() => {
        if (active === session && session.uiPhase === phase && !session.formOpen) openPage(session, page);
    }, 1);
}

function changePhase(session, previous, phase) {
    const state = session.state;
    if (previous === "attack") clearAttack(session);
    if (phase === "attack") spawnAttack(session);
    if (phase === "hit") {
        if (state.missed) sound(session, "note.bass", { pitch: 0.6 });
        else if (state.equipped === "brr:item_glock") {
            sound(session, "item.shoot");
            shake(session, 0.5, 0.35);
        } else {
            sound(session, "item.trident.hit");
            if (state.damage >= BATTLE.whackDamage) shake(session, 0.25, 0.2);
        }
    } else if (phase === "victory") {
        // The congrats theme (shorter than the victory screen) replaces the battle music.
        session.music = undefined;
        for (const { player } of session.viewers.values()) {
            if (!player.isValid) continue;
            try {
                player.runCommand(`stopsound @s ${MUSIC}`);
                playAt(session, player, VICTORY_MUSIC, musicVolume(player));
            } catch (error) { report(error, "playing the victory music"); }
        }
        if (state.outcome === "spared") sound(session, "beast.congrats");
    } else if (phase === "defeat") {
        sound(session, "random.glass");
    }
}

function shake(session, intensity, seconds) {
    try { session.player.runCommand(`camerashake add @s ${intensity} ${seconds} positional`); }
    catch (error) { report(error, "shaking the camera"); }
}

function updateActors(session) {
    const { origin, player, beast, state } = session;
    player.teleport(stagePoint(origin, STAGE.player.x, STAGE.player.feet, STAGE.player.depth),
        { dimension: session.dimension, rotation: { x: 0, y: STAGE.player.yaw } });
    player.clearVelocity();
    const centre = stagePoint(origin, STAGE.beast.x, STAGE.beast.y, STAGE.beast.depth);
    const defeated = state.phase === "victory" && state.outcome === "defeated";
    beast.teleport({ x: centre.x, y: centre.y - STAGE.beast.height / 2, z: centre.z + (defeated ? 30 : 0) },
        { rotation: { x: 0, y: 0 } });
    beast.clearVelocity();
    for (const { player: viewer, saved } of session.viewers.values()) {
        if (!viewer.isValid || viewer.id === player.id) continue;
        viewer.teleport({ ...origin, z: origin.z - 10 }, { dimension: session.dimension, rotation: saved.rotation });
        viewer.clearVelocity();
    }
    if (system.currentTick % 100 === 0) {
        for (const { player: viewer } of session.viewers.values()) {
            if (viewer.isValid) {
                viewer.addEffect("resistance", 200, { amplifier: 255, showParticles: false });
                viewer.addEffect("night_vision", 400, { amplifier: 0, showParticles: false });
            }
        }
    }
}

function updateVisuals(session) {
    const state = session.state;
    if (state.phase !== "attack" || !session.heart) return;
    session.heart.teleport(point(session, state.heart.x, state.heart.y, -0.1));
    session.emitter?.teleport(point(session, 170, state.emitter.y, -0.1));
    if (session.shownHearts !== battleHearts(state)) {
        session.shownHearts = battleHearts(state);
        session.heartsRow.forEach((entity, index) => entity.setProperty("brr:visual", heartsRowType(session, index)));
    }
    const remaining = new Set();
    for (const shot of state.projectiles) {
        remaining.add(shot.id);
        let entity = session.shots.get(shot.id);
        if (!entity) {
            const [width, height] = SHOT_SIZE[shot.kind] ?? [0.32, 0.24];
            entity = visual(session, VISUAL[shot.kind], point(session, shot.x, shot.y, -0.12), width, height);
            session.shots.set(shot.id, entity);
        }
        entity.teleport(point(session, shot.x, shot.y, -0.12));
    }
    for (const [id, entity] of session.shots) {
        if (remaining.has(id)) continue;
        if (entity.isValid) entity.remove();
        session.visuals.delete(entity);
        session.shots.delete(id);
    }
}

function tickEffects(session) {
    const state = session.state;
    if (state.hits > session.shownHits) {
        session.shownHits = state.hits;
        sound(session, "game.player.hurt");
        shake(session, 0.2, 0.15);
    }
    const blips = session.blips;
    if (blips && system.currentTick >= blips.next) {
        if (system.currentTick > blips.until || !session.formOpen) session.blips = undefined;
        else {
            sound(session, "random.click", { volume: 0.25, pitch: blips.pitch, fighterOnly: true });
            blips.next += 2;
        }
    }
    for (const event of state.events.splice(0)) {
        if (EVENT_SOUNDS[event]) sound(session, EVENT_SOUNDS[event]);
    }
    if (session.music && system.currentTick >= session.nextMusicAt) {
        for (const { player } of session.viewers.values()) {
            if (player.isValid) playAt(session, player, session.music, musicVolume(player));
        }
        session.musicStarted = true;
        session.nextMusicAt = system.currentTick + BATTLE_MUSIC_TICKS;
    }
}

function battleTick(session) {
    if (!session.player.isValid || !session.beast.isValid) {
        finish(session, "aborted");
        return;
    }
    if (session.player.getComponent("minecraft:health").currentValue <= 0) {
        finish(session, "aborted");
        return;
    }
    for (const player of world.getAllPlayers()) enroll(session, player);
    const state = session.state;
    const input = state.phase === "attack" ? session.player.inputInfo.getMovementVector() : { x: 0, y: 0 };
    // Strafe input is mirrored because the stage camera looks along +z. While a page waits for another
    // screen to close, the battle clock stops so no phase (or attack) starts behind it.
    if (!session.retrying) advanceBattle(state, { x: -input.x, y: input.y });
    syncPage(session);
    updateActors(session);
    updateVisuals(session);
    tickEffects(session);
    if (state.phase === "victory") {
        if (!session.rewarded) {
            addScore(session.player, "money", BATTLE.reward, "Money");
            session.rewarded = true;
        }
        if (state.elapsed >= BATTLE.victoryTicks) finish(session, state.outcome);
    } else if (state.phase === "defeat" && state.elapsed >= BATTLE.defeatTicks) {
        finish(session, "defeat");
    }
}

function recoverPlayer(player) {
    const value = player.getDynamicProperty(RESTORE_PROPERTY);
    if (value === undefined || active?.viewers.has(player.id)) return;
    try { restore(player, JSON.parse(value)); }
    catch (error) { report(error, `recovering ${player.id}`); }
}

function recoverBeast(entity) {
    if (!entity.isValid) return;
    const value = entity.getDynamicProperty(RESTORE_PROPERTY);
    if (value === undefined) return;
    try {
        const saved = JSON.parse(value);
        entity.teleport(saved.location, { rotation: saved.rotation });
        entity.setDynamicProperty(RESTORE_PROPERTY, undefined);
    } catch (error) { report(error, `recovering MrBeast ${entity.id}`); }
}

export function startBeastBattleSystem() {
    world.afterEvents.playerLeave.subscribe(({ playerId }) => {
        if (active?.player.id === playerId) finish(active, "aborted");
        else if (active) {
            const viewer = active.viewers.get(playerId);
            if (viewer?.player.isValid) viewer.player.onScreenDisplay.setHudVisibility(HudVisibility.Reset);
            active.viewers.delete(playerId);
        }
    });
    world.afterEvents.playerSpawn.subscribe(({ player }) => system.run(() => recoverPlayer(player)));
    world.afterEvents.entityLoad.subscribe(({ entity }) => {
        if (entity.typeId === VISUAL_ID && !active?.visuals.has(entity)) {
            system.run(() => { if (entity.isValid) entity.remove(); });
        } else if (entity.typeId === "brr:mrbeast") {
            // Only the MrBeast currently on stage keeps its checkpoint; any other one is restored now.
            system.run(() => { if (active?.beast.id !== entity.id) recoverBeast(entity); });
        }
    });
    for (const name of ["playerInteractWithBlock", "playerInteractWithEntity", "playerBreakBlock", "itemUse"]) {
        world.beforeEvents[name].subscribe((event) => { if (active) event.cancel = true; });
    }
    system.run(() => {
        for (const player of world.getAllPlayers()) recoverPlayer(player);
        for (const id of ["overworld", "nether", "the_end"]) {
            const dimension = world.getDimension(id);
            for (const entity of dimension.getEntities({ type: VISUAL_ID })) entity.remove();
            for (const entity of dimension.getEntities({ type: "brr:mrbeast" })) recoverBeast(entity);
        }
    });
    system.runInterval(() => {
        if (!active) return;
        const session = active;
        try { battleTick(session); }
        catch (error) {
            report(error, "battle tick");
            if (session.player.isValid) session.player.sendMessage("MrBeast's battle stopped because of an error. Check the content log.");
            finish(session, "aborted");
        }
    }, 1);
}
