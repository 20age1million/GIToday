import type { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";
import { appendMap } from '../../../lib/people-configs/map.js'

export const data = ((sub: SlashCommandSubcommandBuilder) => 
    sub
        .setName("add")
        .setDescription("Authenticate a map to your account")
        .addStringOption(option => 
            option
                .setName("raw-id")
                .setDescription("The raw ID of the map you want to authenticate")
                .setRequired(true)
        )
        .addUserOption(option => 
            option
                .setName("user")
                .setDescription("The user you want to authenticate the map to (defaults to yourself)")
                .setRequired(false)
        )
);

export async function execute(interaction: ChatInputCommandInteraction) {
    const rawID = interaction.options.getString("raw-id", true);
    const user = interaction.options.getUser("user") ?? interaction.user;

    const success = await appendMap(rawID, user.id);
    let msg: string;

    if (success) {
        msg = `Successfully authenticated map with raw ID \`${rawID}\` to <@${user.id}>`;
    } else {
        msg = `Map with raw ID \`${rawID}\` is already authenticated`;
    }

    await interaction.reply({ content: msg, ephemeral: true });
}
