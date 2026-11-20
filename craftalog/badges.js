import { system, world } from "@minecraft/server";
import { Platform } from "@bloxxed/sdk";

const BADGE_TRIGGERS = [
	{ triggerTag: "craftalog_badge_easy_win", badgeKey: "mode_easy_win" },
	{ triggerTag: "craftalog_badge_medium_win", badgeKey: "mode_medium_win" },
	{ triggerTag: "craftalog_badge_hard_win", badgeKey: "mode_hard_win" },
];

async function awardBadge(player, triggerTag, badgeKey) {
	player.removeTag(triggerTag);

	try {
		await Platform.badges.award(player, badgeKey);
	} catch (error) {
		console.warn(`[Flood Escape] Failed to award Craftalog badge ${badgeKey} to ${player.name}: ${error}`);
	}
}

export function registerCraftalogBadgeSystems() {
	system.runInterval(() => {
		for (const { triggerTag, badgeKey } of BADGE_TRIGGERS) {
			for (const player of world.getPlayers({ tags: [triggerTag] })) {
				awardBadge(player, triggerTag, badgeKey);
			}
		}
	});
}