import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js"
import { data as addData, execute as addExe} from "./handler/add.js"
import { data as showData, execute as showExe} from "./handler/show.js"
import { data as removeData, execute as removeExe } from "./handler/remove.js"


export const data = new SlashCommandBuilder()
    .setName("auth-map")
    .setDescription("Authenticate a map to your account")
    .addSubcommand(addData)
    .addSubcommand(showData)
    .addSubcommand(removeData);

export async function execute(interaction: ChatInputCommandInteraction) {
    if (interaction.options.getSubcommand() === "add") {
        await addExe(interaction);
    } else if (interaction.options.getSubcommand() === "show") {
        await showExe(interaction);
    } else if (interaction.options.getSubcommand() === "remove") {
        await removeExe(interaction);
    } else {
        await interaction.reply({ content: "Unknown subcommand", ephemeral: true });
    }
}
