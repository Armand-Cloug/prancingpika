// commands/reparse.js  [ADMIN]
// /reparse [filename]
// Relance le parser Rust via son API HTTP sur un fichier existant.
// Necessite le role Officer ou Owner de guilde (lie au compte Discord).

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getDb } from '../db.js';
import { isAdmin } from '../permissions.js';

export const data = new SlashCommandBuilder()
  .setName('reparse')
  .setDescription('[Admin] Re-run the parser on an existing log file')
  .addStringOption(opt =>
    opt.setName('filename')
      .setDescription('Log file name (e.g.: combat_20260322.log)')
      .setRequired(true));

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  if (!isAdmin(interaction)) {
    return interaction.editReply('Permission denied. This command is restricted to admins.');
  }

  const filename  = interaction.options.getString('filename');
  const parserUrl = process.env.PARSER_URL ?? 'http://parser:3001';

  // Récupérer l'accountId et le guildId DB de l'utilisateur
  let uploaderAccountId = '1';
  let guildId           = '1';
  try {
    const db = getDb();
    const [rows] = await db.query(
      `SELECT wa.id AS accountId, gm.guildId
       FROM web_accounts wa
       LEFT JOIN guild_members gm ON gm.accountId = wa.id
       WHERE wa.provider = 'discord' AND wa.providerAccountId = ?
       LIMIT 1`,
      [String(interaction.user.id)]
    );
    if (rows[0]) {
      uploaderAccountId = String(rows[0].accountId);
      if (rows[0].guildId) guildId = String(rows[0].guildId);
    }
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
        `Parser error: ${result?.error ?? res.statusText}`
      );
    }
  } catch (err) {
    return interaction.editReply(`Unable to contact the parser: ${err.message}`);
  }

  const embed = new EmbedBuilder()
    .setColor(0x00C853)
    .setTitle('Parser successfully re-run')
    .addFields(
      { name: 'File',              value: filename,                        inline: true },
      { name: 'Fights detected',   value: String(result.fightsDetected),   inline: true },
      { name: 'Runs imported',     value: String(result.runsInserted),     inline: true },
      { name: 'Runs skipped',      value: String(result.runsSkipped),      inline: true },
    )
    .setFooter({ text: result.message ?? '' });

  return interaction.editReply({ embeds: [embed] });
}
