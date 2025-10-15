import type { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";
import { AuthMap } from "infrastructure/db/authMap.js";
import type { SubCommand } from "shared/types/command.js";

const data = ((sub: SlashCommandSubcommandBuilder) => 
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

async function execute(interaction: ChatInputCommandInteraction) {
    const rawID = interaction.options.getString("raw-id", true);
    const user = interaction.options.getUser("user") ?? interaction.user;

    const success = await AuthMap.set(interaction.guildId!, rawID, user.id);
    let msg: string;

    if (success) {
        msg = `Successfully authenticated map with raw ID \`${rawID}\` to <@${user.id}>`;
    } else {
        msg = `Map with raw ID \`${rawID}\` is already authenticated`;
    }

    await interaction.reply({ content: msg, ephemeral: true });
}

export const command: SubCommand = { data, execute };