import { GitHub } from "infrastructure/github/github.js";
import { Formatter } from "shared/formatters/formatter.js";
import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "shared/types/command.js";
import { ConvertAuth } from "core/people/convertAuth.js";

import { Logger } from "infrastructure/log/log.js";

const data: SlashCommandSubcommandBuilder = new SlashCommandSubcommandBuilder()
    .setName("people")
    .setDescription("List all people contributing")
    .addIntegerOption((opt) =>
        opt
        .setName("max")
        .setDescription("Max number of people to list")
        .setRequired(false)
)


export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
        await interaction.editReply({ content: `No guild found` });
        Logger.error("Command", "ls: people: no guild found");
        return;
    }
    
    const max = interaction.options.getInteger("max") ?? 20;
    const gh = await GitHub.create(interaction.guildId!);

    const items = await gh.listMembers();

    if (items.length === 0) {
        await interaction.editReply({ content: `No items found for People` });
        return;
    }



    const promises = 
    (await ConvertAuth.create(interaction.client, interaction.guild)).


    let names = await listOrgContributors(org);
    names = await removeArrayByBlackList(names);
    return names.slice(0, max);
}
