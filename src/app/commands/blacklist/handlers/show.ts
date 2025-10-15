import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, MessageFlags} from "discord.js"
import { Blacklist } from "infrastructure/db/blacklist.js";
import { Formatter } from "shared/formatters/formatter.js";
import type { SubCommand } from "shared/types/command.js";

export const data = ((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('show')
            .setDescription('List all blacklisted authors'));

export async function execute(interaction: ChatInputCommandInteraction) {
    const blacklist = await Blacklist.get(interaction.guildId!);
    let msg: string;
    if (!blacklist || blacklist.length === 0) {
        msg = 'The blacklist is currently empty.';
    } else {
        msg = Formatter.list(blacklist, 'Blacklisted Authors:');
    }

    await interaction.reply({content: msg, flags: MessageFlags.Ephemeral});
}

export const command: SubCommand = { data, execute };