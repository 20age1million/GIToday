import type { Command } from "shared/types/command.js";

import {
    SlashCommandBuilder,
    ChatInputCommandInteraction
} from "discord.js"


const data = new SlashCommandBuilder()
    .setName("echo")
    .setDescription("Replies with your input!")
    .addStringOption(options => options
        .setName("context")
        .setDescription("The input to echo back.")
        .setRequired(true)
    );

async function execute(interaction: ChatInputCommandInteraction) {
    let input= interaction.options.getString("context");
    if (!input) input = "";
    await interaction.reply(input);
}

export const command: Command = { data, execute };
