// commands/lookup.js
// /lookup [pseudo]
// Historique complet d'un joueur : meilleur score par boss.

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import {
  getPlayerHistory,
  classColor, classEmoji, roleEmoji,
  fmtNum,
} from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('lookup')
  .setDescription('Full player history (best score per boss)')
  .addStringOption(opt =>
    opt.setName('pseudo').setDescription('Character name').setRequired(true));

export async function execute(interaction) {
  await interaction.deferReply();

  const pseudo = interaction.options.getString('pseudo');
  const rows   = await getPlayerHistory(pseudo);

  if (!rows.length) {
    return interaction.editReply(`No run found for **${pseudo}**.`);
  }

  const cls   = rows[0].class;
  const color = classColor(cls);
  const clsEmoji = classEmoji(cls);

  const lines = rows.map(r => {
    const role   = roleEmoji(r.role);
    const dps    = fmtNum(r.best_dps);
    const hps    = r.best_hps > 0 ? ` / ${fmtNum(r.best_hps)} HPS` : '';
    const aps    = r.best_aps > 0 ? ` / ${fmtNum(r.best_aps)} APS` : '';
    const count  = r.run_count;
    return `${role} **${r.boss_name}** — ${dps} DPS${hps}${aps}  *(${count} run${count > 1 ? 's' : ''})*`;
  });

  // Discord embed description limitee a 4096 chars — on coupe si besoin
  const description = lines.join('\n').slice(0, 4000);

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${clsEmoji} ${pseudo} — History`)
    .setDescription(description);

  return interaction.editReply({ embeds: [embed] });
}
