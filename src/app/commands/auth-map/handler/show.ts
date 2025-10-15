import type { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { AuthMap } from "infrastructure/db/authMap.js";
import { Formatter } from "shared/formatters/formatter.js";
import type { SubCommand } from "shared/types/command.js";

const data = ((sub: SlashCommandSubcommandBuilder) =>
    sub
        .setName("show")
        .setDescription("Show all authenticated maps")
);

async function execute(interaction: ChatInputCommandInteraction) {
    const map = await AuthMap.get(interaction.guildId!);
    let msg: string;

    if (map.size === 0) {
        msg = "No maps are authenticated";
    } else {
        msg = Formatter.list(Array.from(map, ([k, v]) => `${k} : ${v}`), "Authenticated maps:");
    }

    await interaction.reply({ content: msg, ephemeral: true });
}

export const command: SubCommand = { data, execute };