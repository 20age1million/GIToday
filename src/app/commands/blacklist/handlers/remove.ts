import { SlashCommandSubcommandBuilder } from "discord.js"
import { type ChatInputCommandInteraction } from 'discord.js';
import { Blacklist } from "infrastructure/db/blacklist.js";
import type { SubCommand } from "shared/types/command.js";

const data = ((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('remove')
            .setDescription('Remove an author from the blacklist')
            .addStringOption(option =>
                option.setName('author')
                    .setDescription('The author name or email to remove from the blacklist')
                    .setRequired(true)));

async function execute(interaction: ChatInputCommandInteraction) {
    const author = interaction.options.getString('author', true);
    const success = await Blacklist.remove(interaction.guildId!, author);
    let msg: string;
    if (success) {
        msg = `Removed **${author}** from the blacklist.`;
    } else {
        msg = `**${author}** is not in the blacklist.`;
    }
    await interaction.reply({ content: msg, ephemeral: true });
}

export const command: SubCommand = { data, execute };