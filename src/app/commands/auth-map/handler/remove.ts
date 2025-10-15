import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction} from "discord.js"
import { AuthMap } from "infrastructure/db/authMap.js";
import type { SubCommand } from "shared/types/command.js";


const data = ((sub: SlashCommandSubcommandBuilder ) => 
    sub
        .setName("remove")
        .setDescription("Remove authentication of a map from your account")
        .addStringOption(option => 
            option
                .setName("raw-id")
                .setDescription("The raw ID of the map you want to remove authentication from")
                .setRequired(true))
);

async function execute(interaction: ChatInputCommandInteraction) {
    const rawID = interaction.options.getString("raw-id", true);

    const success = await AuthMap.remove(interaction.guildId!, rawID);
    let msg: string;

    if (success) {
        msg = `Successfully removed authentication of map with raw ID \`${rawID}\``;
    } else {
        msg = `Map with raw ID \`${rawID}\` is not authenticated`;
    }
    
    await interaction.reply({ content: msg, ephemeral: true });
}

export const command: SubCommand = { data, execute};