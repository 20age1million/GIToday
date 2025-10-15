import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { Blacklist } from 'infrastructure/db/blacklist.js';
import type { SubCommand } from 'shared/types/command.js';

const data = ((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('add')
            .setDescription('Add an author to the blacklist')
            .addStringOption(option =>
                option.setName('author')
                    .setDescription('The author name or email to blacklist')
                    .setRequired(true)));
async function execute(interaction: ChatInputCommandInteraction) {
    const author = interaction.options.getString('author', true).trim();
    if (author.length === 0) {
        await interaction.reply({ content: 'Author name cannot be empty.', ephemeral: true });
        return;
    }

    let msg: string;
    const added = await Blacklist.add(interaction.guildId!, author);

    if (added) {
        msg = `Author "${author}" has been added to the blacklist.`;
    } else {
        msg = `Author "${author}" is already in the blacklist.`;
    }

    await interaction.reply({ content: msg, ephemeral: true });
}

export const command: SubCommand = { data, execute };