import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";
import { relativeToWindowISO } from "core/time/time.js";
import { Report } from "core/reports/report.js";
import { Formatter } from "shared/formatters/formatter.js";
import type { SubCommand } from "shared/types/command.js";
import { title } from "process";
import { ConvertAuth } from "core/people/convertAuth.js";

const data = ((sub: SlashCommandSubcommandBuilder) =>
    sub
        .setName("rel")
        .setDescription("Report for a relative time window (e.g. 7d, 24h)")
        .addStringOption((opt) =>
            opt
                .setName("rel")
                .setDescription('Relative window, like "7d" or "24h"')
                .setRequired(true)
        )
         .addStringOption((opt) =>
            opt
                .setName("repo")
                .setDescription("Target repository name (optional)")
                .setRequired(false)
        ));


async function execute(interaction: ChatInputCommandInteraction) {
    const rel = interaction.options.getString("rel", true); 
    const window = relativeToWindowISO(rel);
    const repo = interaction.options.getString("repo");

    let title: string;
    if (repo) {
        title = `${repo} total · last ${rel}`;
    } else {
        title = `Org total · last ${rel}`;
    }

    // verify time window
    const MAX_DAYS = 90;
    const sinceTime = new Date(window.since).getTime();
    const untilTime = new Date(window.until).getTime();
    if (untilTime < sinceTime) {
        interaction.editReply("❌ Invalid time window: 'since' must be before 'until'.");
        return;
    } else {
        const diffMs = untilTime - sinceTime;
        const maxMs = MAX_DAYS * 24 * 60 * 60 * 1000;
        if (diffMs > maxMs) {
            interaction.editReply(`❌ Time window too large: please use a range of at most ${MAX_DAYS} days.`);
        }
    }

    let summary;
    if (repo) {
        summary = await Report.collectRepoReport(interaction.guildId!, repo, window);
    } else {
        summary = (await Report.collectOrgReport(interaction.guildId!, window)).summary;
    }

    if (!summary.length) {
        await interaction.editReply("⚠️ No contributions found in the given time window.");
        return;
    }


    summary = await (await ConvertAuth.create(interaction.client, interaction.guild!)).convertAuthAgg(summary);

    const contents = Formatter.leaderboard(summary, { title } );

    await interaction.editReply({ content: "✅ Succeed!" });;

    const ch = interaction.channel ?? await interaction.client.channels.fetch(interaction.channelId).catch(() => null);
    if (!ch || !ch.isTextBased() || !ch.isSendable()) {
        await interaction.editReply("⚠️ Succeed, but I can't send public messages in this channel (not a text channel or fetch failed).");
    return;
    }
    await ch.send({ content: contents });
}

export const command: SubCommand = { data, execute };