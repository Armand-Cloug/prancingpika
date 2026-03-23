// commands/presentation.js  [ADMIN]
// /presentation title: <title> subtitle: <subtitle> content: <content>
// Poste un embed de présentation du projet.
// Requiert le rôle Officer ou Owner.

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isOfficerOrOwner } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('presentation')
  .setDescription('[Admin] Poster un embed de présentation du projet')
  .addStringOption(opt =>
    opt.setName('title')
      .setDescription('Titre principal de la présentation')
      .setRequired(true))
  .addStringOption(opt =>
    opt.setName('subtitle')
      .setDescription('Sous-titre de la présentation')
      .setRequired(true))
  .addStringOption(opt =>
    opt.setName('content')
      .setDescription('Contenu de la présentation (séparer les paragraphes avec |)')
      .setRequired(true));

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: false });

  const member = await isOfficerOrOwner(interaction.user.id);
  if (!member) {
    return interaction.editReply(
      'Permission refusée. Cette commande requiert le rôle **Officer** ou **Owner** d\'une guilde.'
    );
  }

  const title    = interaction.options.getString('title');
  const subtitle = interaction.options.getString('subtitle');
  const raw      = interaction.options.getString('content');

  const paragraphs = raw
    .split('|')
    .map(s => s.trim())
    .filter(Boolean);

  const description = paragraphs.join('\n\n');

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(title)
    .setDescription(`*${subtitle}*\n\n${description}`)
    .setFooter({ text: 'PTPika Bot - By Cloug' })
    .setTimestamp();

  return interaction.editReply({ embeds: [embed] });
}
