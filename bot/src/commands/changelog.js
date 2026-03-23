// commands/changelog.js  [ADMIN]
// /changelog title: <title> updates: <update1> | <update2> | ...
// Posts a changelog embed with a title and a bullet list of updates.
// Requires Officer or Owner role.

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isOfficerOrOwner } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('changelog')
  .setDescription('[Admin] Post a changelog embed with a title and a list of updates')
  .addStringOption(opt =>
    opt.setName('title')
      .setDescription('Changelog title (e.g.: Patch 1.2.0)')
      .setRequired(true))
  .addStringOption(opt =>
    opt.setName('updates')
      .setDescription('Updates separated by | (e.g.: New boss | Balance changes | Bug fixes)')
      .setRequired(true));

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: false });

  const member = await isOfficerOrOwner(interaction.user.id);
  if (!member) {
    return interaction.editReply(
      'Permission denied. This command requires the **Officer** or **Owner** role of a guild.'
    );
  }

  const title   = interaction.options.getString('title');
  const raw     = interaction.options.getString('updates');

  const items = raw
    .split('|')
    .map(s => s.trim())
    .filter(Boolean);

  if (!items.length) {
    return interaction.editReply('No updates provided. Separate each entry with `|`.');
  }

  const description = items.map(item => `• ${item}`).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`📋 ${title}`)
    .setDescription(description)
    .setFooter({ text: `Posted by ${interaction.user.username} | PTPika Bot - By Cloug` })
    .setTimestamp();

  return interaction.editReply({ embeds: [embed] });
}
