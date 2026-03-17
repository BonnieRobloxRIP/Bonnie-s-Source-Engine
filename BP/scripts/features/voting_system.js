import { system, world } from "@minecraft/server";

const PLAYER_VOTE_PROPERTY = "brr:map_vote";
const WINNER_PROPERTY = "brr:vote_winner";

const SKYBLOCK_ITEM_IDS = new Set(["brr:sk_vote_skyblock"]);
const STONEYHAVEN_ITEM_IDS = new Set(["brr:sk_vote_stoneyhaven", "brr:sk_vote_stoneyhave"]);

const VOTE_VALUES = {
	skyblock: "skyblock",
	stoneyhaven: "stoneyhaven",
};

const RESOLVE_EVENT_IDS = new Set([
	"brr:resolve_map_vote",
	"brr:map_vote_resolve",
	"brr:voting_resolve",
	"brr:vote_winner",
]);

function setPlayerVote(player, voteValue) {
	try {
		player.setDynamicProperty(PLAYER_VOTE_PROPERTY, voteValue);
		player.addTag("voted");
	} catch {
		player.sendMessage("§cCould not save your vote.");
		return false;
	}

	return true;
}

function clearAllVotes(players) {
	for (const player of players) {
		try {
			player.setDynamicProperty(PLAYER_VOTE_PROPERTY, undefined);
		} catch {
		}
	}
}

function setWinningMapScore(winner) {
	const mapScore = winner === VOTE_VALUES.skyblock ? 1 : 2;

	try {
		world.getDimension("overworld").runCommand(`scoreboard players set map game ${mapScore}`);
		return true;
	} catch {
		return false;
	}
}

function resolveMapVote() {
	const players = world.getAllPlayers();
	let skyblockVotes = 0;
	let stoneyhavenVotes = 0;

	for (const player of players) {
		if (player.hasTag("stop")) continue;

		let vote;
		try {
			vote = player.getDynamicProperty(PLAYER_VOTE_PROPERTY);
		} catch {
			vote = undefined;
		}

		if (vote === VOTE_VALUES.skyblock) skyblockVotes += 1;
		else if (vote === VOTE_VALUES.stoneyhaven) stoneyhavenVotes += 1;
	}

	let winner = VOTE_VALUES.skyblock;
	if (stoneyhavenVotes > skyblockVotes) winner = VOTE_VALUES.stoneyhaven;
	else if (stoneyhavenVotes === skyblockVotes) {
		winner = Math.random() < 0.5 ? VOTE_VALUES.skyblock : VOTE_VALUES.stoneyhaven;
	}

	try {
		world.setDynamicProperty(WINNER_PROPERTY, winner);
	} catch {
	}

	setWinningMapScore(winner);

	clearAllVotes(players);
	world.sendMessage(`§fWinner: §b§l${winner} §7(Skyblock: ${skyblockVotes}, Stoneyhaven: ${stoneyhavenVotes})`);

	return winner;
}

world.afterEvents.itemUse.subscribe((event) => {
	const player = event.source;
	if (!player || player.typeId !== "minecraft:player") return;

	const itemTypeId = event.itemStack?.typeId;
	if (!itemTypeId) return;

	if (SKYBLOCK_ITEM_IDS.has(itemTypeId)) {
		if (setPlayerVote(player, VOTE_VALUES.skyblock)) {
			player.sendMessage("§aVoted for §b§lSkyblock");
		}
		return;
	}

	if (STONEYHAVEN_ITEM_IDS.has(itemTypeId)) {
		if (setPlayerVote(player, VOTE_VALUES.stoneyhaven)) {
			player.sendMessage("§aVoted for §7§lStoney Haven");
		}
	}
});

system.afterEvents.scriptEventReceive.subscribe((event) => {
	if (!RESOLVE_EVENT_IDS.has(event.id)) return;

	const winner = resolveMapVote();
	if (event.sourceEntity?.typeId === "minecraft:player") {
		event.sourceEntity.sendMessage(`§aMap vote resolved: §f§l${winner}`);
	}
});
