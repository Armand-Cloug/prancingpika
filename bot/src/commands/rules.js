// commands/rules.js  [ADMIN]
// /rules content: <rule1> | <rule2> | ...
// Poste un embed des règles du serveur.
// Requiert le rôle Officer ou Owner.

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isOfficerOrOwner } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('rules')
  .setDescription('[Admin] Poster un embed des règles du serveur')
  .addStringOption(opt =>
    opt.setName('content')
      .setDescription('Règles séparées par | (ex: Respecter les joueurs | Pas de spam | ...)')
      .setRequired(true));

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: false });

  const member = await isOfficerOrOwner(interaction.user.id);
  if (!member) {
    return interaction.editReply(
      'Permission refusée. Cette commande requiert le rôle **Officer** ou **Owner** d\'une guilde.'
    );
  }

  const raw = interaction.options.getString('content');

  const rules = raw
    .split('|')
    .map(s => s.trim())
    .filter(Boolean);

  if (!rules.length) {
    return interaction.editReply('Aucune règle fournie. Séparez chaque règle avec `|`.');
  }

  const description = rules.map((rule, i) => `**${i + 1}.** ${rule}`).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0xE74C3C)
    .setTitle('Règles du serveur')
    .setDescription(description)
    .setFooter({ text: 'PTPika Bot - By Cloug' })
    .setTimestamp();

  return interaction.editReply({ embeds: [embed] });
}
