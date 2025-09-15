// src/commands/report.ts
// Slash command framework for:
//   /report                          → default = last 1d, org-wide
//   /report rel <rel>                    → rel in {"7d", "24h"} etc., org-wide
//   /report window <ISO> <ISO>     → absolute window, org-wide
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
  MessageFlags,
} from "discord.js";

import { isISO8601String, relativeToWindowISO } from "../lib/time.js"; // you implement
import { collectRepoReport } from "../lib/github/report-repo.js";       
import { collectOrgReport } from "../lib/github/report-org.js";   
import type { AuthorAggregate, ListOptions, RepoSummary, TimeWindow } from "../types/github.js";       
import { requireEnv } from "../lib/requireEnv.js";
import { formatLeaderboard } from "../lib/formatters/formatLeaderboard.js";
import { listOrgRepos } from "../lib/github/repos.js";
import { convertAuth, mergeSameNamesInAuthAgg, removeAuthAggByBlackList } from "../lib/convertAuth.js";
import { verifyRepo } from "../lib/verifiers/verifyRepo.js";

export const data = new SlashCommandBuilder()
  .setName("report")
  .setDescription("GitHub commit report")
  
  // default subcommand
  .addSubcommand((sub) =>
    sub
      .setName("default")
      .setDescription("Report for last 1 day (org-wide by default)")
      .addStringOption((opt) =>
        opt
          .setName("repo")
          .setDescription("Target repository name (optional)")
          .setRequired(false)
      )
  )
  
  // relative window subcommand
  .addSubcommand((sub) =>
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
      )
  )
  
  // absolute window subcommand
  .addSubcommand((sub) =>
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
    )
);

/** Resolve the final time window following the decision rules (absolute > relative > default). */
// function resolveWindowFromOptions(relOpt: string | null, sinceOpt: string | null, untilOpt: string | null): TimeWindow {
//     // Case 1: absolute window
//     if (sinceOpt || untilOpt) {
//         const untilISO = untilOpt ? untilOpt.trim() : new Date().toISOString();
//         const sinceISO = sinceOpt ? sinceOpt.trim() : (() => { throw new Error("When 'until' is provided, 'since' must also be provided (ISO8601 UTC)."); })();

//         if (!isISO8601String(sinceISO)) throw new Error(`Invalid 'since' (expect ISO8601 UTC): ${sinceISO}`);
//         if (!isISO8601String(untilISO)) throw new Error(`Invalid 'until' (expect ISO8601 UTC): ${untilISO}`);

//         if (new Date(sinceISO).getTime() > new Date(untilISO).getTime()) {
//         throw new Error("'since' must be earlier than or equal to 'until'.");
//         }
//         return { since: sinceISO, until: untilISO };
//     }

//     // Case 2: relative window
//     if (relOpt && relOpt.trim().length > 0) {
//         return relativeToWindowISO(relOpt);
//     }

//     // Case 3: default = last 1 day
//     return relativeToWindowISO("1d");
// }

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
    // const rel = interaction.options.getString("rel");
    // const sinceOpt = interaction.options.getString("since");
    // const untilOpt = interaction.options.getString("until");
    const orgName = requireEnv("GITHUB_ORG");
    const opts: ListOptions = {
        perPage: 100,
        includeForks: false,
        includeArchived: false,
        concurrency: 8,
        repoConcurrency: 3,
        ignoreMerges: false
    }

    const sub = interaction.options.getSubcommand();

    // // get displayed time
    let displayedTime: string = "";
    // if (sinceOpt) {
    //     if (untilOpt) {
    //         displayedTime = `since ${sinceOpt} until ${untilOpt}.`;
    //     }
    //     else {
    //         displayedTime = `since ${sinceOpt} until now.`; 
    //     }
    // }
    // else if (rel) displayedTime = `last ${rel}.`;
    // else displayedTime = "last 1d";

    // status var
    // let isError = false;
    let message: string = "";
    let title: string = "";

    // Time (dummy value)
    let window: TimeWindow = { since: (new Date()).toISOString(), until: (new Date()).toISOString() };

    try {
        if (repo) {
            title += (repo + ' '); 
            if (!verifyRepo(orgName, repo)) {
                throw new Error(`❌ Repo "${repo}" does not exists.`); 
            }
        } else {
            title += "Org ";
        }

        title += "Total · ";


        if (sub === "default") {
            window = relativeToWindowISO("1d");
            displayedTime = "last 1d";
        } else if (sub === "rel") {
            const rel = interaction.options.getString("rel", true); 
            window = relativeToWindowISO(rel);
            displayedTime = `last ${rel}`;
        } else if (sub === "window") {
            const since = interaction.options.getString("since", true);
            const until = interaction.options.getString("until", true);
            if (!isISO8601String(since) || !isISO8601String(until)) {
                throw new Error("since/until must be valid ISO8601 UTC strings");
            }
            window = { since: since.trim(), until: until.trim() };
            displayedTime = `since ${window.since} until ${window.until}`;
        } else {
            // fallback to default
            window = relativeToWindowISO("1d");
            displayedTime = "last 1d";
        }

        title += displayedTime;
        
        const MAX_DAYS = 90;
        const sinceTime = new Date(window.since).getTime();
        const untilTime = new Date(window.until).getTime();
        if (untilTime < sinceTime) {
            throw new Error("❌ Invalid time window: 'since' must be before 'until'.");
        } else {
            const diffMs = untilTime - sinceTime;
            const maxMs = MAX_DAYS * 24 * 60 * 60 * 1000;
            if (diffMs > maxMs) {
            throw new Error(`❌ Time window too large: please use a range of at most ${MAX_DAYS} days.`);
            }
        }
    } catch (err: any) {
        await interaction.editReply({content: err.message});
        return;
    }

    let summary;
    if (repo) {
        summary = await collectRepoReport(orgName, repo, window, opts);
    } else {
        summary = (await collectOrgReport(orgName, window, opts)).summary;
    }

    // map to same name
    summary.map((aa: AuthorAggregate) => {
        aa.authorKey = convertAuth(aa.authorKey);
        return aa;
    });
    summary = mergeSameNamesInAuthAgg(summary);
    summary = removeAuthAggByBlackList(summary);

    if (!summary.length) {
        message =`No commits in \`${repo ?? orgName}\` within \`${displayedTime}\`.`;
    } else {
        message = formatLeaderboard(summary, { title: title});
    }

    await interaction.editReply({ content: "✅ Succeed!" });
    const ch = interaction.channel ?? await interaction.client.channels.fetch(interaction.channelId).catch(() => null);
    if (!ch || !ch.isTextBased() || !ch.isSendable()) {
        await interaction.editReply("⚠️ 生成成功，但我无法在这个位置发公开消息（非文本频道或获取失败）。");
    return;
    }
    await ch.send({ content: message });
}
