import { CommandPermissionLevel, CustomCommandParamType, system, world } from "@minecraft/server";
import { emoteCommandsList, emoteConfigByCommand, emoteConfigByTag } from "../config/emotes.js";
import { getPlayerById, getPlayerTags, isEntityValid, runPlayerCommand } from "../core/entity_utils.js";

const lastKnownPlayerPositions = new Map();
const emoteHasActivePlayers = new Map();
const emoteLastSoundTickByTag = new Map();
const emoteRuntimeByTag = new Map();
const emoteMovementGraceUntilTickByPlayerId = new Map();
const emotePartnerGroupByLeaderId = new Map();
const emoteLeaderByMemberId = new Map();
let currentTick = 0;
const EMOTE_TAG_PREFIX = "emote_";
const NO_EMOTE_ANIMATION = "animation.npc.steve.noemote";
const EMOTE_LOOP_BUFFER_TICKS = 2;
const EMOTE_START_GRACE_TICKS = 2;
const EMOTE_PARTNER_INTERACT_COOLDOWN_TICKS = 2;

const emotePartnerJoinAttemptCooldownByPair = new Map();

for (const emoteConfig of Object.values(emoteConfigByCommand)) {
	emoteHasActivePlayers.set(emoteConfig.tag, false);
}

function getActiveEmoteTag(player) {
	if (!isEntityValid(player)) return undefined;
	return findFirstEmoteTag(getPlayerTags(player));
}

function findFirstEmoteTag(tags) {
	for (const tag of tags) {
		if (tag.startsWith(EMOTE_TAG_PREFIX)) {
			return tag;
		}
	}

	return undefined;
}

function getAllEmoteTags(tags) {
	return tags.filter((tag) => tag.startsWith(EMOTE_TAG_PREFIX));
}

function stopEmoteSound(player, emoteTag) {
	const emoteConfig = emoteConfigByTag.get(emoteTag);
	if (!emoteConfig || emoteConfig.sounds.length === 0) return;

	for (const sound of emoteConfig.sounds) {
		runPlayerCommand(player, `stopsound @s ${sound}`);
	}
}

function stopBlockSoundsForEveryone(emoteTag) {
	const emoteConfig = emoteConfigByTag.get(emoteTag);
	if (!emoteConfig || emoteConfig.sounds.length === 0) return;

	const blockSounds = emoteConfig.sounds.filter((sound) => sound.endsWith("_block"));
	for (const sound of blockSounds) {
		world.getDimension("overworld").runCommand(`stopsound @a ${sound}`);
	}
}

function playEmoteAnimation(player, emoteTag) {
	const emoteConfig = emoteConfigByTag.get(emoteTag);
	if (!emoteConfig) return;

	runPlayerCommand(player, `playanimation @s ${emoteConfig.animation}`);
}

function playEmoteSound(player, emoteTag, playNearbySound = true) {
	const emoteConfig = emoteConfigByTag.get(emoteTag);
	if (!emoteConfig) return;

	const playerTags = getPlayerTags(player);
	const isEmoteSoundMuted = playerTags.includes("stop_emote_sound");

	if (emoteConfig.sounds.length > 0) {
		const [selfSound, nearbySound] = emoteConfig.sounds;
		if (selfSound && !isEmoteSoundMuted) {
			runPlayerCommand(player, `playsound ${selfSound} @s`);
		}
		if (nearbySound && playNearbySound) {
			const sourceTag = "emote_sound_source";

			if (!isEntityValid(player)) {
				return;
			}

			let sourceTagged = false;
			try {
				player.addTag(sourceTag);
				sourceTagged = true;
			} catch {
				sourceTagged = false;
			}

			runPlayerCommand(player, `playsound ${nearbySound} @a[r=20, tag=!${sourceTag}, tag=!stop_emote_sound] ~ ~ ~`);

			if (sourceTagged && isEntityValid(player)) {
				try {
					player.removeTag(sourceTag);
				} catch {
				}
			}
		}
	}
}

function canPlayEmoteSoundThisTick(emoteTag) {
	const lastSoundTick = emoteLastSoundTickByTag.get(emoteTag);
	if (lastSoundTick === currentTick) {
		return false;
	}

	emoteLastSoundTickByTag.set(emoteTag, currentTick);
	return true;
}

function clearEmoteTagsFromPlayer(player) {
	const emoteTags = getAllEmoteTags(getPlayerTags(player));

	for (const tag of emoteTags) {
		stopEmoteSound(player, tag);
		if (isEntityValid(player)) {
			try {
				player.removeTag(tag);
			} catch {
				break;
			}
		}
	}

	emoteMovementGraceUntilTickByPlayerId.delete(player.id);
}

function setMovementGraceTicks(playerId, graceTicks) {
	emoteMovementGraceUntilTickByPlayerId.set(playerId, currentTick + graceTicks);
}

function disbandEmoteGroup(leaderId, stopMembers = false) {
	const group = emotePartnerGroupByLeaderId.get(leaderId);
	if (!group) {
		emoteLeaderByMemberId.delete(leaderId);
		return;
	}

	emotePartnerGroupByLeaderId.delete(leaderId);

	for (const memberId of group.memberIds) {
		emoteLeaderByMemberId.delete(memberId);

		if (!stopMembers) continue;

		const member = getPlayerById(memberId);
		if (member) {
			clearEmoteTagsFromPlayer(member);
			runPlayerCommand(member, `playanimation @s ${NO_EMOTE_ANIMATION}`);
		}
	}
}

function removePlayerIdFromEmoteGroup(playerId) {
	const leaderId = emoteLeaderByMemberId.get(playerId);
	if (!leaderId) return;

	const group = emotePartnerGroupByLeaderId.get(leaderId);
	if (!group) {
		emoteLeaderByMemberId.delete(playerId);
		return;
	}

	if (leaderId === playerId) {
		disbandEmoteGroup(leaderId, true);
		return;
	}

	group.memberIds = group.memberIds.filter((memberId) => memberId !== playerId);
	emoteLeaderByMemberId.delete(playerId);

	if (group.memberIds.length === 0) {
		emotePartnerGroupByLeaderId.delete(leaderId);
		return;
	}

	emotePartnerGroupByLeaderId.set(leaderId, group);
}

function stopAllEmotes(player) {
	if (!isEntityValid(player)) return;

	const leaderId = emoteLeaderByMemberId.get(player.id);
	if (leaderId) {
		const group = emotePartnerGroupByLeaderId.get(leaderId);
		if (group && leaderId === player.id) {
			disbandEmoteGroup(leaderId, true);
			return;
		}

		if (group) {
			group.memberIds = group.memberIds.filter((memberId) => memberId !== player.id);
			if (group.memberIds.length === 0) {
				emotePartnerGroupByLeaderId.delete(leaderId);
			} else {
				emotePartnerGroupByLeaderId.set(leaderId, group);
			}
		}

		emoteLeaderByMemberId.delete(player.id);
	}

	clearEmoteTagsFromPlayer(player);
}

function startEmoteByTag(player, emoteTag) {
	if (!isEntityValid(player)) return false;

	const emoteConfig = emoteConfigByTag.get(emoteTag);
	if (!emoteConfig) return false;

	stopAllEmotes(player);

	try {
		player.addTag(emoteTag);
	} catch {
		return false;
	}
	setMovementGraceTicks(player.id, EMOTE_START_GRACE_TICKS);
	playEmoteAnimation(player, emoteTag);
	playEmoteSound(player, emoteTag, false);

	emotePartnerGroupByLeaderId.set(player.id, {
		emoteTag,
		memberIds: [player.id],
	});
	emoteLeaderByMemberId.set(player.id, player.id);
	return true;
}

function startEmote(player, commandName) {
	const emoteConfig = emoteConfigByCommand[commandName];
	if (!emoteConfig) return;
	startEmoteByTag(player, emoteConfig.tag);
}

function tryJoinPartnerEmote(joiningPlayer, targetPlayer) {
	if (!isEntityValid(joiningPlayer) || !isEntityValid(targetPlayer)) return false;
	if (joiningPlayer.id === targetPlayer.id) return false;

	const emoteTag = getActiveEmoteTag(targetPlayer);
	if (!emoteTag) return false;

	const emoteConfig = emoteConfigByTag.get(emoteTag);
	if (!emoteConfig || emoteConfig.partnerEmote !== true) return false;

	const leaderId = emoteLeaderByMemberId.get(targetPlayer.id) ?? targetPlayer.id;
	let group = emotePartnerGroupByLeaderId.get(leaderId);

	if (!group || group.emoteTag !== emoteTag) {
		group = { emoteTag, memberIds: [leaderId] };
		emotePartnerGroupByLeaderId.set(leaderId, group);
		emoteLeaderByMemberId.set(leaderId, leaderId);
	}

	if (emoteLeaderByMemberId.get(joiningPlayer.id) === leaderId) return false;

	if (!startEmoteByTag(joiningPlayer, emoteTag)) return false;

	emotePartnerGroupByLeaderId.delete(joiningPlayer.id);

	group = emotePartnerGroupByLeaderId.get(leaderId) ?? { emoteTag, memberIds: [leaderId] };
	group.memberIds.push(joiningPlayer.id);
	emotePartnerGroupByLeaderId.set(leaderId, group);
	emoteLeaderByMemberId.set(joiningPlayer.id, leaderId);
	return true;
}

system.beforeEvents.startup.subscribe((data) => {
	data.customCommandRegistry.registerEnum("brr:emote", emoteCommandsList);
	data.customCommandRegistry.registerCommand(
		{
			name: "brr:emote",
			description: "Dance on them haters",
			permissionLevel: CommandPermissionLevel.Any,
			mandatoryParameters: [
				{ name: "brr:emote", type: CustomCommandParamType.Enum }
			],
		},
		(origin, subcommand) => {
			const sender = origin.sourceEntity;
			if (!sender) return;

			system.run(() => {
				if (!isEntityValid(sender)) return;
				startEmote(sender, subcommand);
			});
		}
	);
});

system.runInterval(() => {
	currentTick++;
	const activeEmoteTagsThisTick = new Set();
	const movedPlayerIdsThisTick = new Set();
	const activePlayerIdsByEmoteTag = new Map();

	for (const player of world.getPlayers()) {
		if (!isEntityValid(player)) {
			continue;
		}

		const activeEmoteTag = getActiveEmoteTag(player);
		if (activeEmoteTag) {
			activeEmoteTagsThisTick.add(activeEmoteTag);
			let activePlayerIds = activePlayerIdsByEmoteTag.get(activeEmoteTag);
			if (!activePlayerIds) {
				activePlayerIds = [];
				activePlayerIdsByEmoteTag.set(activeEmoteTag, activePlayerIds);
			}
			activePlayerIds.push(player.id);
		} else {
			emoteMovementGraceUntilTickByPlayerId.delete(player.id);
		}

		let currentLocation;
		try {
			currentLocation = player.location;
		} catch {
			continue;
		}

		const previousLocation = lastKnownPlayerPositions.get(player.id);

		if (!previousLocation) {
			lastKnownPlayerPositions.set(player.id, {
				x: currentLocation.x,
				y: currentLocation.y,
				z: currentLocation.z,
			});
			continue;
		}

		const hasMoved =
			currentLocation.x !== previousLocation.x ||
			currentLocation.y !== previousLocation.y ||
			currentLocation.z !== previousLocation.z;

		if (hasMoved) {
			movedPlayerIdsThisTick.add(player.id);
		}
		const hasVerticalMovement = currentLocation.y !== previousLocation.y;
		const activeEmoteConfig = activeEmoteTag ? emoteConfigByTag.get(activeEmoteTag) : undefined;
		const graceUntilTick = emoteMovementGraceUntilTickByPlayerId.get(player.id) ?? 0;
		const isWithinMovementGrace = currentTick <= graceUntilTick;
		const shouldStopForMovement =
			Boolean(activeEmoteTag) &&
			!isWithinMovementGrace &&
			(!activeEmoteConfig?.canMove || hasVerticalMovement);

		if (hasMoved && shouldStopForMovement) {
			stopAllEmotes(player);
			runPlayerCommand(player, `playanimation @s ${NO_EMOTE_ANIMATION}`);
		}

		lastKnownPlayerPositions.set(player.id, {
			x: currentLocation.x,
			y: currentLocation.y,
			z: currentLocation.z,
		});
	}

	for (const [emoteTag, hadActivePlayers] of emoteHasActivePlayers.entries()) {
		const hasActivePlayers = activeEmoteTagsThisTick.has(emoteTag);
		if (hadActivePlayers && !hasActivePlayers) {
			stopBlockSoundsForEveryone(emoteTag);
			emoteRuntimeByTag.delete(emoteTag);
		}

		if (hasActivePlayers) {
			const activePlayerIds = activePlayerIdsByEmoteTag.get(emoteTag) ?? [];
			const previousRuntime = emoteRuntimeByTag.get(emoteTag);

			let leaderId = previousRuntime?.leaderId;
			if (!leaderId || !activePlayerIds.includes(leaderId)) {
				leaderId = activePlayerIds[0];
			}

			if (!previousRuntime) {
				emoteRuntimeByTag.set(emoteTag, { leaderId, tick: 1 });
			} else {
				emoteRuntimeByTag.set(emoteTag, { leaderId, tick: previousRuntime.tick + 1 });
			}
		}

		emoteHasActivePlayers.set(emoteTag, hasActivePlayers);
	}

	for (const [emoteTag, activePlayerIds] of activePlayerIdsByEmoteTag.entries()) {
		const emoteConfig = emoteConfigByTag.get(emoteTag);
		const emoteRuntime = emoteRuntimeByTag.get(emoteTag);
		if (!emoteConfig || !emoteRuntime) {
			continue;
		}

		const emoteTick = emoteRuntime.tick;
		const shouldPlayAnimation =
			emoteTick === 1 ||
			(emoteConfig.animationLoopTicks > 0 &&
				emoteTick > emoteConfig.animationLoopTicks + EMOTE_LOOP_BUFFER_TICKS &&
				(emoteTick - 1 - EMOTE_LOOP_BUFFER_TICKS) % emoteConfig.animationLoopTicks === 0);
		const shouldPlaySound =
			emoteConfig.soundLoopTicks > 0 &&
			(emoteTick === 1 || emoteTick % emoteConfig.soundLoopTicks === 0);

		if (!shouldPlayAnimation && !shouldPlaySound) {
			continue;
		}

		for (const playerId of activePlayerIds) {
			const player = getPlayerById(playerId);
			if (!isEntityValid(player)) {
				continue;
			}

			if (shouldPlayAnimation) {
				playEmoteAnimation(player, emoteTag);
			}

			const isTposeEmote = emoteTag === "emote_tpose";
			const shouldPlayTposeMoveSound = !isTposeEmote || movedPlayerIdsThisTick.has(player.id);

			if (shouldPlaySound && shouldPlayTposeMoveSound) {
				playEmoteSound(player, emoteTag, canPlayEmoteSoundThisTick(emoteTag));
			}
		}
	}
}, 1);

world.afterEvents.playerLeave.subscribe((data) => {
	const playerName = data.playerName;
	if (!playerName) return;

	lastKnownPlayerPositions.delete(data.playerId);
	emoteMovementGraceUntilTickByPlayerId.delete(data.playerId);
	removePlayerIdFromEmoteGroup(data.playerId);

	system.run(() => {
		world.getDimension("overworld").runCommand(`scoreboard players reset "${playerName}" music`);
	});
});

function queuePartnerJoinAttempt(joiningPlayer, target) {
	if (!joiningPlayer || !target) return;
	if (joiningPlayer.typeId !== "minecraft:player" || target.typeId !== "minecraft:player") return;
	if (!isEntityValid(joiningPlayer) || !isEntityValid(target)) return;

	const pairKey = `${joiningPlayer.id}->${target.id}`;
	const cooldownUntilTick = emotePartnerJoinAttemptCooldownByPair.get(pairKey) ?? 0;
	if (currentTick <= cooldownUntilTick) return;

	emotePartnerJoinAttemptCooldownByPair.set(pairKey, currentTick + EMOTE_PARTNER_INTERACT_COOLDOWN_TICKS);

	system.run(() => {
		if (!isEntityValid(joiningPlayer) || !isEntityValid(target)) return;
		tryJoinPartnerEmote(joiningPlayer, target);
	});
}

function getInteractionTarget(event) {
	return event?.target ?? event?.targetEntity ?? event?.interactedWith;
}

try {
	world.afterEvents.playerInteractWithEntity.subscribe((event) => {
		queuePartnerJoinAttempt(event.player, getInteractionTarget(event));
	});
} catch {
}

try {
	world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
		queuePartnerJoinAttempt(event.player, getInteractionTarget(event));
	});
} catch {
}