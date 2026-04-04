// Résout le nom d'affichage d'un player :
// → displayName du compte lié si disponible
// → sinon le nom original du player
export function resolvePlayerName(player: {
  name: string
  webAccount?: { displayName: string | null } | null
}): string {
  return player.webAccount?.displayName ?? player.name
}
