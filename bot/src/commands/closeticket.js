// commands/closeticket.js  [ADMIN]
// /closeticket — Ferme (supprime) le ticket dans le salon courant.
// Doit être utilisé depuis un channel ticket (topic = ticket:<userId>).

import { SlashCommandBuilder } from 'discord.js';
import { isAdmin } from '../permissions.js';

export const data = new SlashCommandBuilder()
  .setName('closeticket')
  .setDescription('[Admin] Ferme le ticket dans ce salon');

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: 'Commande réservée aux administrateurs.', ephemeral: true });
  }

  const { channel } = interaction;
  const categoryId = process.env.TICKET_CATEGORY_ID;

  // Vérifier que l'on est bien dans un ticket
  const isTicket = channel.parentId === categoryId && channel.topic?.startsWith('ticket:');
  if (!isTicket) {
    return interaction.reply({
      content: 'Cette commande doit être utilisée dans un salon ticket.',
      ephemeral: true,
    });
  }

  await interaction.reply({ content: 'Fermeture du ticket dans 3 secondes...' });

  setTimeout(() => {
    channel.delete('Ticket fermé par un admin').catch(err => {
      console.error('[closeticket] Erreur suppression channel:', err);
    });
  }, 3000);
}
