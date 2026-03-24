// commands/ticket.js  [ADMIN]
// /ticket — Envoie le panneau de création de ticket dans le salon courant.
// Le bouton "Créer un ticket" crée un channel privé dans la catégorie TICKET_CATEGORY_ID.
// Une seule limite : un ticket actif par utilisateur.

import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';
import { isAdmin } from '../permissions.js';

export const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('[Admin] Envoie le panneau de création de ticket dans ce salon');

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: 'Commande réservée aux administrateurs.', ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('Support — Tickets')
    .setDescription(
      'Need help or want to report something? Open a private ticket and an admin will get back to you.\n\n' +
      '**You can open a ticket for:**\n' +
      '• 🐛 Reporting a bug on the website or the bot\n' +
      '• 📊 Reporting a suspicious or bugged parse\n' +
      '• 🗑️ Requesting a run to be deleted or restored\n' +
      '• 👤 Requesting account deletion or other account-related actions\n' +
      '• 💬 Any general question or request about the app'
    )
    .setFooter({ text: 'One active ticket per person.' });

  const button = new ButtonBuilder()
    .setCustomId('ticket_create')
    .setLabel('+ Créer un ticket')
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(button);

  return interaction.reply({ embeds: [embed], components: [row] });
}

// Handler appelé depuis discord.js lors du clic sur le bouton ticket_create
export async function handleTicketCreate(interaction) {
  const { guild, user } = interaction;
  const categoryId = process.env.TICKET_CATEGORY_ID;

  if (!categoryId) {
    return interaction.reply({
      content: 'La catégorie de tickets n\'est pas configurée (`TICKET_CATEGORY_ID` manquant).',
      ephemeral: true,
    });
  }

  // Vérifier si l'utilisateur a déjà un ticket ouvert dans la catégorie
  const existing = guild.channels.cache.find(
    ch => ch.parentId === categoryId && ch.topic === `ticket:${user.id}`
  );
  if (existing) {
    return interaction.reply({
      content: `Vous avez déjà un ticket ouvert : ${existing}`,
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const adminRoleId  = process.env.ADMIN_ROLE_ID;

  const permissionOverwrites = [
    // Personne ne voit le channel par défaut
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    // Le créateur du ticket
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
  ];

  // Rôle admin
  if (adminRoleId) {
    permissionOverwrites.push({
      id: adminRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
      ],
    });
  }

  // Owner du serveur (si différent du créateur)
  if (guild.ownerId !== user.id) {
    permissionOverwrites.push({
      id: guild.ownerId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
      ],
    });
  }

  let channel;
  try {
    channel = await guild.channels.create({
      name: `ticket-${user.username}`,
      type: ChannelType.GuildText,
      parent: categoryId,
      topic: `ticket:${user.id}`,
      permissionOverwrites,
    });
  } catch (err) {
    console.error('[ticket] Erreur création channel:', err);
    return interaction.editReply('Impossible de créer le ticket. Vérifiez les permissions du bot sur la catégorie.');
  }

  const welcomeEmbed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle('Ticket opened')
    .setDescription(
      `Hello <@${user.id}>!\n\n` +
      'Your ticket has been created. Please describe your issue or request and an admin will respond as soon as possible.\n\n' +
      'To close this ticket, an admin can use `/closeticket`.'
    )
    .setFooter({ text: `Ticket by ${user.username}` })
    .setTimestamp();

  await channel.send({ content: `<@${user.id}>`, embeds: [welcomeEmbed] });

  return interaction.editReply({ content: `Votre ticket a été créé : ${channel}` });
}
