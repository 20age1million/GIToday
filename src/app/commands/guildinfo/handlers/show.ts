import type { SubCommand } from "shared/types/command.js"
import { SlashCommandSubcommandBuilder} from "discord.js";
import { ChatInputCommandInteraction } from "discord.js";
import { Logger } from "infrastructure/log/log.js";
import { GuildInfo } from "infrastructure/db/guildInfo.js";
import { Formatter } from "shared/formatters/formatter.js";

const data = ((sub: SlashCommandSubcommandBuilder) => 
    sub
        .setName("show")
        .setDescription("List config")
);

async function execute(interaction: ChatInputCommandInteraction){
    const guildId = interaction.guildId!;

    try {
        const cfg = await GuildInfo.get(guildId); // must be guildID since tested in index.ts
        const result = cfg.get("git");
        if (!result) {
            Logger.error(`guildinfo show`, `guild=${guildId}, no git config found`);
            await interaction.editReply("❌ No git config found.");
            return;
        }
        let resultList: string[] = [];

        for (const [key, value] of result!) {
            resultList.push(`${key}: \`${value || "(unset)"}\``);
        }

        await interaction.editReply(Formatter.list(resultList, "Current config:"));
    } catch (err) {
        Logger.error(`guildinfo show`, `guild=${guildId}, error=${err}`);
        await interaction.editReply("❌ Failed to read config.");
    }

    return; 
}


export const command: SubCommand = { data, execute };