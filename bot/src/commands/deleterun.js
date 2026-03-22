// commands/deleterun.js  [ADMIN]
// /deleterun [run_id]
// Supprime un run de la DB.
// Necessite le role Officer ou Owner de guilde.

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isOfficerOrOwner, deleteRun, getDb } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('deleterun')
  .setDescription('[Admin] Supprime un run de la base de donnees')
  .addIntegerOption(opt =>
    opt.setName('run_id')
      .setDescription('ID du run a supprimer')
      .setRequired(true));

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  // Verification du role
  const member = await isOfficerOrOwner(interaction.user.id);
  if (!member) {
    return interaction.editReply(
      'Permission refusee. Cette commande necessite le role **Officer** ou **Owner** d\'une guilde.'
    );
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
    return interaction.editReply(`Run #${runId} introuvable en base.`);
  }

  const deleted = await deleteRun(runId);

  if (!deleted) {
    return interaction.editReply(`Echec de la suppression du run #${runId}.`);
  }

  const embed = new EmbedBuilder()
    .setColor(0xE53935)
    .setTitle('Run supprime')
    .addFields(
      { name: 'ID',      value: String(runId),                           inline: true },
      { name: 'Boss',    value: runInfo.boss_name,                       inline: true },
      { name: 'Guilde',  value: runInfo.guild_name,                      inline: true },
      { name: 'Date',    value: new Date(runInfo.startedAt).toLocaleDateString('fr-FR'), inline: true },
      { name: 'Supprime par', value: `<@${interaction.user.id}>`,       inline: true },
    );

  return interaction.editReply({ embeds: [embed] });
}
