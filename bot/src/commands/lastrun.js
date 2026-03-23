// commands/lastrun.js
// /lastrun
// Affiche le dernier run uploade avec boss, guilde, temps, DPS groupe, roster top 5.

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getLastRun, getRunRoster, classEmoji, roleEmoji, fmtNum, fmtDuration } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('lastrun')
  .setDescription('Show the last uploaded run');

export async function execute(interaction) {
  await interaction.deferReply();

  const run = await getLastRun();
  if (!run) {
    return interaction.editReply('No run found in database.');
  }

  const roster = await getRunRoster(run.run_id, 5);

  const rosterLines = roster.map((r, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
    const cls   = classEmoji(r.class);
    const role  = roleEmoji(r.role);
    return `${medal} ${cls}${role} **${r.player_name}** — ${fmtNum(r.dps)} DPS`;
  });

  const guildDisplay = run.guild_tag
    ? `${run.guild_name} [${run.guild_tag}]`
    : run.guild_name;

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`📋 Last run — ${guildDisplay}`)
    .setTimestamp(new Date(run.createdAt))
    .addFields(
      { name: '🐉 Boss',        value: run.boss_name,               inline: true },
      { name: '⏱️ Duration',    value: fmtDuration(run.duration_s), inline: true },
      { name: '💥 Group DPS',   value: fmtNum(run.dpsGroup),        inline: true },
      { name: '💚 Group HPS',   value: fmtNum(run.hpsGroup),        inline: true },
      run.apsGroup > 0
        ? { name: '🛡️ Group APS', value: fmtNum(run.apsGroup), inline: true }
        : { name: '\u200b', value: '\u200b', inline: true },
      { name: '🏆 Top 5', value: rosterLines.join('\n') || '—', inline: false },
    );

  return interaction.editReply({ embeds: [embed] });
}
