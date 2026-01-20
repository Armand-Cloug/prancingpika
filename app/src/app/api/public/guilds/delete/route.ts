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

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const guildIdStr = body?.guildId as string | undefined;
  if (!guildIdStr) return NextResponse.json({ error: "Missing guildId" }, { status: 400 });

  const guildId = toBigInt(guildIdStr);
  if (!guildId) return NextResponse.json({ error: "Invalid guildId" }, { status: 400 });

  const who = await requireAccountId(req);
  if (!who.ok) return who.res;

  const me = await prisma.guildMember.findUnique({
    where: { guildId_accountId: { guildId, accountId: who.accountId } },
    select: { role: true },
  });
  if (me?.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.$transaction(async (tx) => {
    const runIds = await tx.run.findMany({ where: { guildId }, select: { id: true } });
    const ids = runIds.map((r) => r.id);

    if (ids.length) {
      await tx.runPlayer.deleteMany({ where: { runId: { in: ids } } });
      await tx.run.deleteMany({ where: { id: { in: ids } } });
    }

    await tx.guildMember.deleteMany({ where: { guildId } });
    await tx.guild.delete({ where: { id: guildId } });
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
