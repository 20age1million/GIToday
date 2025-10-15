import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags } from 'discord.js';

import { command as show } from './handlers/show.js';
import { command as set } from './handlers/set.js';

const data = new SlashCommandBuilder()
    .setName('guildinfo')
    .setDescription('Manage the basic info for the guild')
    .addSubcommand(set.data)
    .addSubcommand(show.data);

async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    await interaction.deferReply( {flags: MessageFlags.Ephemeral} );

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'set':
            {
                await set.execute(interaction);
            }
            break;
        case 'show':
            {
                await show.execute(interaction);
            }
            break;
        default:
            await interaction.reply({ content: 'Unknown subcommand', flags: MessageFlags.Ephemeral });
    }
}

export const command = { data, execute };