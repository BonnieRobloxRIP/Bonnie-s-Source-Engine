import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const OPEN_MENU_TAG = "brr_open_black_mesa_menu";
const SELECTED_CHAPTER_PROPERTY = "brr_bm_selected_chapter";

const HUB_TITLE = "BM_MAIN::HUB";
const CAMPAIGN_TITLE_PREFIX = "BM_MAIN::CAMPAIGN::";

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

function notifyNotImplemented(player, tabName) {
    try {
        player.sendMessage(`§7[BM Menu] §f${tabName} is planned but not wired yet.`);
    } catch { }
}

function handleStartGame(player) {
    const selectedChapter = CHAPTERS[getSelectedChapterIndex(player)] ?? CHAPTERS[0];

    try {
        player.sendMessage(`§6[BM Menu] §fSTART GAME selected for §e${selectedChapter}§f.`);
        player.sendMessage("§7Hook your chapter boot logic inside handler/ui/black_mesa_menu.js -> handleStartGame().");
    } catch { }
}

function showHubMenu(player) {
    if (!isPlayerValid(player)) return;

    const form = new ActionFormData()
        .title(HUB_TITLE)
        .body("ANOMALOUS MATERIALS\nSaturday, March 14 2026 1:42:03")
        .button(TOP_TABS[0])
        .button(TOP_TABS[1])
        .button(TOP_TABS[2])
        .button(TOP_TABS[3])
        .button(TOP_TABS[4])
        .button("RESUME")
        .button("QUIT");

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
                notifyNotImplemented(player, "OPTIONS");
                showHubMenu(player);
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
                try {
                    player.sendMessage("§a[BM Menu] Resume selected.");
                } catch { }
                return;
            case 6:
                try {
                    player.sendMessage("§c[BM Menu] Quit selected.");
                } catch { }
                return;
            default:
                return;
        }
    }).catch((error) => {
        sendUiFailure(player, "hub menu", error);
    });
}

function showCampaignMenu(player) {
    if (!isPlayerValid(player)) return;

    const selectedChapterIndex = getSelectedChapterIndex(player);
    const selectedChapter = CHAPTERS[selectedChapterIndex] ?? CHAPTERS[0];

    const form = new ActionFormData()
        .title(getCampaignTitle(player))
        .body(`SELECTED CHAPTER: ${selectedChapter}\nPick a chapter card, then press START GAME.`)
        .button(TOP_TABS[0])
        .button(TOP_TABS[1])
        .button(TOP_TABS[2])
        .button(TOP_TABS[3])
        .button(TOP_TABS[4])
        .button(CHAPTERS[0])
        .button(CHAPTERS[1])
        .button(CHAPTERS[2])
        .button(CHAPTERS[3])
        .button("BACK")
        .button("START GAME");

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
            notifyNotImplemented(player, "OPTIONS");
            showHubMenu(player);
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
