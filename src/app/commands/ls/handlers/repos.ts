import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder} from "discord.js";

import type { RepoSummary } from "shared/types/github.js";
import { GitHub } from "infrastructure/github/github.js";
import { Formatter } from "shared/formatters/formatter.js";
import type { SubCommand } from "shared/types/command.js";

const data = ((sub: SlashCommandSubcommandBuilder) => 
    sub
        .setName("repos")
        .setDescription("List all repos in org")
        .addIntegerOption((max) =>
            max
                .setName("max")
                .setDescription("Max number of repos to list (default 50)")
                .setRequired(false)
));


async function execute(interaction: ChatInputCommandInteraction) {
    // const summary = await listOrgRepos(orgName);
    // const names = summary.map((rs: RepoSummary) => rs.name);
    // return names.slice(0,max);

    const max = interaction.options.getInteger("max") ?? 50;

    const gh = await GitHub.create(interaction.guildId!);

    const summary = await gh.listOrgRepos({ perPage: max });
    const title = `Repos in org (max ${max})`;
    const names = summary.map((rs: RepoSummary) => rs.name);

    if (names.length === 0) {
        await interaction.editReply({ content: `No items found for ${title}` });
        return;
    }

    const content = Formatter.list(names, title);
    await interaction.editReply({ content });
}

export const command: SubCommand= { data, execute };