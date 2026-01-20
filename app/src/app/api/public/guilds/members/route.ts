import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthIdentity } from "@/lib/auth-identity";

function toBigInt(v: string): bigint | null {
  try {
    return BigInt(v);
  } catch {
    return null;
  }
}

async function requireAccountId(req: NextRequest): Promise<
  { ok: true; accountId: bigint } | { ok: false; res: NextResponse }
> {
  const auth = await requireAuthIdentity(req);
  if (!auth.ok) return { ok: false, res: NextResponse.json({ error: auth.message }, { status: auth.status }) };

  const account = await prisma.webAccount.findFirst({
    where: { provider: auth.identity.provider, providerAccountId: auth.identity.providerAccountId },
    select: { id: true },
  });

  if (!account) return { ok: false, res: NextResponse.json({ error: "Account not found" }, { status: 403 }) };
  return { ok: true, accountId: account.id };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const guildIdStr = searchParams.get("guildId");
  if (!guildIdStr) return NextResponse.json({ error: "Missing guildId" }, { status: 400 });

  const guildId = toBigInt(guildIdStr);
  if (!guildId) return NextResponse.json({ error: "Invalid guildId" }, { status: 400 });

  const who = await requireAccountId(req);
  if (!who.ok) return who.res;

  // Doit être membre pour voir la liste
  const me = await prisma.guildMember.findUnique({
    where: { guildId_accountId: { guildId, accountId: who.accountId } },
    select: { role: true },
  });
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const members = await prisma.guildMember.findMany({
    where: { guildId },
    select: {
      role: true,
      joinedAt: true,
      account: { select: { pseudo: true } },
    },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
  });

  return NextResponse.json(
    {
      members: members.map((m) => ({
        pseudo: m.account.pseudo,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
      })),
    },
    { status: 200 }
  );
}
