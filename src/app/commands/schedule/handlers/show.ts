import type { SubCommand } from "shared/types/command.js"
import { SlashCommandSubcommandBuilder} from "discord.js";
import { ChatInputCommandInteraction } from "discord.js";
import { Tasks } from "infrastructure/db/tasks.js";
import { Logger } from "infrastructure/log/log.js";

const data = ((sub: SlashCommandSubcommandBuilder) => 
    sub
        .setName("show")
        .setDescription("List config")
);


async function execute(interaction: ChatInputCommandInteraction){
    const guildId = interaction.guildId!

    try {
      const cfg = await Tasks.get(guildId); // must be guildID since tested in index.ts
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
      Logger.error(`[schedule show]`, `guild=${guildId}, error=${err}`);
      await interaction.editReply("❌ Failed to read schedule config.");
    }
    return; 
}


export const command: SubCommand = { data, execute };