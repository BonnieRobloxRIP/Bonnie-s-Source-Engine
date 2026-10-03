import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const OPEN_MENU_TAG = "brr_open_black_mesa_menu";
const SELECTED_CHAPTER_PROPERTY = "brr_bm_selected_chapter";
const HAS_SAVE_PROPERTY = "brr_bm_has_save";

const HUB_SAVE_TITLE = "BM_MAIN::HUB::SAVE";
const HUB_NEW_TITLE = "BM_MAIN::HUB::NEW";
const CAMPAIGN_TITLE_PREFIX = "BM_MAIN::CAMPAIGN::";

const OPTIONS_TABS = {
    GAME: {
        title: "BM_MAIN::OPTIONS::GAME",
        label: "GAME",
        rows: [
            "DIFFICULTY",
            "ALWAYS RUN",
            "VIEW ROLL",
            "FAST WEAPON SWITCH",
            "AUTO WEAPON SWITCH",
            "CLASSIC IRON-SIGHTS",
            "AUTO CROUCH JUMP"
        ]
    },
    AUDIO: {
        title: "BM_MAIN::OPTIONS::AUDIO",
        label: "AUDIO",
        rows: [
            "MASTER VOLUME",
            "SOUND EFFECT VOLUME",
            "MUSIC VOLUME",
            "SPEAKER CONFIGURATION",
            "SOUND QUALITY",
            "CAPTIONING",
            "CAPTIONING LANGUAGE"
        ]
    },
    PERF: {
        title: "BM_MAIN::OPTIONS::PERF",
        label: "PERFORMANCE",
        rows: [
            "RENDER DISTANCE",
            "FIELD OF VIEW",
            "DYNAMIC LIGHTS",
            "PARTICLE DENSITY",
            "LENS FLARE",
            "CHROMATIC ABERRATION",
            "RADIOACTIVE NOISE SHADER",
            "HUD POST PROCESSING"
        ]
    }
};

const TOP_TABS = [
    "CAMPAIGN",
    "MULTIPLAYER",
    "OPTIONS",
    "ACHIEVEMENTS",
    "STEAM WORKSHOP"
];

const CHAPTERS = [
    "BLACK MESA INBOUND",
    "ANOMALOUS MATERIALS",
    "UNFORESEEN CONSEQUENCES",
    "OFFICE COMPLEX"
];

const SAVE_TIMESTAMP = "Saturday, March 14 2026 1:42:03";

function isPlayerValid(player) {
    if (!player) return false;
    try {
        if (typeof player.isValid === "function") {
            return player.isValid();
        }

        if (typeof player.isValid === "boolean") {
            return player.isValid;
        }

        // Fallback for API variants that do not expose isValid directly.
        return true;
    } catch {
        return false;
    }
}

function sendUiFailure(player, context, error) {
    if (!isPlayerValid(player)) return;

    const reason = `${error ?? "unknown"}`.trim();
    try {
        player.sendMessage(`§c[BM Menu] Failed to open ${context}. Reason: ${reason}`);
    } catch { }
}

function queueInitialMenuOpen(player) {
    // Opening a form immediately after /function from chat can hit UserBusy.
    system.run(() => {
        system.run(() => {
            if (!isPlayerValid(player)) return;
            showHubMenu(player);
        });
    });
}

function clampChapterIndex(index) {
    if (!Number.isFinite(index)) return 0;
    return Math.max(0, Math.min(CHAPTERS.length - 1, Math.floor(index)));
}

function getSelectedChapterIndex(player) {
    try {
        const value = Number.parseInt(`${player.getDynamicProperty(SELECTED_CHAPTER_PROPERTY) ?? "0"}`, 10);
        return clampChapterIndex(value);
    } catch {
        return 0;
    }
}

function setSelectedChapterIndex(player, index) {
    try {
        player.setDynamicProperty(SELECTED_CHAPTER_PROPERTY, clampChapterIndex(index));
    } catch { }
}

function getCampaignTitle(player) {
    return `${CAMPAIGN_TITLE_PREFIX}${getSelectedChapterIndex(player)}`;
}

function hasSave(player) {
    try {
        return player.getDynamicProperty(HAS_SAVE_PROPERTY) === true;
    } catch {
        return false;
    }
}

function setHasSave(player) {
    try {
        player.setDynamicProperty(HAS_SAVE_PROPERTY, true);
    } catch { }
}

function notifyNotImplemented(player, tabName) {
    try {
        player.sendMessage(`§7[BM Menu] §f${tabName} is planned but not wired yet.`);
    } catch { }
}

function notifyPlaceholder(player, what) {
    try {
        player.sendMessage(`§6[BM Menu] §f${what} §7(placeholder — not wired yet)`);
    } catch { }
}

function handleStartGame(player) {
    const selectedChapter = CHAPTERS[getSelectedChapterIndex(player)] ?? CHAPTERS[0];

    setHasSave(player);

    try {
        player.sendMessage(`§6[BM Menu] §fSTART GAME selected for §e${selectedChapter}§f.`);
        player.sendMessage("§7Hook your chapter boot logic inside handler/ui/black_mesa_menu.js -> handleStartGame().");
    } catch { }
}

function showHubMenu(player) {
    if (!isPlayerValid(player)) return;

    const savedChapter = CHAPTERS[getSelectedChapterIndex(player)] ?? CHAPTERS[0];
    const playerHasSave = hasSave(player);

    // Trailing [XX] tokens let server_form.json bind each entry to a specific control; the UI strips them before display.
    const form = new ActionFormData()
        .title(playerHasSave ? HUB_SAVE_TITLE : HUB_NEW_TITLE)
        .body(`${savedChapter}\n${SAVE_TIMESTAMP}`)
        .button(`${TOP_TABS[0]}[T0]`)
        .button(`${TOP_TABS[1]}[T1]`)
        .button(`${TOP_TABS[2]}[T2]`)
        .button(`${TOP_TABS[3]}[T3]`)
        .button(`${TOP_TABS[4]}[T4]`)
        .button(playerHasSave ? "RESUME[HR]" : "START GAME[HR]")
        .button("QUIT")
        .button(`${savedChapter}[HC]`)
        .button(`${SAVE_TIMESTAMP}[HD]`);

    form.show(player).then((response) => {
        if (response.canceled || !isPlayerValid(player)) return;

        const selectedIndex = Number(response.selection);
        switch (selectedIndex) {
            case 0:
                showCampaignMenu(player);
                return;
            case 1:
                notifyNotImplemented(player, "MULTIPLAYER");
                showHubMenu(player);
                return;
            case 2:
                showOptionsMenu(player, "GAME");
                return;
            case 3:
                notifyNotImplemented(player, "ACHIEVEMENTS");
                showHubMenu(player);
                return;
            case 4:
                notifyNotImplemented(player, "STEAM WORKSHOP");
                showHubMenu(player);
                return;
            case 5:
                if (playerHasSave) {
                    try {
                        player.sendMessage("§a[BM Menu] Resume selected.");
                    } catch { }
                } else {
                    setSelectedChapterIndex(player, 0);
                    handleStartGame(player);
                }
                return;
            case 6:
                try {
                    player.sendMessage("§c[BM Menu] Quit selected.");
                } catch { }
                return;
            case 7:
            case 8:
                showHubMenu(player);
                return;
            default:
                return;
        }
    }).catch((error) => {
        sendUiFailure(player, "hub menu", error);
    });
}

function showOptionsMenu(player, tabKey) {
    if (!isPlayerValid(player)) return;

    const tab = OPTIONS_TABS[tabKey] ?? OPTIONS_TABS.GAME;
    const rowCount = tab.rows.length;

    const form = new ActionFormData()
        .title(tab.title)
        .body(`${tab.label} OPTIONS`);

    // Rows come first so their indices stay stable regardless of how many a tab has.
    for (let i = 0; i < rowCount; i++) {
        form.button(`${tab.rows[i]}[R${i}]`);
    }

    form.button(`${TOP_TABS[0]}[T0]`)
        .button(`${TOP_TABS[1]}[T1]`)
        .button(`${TOP_TABS[2]}[T2]`)
        .button(`${TOP_TABS[3]}[T3]`)
        .button(`${TOP_TABS[4]}[T4]`)
        .button("GAME[OSG]")
        .button("AUDIO[OSA]")
        .button("PERFORMANCE[OSP]")
        .button("BACK[CB]")
        .button("DISCARD CHANGES[ODC]")
        .button("APPLY CHANGES[OAC]");

    form.show(player).then((response) => {
        if (response.canceled || !isPlayerValid(player)) return;

        const selectedIndex = Number(response.selection);

        if (selectedIndex < rowCount) {
            notifyPlaceholder(player, `${tab.label} \u2192 ${tab.rows[selectedIndex]}`);
            showOptionsMenu(player, tabKey);
            return;
        }

        switch (selectedIndex - rowCount) {
            case 0:
                showCampaignMenu(player);
                return;
            case 1:
                notifyNotImplemented(player, "MULTIPLAYER");
                showOptionsMenu(player, tabKey);
                return;
            case 2:
                showOptionsMenu(player, tabKey);
                return;
            case 3:
                notifyNotImplemented(player, "ACHIEVEMENTS");
                showOptionsMenu(player, tabKey);
                return;
            case 4:
                notifyNotImplemented(player, "STEAM WORKSHOP");
                showOptionsMenu(player, tabKey);
                return;
            case 5:
                showOptionsMenu(player, "GAME");
                return;
            case 6:
                showOptionsMenu(player, "AUDIO");
                return;
            case 7:
                showOptionsMenu(player, "PERF");
                return;
            case 8:
                showHubMenu(player);
                return;
            case 9:
                notifyPlaceholder(player, `${tab.label} changes discarded`);
                showOptionsMenu(player, tabKey);
                return;
            case 10:
                notifyPlaceholder(player, `${tab.label} changes applied`);
                showOptionsMenu(player, tabKey);
                return;
            default:
                return;
        }
    }).catch((error) => {
        sendUiFailure(player, "options menu", error);
    });
}

function showCampaignMenu(player) {
    if (!isPlayerValid(player)) return;

    const selectedChapterIndex = getSelectedChapterIndex(player);
    const selectedChapter = CHAPTERS[selectedChapterIndex] ?? CHAPTERS[0];

    const form = new ActionFormData()
        .title(getCampaignTitle(player))
        .body(`SELECTED CHAPTER: ${selectedChapter}\nPick a chapter card, then press START GAME.`)
        .button(`${TOP_TABS[0]}[T0]`)
        .button(`${TOP_TABS[1]}[T1]`)
        .button(`${TOP_TABS[2]}[T2]`)
        .button(`${TOP_TABS[3]}[T3]`)
        .button(`${TOP_TABS[4]}[T4]`)
        .button(`${CHAPTERS[0]}[C0]`)
        .button(`${CHAPTERS[1]}[C1]`)
        .button(`${CHAPTERS[2]}[C2]`)
        .button(`${CHAPTERS[3]}[C3]`)
        .button("BACK[CB]")
        .button("START GAME[CS]")
        .button("LOAD GAME[CL]")
        .button("SAVE GAME[CV]")
        .button("NEW GAME[CN]");

    form.show(player).then((response) => {
        if (response.canceled || !isPlayerValid(player)) return;

        const selectedIndex = Number(response.selection);

        if (selectedIndex === 0) {
            showCampaignMenu(player);
            return;
        }

        if (selectedIndex === 1) {
            notifyNotImplemented(player, "MULTIPLAYER");
            showHubMenu(player);
            return;
        }

        if (selectedIndex === 2) {
            showOptionsMenu(player, "GAME");
            return;
        }

        if (selectedIndex === 3) {
            notifyNotImplemented(player, "ACHIEVEMENTS");
            showHubMenu(player);
            return;
        }

        if (selectedIndex === 4) {
            notifyNotImplemented(player, "STEAM WORKSHOP");
            showHubMenu(player);
            return;
        }

        if (selectedIndex >= 5 && selectedIndex <= 8) {
            setSelectedChapterIndex(player, selectedIndex - 5);
            showCampaignMenu(player);
            return;
        }

        if (selectedIndex === 9) {
            showHubMenu(player);
            return;
        }

        if (selectedIndex === 10) {
            handleStartGame(player);
            return;
        }

        if (selectedIndex === 11) {
            notifyNotImplemented(player, "LOAD GAME");
            showCampaignMenu(player);
            return;
        }

        if (selectedIndex === 12) {
            notifyNotImplemented(player, "SAVE GAME");
            showCampaignMenu(player);
            return;
        }

        if (selectedIndex === 13) {
            showCampaignMenu(player);
        }
    }).catch((error) => {
        sendUiFailure(player, "campaign menu", error);
    });
}

export function processBlackMesaMenuRequests() {
    for (const player of world.getPlayers()) {
        if (!isPlayerValid(player)) continue;

        let shouldOpenMenu = false;
        try {
            shouldOpenMenu = player.hasTag(OPEN_MENU_TAG);
        } catch {
            shouldOpenMenu = false;
        }

        if (!shouldOpenMenu) continue;

        try {
            player.removeTag(OPEN_MENU_TAG);
        } catch { }

        queueInitialMenuOpen(player);
    }
}

export function openBlackMesaMenuForPlayer(player) {
    if (!isPlayerValid(player)) return;
    showHubMenu(player);
}
