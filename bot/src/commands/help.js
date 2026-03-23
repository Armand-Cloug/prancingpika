// commands/help.js
// /help
// Displays all available bot commands.

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Show all available commands');

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📖 Prancing Pika — Commands')
    .addFields(
      {
        name: '🔍 Stats & Lookup',
        value: [
          '`/lookup <character>` — Full history of a player (best score per boss)',
          '`/personalbest <character> <boss>` — Best score of a player on a specific boss',
          '`/top <boss> [limit]` — Top DPS on a boss across all guilds (default top 10)',
          '`/compare <player1> <player2> <boss>` — Side-by-side comparison of two players on a boss',
        ].join('\n'),
      },
      {
        name: '📊 Runs',
        value: [
          '`/lastrun` — Show the last uploaded run with roster and group stats',
          '`/weeklysummary` — Weekly top 3 players per category on each boss',
        ].join('\n'),
      },
      {
        name: '🔒 Admin only',
        value: [
          '`/changelog <title> <updates>` — Post a changelog embed (separate updates with `|`)',
          '`/reparse <filename>` — Re-run the parser on an existing log file',
          '`/deleterun <run_id>` — Delete a run from the database',
        ].join('\n'),
      },
    )
    .setFooter({ text: 'Admin commands require Officer or Owner role.' });

  return interaction.reply({ embeds: [embed], ephemeral: false });
}
