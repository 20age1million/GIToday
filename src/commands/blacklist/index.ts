import { ChatInputCommandInteraction, SlashCommandBuilder, type ChatInputApplicationCommandData } from 'discord.js';

import { data as addSubcommand, execute as addHandler } from './handlers/add.js';
import { data as removeSubcommand, execute as removeHandler } from './handlers/remove.js';
import { data as showSubcommand, execute as showHandler } from './handlers/show.js';

export const data = new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Manage the blacklist of authors to exclude from leaderboards')
    .addSubcommand(addSubcommand)
    .addSubcommand(removeSubcommand)
    .addSubcommand(showSubcommand);

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'add':
            {
                await addHandler(interaction);
            }
            break;
        case 'remove':
            {
                await removeHandler(interaction);
            }
            break;
        case 'show':
            {
                await showHandler(interaction);
            }
            break;
        default:
            await interaction.reply({ content: 'Unknown subcommand', ephemeral: true });
    }
}
