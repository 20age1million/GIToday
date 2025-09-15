// ls repos
// ls branches [repo]
// ls people <repo>

import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageFlags,
} from "discord.js";

import {
    formatList
} from "../../lib/formatters/formatList.js";

import {
    requireEnv
} from "../../lib/requireEnv.js"

import {
    lsRepos,
} from "./handlers/repos.js"

import {
    lsBranches,
} from "./handlers/branches.js"

import {
    lsPeople,
} from "./handlers/people.js"
import { verifyRepo } from "../../lib/verifiers/verifyRepo.js";

export const data = new SlashCommandBuilder()
    .setName("ls")
    .setDescription("List repos / branches / people")
    
    .addSubcommand((sub) => 
        sub
            .setName("repos")
            .setDescription("List all repos in org")
            .addIntegerOption((opt) => 
                opt
                    .setName("max")
                    .setDescription("Max number of repos to list")
                    .setRequired(false)
            )
    )

    .addSubcommand((sub) => 
        sub
            .setName("branches")
            .setDescription("List all branches in a repo")
            .addStringOption((opt) =>
                opt 
                    .setName("repo")
                    .setDescription("Repository name")
                    .setRequired(true)
            )
            .addIntegerOption((opt) =>
                opt
                    .setName("max")
                    .setDescription("Max number of branches to list")
                    .setRequired(false)
            )
    )

    .addSubcommand((sub) =>
        sub
            .setName("people")
            .setDescription("List all people contributing")
            .addIntegerOption((opt) =>
                opt
                    .setName("max")
                    .setDescription("Max number of people to list")
                    .setRequired(false)
            )
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const orgName = requireEnv("GITHUB_ORG");
    const sub = interaction.options.getSubcommand();
    const max = interaction.options.getInteger("max") ?? 50;

    let items: string[] = [];
    let title: string;

    try {
        const repo = interaction.options.getString("repo");
        if (repo) {
            if (!verifyRepo(orgName, repo)) {
                throw new Error(`the repo ${repo} does not exist.`);
            }
        }

        if (sub === "repos") {
            items = await lsRepos(orgName, max);
            title = `Repos in ${orgName} (max ${max})`;
        } else if (sub === "branches") {
            const repo = interaction.options.getString("repo", true);
            items = await lsBranches(orgName, repo, max);
            title = `Branches in ${repo} (max ${max})`;
        } else if (sub === "people") {
            const repo = interaction.options.getString("repo");
            items = await lsPeople(orgName, max);
            title = repo
                ? `People in ${repo} (max ${max})`
                : `People in org ${orgName} (max ${max})`;
        } else {
            items = [];
            title = "Invalid subcommand";
        }
    } catch (err: any) {
        await interaction.editReply({ content: `❌ Error: ${err.message}` });
        return;
    }

    if (items.length === 0) {
        await interaction.editReply({ content: `No items found for ${title}` });
        return;
    }

    const content = formatList(items, title);
    await interaction.editReply({ content });
}
