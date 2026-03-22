// commands/personalbest.js
// /personalbest [pseudo] [boss]
// Affiche le meilleur score DPS/HPS/APS d'un joueur sur un boss.

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import {
  getPersonalBest,
  classColor, classEmoji, roleEmoji,
  fmtNum, fmtDuration,
} from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('personalbest')
  .setDescription('Meilleur score d\'un joueur sur un boss')
  .addStringOption(opt =>
    opt.setName('pseudo').setDescription('Nom du personnage').setRequired(true))
  .addStringOption(opt =>
    opt.setName('boss').setDescription('Nom du boss').setRequired(true));

export async function execute(interaction) {
  await interaction.deferReply();

  const pseudo = interaction.options.getString('pseudo');
  const boss   = interaction.options.getString('boss');

  const record = await getPersonalBest(pseudo, boss);

  if (!record) {
    return interaction.editReply(
      `Aucun record trouve pour **${pseudo}** sur **${boss}**.`
    );
  }

  const color = classColor(record.class);
  const clsEmoji = classEmoji(record.class);
  const rEmoji   = roleEmoji(record.role);

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${clsEmoji} Record de ${record.player_name} sur ${record.boss_name}`)
    .setFooter({ text: `Run #${record.run_id} — ${record.guild_name}` })
    .setTimestamp(new Date(record.startedAt))
    .addFields(
      { name: '⚔️ DPS',   value: fmtNum(record.dps),      inline: true },
      { name: '💚 HPS',   value: fmtNum(record.hps),      inline: true },
      { name: '🛡️ APS',   value: fmtNum(record.aps) === '0' ? '—' : fmtNum(record.aps), inline: true },
      { name: `${rEmoji} Role`,  value: record.role  ?? '—', inline: true },
      { name: `${clsEmoji} Classe`, value: record.class ?? '—', inline: true },
      { name: '⏱️ Temps', value: fmtDuration(record.duration_s), inline: true },
    );

  return interaction.editReply({ embeds: [embed] });
}
