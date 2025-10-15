import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { GitHub } from "infrastructure/github/github.js";
import type { BranchSummary } from "shared/types/github.js";
import { Formatter } from "shared/formatters/formatter.js";
import type { SubCommand } from "shared/types/command.js";

const data = ((sub: SlashCommandSubcommandBuilder) => 
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
            .setDescription("Max number of branches to list (default 20)")
            .setRequired(false)
    ));


async function execute(interaction: ChatInputCommandInteraction) {
    const repo = interaction.options.getString("repo", true);
    const max = interaction.options.getInteger("max") ?? 20;

    const gh = await GitHub.create(interaction.guildId!);

    if (!gh.verifyRepo(repo)) {
        await interaction.editReply({ content: `❌ Error: the repo ${repo} does not exist.` });
        return;
    }

    const summary = await gh.listBranches(repo);
    const title = `Branches in ${repo} (max ${max})`;
    const names = summary.map((bs: BranchSummary) => bs.name);
    
    if (names.length === 0) {
        await interaction.editReply({ content: `No items found for ${title}` });
        return;
    }

    const content = Formatter.list(names, title);
    await interaction.editReply({ content });
}

export const command: SubCommand= { data, execute };