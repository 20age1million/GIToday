import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { isISO8601String } from "core/time/time.js";
import { Report } from "core/reports/report.js";
import { Formatter } from "shared/formatters/formatter.js";
import type { SubCommand } from "shared/types/command.js";


const data = ((sub: SlashCommandSubcommandBuilder) =>
    sub
        .setName("window")
            .setDescription("Report for an absolute time window")
            .addStringOption((opt) =>
                opt
                .setName("since")
                .setDescription("Start time (ISO8601 UTC)")
                .setRequired(true)
            )
            .addStringOption((opt) =>
                opt
                .setName("until")
                .setDescription("End time (ISO8601 UTC)")
                .setRequired(true)
            )
            .addStringOption((opt) =>
                opt
                .setName("repo")
                .setDescription("Target repository name (optional)")
                .setRequired(false)
            ));

async function execute(interaction: ChatInputCommandInteraction) {
    const since = interaction.options.getString("since", true);
    const until = interaction.options.getString("until", true);

    if (!isISO8601String(since) || !isISO8601String(until)) {
        interaction.editReply("since/until must be valid ISO8601 UTC strings");
    }

    const window = { since: since.trim(), until: until.trim() };
    const repo = interaction.options.getString("repo");

    let title: string;
    if (repo) {
        title = `${repo} total · from ${since} to ${until}`;
    } else {
        title = `Org total · from ${since} to ${until}`;
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
