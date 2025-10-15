// ls repos
// ls branches [repo]
// ls people <repo>

import { command as branches } from "./handlers/branches.js";
import { command as repos } from "./handlers/repos.js";
import { command as people } from "./handlers/people.js";

import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
} from "discord.js";

import { GuildInfo } from "infrastructure/db/guildInfo.js";
import { Logger } from "infrastructure/log/log.js";


const data = new SlashCommandBuilder()
    .setName("ls")
    .setDescription("List repos / branches / people")
    .addSubcommand(branches.data)
    .addSubcommand(repos.data)
    .addSubcommand(people.data);

async function execute(interaction: ChatInputCommandInteraction) {
    Logger.log("Command", `/ls command invoked by ${interaction.user.tag}`);
    await interaction.deferReply();
    
    if (! await (GuildInfo.infoComplete(interaction.guildId!))) {
        Logger.warn("Command", `/ls aborted: repo info not set for guild ${interaction.guildId}`);
        await interaction.editReply({
            content: "Please set up repo info first using /guildinfo set",
        });
        return;
    }

    const sub = interaction.options.getSubcommand();

    switch (sub) {
        case "repos":
            await repos.execute(interaction);
            break;
        case "branches":
            await branches.execute(interaction);
            break;
        case "people":
            await people.execute(interaction);
            break;
        default:
            await interaction.editReply({ content: `Unknown subcommand: ${sub}` });
            break;
    }
}

export const command = { data, execute };