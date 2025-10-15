// a MVP funciton, support /hello function
import type { Command } from "shared/types/command.js";

import {
    SlashCommandBuilder, // use to fill meta info of a Slashcommand
    type ChatInputCommandInteraction
} from "discord.js";

const data = new SlashCommandBuilder().setName("hello").setDescription("Hello, World!");

async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply("Hello, World!");
}

export const command: Command = { data, execute };
