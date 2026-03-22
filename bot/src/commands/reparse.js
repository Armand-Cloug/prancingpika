// commands/reparse.js  [ADMIN]
// /reparse [filename]
// Relance le parser Rust via son API HTTP sur un fichier existant.
// Necessite le role Officer ou Owner de guilde (lie au compte Discord).

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isOfficerOrOwner } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('reparse')
  .setDescription('[Admin] Relance le parser sur un fichier de log existant')
  .addStringOption(opt =>
    opt.setName('filename')
      .setDescription('Nom du fichier de log (ex: combat_20260322.log)')
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

  const filename   = interaction.options.getString('filename');
  const parserUrl  = process.env.PARSER_URL ?? 'http://parser:3001';
  const guildId    = String(member.guildId);

  // Recuperer l'accountId Discord pour l'uploader
  // (on reutilise le membre officer comme uploader)
  let uploaderAccountId = '1'; // fallback
  try {
    const { getDb } = await import('../db.js');
    const db = getDb();
    const [rows] = await db.query(
      `SELECT wa.id FROM web_accounts wa
      WHERE wa.provider = 'discord' AND wa.providerAccountId = ? LIMIT 1`,
      [String(interaction.user.id)]
    );
    if (rows[0]) uploaderAccountId = String(rows[0].id);
  } catch {
    // non-fatal
  }

  let result;
  try {
    const res = await fetch(`${parserUrl}/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName:           filename,
        guildId,
        uploaderAccountId,
      }),
    });
    result = await res.json();
    if (!res.ok) {
      return interaction.editReply(
        `Erreur du parser : ${result?.error ?? res.statusText}`
      );
    }
  } catch (err) {
    return interaction.editReply(`Impossible de contacter le parser : ${err.message}`);
  }

  const embed = new EmbedBuilder()
    .setColor(0x00C853)
    .setTitle('Parser relance avec succes')
    .addFields(
      { name: 'Fichier',           value: filename,                        inline: true },
      { name: 'Fights detectes',   value: String(result.fightsDetected),   inline: true },
      { name: 'Runs importes',     value: String(result.runsInserted),     inline: true },
      { name: 'Runs ignores',      value: String(result.runsSkipped),      inline: true },
    )
    .setFooter({ text: result.message ?? '' });

  return interaction.editReply({ embeds: [embed] });
}
