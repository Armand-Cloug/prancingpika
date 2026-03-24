// commands/rules.js  [ADMIN]
// /rules title: <title> section1_title: <s1t> section1_content: <s1c> ...
// Poste un embed des règles multi-sections.
// Requiert le rôle Officer ou Owner.

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isAdmin } from '../permissions.js';

export const data = new SlashCommandBuilder()
  .setName('rules')
  .setDescription('[Admin] Poster un embed des règles du serveur')
  .addStringOption(opt =>
    opt.setName('title')
      .setDescription('Titre de l\'embed (ex: Règles du serveur)')
      .setRequired(true))
  .addStringOption(opt =>
    opt.setName('section1_title')
      .setDescription('Titre de la 1ère section')
      .setRequired(true))
  .addStringOption(opt =>
    opt.setName('section1_content')
      .setDescription('Règles de la 1ère section séparées par | (ex: Respecter les joueurs | Pas de spam)')
      .setRequired(true))
  .addStringOption(opt =>
    opt.setName('section2_title')
      .setDescription('Titre de la 2ème section (optionnel)')
      .setRequired(false))
  .addStringOption(opt =>
    opt.setName('section2_content')
      .setDescription('Règles de la 2ème section séparées par | (optionnel)')
      .setRequired(false))
  .addStringOption(opt =>
    opt.setName('section3_title')
      .setDescription('Titre de la 3ème section (optionnel)')
      .setRequired(false))
  .addStringOption(opt =>
    opt.setName('section3_content')
      .setDescription('Règles de la 3ème section séparées par | (optionnel)')
      .setRequired(false));

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: false });

  if (!isAdmin(interaction)) {
    return interaction.editReply('Permission refusée. Cette commande est réservée aux admins.');
  }

  const title = interaction.options.getString('title');

  const sections = [
    { t: interaction.options.getString('section1_title'), c: interaction.options.getString('section1_content') },
    { t: interaction.options.getString('section2_title'), c: interaction.options.getString('section2_content') },
    { t: interaction.options.getString('section3_title'), c: interaction.options.getString('section3_content') },
  ].filter(s => s.t && s.c);

  const embed = new EmbedBuilder()
    .setColor(0xE74C3C)
    .setTitle(title)
    .setFooter({ text: 'PTPika Bot - By Cloug' })
    .setTimestamp();

  for (const section of sections) {
    const rules = section.c.split('|').map(s => s.trim()).filter(Boolean);
    const value = rules.map((rule, i) => `**${i + 1}.** ${rule}`).join('\n');
    embed.addFields({ name: section.t, value });
  }

  return interaction.editReply({ embeds: [embed] });
}
