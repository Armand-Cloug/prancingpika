// commands/presentation.js  [ADMIN]
// /presentation title: <title> section1_title: <s1t> section1_content: <s1c> ...
// Poste un embed de présentation multi-sections.
// Requiert le rôle Officer ou Owner.

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isOfficerOrOwner } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('presentation')
  .setDescription('[Admin] Poster un embed de présentation du projet')
  .addStringOption(opt =>
    opt.setName('title')
      .setDescription('Titre principal')
      .setRequired(true))
  .addStringOption(opt =>
    opt.setName('section1_title')
      .setDescription('Sous-titre de la 1ère section')
      .setRequired(true))
  .addStringOption(opt =>
    opt.setName('section1_content')
      .setDescription('Contenu de la 1ère section (séparer les paragraphes avec |)')
      .setRequired(true))
  .addStringOption(opt =>
    opt.setName('section2_title')
      .setDescription('Sous-titre de la 2ème section (optionnel)')
      .setRequired(false))
  .addStringOption(opt =>
    opt.setName('section2_content')
      .setDescription('Contenu de la 2ème section (optionnel, séparer avec |)')
      .setRequired(false))
  .addStringOption(opt =>
    opt.setName('section3_title')
      .setDescription('Sous-titre de la 3ème section (optionnel)')
      .setRequired(false))
  .addStringOption(opt =>
    opt.setName('section3_content')
      .setDescription('Contenu de la 3ème section (optionnel, séparer avec |)')
      .setRequired(false));

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: false });

  const member = await isOfficerOrOwner(interaction.user.id);
  if (!member) {
    return interaction.editReply(
      'Permission refusée. Cette commande requiert le rôle **Officer** ou **Owner** d\'une guilde.'
    );
  }

  const title = interaction.options.getString('title');

  const sections = [
    { t: interaction.options.getString('section1_title'), c: interaction.options.getString('section1_content') },
    { t: interaction.options.getString('section2_title'), c: interaction.options.getString('section2_content') },
    { t: interaction.options.getString('section3_title'), c: interaction.options.getString('section3_content') },
  ].filter(s => s.t && s.c);

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(title)
    .setFooter({ text: 'PTPika Bot - By Cloug' })
    .setTimestamp();

  for (const section of sections) {
    const paragraphs = section.c.split('|').map(s => s.trim()).filter(Boolean);
    embed.addFields({ name: section.t, value: paragraphs.join('\n\n') });
  }

  return interaction.editReply({ embeds: [embed] });
}
