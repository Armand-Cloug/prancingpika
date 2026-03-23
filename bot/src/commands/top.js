// commands/top.js
// /top [boss]
// Affiche le top 10 DPS sur un boss (toutes guildes).

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getTopDps, classEmoji, fmtNum, fmtDuration } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('top')
  .setDescription('Top 10 DPS on a boss (all guilds)')
  .addStringOption(opt =>
    opt.setName('boss').setDescription('Boss name').setRequired(true))
  .addIntegerOption(opt =>
    opt.setName('limit').setDescription('Number of players (default 10, max 25)').setRequired(false));

export async function execute(interaction) {
  await interaction.deferReply();

  const boss  = interaction.options.getString('boss');
  const limit = Math.min(interaction.options.getInteger('limit') ?? 10, 25);

  const rows = await getTopDps(boss, limit);

  if (!rows.length) {
    return interaction.editReply(`No run found for boss **${boss}**.`);
  }

  const bossName = rows[0].player_name ? boss : boss;

  const lines = rows.map((r, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
    const cls   = classEmoji(r.class);
    const dps   = fmtNum(r.dps);
    const dur   = fmtDuration(r.duration_s);
    return `${medal} ${cls} **${r.player_name}** — ${dps} DPS [${dur}] *(${r.guild_name})*`;
  });

  const embed = new EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle(`Top ${limit} DPS — ${boss}`)
    .setDescription(lines.join('\n'));

  return interaction.editReply({ embeds: [embed] });
}
