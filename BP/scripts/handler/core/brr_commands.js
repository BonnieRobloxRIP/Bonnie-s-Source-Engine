import * as mc from "@minecraft/server";

// SECTION: Command Types
const CommandPermissionLevel = mc.CommandPermissionLevel;
const CustomCommandParamType = mc.CustomCommandParamType;

// SECTION: Formatting Helpers
function joinTextParts(parts) {
    return (parts ?? [])
        .map((part) => `${part ?? ""}`.trim())
        .filter((part) => part.length > 0)
        .join(" ");
}

function formatSeconds(seconds) {
    return seconds
        .toFixed(3)
        .replace(/\.0+$/, "")
        .replace(/(\.\d*?)0+$/, "$1");
}

function resolveBoolean(parseBooleanLike, value) {
    if (typeof parseBooleanLike === "function") {
        return parseBooleanLike(value, undefined);
    }

    const normalized = `${value ?? ""}`.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
    return undefined;
}

// SECTION: Command Registration Helpers
function registerCommandAliases(registry, baseConfig, callback, names) {
    for (const name of names) {
        try {
            registry.registerCommand(
                {
                    ...baseConfig,
                    name
                },
                callback
            );
        } catch {
            // Ignore duplicate or unavailable aliases.
        }
    }
}

// SECTION: Public API
export function registerBrrCommands(data, api = {}) {
    const registry = data?.customCommandRegistry;
    if (!registry || !CommandPermissionLevel || !CustomCommandParamType) {
        return;
    }

    const {
        emojiCommand,
        parseBooleanLike,
        adventureCommandToKey,
        setEngineBlocksAlwaysVisible,
        setToolsEnabled,
        setAdventurePermission,
        setHideUsernames,
        setRandomizeUsernames,
        setChatCooldownSeconds,
        setDynamicLightsEnabled,
        setChatSpamBlockedMessage,
        executeAntiBotClearCommand,
        executeAntiBotRearmCommand,
        versionText = "§aBonnie's Source Engine v1.0.35"
    } = api;

    if (typeof emojiCommand === "function") {
        emojiCommand(data);
    }

    const brrHandler = (origin, subcommandRaw, arg1) => {
        const sender = origin?.sourceEntity;
        if (!sender) return;

        const subcommand = `${subcommandRaw ?? ""}`.trim();
        const parsedBoolean = resolveBoolean(parseBooleanLike, arg1);

        if (subcommand === "engine_blocks_always_visible") {
            if (parsedBoolean === undefined) {
                sender.sendMessage("§cInvalid value. Use true/false for engine_blocks_always_visible.");
                return;
            }

            const nextValue = typeof setEngineBlocksAlwaysVisible === "function"
                ? setEngineBlocksAlwaysVisible(parsedBoolean)
                : parsedBoolean;

            sender.sendMessage(`Toggled tool blocks visibility to ${nextValue}`);
            return;
        }

        if (subcommand === "tools_enabled") {
            if (parsedBoolean === undefined) {
                sender.sendMessage("§cInvalid value. Use true/false for tools_enabled.");
                return;
            }

            const nextValue = typeof setToolsEnabled === "function"
                ? setToolsEnabled(parsedBoolean)
                : parsedBoolean;

            sender.sendMessage(`Toggled tools to ${nextValue}`);
            return;
        }

        const adventurePermissionKey = adventureCommandToKey?.[subcommand];
        if (adventurePermissionKey) {
            if (parsedBoolean === undefined) {
                sender.sendMessage(`§cInvalid value. Use true/false for ${subcommand}.`);
                return;
            }

            if (typeof setAdventurePermission === "function") {
                setAdventurePermission(adventurePermissionKey, parsedBoolean);
            }

            if (adventurePermissionKey === "canUseAll") {
                sender.sendMessage(`Set all adventure interaction permissions to ${parsedBoolean}.`);
                return;
            }

            sender.sendMessage(`Set ${subcommand} to ${parsedBoolean}.`);
            return;
        }

        if (subcommand === "hide_usernames") {
            if (parsedBoolean === undefined) {
                sender.sendMessage("§cInvalid value. Use true/false for hide_usernames.");
                return;
            }

            if (typeof setHideUsernames === "function") {
                setHideUsernames(parsedBoolean);
            }

            sender.sendMessage(`§aHide usernames is now ${parsedBoolean}.`);
            return;
        }

        if (subcommand === "randomize_usernames") {
            if (parsedBoolean === undefined) {
                sender.sendMessage("§cInvalid value. Use true/false for randomize_usernames.");
                return;
            }

            if (typeof setRandomizeUsernames === "function") {
                setRandomizeUsernames(parsedBoolean);
            }

            sender.sendMessage(`§aRandomize usernames is now ${parsedBoolean}.`);
            return;
        }

        if (subcommand === "dynamic_lights") {
            if (parsedBoolean === undefined) {
                sender.sendMessage("§cInvalid value. Use true/false for dynamic_lights.");
                return;
            }

            const nextEnabled = typeof setDynamicLightsEnabled === "function"
                ? setDynamicLightsEnabled(parsedBoolean)
                : parsedBoolean;

            sender.sendMessage(`§aDynamic lights are now ${nextEnabled}.`);
        }
    };

    const allCmds = [
        "engine_blocks_always_visible",
        "tools_enabled",
        ...Object.keys(adventureCommandToKey ?? {}),
        "hide_usernames",
        "randomize_usernames",
        "dynamic_lights"
    ].sort((a, b) => a.localeCompare(b));

    let mandatoryParameters = [
        { name: "subcommand", type: CustomCommandParamType.String }
    ];

    let booleanValueParameter = {
        name: "value",
        type: CustomCommandParamType.String
    };

    const nativeBooleanParamType = CustomCommandParamType.Boolean ?? CustomCommandParamType.Bool;
    if (nativeBooleanParamType) {
        booleanValueParameter = {
            name: "value",
            type: nativeBooleanParamType
        };
    } else if (CustomCommandParamType.Enum) {
        try {
            registry.registerEnum("brr:boolean_values", ["true", "false"]);
        } catch {
            // Ignore duplicate enum registration.
        }

        booleanValueParameter = {
            name: "brr:boolean_values",
            type: CustomCommandParamType.Enum
        };
    }

    try {
        registry.registerEnum("brr:cmds", allCmds);
        mandatoryParameters = [
            { name: "brr:cmds", type: CustomCommandParamType.Enum }
        ];
    } catch {
        // Enum registration can fail on duplicate names.
    }

    const brrCommandSchema = {
        description: "Bonnie's Source Engine Settings",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [
            ...mandatoryParameters,
            booleanValueParameter
        ],
        optionalParameters: []
    };

    registerCommandAliases(registry, brrCommandSchema, brrHandler, ["brr", "brr:brr"]);

    registerCommandAliases(
        registry,
        {
            description: "Set chat cooldown in seconds",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            mandatoryParameters: [
                { name: "seconds", type: CustomCommandParamType.String }
            ],
            optionalParameters: []
        },
        (origin, secondsRaw) => {
            const sender = origin?.sourceEntity;
            if (!sender || typeof setChatCooldownSeconds !== "function") return;

            const appliedSeconds = setChatCooldownSeconds(secondsRaw);
            if (appliedSeconds === undefined) {
                sender.sendMessage("§cInvalid value. Use a number >= 0 (examples: 0, 0.1, 1).");
                return;
            }

            sender.sendMessage(`§aChat cooldown set to ${formatSeconds(appliedSeconds)} second(s).`);
        },
        ["adjust_chat_cooldown", "brr:adjust_chat_cooldown"]
    );

    registerCommandAliases(
        registry,
        {
            description: "Set anti-spam blocked message",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            mandatoryParameters: [
                { name: "arg1", type: CustomCommandParamType.String }
            ],
            optionalParameters: [
                { name: "arg2", type: CustomCommandParamType.String },
                { name: "arg3", type: CustomCommandParamType.String },
                { name: "arg4", type: CustomCommandParamType.String }
            ]
        },
        (origin, arg1, arg2, arg3, arg4) => {
            const sender = origin?.sourceEntity;
            if (!sender || typeof setChatSpamBlockedMessage !== "function") return;

            const nextMessage = joinTextParts([arg1, arg2, arg3, arg4]);
            if (!nextMessage) {
                sender.sendMessage("§cUsage: /set_spam_message <text>");
                return;
            }

            const appliedMessage = setChatSpamBlockedMessage(nextMessage);
            sender.sendMessage(`§aSpam blocked message updated to: ${appliedMessage}`);
        },
        ["set_spam_message", "brr:set_spam_message"]
    );

    registerCommandAliases(
        registry,
        {
            description: "Reset anti-spam blocked message",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            mandatoryParameters: [],
            optionalParameters: []
        },
        (origin) => {
            const sender = origin?.sourceEntity;
            if (!sender || typeof setChatSpamBlockedMessage !== "function") return;

            const appliedMessage = setChatSpamBlockedMessage(undefined);
            sender.sendMessage(`§aSpam blocked message reset to: ${appliedMessage}`);
        },
        ["reset_spam_message", "brr:reset_spam_message"]
    );

    registerCommandAliases(
        registry,
        {
            description: "Show pack version",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            mandatoryParameters: [],
            optionalParameters: []
        },
        (origin) => {
            const sender = origin?.sourceEntity;
            if (!sender) return;

            sender.sendMessage(versionText);
        },
        ["version", "brr:version"]
    );

    registerCommandAliases(
        registry,
        {
            description: "Clear anti-bot flags",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            mandatoryParameters: [],
            optionalParameters: [
                { name: "target", type: CustomCommandParamType.String }
            ]
        },
        (origin, target) => {
            const sender = origin?.sourceEntity;
            if (!sender || typeof executeAntiBotClearCommand !== "function") return;

            executeAntiBotClearCommand(sender, target);
        },
        ["antibot_clear", "brr:antibot_clear"]
    );

    registerCommandAliases(
        registry,
        {
            description: "Rearm anti-bot checks",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            mandatoryParameters: [],
            optionalParameters: [
                { name: "target", type: CustomCommandParamType.String }
            ]
        },
        (origin, target) => {
            const sender = origin?.sourceEntity;
            if (!sender || typeof executeAntiBotRearmCommand !== "function") return;

            executeAntiBotRearmCommand(sender, target);
        },
        ["antibot_rearm", "brr:antibot_rearm"]
    );
}