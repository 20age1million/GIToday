// ls repos
// ls branches [repo]
// ls people <repo>

import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageFlags,
    ChannelType
} from "discord.js";

import { scheduler } from "../../scheduler/index.js";
import { getConfig } from "../../scheduler/storage-json.js";

export const data = new SlashCommandBuilder()
    .setName("schedule")
    .setDescription("schedule set/show")
    
    .addSubcommand((sub) => 
        sub
            .setName("show")
            .setDescription("List config")
    )

    .addSubcommand((sub) => 
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

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "❌ This command must be used in a server (guild).",
      ephemeral: true,
    });
    return;
  }

  const guildId = interaction.guildId;
  const sub = interaction.options.getSubcommand();

  if (sub === "show") {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      const cfg = await getConfig(guildId);
      if (!cfg) {
        await interaction.editReply(
          "No schedule configured yet. Use `/schedule set` to configure time, timezone, channel, and enabled."
        );
        return;
      }
      const enabled = cfg.enabled ? "true" : "false";
      const time = cfg.time ?? "(unset)";
      const tz = cfg.timeZone ?? "(unset)";
      const channel = cfg.channelId ? `<#${cfg.channelId}>` : "(unset)";

      await interaction.editReply(
        `Current schedule:\n• enabled: \`${enabled}\`\n• time: \`${time}\`\n• timezone: \`${tz}\`\n• channel: ${channel}`
      );
    } catch (err) {
      console.error(`[schedule show] guild=${guildId}`, err);
      await interaction.editReply("❌ Failed to read schedule config.");
    }
    return;
  }

  if (sub === "set") {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const optTime = interaction.options.getString("time");
    const optTZ = interaction.options.getString("timezone");
    const optChannel = interaction.options.getChannel("channel");
    const optEnabled = interaction.options.getBoolean("enabled");

    const changes: string[] = [];

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
      console.error(`[schedule set] guild=${guildId}`, err);
      await interaction.editReply(
        "❌ Failed to update schedule. Please ensure your inputs are valid."
      );
    }
    return;
  }

  // Unknown subcommand fallback
  await interaction.reply({ content: "Unknown subcommand.", ephemeral: true });
}
