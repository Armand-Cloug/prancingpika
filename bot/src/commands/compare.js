// commands/compare.js
// /compare [pseudo1] [pseudo2] [boss]
// Compare cote a cote deux joueurs sur un boss.

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import {
  comparePlayers,
  classColor, classEmoji, roleEmoji,
  fmtNum, fmtDuration,
} from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('compare')
  .setDescription('Compare two players on a boss')
  .addStringOption(opt =>
    opt.setName('pseudo1').setDescription('First player').setRequired(true))
  .addStringOption(opt =>
    opt.setName('pseudo2').setDescription('Second player').setRequired(true))
  .addStringOption(opt =>
    opt.setName('boss').setDescription('Boss name').setRequired(true));

function playerField(record, label) {
  if (!record) return `${label}\n*No record*`;
  const lines = [
    `**DPS:** ${fmtNum(record.dps)}`,
    `**HPS:** ${fmtNum(record.hps)}`,
    record.aps > 0 ? `**APS:** ${fmtNum(record.aps)}` : null,
    `**Role:** ${record.role ?? '—'} ${roleEmoji(record.role)}`,
    `**Class:** ${record.class ?? '—'} ${classEmoji(record.class)}`,
    `**Duration:** ${fmtDuration(record.duration_s)}`,
    `*${record.guild_name}*`,
  ].filter(Boolean);
  return lines.join('\n');
}

function winner(val1, val2) {
  if (val1 == null || val2 == null) return '';
  if (val1 > val2) return ' ✅';
  if (val2 > val1) return ' ❌';
  return ' 🟰';
}

export async function execute(interaction) {
  await interaction.deferReply();

  const p1Name = interaction.options.getString('pseudo1');
  const p2Name = interaction.options.getString('pseudo2');
  const boss   = interaction.options.getString('boss');

  const { p1, p2 } = await comparePlayers(p1Name, p2Name, boss);

  if (!p1 && !p2) {
    return interaction.editReply(
      `No record found for **${p1Name}** or **${p2Name}** on **${boss}**.`
    );
  }

  const bossName = p1?.boss_name ?? p2?.boss_name ?? boss;

  // Couleur basee sur la classe du p1 en priorite
  const color = classColor(p1?.class ?? p2?.class);

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`⚖️ ${p1Name} vs ${p2Name} — ${bossName}`)
    .addFields(
      {
        name: `${classEmoji(p1?.class)} ${p1?.player_name ?? p1Name}${winner(p1?.dps, p2?.dps)}`,
        value: playerField(p1, p1Name),
        inline: true,
      },
      {
        name: `${classEmoji(p2?.class)} ${p2?.player_name ?? p2Name}${winner(p2?.dps, p1?.dps)}`,
        value: playerField(p2, p2Name),
        inline: true,
      }
    );

  // Ligne de comparaison DPS si les deux existent
  if (p1 && p2) {
    const diff = Math.abs(p1.dps - p2.dps);
    const who  = p1.dps >= p2.dps ? (p1.player_name ?? p1Name) : (p2.player_name ?? p2Name);
    embed.setFooter({ text: `DPS gap: ${fmtNum(diff)} — advantage ${who}` });
  }

  return interaction.editReply({ embeds: [embed] });
}
