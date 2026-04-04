// scripts/link-players.ts
// Exécuté automatiquement à chaque deploy via le Dockerfile / entrypoint.
// Idempotent : ne modifie que les players non encore liés (webAccountId IS NULL).

import { prisma } from "@/lib/prisma"

async function main() {
  const chars = await prisma.riftCharacter.findMany({
    include: { webAccount: { select: { id: true } } }
  })

  let linked = 0
  for (const char of chars) {
    if (!char.webAccount) continue
    const updated = await prisma.player.updateMany({
      where: { name: char.name, webAccountId: null },
      data:  { webAccountId: char.webAccount.id }
    })
    linked += updated.count
  }
  console.log(`[link-players] ${linked} player(s) newly linked`)
}
main().catch(console.error).finally(() => prisma.$disconnect())
