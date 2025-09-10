// a MVP funciton, support /hello function

import {
    SlashCommandBuilder, // use to fill meta info of a Slashcommand
    type ChatInputCommandInteraction
} from "discord.js";

export const data = new SlashCommandBuilder().setName("hello").setDescription("Hello, World!");

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply("Hello, World!");
}
