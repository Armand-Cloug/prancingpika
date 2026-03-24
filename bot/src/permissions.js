// src/permissions.js
// Contrôle d'accès aux commandes admin.
//
// Un utilisateur est admin si :
//   1. Il est propriétaire (owner) du serveur Discord, OU
//   2. Il possède le rôle dont l'ID est défini dans ADMIN_ROLE_ID (.env)

/**
 * Retourne true si l'utilisateur est autorisé à utiliser les commandes admin.
 * @param {import('discord.js').Interaction} interaction
 */
export function isAdmin(interaction) {
  const { guild, member, user } = interaction;

  // Commande en DM → refus
  if (!guild || !member) return false;

  // Propriétaire du serveur Discord
  if (guild.ownerId === user.id) return true;

  // Rôle admin configuré dans .env
  const adminRoleId = process.env.ADMIN_ROLE_ID;
  if (adminRoleId && member.roles?.cache?.has(adminRoleId)) return true;

  return false;
}
