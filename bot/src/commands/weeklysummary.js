// commands/weeklysummary.js
// /weeklysummary
// Declenche manuellement le resume hebdomadaire.
// Sinon automatique le lundi matin (voir notifications.js).

import { SlashCommandBuilder } from 'discord.js';
import { buildWeeklyEmbed } from '../notifications.js';
import { getWeeklySummary } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('weeklysummary')
  .setDescription('Weekly summary: top 3 players per category on each boss');

export async function execute(interaction) {
  await interaction.deferReply();

  const summary = await getWeeklySummary();
  const bosses  = Object.keys(summary);

  if (!bosses.length) {
    return interaction.editReply('No activity this week.');
  }

  const embeds = buildWeeklyEmbed(summary);

  // Discord accepte max 10 embeds par message
  return interaction.editReply({ embeds: embeds.slice(0, 10) });
}
