// commands/renameticket.js
// /renameticket <name> — Renomme le salon ticket courant.
// Ne fonctionne que dans un salon ticket (topic = ticket:<userId>).

import { SlashCommandBuilder, MessageFlags } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('renameticket')
  .setDescription('Rename the current ticket channel')
  .addStringOption(opt =>
    opt.setName('name')
      .setDescription('New channel name')
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(100));

export async function execute(interaction) {
  const { channel } = interaction;
  const categoryId = process.env.TICKET_CATEGORY_ID;

  // Silencieux si pas dans un ticket
  const isTicket = categoryId && channel.parentId === categoryId && channel.topic?.startsWith('ticket:');
  if (!isTicket) return;

  const newName = interaction.options.getString('name');

  try {
    await channel.setName(newName);
    return interaction.reply({ content: `Channel renamed to **${newName}**.`, flags: MessageFlags.Ephemeral });
  } catch (err) {
    console.error('[renameticket] Erreur rename:', err);
    return interaction.reply({ content: 'Failed to rename the channel.', flags: MessageFlags.Ephemeral });
  }
}
