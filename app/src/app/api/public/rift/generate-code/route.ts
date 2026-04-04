import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getOrCreateWebAccount } from "@/lib/account";
import { authOptions } from "@/lib/auth-options";

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = randomBytes(6);
  let result = "PP-";
  for (const b of bytes) {
    result += chars[b % chars.length];
  }
  return result;
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const account = await getOrCreateWebAccount(session.user as any);

  if (account.riftLocked) {
    return NextResponse.json({ error: "ALREADY_LINKED" }, { status: 403 });
  }

  // Supprimer les anciens codes non utilisés avant d'en créer un nouveau
  await prisma.riftLinkCode.deleteMany({
    where: { webAccountId: account.id, used: false },
  });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const linkCode = await prisma.riftLinkCode.create({
    data: { code, webAccountId: account.id, expiresAt },
  });

  return NextResponse.json({ code: linkCode.code, expiresAt: linkCode.expiresAt });
}
