import {
    SlashCommandBuilder,
    type ChatInputCommandInteraction
} from "discord.js"

export const data = new SlashCommandBuilder()
    .setName("echo")
    .setDescription("Replies with your input!")
    .addStringOption(options => options
        .setName("context")
        .setDescription("The input to echo back.")
        .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    let input= interaction.options.getString("context");
    if (!input) input = "";
    await interaction.reply(input);
}
