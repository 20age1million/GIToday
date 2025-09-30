import type { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getMap } from '../../../lib/people-configs/map.js'
import { formatList } from "../../../lib/formatters/formatList.js";
import { stringify } from "querystring";

export const data = ((sub: SlashCommandSubcommandBuilder) =>
    sub
        .setName("show")
        .setDescription("Show all authenticated maps")
);

export async function execute(interaction: ChatInputCommandInteraction) {
    const map = await getMap();
    let msg: string;

    if (map.size === 0) {
        msg = "No maps are authenticated";
    } else {
        msg = formatList(Array.from(map, ([k, v]) => `${k} : ${v}`), "Authenticated maps:");
    }

    await interaction.reply({ content: msg, ephemeral: true });
}
