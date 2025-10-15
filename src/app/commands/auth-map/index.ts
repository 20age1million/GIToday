import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from "discord.js"
import { command as add} from "./handler/add.js"
import { command as show} from "./handler/show.js"
import { command as remove} from "./handler/remove.js"


export const data = new SlashCommandBuilder()
    .setName("auth-map")
    .setDescription("Authenticate a map to your account")
    .addSubcommand(add.data)
    .addSubcommand(show.data)
    .addSubcommand(remove.data);

export async function execute(interaction: ChatInputCommandInteraction) {
    if (interaction.options.getSubcommand() === "add") {
        await add.execute(interaction);
    } else if (interaction.options.getSubcommand() === "show") {
        await show.execute(interaction);
    } else if (interaction.options.getSubcommand() === "remove") {
        await remove.execute(interaction);
    } else {
        await interaction.reply({ content: "Unknown subcommand", flags: MessageFlags.Ephemeral });
    }
}

export const command = { data, execute };