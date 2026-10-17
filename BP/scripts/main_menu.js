import { HudVisibility, InputPermissionCategory, system, world } from "@minecraft/server";
import { ActionFormData, FormCancelationReason, uiManager } from "@minecraft/server-ui";
import { holdPause, releasePause } from "./core/pause.js";
import { VOLUME_STEPS, getSetting, musicVolume, resetSetting, setSetting, soundVolume } from "./core/settings.js";
import { forgetCraftersDespawns } from "./characters/crafters.js";
import { trackedCharacters } from "./characters/registry.js";
import { resetEscape } from "./escape.js";
import { INTRO_TEXTS } from "./intro_texts_data.js";
import { loadMap, unloadMap } from "./map.js";
import { ensureMenuRoom, holdInMenuRoom, releaseFromMenuRoom } from "./menu_room.js";
import { resetBeginning } from "./beginning.js";
import { resetCharacterSpawns } from "./character_spawns.js";
import { isXmasMode, setXmasMode } from "./memes.js";
import { clearMenuCamera, showMenuCamera } from "./menu_camera.js";
import { MODES, chooseMode, isRunActive, othersPlaying, playScreen } from "./run.js";
import { TROPHIES, hasTrophy, resetTrophies, unlockedCount } from "./trophies.js";

// Main menu shown on RP/ui/brr_menu.json. Every screen is an ActionFormData whose title
// "brr:menu:<screen>[|peter][|nf][|intro][|flash]" selects the layout; the button order below must
// match the collection_index values used there. Joining boots like the original: the Loading
// screen, the content warning, then the main menu with its intro.
export const GAME_VERSION = "1.0.3";
// true while in the menu, false while in a run (BP/scripts/run.js)
export const IN_MENU_PROPERTY = "brr:in_menu";
// set by the removed QUIT button; cleared on the next menu open for anyone it left frozen
const QUIT_PENDING_PROPERTY = "brr:menu_quit_pending";
const PETER_CLICKS = 10;
const BUSY_RETRY_TICKS = 5;
const JOIN_DELAY_TICKS = 20;
// the original's Loading panel stays up about 3.7 s
const BOOT_LOADING_TICKS = 74;
// after the warning is accepted the original waits 5 s; its music fades out in half a second
const WARNING_EXIT_TICKS = 100;
const WARNING_MUSIC_STOP_TICKS = 10;

// looping menu music; lengths measured from the Ogg sample counts
const MUSIC = {
    menu: { sound: "menu.music", ticks: 5062 },
    peter: { sound: "menu.music_peter", ticks: 5081 },
    credits: { sound: "menu.music_credits", ticks: 576 },
    warning: { sound: "menu.music_warning", ticks: 1288 }
};

const TEX = {
    segOn: "textures/ui/menu/seg_on",
    segOff: "textures/ui/menu/seg_off",
    checkOn: "textures/ui/menu/check_on",
    checkOff: "textures/ui/menu/check_off"
};

// Gameplay tab toggles; up to 10 fit the layout.
const GAMEPLAY_TOGGLES = [
    { label: "Memes", get: (player) => getSetting(player, "memes") === true, set: (player, on) => setSetting(player, "memes", on) },
    { label: "Christmas Memes", get: () => isXmasMode(), set: (_player, on) => setXmasMode(on) },
    { label: "Dont Show Warning", get: (player) => getSetting(player, "skip_warning") === true, set: (player, on) => setSetting(player, "skip_warning", on) }
];

const AUDIO_TOGGLES = [
    { key: "no_licensed_audio" },
    { key: "no_fart_sounds" }
];

const sessions = new Map();

function title(session, player, screen, extra = "") {
    const peter = session.peter ? "|peter" : "";
    const noFarts = getSetting(player, "no_fart_sounds") ? "|nf" : "";
    return `brr:menu:${screen}${peter}${noFarts}${extra}`;
}

function introText() {
    const text = INTRO_TEXTS[Math.floor(Math.random() * INTRO_TEXTS.length)];
    if (text !== null) return text;
    try { return new Date().toLocaleString(); } catch { return new Date().toString(); }
}

function addSlider(form, player, key) {
    const value = getSetting(player, key);
    const percent = `${Math.round((value / VOLUME_STEPS) * 100)}%`;
    for (let step = 1; step <= VOLUME_STEPS; step++) form.button(percent, step <= value ? TEX.segOn : TEX.segOff);
    form.button("Reset");
}

function handleSlider(player, key, index) {
    if (index === VOLUME_STEPS) {
        resetSetting(player, key);
        return;
    }
    const step = index + 1;
    // clicking the only filled segment again mutes
    setSetting(player, key, getSetting(player, key) === step && step === 1 ? 0 : step);
}

// ------------------------------------------------------------------ music ----

function stopTrack(player, session) {
    const playing = session.music;
    if (!playing) return;
    session.music = undefined;
    system.clearRun(playing.loop);
    try { player.runCommand(`stopsound @s ${MUSIC[playing.track].sound}`); } catch { }
}

function playTrack(player, session, track) {
    if (session.music?.track === track) return;
    stopTrack(player, session);
    if (!track) return;
    const playing = { track };
    session.music = playing;
    const play = () => {
        if (session.music !== playing || !player.isValid) return;
        const volume = musicVolume(player);
        if (volume > 0) {
            try { player.playSound(MUSIC[track].sound, { volume }); } catch { }
        }
        playing.loop = system.runTimeout(play, MUSIC[track].ticks);
    };
    play();
}

// what plays under each screen; sub screens keep the menu music except credits (mus_results)
function screenTrack(session, screen) {
    if (screen === "boot") return undefined;
    if (screen === "warning") return "warning";
    if (screen === "warning_accepted") return session.music?.track;
    if (screen === "credits") return "credits";
    return session.peter ? "peter" : "menu";
}

function playSound(player, sound) {
    const volume = soundVolume(player);
    if (volume <= 0) return;
    try { player.playSound(sound, { volume }); } catch { }
}

// runs `callback` after `ticks` if the player is still in this menu session
function later(player, session, ticks, callback) {
    system.runTimeout(() => {
        if (sessions.get(player.id) === session && player.isValid) callback();
    }, ticks);
}

// ---------------------------------------------------------------- screens ----

const SCREENS = {
    // the original's Loading screen; it moves on by itself
    boot: {
        build(form, session, player) {
            form.title(title(session, player, "boot")).body("");
        },
        cancel() {
            return "boot";
        }
    },
    warning: {
        build(form, session, player) {
            form.title(title(session, player, "warning")).body("");
            form.button("");
        },
        // any key: the full screen button, Enter, or Escape
        select(player, session) {
            return acceptWarning(player, session, false);
        },
        cancel(player, session) {
            return acceptWarning(player, session, true);
        }
    },
    warning_accepted: {
        build(form, session, player) {
            form.title(title(session, player, "warning", "|accepted")).body("");
            form.button("");
        },
        select() {
            return "warning_accepted";
        },
        cancel() {
            return "warning_accepted";
        }
    },
    main: {
        build(form, session, player) {
            const intro = session.introNext ? "|intro" : "";
            const flash = session.flashNext ? "|flash" : "";
            form.title(title(session, player, "main", `${intro}${flash}`)).body(`RaldiCrackhouse v${GAME_VERSION}`);
            session.introNext = false;
            session.flashNext = false;
            // button 3 was QUIT; its empty slot keeps the later indices where brr_menu.json expects them
            for (const label of ["PLAY", "CREDITS", "OPTIONS", "", "", "TROPHIES", session.introText]) form.button(label);
        },
        select(player, session, index) {
            if (index === 0) return "play";
            if (index === 1) return "credits";
            if (index === 2) return "audio";
            if (index === 5) return "trophies";
            if (index === 4 && !session.peter && ++session.peterClicks >= PETER_CLICKS) {
                session.peter = true;
                session.flashNext = true;
                playSound(player, "menu.vineboom");
            }
            return "main";
        }
    },
    play: {
        build(form, session, player) {
            const { banner, cards } = playScreen(player);
            form.title(title(session, player, "play")).body(banner);
            form.button("");
            for (const card of cards) form.button(card);
        },
        select(player, _session, index) {
            const mode = MODES[index - 1];
            return mode ? chooseMode(player, mode.id) : "main";
        }
    },
    credits: {
        // only the back arrow: the list itself is static UI (scripts_gen/gen_credits_ui.mjs)
        build(form, session, player) {
            form.title(title(session, player, "credits")).body("");
            form.button("");
        },
        select() {
            return "main";
        }
    },
    trophies: {
        // Button 0 is the back arrow, button 1 the RESET LOCAL TROPHIES tab ("R|" + label). Each card's
        // text is fixed width so brr_menu.json can slice it:
        // [0..2) "A|" achieved / "N|" not, [2..34) name, [34..42) tier, [42..) description.
        build(form, session, player) {
            form.title(title(session, player, "trophies")).body(`Unlocked ${unlockedCount(player)}/${TROPHIES.length}`);
            form.button("");
            form.button(session.resetArmed ? "R|PRESS AGAIN TO RESET" : "R|RESET LOCAL TROPHIES");
            for (const trophy of TROPHIES) {
                const flag = hasTrophy(player, trophy.id) ? "A|" : "N|";
                form.button(`${flag}${trophy.name.padEnd(32).slice(0, 32)}${trophy.tier.padEnd(8).slice(0, 8)}${trophy.description}`, trophy.icon);
            }
        },
        // resetting takes a second press, so one stray click can't wipe them
        select(player, session, index) {
            const armed = session.resetArmed;
            session.resetArmed = false;
            if (index !== 1) return "main";
            if (armed) resetTrophies(player);
            else session.resetArmed = true;
            return "trophies";
        },
        cancel(player, session) {
            session.resetArmed = false;
            return "main";
        }
    },
    audio: {
        build(form, session, player) {
            form.title(title(session, player, "audio")).body("");
            form.button("").button("AUDIO").button("GAMEPLAY");
            addSlider(form, player, "music_volume");
            addSlider(form, player, "sound_volume");
            for (const toggle of AUDIO_TOGGLES) form.button("", getSetting(player, toggle.key) ? TEX.checkOn : TEX.checkOff);
        },
        select(player, _session, index) {
            const tab = selectTab(index);
            if (tab) return tab;
            index -= 3;
            const sliderSize = VOLUME_STEPS + 1;
            if (index < sliderSize) handleSlider(player, "music_volume", index);
            else if (index < sliderSize * 2) handleSlider(player, "sound_volume", index - sliderSize);
            else {
                const toggle = AUDIO_TOGGLES[index - sliderSize * 2];
                if (toggle) setSetting(player, toggle.key, !getSetting(player, toggle.key));
            }
            return "audio";
        }
    },
    gameplay: {
        build(form, session, player) {
            form.title(title(session, player, "gameplay")).body("");
            form.button("").button("AUDIO").button("GAMEPLAY");
            for (const toggle of GAMEPLAY_TOGGLES) form.button(toggle.label, toggle.get(player) ? TEX.checkOn : TEX.checkOff);
        },
        select(player, _session, index) {
            const tab = selectTab(index);
            if (tab) return tab;
            const toggle = GAMEPLAY_TOGGLES[index - 3];
            if (toggle) toggle.set(player, !toggle.get(player));
            return "gameplay";
        }
    }
};

function selectTab(index) {
    if (index === 0) return "main";
    if (index === 1) return "audio";
    if (index === 2) return "gameplay";
    return undefined;
}

// WarningScreenScript: confirm sound, the music fades, and 5 s later the menu
function acceptWarning(player, session, fromEscape) {
    // the full screen button plays the confirm sound itself (RP/ui/brr_menu.json)
    if (fromEscape) playSound(player, "menu.confirm");
    later(player, session, WARNING_MUSIC_STOP_TICKS, () => stopTrack(player, session));
    later(player, session, WARNING_EXIT_TICKS, () => {
        if (session.screen === "warning_accepted") reopen(player, session, "main");
    });
    return "warning_accepted";
}

function show(player, session, screen) {
    if (sessions.get(player.id) !== session || !player.isValid) return;
    session.screen = screen;
    playTrack(player, session, screenTrack(session, screen));
    // a form closed by reopen() resolves as canceled; its token tells it to stay quiet
    const token = ++session.token;
    const form = new ActionFormData();
    SCREENS[screen].build(form, session, player);
    form.show(player)
        .then((response) => {
            if (sessions.get(player.id) !== session || session.token !== token || !player.isValid) return;
            if (response.canceled) {
                if (response.cancelationReason === FormCancelationReason.UserBusy) {
                    // a client that's still loading (joining, or the teleport to the menu yard) drops
                    // sounds too: the screen's music starts over with the retry that gets through
                    stopTrack(player, session);
                    retry(player, session, token, screen, BUSY_RETRY_TICKS);
                    return;
                }
                // the menu can't be closed: escape on a sub screen goes back, on the main screen it
                // reopens (which also skips the intro, like Back/Pause in the original)
                const next = SCREENS[screen].cancel?.(player, session) ?? "main";
                show(player, session, next);
                return;
            }
            const next = SCREENS[screen].select(player, session, response.selection);
            if (next) show(player, session, next);
        })
        .catch((error) => {
            if (sessions.get(player.id) !== session || session.token !== token) return;
            console.warn(`[menu] Form failed for ${player.name}: ${error}`);
            retry(player, session, token, screen, BUSY_RETRY_TICKS * 4);
        });
}

// Shows `screen` again later, unless another screen has been opened in the meantime. (A busy client,
// e.g. one still joining, turns forms away for a while; a stale retry used to reopen the boot screen
// over the warning and the menu, and leave it stuck on top of everything after it.)
function retry(player, session, token, screen, ticks) {
    system.runTimeout(() => {
        if (sessions.get(player.id) === session && session.token === token) show(player, session, screen);
    }, ticks);
}

function reopen(player, session, screen) {
    const token = ++session.token;
    try { uiManager.closeAllForms(player); } catch { }
    system.run(() => {
        if (sessions.get(player.id) === session && session.token === token) show(player, session, screen);
    });
}

// rebuilds the open screen with fresh contents, if the player is on `screen`
export function refreshMenu(player, screen) {
    const session = sessions.get(player.id);
    if (session?.screen === screen) reopen(player, session, screen);
}

// switches a player who is in the menu to another screen
export function showMenu(player, screen) {
    const session = sessions.get(player.id);
    if (session) reopen(player, session, screen);
}

function setFrozen(player, frozen) {
    try {
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, !frozen);
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.Camera, !frozen);
    } catch { }
}

// Opens the menu fresh (Peter mode always starts off) with its intro. `boot` shows the
// Loading screen and the content warning first, like starting the original game.
export function openMainMenu(player, { boot = false } = {}) {
    if (player.getDynamicProperty("brr:beast_battle_restore") !== undefined) {
        player.sendMessage("Finish MrBeast's battle before opening the main menu.");
        return;
    }
    endSession(player.id, player);
    const session = {
        peter: false, peterClicks: 0, flashNext: false, screen: "main", token: 0,
        introNext: true, introText: introText()
    };
    sessions.set(player.id, session);
    // the game pauses while in the menu, unless others are still playing a run
    if (!othersPlaying(player)) holdPause(session);
    player.setDynamicProperty(IN_MENU_PROPERTY, true);
    player.setDynamicProperty(QUIT_PENDING_PROPERTY, undefined);
    setFrozen(player, false);
    try { player.onScreenDisplay.setHudVisibility(HudVisibility.Hide); } catch { }
    try { uiManager.closeAllForms(player); } catch { }
    // waiting in the menu's own yard, invisible, with the camera looking at the school front
    holdInMenuRoom(player);
    showMenuCamera(player);
    if (!boot) {
        system.run(() => show(player, session, "main"));
        return;
    }
    system.run(() => show(player, session, "boot"));
    later(player, session, BOOT_LOADING_TICKS, () => {
        if (session.screen !== "boot") return;
        reopen(player, session, getSetting(player, "skip_warning") ? "main" : "warning");
    });
}

function endSession(playerId, player) {
    const session = sessions.get(playerId);
    if (!session) return;
    sessions.delete(playerId);
    releasePause(session);
    if (player?.isValid) {
        stopTrack(player, session);
        clearMenuCamera(player);
    }
}

// leaving the menu for a run; run.js takes over the HUD and the open form
export function exitMenu(player) {
    endSession(player.id, player);
    setFrozen(player, false);
    releaseFromMenuRoom(player);
}

export function isInMainMenu(player) {
    return sessions.has(player.id);
}

// things a run leaves lying around that would otherwise freeze in place and carry on in the next one
const LEFTOVER_QUERIES = [{ families: ["brr_projectile"] }, { type: "brr:alarm_clock" }, { type: "brr:beast_battle_visual" }];

// A clean slate. The run end takes the map away (unload: the menu has its own yard, menu_room.js);
// the run start places it again (onlyIfUsed: unless it's still fresh and untouched).
export function resetGame({ onlyIfUsed = false, unload = false } = {}) {
    const overworld = world.getDimension("overworld");
    // a Crafters mid-chase would bring back everyone he hid as he's removed
    forgetCraftersDespawns();
    // every character goes; the next run spawns them on their start markers (character_spawns.js)
    for (const entity of trackedCharacters(overworld)) {
        try { entity.remove(); } catch { }
    }
    for (const query of LEFTOVER_QUERIES) {
        let found = [];
        try { found = overworld.getEntities(query); } catch { }
        for (const entity of found) {
            try { entity.remove(); } catch { }
        }
    }
    // the map itself goes, or comes back from its six structures (map.js)
    try {
        if (unload) unloadMap();
        else loadMap({ onlyIfUsed });
    } catch (error) { console.warn(`[menu] Map ${unload ? "unload" : "load"} failed: ${error}`); }
    for (const command of ["function rc_reset", "function rc_setup"]) {
        try { overworld.runCommand(command); }
        catch (error) { console.warn(`[menu] "${command}" failed: ${error}`); }
    }
    // after rc_setup (its setworldspawn / clearspawnpoint): the yard's spawns are the ones that stick
    if (unload) {
        ensureMenuRoom();
        for (const player of world.getAllPlayers()) {
            if (sessions.has(player.id)) holdInMenuRoom(player);
        }
    }
    // vaults come back intact with the reloaded map
    world.setDynamicProperty("brr:cracked_vaults", undefined);
    // the characters wait for the new run again (character_spawns.js), Raldi for the players (beginning.js)
    resetCharacterSpawns();
    resetBeginning();
    try { resetEscape(); }
    catch (error) { console.warn(`[menu] Escape reset failed: ${error}`); }
}

// `/scriptevent brr:ingame` (scriptevent ids need a namespace)
system.afterEvents.scriptEventReceive.subscribe(({ id, sourceEntity }) => {
    if (id !== "brr:ingame") return;
    const players = sourceEntity?.typeId === "minecraft:player" ? [sourceEntity] : world.getAllPlayers();
    for (const player of players) openMainMenu(player);
});

// everyone joining boots into the menu, except players rejoining a run that's still going
world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    if (!initialSpawn) return;
    if (player.getDynamicProperty("brr:beast_battle_restore") !== undefined) return;
    if (player.getDynamicProperty(IN_MENU_PROPERTY) === false && isRunActive()) return;
    const welcome = () => {
        if (!player.isValid) return;
        if (player.getDynamicProperty("brr:beast_battle_restore") !== undefined) {
            system.runTimeout(welcome, JOIN_DELAY_TICKS);
            return;
        }
        openMainMenu(player, { boot: true });
    };
    system.runTimeout(welcome, JOIN_DELAY_TICKS);
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => endSession(playerId));

// after /reload, put anyone who was in the menu back into it
system.run(() => {
    for (const player of world.getAllPlayers()) {
        if (player.getDynamicProperty(IN_MENU_PROPERTY) === true) openMainMenu(player);
    }
});
