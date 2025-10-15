import { GitHub } from "infrastructure/github/github.js";
import { Formatter } from "shared/formatters/formatter.js";
import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { SubCommand } from "shared/types/command.js";
import { ConvertAuth } from "core/people/convertAuth.js";

import { Logger } from "infrastructure/log/log.js";

const data= ((sub: SlashCommandSubcommandBuilder) =>
    sub
        .setName("people")
        .setDescription("List all people contributing")
        .addIntegerOption((opt) =>
            opt
            .setName("max")
            .setDescription("Max number of people to list")
            .setRequired(false)
));


async function execute(interaction: ChatInputCommandInteraction) {
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


    const cp = await ConvertAuth.create(interaction.client, interaction.guild);

    const promises = items.map(interaction => cp.convertAuth(interaction));
    const converted = await Promise.all(promises);

    const names = await cp.removeArrayByBlackList(converted)

    const contens = Formatter.list(names.slice(0, max), `People contributing (max ${max})`);
    await interaction.editReply({ content: contens });
}

export const command: SubCommand= { data, execute };