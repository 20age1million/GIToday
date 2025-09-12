// src/commands/report.ts
// Slash command framework for:
//   /report                          → default = last 1d, org-wide
//   /report <rel>                    → rel in {"7d", "24h"} etc., org-wide
//   /report duration <ISO> <ISO>     → absolute window, org-wide
//   /report repo <name>              → default = last 1d, single repo
//   /report repo <name> <rel>        → rel window, single repo
//   /report repo <name> duration <ISO> <ISO> → absolute window, single repo
//
// We model this with ONE slash command and FOUR string options:
//   - repo  : optional repo name (if absent → org report)
//   - rel   : optional relative window string, e.g. "7d" | "24h"  (d/h only)
//   - since : optional ISO 8601 UTC string
//   - until : optional ISO 8601 UTC string
//
// Decision rules in execute():
//   1) If since || until present → absolute window (validate both; if only one given, fill the other as now or throw).
//   2) else if rel present       → relative window via time helper (now - rel .. now).
//   3) else                      → default to last "1d".
//   4) If repo provided → single-repo path, else → org-wide path.

import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from "discord.js";

// ---- import your helpers/services (adjust the import paths) ----
import { isISO8601String, relativeToWindowISO } from "../lib/time.js"; // you implement
import { collectRepoReport } from "../lib/github/report-repo.js";       
import { collectOrgReport } from "../lib/github/report-org.js";   
import type { ListOptions, RepoSummary, TimeWindow } from "../types/github.js";       
import { requireEnv } from "../lib/requireEnv.js";
import { formatLeaderboard } from "../lib/github/formatLeaderboard.js";
import { listOrgRepos } from "../lib/github/repos.js";

export const data = new SlashCommandBuilder()
    .setName("report")
    .setDescription("GitHub commit report.")
    .addStringOption((opt) => 
        opt
            .setName("repo")
            .setDescription("Target repository name. Omit for org-wide report.")
            .setRequired(false)
    )
    .addStringOption((opt) => 
        opt
            .setName("rel")
            .setDescription(`Relative window: e.g. "7d" or "24h". Ignored if 'since'/'until' provided.`)
            .setRequired(false)
    )
    .addStringOption((opt) =>
        opt
            .setName("since")
            .setDescription("Start time (ISO8601 UTC, e.g. 2025-09-10T10:00:00Z).")
            .setRequired(false)
    )
    .addStringOption((opt) =>
        opt
            .setName("until")
            .setDescription("End time (ISO8601 UTC, default = now if omitted).")
            .setRequired(false)
    );

/** Resolve the final time window following the decision rules (absolute > relative > default). */
function resolveWindowFromOptions(relOpt: string | null, sinceOpt: string | null, untilOpt: string | null): TimeWindow {
    // Case 1: absolute window
    if (sinceOpt || untilOpt) {
        const untilISO = untilOpt ? untilOpt.trim() : new Date().toISOString();
        const sinceISO = sinceOpt ? sinceOpt.trim() : (() => { throw new Error("When 'until' is provided, 'since' must also be provided (ISO8601 UTC)."); })();

        if (!isISO8601String(sinceISO)) throw new Error(`Invalid 'since' (expect ISO8601 UTC): ${sinceISO}`);
        if (!isISO8601String(untilISO)) throw new Error(`Invalid 'until' (expect ISO8601 UTC): ${untilISO}`);

        if (new Date(sinceISO).getTime() > new Date(untilISO).getTime()) {
        throw new Error("'since' must be earlier than or equal to 'until'.");
        }
        return { since: sinceISO, until: untilISO };
    }

    // Case 2: relative window
    if (relOpt && relOpt.trim().length > 0) {
        return relativeToWindowISO(relOpt);
    }

    // Case 3: default = last 1 day
    return relativeToWindowISO("1d");
}

export async function execute(interaction: ChatInputCommandInteraction) {

    // confirm of receive
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (e) {
        // 如果 defer 都失败了，后面就别再 editReply 了
        console.error("[/report] deferReply failed:", e);
        return;
    }

    // get options
    const repo = interaction.options.getString("repo");
    const rel = interaction.options.getString("rel");
    const sinceOpt = interaction.options.getString("since");
    const untilOpt = interaction.options.getString("until");
    const orgName = requireEnv("GITHUB_ORG");
    const opts: ListOptions = {
        perPage: 100,
        includeForks: false,
        includeArchived: false,
        concurrency: 8,
        repoConcurrency: 3,
        ignoreMerges: false
    }

    // get displayed time
    let displayedTime: string = "";
    if (sinceOpt) {
        if (untilOpt) {
            displayedTime = `since ${sinceOpt} until ${untilOpt}.`;
        }
        else {
            displayedTime = `since ${sinceOpt} until now.`; 
        }
    }
    else if (rel) displayedTime = `last ${rel}.`;
    else displayedTime = "last 1d";

    // status var
    let isError = false;
    let message: string = "";

    // if repo is given, check is repo exists
    if (repo) {
        const repos = await listOrgRepos(orgName, opts)
        const repoNames = repos.map((rs: RepoSummary) => rs.name); 
        if (!repoNames.includes(repo)) {
            isError = true;
            message = `❌ Repo "${repo}" does not exists.`; 
        }
    }

    // Time (dummy value)
    let window: TimeWindow = { since: (new Date()).toISOString(), until: (new Date()).toISOString() };

    // 1. parse time
    const MAX_DAYS = 90;
    try {
        window = resolveWindowFromOptions(rel, sinceOpt, untilOpt);
    } catch (err: any) {
        isError = true;
        message = `❌ Time window error: ${err?.message ?? err}`;
    }

    if (!isError) {
        const sinceTime = new Date(window.since).getTime();
        const untilTime = new Date(window.until).getTime();
        if (untilTime < sinceTime) {
            isError = true;
            message = "❌ Invalid time window: 'since' must be before 'until'.";
        } else {
            const diffMs = untilTime - sinceTime;
            const maxMs = MAX_DAYS * 24 * 60 * 60 * 1000;
            if (diffMs > maxMs) {
            isError = true;
            message = `❌ Time window too large: please use a range of at most ${MAX_DAYS} days.`;
            }
        }
    }

    // if not error, analyze content
    if (!isError) {
        try {
            if (repo) {
                const agg = await collectRepoReport(orgName, repo, window, opts);

                if (!agg.length) {
                    // isError = true;
                    message = `No commits in \`${repo}\` within \`${displayedTime}\`.`;
                } else {
                    message = formatLeaderboard(agg, {
                        title: `Repo: ${repo} · ${displayedTime}}`,
                        top: 10,
                    });
                }
            } else {
                const total = (await collectOrgReport(orgName, window, opts)).summary;

                if (!total.length) {
                    // isError = true;
                    message = `No commits in org within \`${displayedTime}\`.`;
                } else {
                    message = formatLeaderboard(total, {
                        title: `Org Total · ${displayedTime}`,
                        top: 10,
                    });
                }
            }
        } catch (err: any) {
            isError = true;
            message = `⚠️ Report failed: ${err?.message ?? err}`;
            console.error("[/report] execute error:", err);
        }
    }

    // 2. send message
    if (isError) {
        await interaction.editReply({content: message});
    } else {
        await interaction.editReply({ content: "✅ Succeed!" });
        const ch = interaction.channel ?? await interaction.client.channels.fetch(interaction.channelId).catch(() => null);
        if (!ch || !ch.isTextBased() || !ch.isSendable()) {
            await interaction.editReply("⚠️ 生成成功，但我无法在这个位置发公开消息（非文本频道或获取失败）。");
        return;
        }
        await ch.send({ content: message });
    } 
}
