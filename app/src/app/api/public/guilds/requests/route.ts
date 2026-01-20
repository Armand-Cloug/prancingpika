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

type ReqRow = { pseudo: string; requestedAt: Date };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const guildIdStr = searchParams.get("guildId");
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

  // Optionnel: table SQL hors Prisma
  try {
    const rows = await prisma.$queryRaw<ReqRow[]>`
      SELECT wa.pseudo as pseudo, gjr.requested_at as requestedAt
      FROM guild_join_requests gjr
      JOIN web_accounts wa ON wa.id = gjr.account_id
      WHERE gjr.guild_id = ${guildId} AND (gjr.status = 'PENDING' OR gjr.status IS NULL)
      ORDER BY gjr.requested_at DESC
      LIMIT 200
    `;

    return NextResponse.json(
      {
        requests: rows.map((r) => ({ pseudo: r.pseudo, requestedAt: r.requestedAt.toISOString() })),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { requests: [], note: "Join requests table not found (guild_join_requests)." },
      { status: 200 }
    );
  }
}
