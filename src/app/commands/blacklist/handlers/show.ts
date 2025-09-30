import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, MessageFlags} from "discord.js"
import { getBlacklist } from '../../../lib/people-configs/blacklist.js'
import { formatList } from "../../../lib/formatters/formatList.js";

export const data = ((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('show')
            .setDescription('List all blacklisted authors'));

export async function execute(interaction: ChatInputCommandInteraction) {
    const blacklist = await getBlacklist();
    let msg: string;
    if (!blacklist || blacklist.length === 0) {
        msg = 'The blacklist is currently empty.';
    } else {
        msg = formatList(blacklist, 'Blacklisted Authors:');
    }

    await interaction.reply({content: msg, flags: MessageFlags.Ephemeral});
}
