import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateWebAccount } from "@/lib/account";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const account = await getOrCreateWebAccount(session.user as any);

  const [memberships, riftData] = await Promise.all([
    prisma.guildMember.findMany({
      where: { accountId: account.id },
      include: { guild: true },
      orderBy: { joinedAt: "desc" },
    }),
    prisma.webAccount.findUnique({
      where: { id: account.id },
      select: {
        riftLocked: true,
        riftLinkedAt: true,
        riftCharacters: {
          select: {
            name: true,
            shard: true,
            calling: true,
            level: true,
            guild: true,
            lastSeenAt: true,
          },
          orderBy: { level: "desc" },
        },
      },
    }),
  ]);

  return NextResponse.json({
    account: {
      id: account.id.toString(),
      pseudo: account.pseudo,
      provider: account.provider,
    },
    guilds: memberships.map((m) => ({
      id: m.guildId.toString(),
      name: m.guild.name,
      tag: m.guild.tag,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
    rift: {
      locked: riftData?.riftLocked ?? false,
      linkedAt: riftData?.riftLinkedAt ?? null,
      characters: (riftData?.riftCharacters ?? []).map((c) => ({
        name: c.name,
        shard: c.shard,
        calling: c.calling,
        level: c.level,
        guild: c.guild,
        lastSeenAt: c.lastSeenAt,
      })),
    },
  });
}
