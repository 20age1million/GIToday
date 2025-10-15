// ls repos
// ls branches [repo]
// ls people <repo>

import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageFlags,
    ChannelType
} from "discord.js";

import { command as show } from "./handlers/show.js";
import { command as set } from "./handlers/set.js";

export const data = new SlashCommandBuilder()
    .setName("schedule")
    .setDescription("schedule set/show")
    .addSubcommand(show.data)
    .addSubcommand(set.data);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "❌ This command must be used in a server (guild).",
      flags: MessageFlags.Ephemeral, 
    });
    return;
  }

  const sub = interaction.options.getSubcommand();

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (sub === "show") {
    return show.execute(interaction);
  }

  if (sub === "set") {
    return set.execute(interaction);
  }

  // Unknown subcommand fallback
  await interaction.reply({ content: "Unknown subcommand.", flags: MessageFlags.Ephemeral });
}

export const command = { data, execute };