// scripts/link-players.js
// Exécuté automatiquement à chaque deploy. Idempotent.
// Ne modifie que les players dont webAccountId est encore null.

const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[link-players] DATABASE_URL manquante — abandon.");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url) });

async function main() {
  const chars = await prisma.riftCharacter.findMany({
    include: { webAccount: { select: { id: true } } },
  });

  let linked = 0;
  for (const char of chars) {
    if (!char.webAccount) continue;
    const updated = await prisma.player.updateMany({
      where: { name: char.name, webAccountId: null },
      data: { webAccountId: char.webAccount.id },
    });
    linked += updated.count;
  }
  console.log(`[link-players] ${linked} player(s) newly linked`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
