import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGuildDetails } from "@/lib/guilds";
import { requireAuthIdentity } from "@/lib/auth-identity";

function toBigInt(v: string): bigint | null {
  try {
    return BigInt(v);
  } catch {
    return null;
  }
}

async function getAccountIdFromSession(req: NextRequest): Promise<bigint | null> {
  const auth = await requireAuthIdentity(req);
  if (!auth.ok) return null;

  const account = await prisma.webAccount.findFirst({
    where: {
      provider: auth.identity.provider,
      providerAccountId: auth.identity.providerAccountId,
    },
    select: { id: true },
  });

  return account?.id ?? null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const guildIdStr = searchParams.get("guildId");
  if (!guildIdStr) return NextResponse.json({ error: "Missing guildId" }, { status: 400 });

  const guildId = toBigInt(guildIdStr);
  if (!guildId) return NextResponse.json({ error: "Invalid guildId" }, { status: 400 });

  const details = await getGuildDetails(guildId);
  if (!details) return NextResponse.json({ error: "Guild not found" }, { status: 404 });

  const accountId = await getAccountIdFromSession(req);

  let isOwner = false;
  if (accountId) {
    const gm = await prisma.guildMember.findUnique({
      where: { guildId_accountId: { guildId, accountId } },
      select: { role: true },
    });
    isOwner = gm?.role === "OWNER";
  }

  return NextResponse.json({ ...details, isOwner }, { status: 200 });
}
