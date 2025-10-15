import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { relativeToWindowISO } from "core/time/time.js";
import { Report } from "core/reports/report.js";
import { Formatter } from "shared/formatters/formatter.js";
import type { SubCommand } from "shared/types/command.js";
import { ConvertAuth } from "core/people/convertAuth.js";

const data = ((sub: SlashCommandSubcommandBuilder) => 
    sub
      .setName("default")
      .setDescription("Report for last 1 day (org-wide by default)")
      .addStringOption((opt) =>
        opt
          .setName("repo")
          .setDescription("Target repository name (optional)")
          .setRequired(false)
      ));


async function execute(interaction: ChatInputCommandInteraction) {
    const title = "Org total · Last 1d";
    const window = relativeToWindowISO("1d");

    const summary = await Report.collectOrgReport(interaction.guildId!, window);

    if (!summary.summary.length) {
        await interaction.editReply("⚠️ No contributions found in the given time window.");
        return;
    }

    const resultSummary = await (await ConvertAuth.create(interaction.client, interaction.guild!)).convertAuthAgg(summary.summary);

    const contents = Formatter.leaderboard(resultSummary, { title } );

    await interaction.editReply({ content: "✅ Succeed!" });;

    const ch = interaction.channel ?? await interaction.client.channels.fetch(interaction.channelId).catch(() => null);
    if (!ch || !ch.isTextBased() || !ch.isSendable()) {
        await interaction.editReply("⚠️ Succeed, but I can't send public messages in this channel (not a text channel or fetch failed).");
    return;
    }
    await ch.send({ content: contents });
}

export const command: SubCommand = { data, execute };
