// commands/emojis.js
// /emojis — Affiche la signification des emojis utilisés par le bot (rôles et classes).

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('emojis')
  .setDescription('Show the meaning of the emojis used by the bot');

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('Emoji Legend')
    .addFields(
      {
        name: 'Roles',
        value: [
          '⚔️  — DPS',
          '💚  — Healer',
          '🛡️  — Tank',
          '🎵  — Support',
        ].join('\n'),
        inline: true,
      },
      {
        name: 'Callings (Classes)',
        value: [
          '🗡️  — Rogue',
          '✨  — Cleric',
          '⚔️  — Warrior',
          '🌪️  — Primalist',
          '🔮  — Mage',
        ].join('\n'),
        inline: true,
      },
    )
    .setFooter({ text: 'PTPika Bot' });

  return interaction.reply({ embeds: [embed], ephemeral: false });
}
