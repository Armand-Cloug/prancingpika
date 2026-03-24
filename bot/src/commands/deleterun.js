// commands/deleterun.js  [ADMIN]
// /deleterun [run_id]
// Supprime un run de la DB.
// Necessite le role Officer ou Owner de guilde.

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { deleteRun, getDb } from '../db.js';
import { isAdmin } from '../permissions.js';

export const data = new SlashCommandBuilder()
  .setName('deleterun')
  .setDescription('[Admin] Delete a run from the database')
  .addIntegerOption(opt =>
    opt.setName('run_id')
      .setDescription('Run ID to delete')
      .setRequired(true));

export async function execute(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (!isAdmin(interaction)) {
    return interaction.editReply('Permission denied. This command is restricted to admins.');
  }

  const runId = interaction.options.getInteger('run_id');

  // Recuperer les infos du run avant suppression (pour confirmation)
  let runInfo = null;
  try {
    const db = getDb();
    const [rows] = await db.query(
      `SELECT r.id, b.name AS boss_name, g.name AS guild_name, r.startedAt
      FROM runs r
      JOIN bosses b ON r.bossId  = b.id
      JOIN guilds g ON r.guildId = g.id
      WHERE r.id = ?`,
      [runId]
    );
    runInfo = rows[0] ?? null;
  } catch {
    // non-fatal
  }

  if (!runInfo) {
    return interaction.editReply(`Run #${runId} not found in database.`);
  }

  const deleted = await deleteRun(runId);

  if (!deleted) {
    return interaction.editReply(`Failed to delete run #${runId}.`);
  }

  const embed = new EmbedBuilder()
    .setColor(0xE53935)
    .setTitle('Run deleted')
    .addFields(
      { name: 'ID',           value: String(runId),                                          inline: true },
      { name: 'Boss',         value: runInfo.boss_name,                                      inline: true },
      { name: 'Guild',        value: runInfo.guild_name,                                     inline: true },
      { name: 'Date',         value: new Date(runInfo.startedAt).toLocaleDateString('en-US'), inline: true },
      { name: 'Deleted by',   value: `<@${interaction.user.id}>`,                            inline: true },
    );

  return interaction.editReply({ embeds: [embed] });
}
