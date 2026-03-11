const DEFAULT_EMOTE_CONFIG = {
	sounds: [],
	animationLoopTicks: 1,
	soundLoopTicks: 0,
	canMove: false,
	partnerEmote: false,
	partnerCount: 1,
};

export const emoteDefinitions = [
	{
		command: "afterbody",
		tag: "emote_afterbody",
		animation: "animation.npc.steve.afterbody",
		sounds: ["emote.afterbody", "emote.afterbody_block"],
		animationLoopTicks: 172,
		soundLoopTicks: 394,
		canMove: false,
		partnerEmote: true
	},
	{
		command: "shika",
		tag: "emote_shika",
		animation: "animation.npc.steve.shika",
		sounds: ["emote.shika", "emote.shika_block"],
		animationLoopTicks: 50,
		soundLoopTicks: 208,
		canMove: true,
		partnerEmote: true
	},
	{
		command: "tpose",
		tag: "emote_tpose",
		animation: "animation.npc.steve.tpose",
		sounds: ["emote.tpose_move"],
		soundLoopTicks: 30,
		canMove: true,
	},
	{
		command: "number",
		tag: "emote_number",
		animation: "animation.npc.steve.number",
		sounds: ["emote.number", "emote.number_block"],
		animationLoopTicks: 60,
		soundLoopTicks: 474,
		partnerEmote: true
	},
	{
		command: "get_down",
		tag: "emote_getdown",
		animation: "animation.npc.steve.getdown",
		sounds: ["emote.getdown", "emote.getdown_block"],
		animationLoopTicks: 720,
		soundLoopTicks: 720,
		partnerEmote: true
	},
	{
		command: "otsukare_summer",
		tag: "emote_otsukare_summer",
		animation: "animation.npc.steve.otsukare_summer",
		sounds: ["emote.otsukare_summer", "emote.otsukare_summer_block"],
		animationLoopTicks: 80,
		soundLoopTicks: 824,
		canMove: false,
		partnerEmote: true
	},
	{
		command: "ai_dua_em_ve",
		tag: "emote_aiduaemve",
		animation: "animation.npc.steve.aiduaemve",
		sounds: ["emote.aiduaemve", "emote.aiduaemve_block"],
		animationLoopTicks: 18,
		soundLoopTicks: 326,
		partnerEmote: true,
	},
];

export const emoteConfigByCommand = Object.fromEntries(
	emoteDefinitions.map(({ command, ...config }) => [command, { ...DEFAULT_EMOTE_CONFIG, ...config }])
);

export const emoteConfigByTag = new Map(
	Object.values(emoteConfigByCommand).map((config) => [config.tag, config])
);

export const emoteCommandsList = emoteDefinitions.map((entry) => entry.command);