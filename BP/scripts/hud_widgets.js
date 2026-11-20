import { world } from "@minecraft/server";
import { defineWidget } from "./hud.js";

// The widgets everyone always sees: one per mode, read left to right from the top right corner.
// The style picks the background and trophy icon (RP/textures/ui/fe_hud).

function score(player, objectiveId) {
	try {
		return world.scoreboard.getObjective(objectiveId)?.getScore(player) ?? 0;
	} catch {
		return 0;
	}
}

export const WIN_WIDGETS = [
	{ key: "wins_easy", style: "easy", label: "§aEasy Wins", objective: "storage_easy" },
	{ key: "wins_medium", style: "medium", label: "§eMedium Wins", objective: "storage_medium" },
	{ key: "wins_hard", style: "hard", label: "§cHard Wins", objective: "storage_hard" },
	{ key: "wins_extreme", style: "extreme", label: "§dExtreme Wins", objective: "storage_extreme" },
	{ key: "endless_best", style: "endless", label: "§9Endless Best", objective: "storage_endless" },
];

/** The widget text for a score (also used by previews). */
export const winText = (widget, value) => `${widget.label}: ${value}`;

export function registerWinWidgets() {
	WIN_WIDGETS.forEach((widget, order) => {
		defineWidget(widget.key, { order, style: widget.style, text: (player) => winText(widget, score(player, widget.objective)) });
	});
}
