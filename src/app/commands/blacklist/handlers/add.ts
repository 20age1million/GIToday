import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { appendBlacklist } from '../../../lib/people-configs/blacklist.js';

export const data = ((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('add')
            .setDescription('Add an author to the blacklist')
            .addStringOption(option =>
                option.setName('author')
                    .setDescription('The author name or email to blacklist')
                    .setRequired(true)));

export async function execute(interaction: ChatInputCommandInteraction) {
    const author = interaction.options.getString('author', true).trim();
    if (author.length === 0) {
        await interaction.reply({ content: 'Author name cannot be empty.', ephemeral: true });
        return;
    }

    let msg: string;
    const added = await appendBlacklist(author);

    if (added) {
        msg = `Author "${author}" has been added to the blacklist.`;
    } else {
        msg = `Author "${author}" is already in the blacklist.`;
    }

    await interaction.reply({ content: msg, ephemeral: true });
}
