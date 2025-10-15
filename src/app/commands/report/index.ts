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

import { command as defaultreport } from "./handler/default.js";
import { command as rel } from "./handler/rel.js";
import { command as window } from "./handler/window.js";

import { Logger } from "infrastructure/log/log.js";
import type { Command } from "shared/types/command.js";
import { GuildInfo } from "infrastructure/db/guildInfo.js";

const data = new SlashCommandBuilder()
  .setName("report")
  .setDescription("GitHub commit report")
  
  // default subcommand
  .addSubcommand(defaultreport.data)
  
  // relative window subcommand
  .addSubcommand(rel.data)
  
  // absolute window subcommand
  .addSubcommand(window.data);

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

async function execute(interaction: ChatInputCommandInteraction) {

    // confirm of receive
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (e) {
        // 如果 defer 都失败了，后面就别再 editReply 了
        Logger.error("command", "report - Failed to defer reply");
        return;
    }

    if (! await (GuildInfo.infoComplete(interaction.guildId!))) {
        Logger.warn("Command", `/ls aborted: repo info not set for guild ${interaction.guildId}`);
        await interaction.editReply({
            content: "Please set up repo info first using /guildinfo set",
        });
        return;
    }

    const sub = interaction.options.getSubcommand();

    switch (sub) {
        case "default":
            await defaultreport.execute(interaction);
            break;

        case "rel":
            await rel.execute(interaction);
            break;

        case "window":
            await window.execute(interaction);
            break;

        default:
            await interaction.editReply(`Unsupported subcommand: ${sub}`);
            break;
    }
}

export const command: Command = { data, execute };