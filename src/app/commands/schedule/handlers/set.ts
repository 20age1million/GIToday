import type { SubCommand } from "shared/types/command.js"
import { ChannelType } from "discord.js";
import { SlashCommandSubcommandBuilder} from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import { scheduler } from "app/scheduler/scheduler.js";
import { Logger } from "infrastructure/log/log.js";

const data = ((sub: SlashCommandSubcommandBuilder) => 
    sub
        .setName("set")
        .setDescription("Set the config")
        .addStringOption((opt) =>
            opt 
                .setName("time")
                .setDescription("Time of day in HH:mm (24h)")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('timezone')
                .setDescription('IANA timezone name (e.g. America/Toronto)')
                .setRequired(false)
        )
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Text channel where the bot will send scheduled message')
                .addChannelTypes(ChannelType.GuildText)  // 或其他你允许的类型
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('enabled')
                .setDescription('Whether scheduling is enabled (default false)')
                .setRequired(false)
        )
);

async function execute(interaction: ChatInputCommandInteraction) {

    const optTime = interaction.options.getString("time");
    const optTZ = interaction.options.getString("timezone");
    const optChannel = interaction.options.getChannel("channel");
    const optEnabled = interaction.options.getBoolean("enabled");

    const changes: string[] = [];

    const guildId = interaction.guildId!;

    try {
      if (optTime !== null) {
        // Quick HH:mm validation; scheduler.setTime 里也可再次校验
        const ok = /^\d{2}:\d{2}$/.test(optTime);
        if (!ok) {
          await interaction.editReply("⚠️ Invalid time format. Use HH:mm (24h), e.g. 08:00");
          return;
        }
        await scheduler.setTime(guildId, optTime);
        changes.push(`time = \`${optTime}\``);
      }

      if (optTZ !== null) {
        const ok = Intl.supportedValuesOf("timeZone").includes(optTZ);
        if (!ok) {
            await interaction.editReply("⚠️ Invalid time zone");
            return;
        }
        await scheduler.setTimeZone(guildId, optTZ);
        changes.push(`timezone = \`${optTZ}\``);
      }

      if (optChannel !== null) {
        if (optChannel.type !== ChannelType.GuildText) {
          await interaction.editReply("⚠️ Channel must be a text channel.");
          return;
        }
        await scheduler.setChannelID(guildId, optChannel.id);
        await scheduler.ensureJob(guildId);
        changes.push(`channel = <#${optChannel.id}>`);
      }

      if (optEnabled !== null) {
        await scheduler.setEnabled(guildId, optEnabled);
        changes.push(`enabled = \`${optEnabled}\``);
      }

      if (changes.length === 0) {
        await interaction.editReply(
          "No options provided. Provide at least one of `time`, `timezone`, `channel`, or `enabled`."
        );
      } else {
        await interaction.editReply(`✅ Schedule updated: ${changes.join(", ")}`);
      }
    } catch (err) {
      Logger.error(`schedule set`, `guild=${guildId}, err= ${err}`);
      await interaction.editReply(
        "❌ Failed to update schedule. Please ensure your inputs are valid."
      );
    }
    return;
}

export const command: SubCommand = { data, execute };