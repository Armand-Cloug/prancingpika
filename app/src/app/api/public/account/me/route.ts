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

  const memberships = await prisma.guildMember.findMany({
    where: { accountId: account.id },
    include: { guild: true },
    orderBy: { joinedAt: "desc" },
  });

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
  });
}
