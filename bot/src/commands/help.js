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
        name: 'ℹ️ General',
        value: [
          '`/emojis` — Show the meaning of the emojis used by the bot (roles & callings)',
        ].join('\n'),
      },
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
        name: '🎫 Tickets',
        value: [
          '`/ticket` — Post the ticket creation panel in the current channel (admin)',
          '`/closeticket` — Close (delete) the current ticket channel (admin)',
          '`/renameticket <name>` — Rename the current ticket channel (must be used inside a ticket)',
        ].join('\n'),
      },
      {
        name: '🔒 Admin only',
        value: [
          '`/changelog <title> <updates>` — Post a changelog embed (separate updates with `|`)',
          '`/rules <title> <section1_title> <section1_content> [...]` — Post a rules embed (up to 3 sections, separate entries with `|`)',
          '`/presentation <title> <section1_title> <section1_content> [...]` — Post a presentation embed (up to 3 sections)',
          '`/reparse <filename>` — Re-run the parser on an existing log file',
          '`/deleterun <run_id>` — Delete a run from the database',
        ].join('\n'),
      },
    )
    .setFooter({ text: 'Admin commands: server owner or admin role only. | PTPika Bot - By Cloug' });

  return interaction.reply({ embeds: [embed], ephemeral: false });
}
