import { SlashCommandSubcommandBuilder } from "discord.js"
import { type ChatInputCommandInteraction } from 'discord.js';
import { removeFromBlacklist } from "../../../lib/people-configs/blacklist.js";

export const data = ((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('remove')
            .setDescription('Remove an author from the blacklist')
            .addStringOption(option =>
                option.setName('author')
                    .setDescription('The author name or email to remove from the blacklist')
                    .setRequired(true)));

export async function execute(interaction: ChatInputCommandInteraction) {
    const author = interaction.options.getString('author', true);
    const success = await removeFromBlacklist(author);
    let msg: string;
    if (success) {
        msg = `Removed **${author}** from the blacklist.`;
    } else {
        msg = `**${author}** is not in the blacklist.`;
    }
    await interaction.reply({ content: msg, ephemeral: true });
}
