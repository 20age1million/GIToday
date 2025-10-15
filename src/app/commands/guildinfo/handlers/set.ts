import type { SubCommand } from "shared/types/command.js"
import { ChannelType } from "discord.js";
import { SlashCommandSubcommandBuilder} from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import { scheduler } from "app/scheduler/scheduler.js";
import { Logger } from "infrastructure/log/log.js";
import { GuildInfo } from "infrastructure/db/guildInfo.js";

const data = ((sub: SlashCommandSubcommandBuilder) => 
    sub
        .setName("set")
        .setDescription("Set the config")
        .addStringOption((opt) =>
            opt 
                .setName("platform")
                .setDescription("Git platform, e.g. GitHub")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('auth-method')
                .setDescription('Authentication method, e.g. default, app or PAT')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('key')
                .setDescription('Authentication key, e.g. app id/private key or PAT (no need to set if authMethod is default)')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('org')
                .setDescription('Git organization name')
                .setRequired(false)
        )
);

async function execute(interaction: ChatInputCommandInteraction) {

    const optPlatform = interaction.options.getString("platform");
    const optAuthMethod = interaction.options.getString("auth-method");
    const optKey = interaction.options.getString("key");
    const optOrg = interaction.options.getString("org");

    const guildId = interaction.guildId!;

    const change: Record<string, string> = {};

    if (optPlatform) {
        change["platform"] = optPlatform;
    }
    if (optAuthMethod) {
        change["authMethod"] = optAuthMethod;
    }
    if (optKey) {
        change["key"] = optKey;
    }
    if (optOrg) {
        change["org"] = optOrg;
    }

    GuildInfo.setGitInfo(guildId, change);

    await interaction.editReply("Config updated.");
}

export const command: SubCommand = { data, execute };