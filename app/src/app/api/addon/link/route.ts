import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CharacterInput = {
  name: string;
  shard: string;
  calling: string;
  level: number;
  guild?: string;
};

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const { code, riftAccountId, characters } = body;

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "MISSING_CODE" }, { status: 400 });
  }
  if (
    !riftAccountId ||
    typeof riftAccountId !== "string" ||
    riftAccountId.trim().length === 0 ||
    riftAccountId.length > 64
  ) {
    return NextResponse.json({ error: "INVALID_RIFT_ACCOUNT_ID" }, { status: 400 });
  }
  if (!Array.isArray(characters) || characters.length === 0) {
    return NextResponse.json({ error: "INVALID_CHARACTERS" }, { status: 400 });
  }
  for (const c of characters) {
    if (
      !c.name || typeof c.name !== "string" ||
      !c.shard || typeof c.shard !== "string" ||
      !c.calling || typeof c.calling !== "string" ||
      typeof c.level !== "number"
    ) {
      return NextResponse.json({ error: "INVALID_CHARACTER_DATA" }, { status: 400 });
    }
  }

  // Vérifier que le code existe
  const linkCode = await prisma.riftLinkCode.findUnique({
    where: { code },
  });

  if (!linkCode) {
    return NextResponse.json({ error: "CODE_NOT_FOUND" }, { status: 404 });
  }
  if (linkCode.used) {
    return NextResponse.json({ error: "CODE_ALREADY_USED" }, { status: 409 });
  }
  if (linkCode.expiresAt < new Date()) {
    return NextResponse.json({ error: "CODE_EXPIRED" }, { status: 410 });
  }

  // Vérifier que le riftAccountId n'est pas déjà utilisé par un autre compte
  const existing = await prisma.webAccount.findUnique({
    where: { riftAccountId },
  });
  if (existing) {
    return NextResponse.json({ error: "RIFT_ACCOUNT_ALREADY_LINKED" }, { status: 409 });
  }

  const now = new Date();
  const webAccountId = linkCode.webAccountId;

  await prisma.$transaction(async (tx) => {
    await tx.webAccount.update({
      where: { id: webAccountId },
      data: { riftAccountId, riftLocked: true, riftLinkedAt: now },
    });

    await tx.riftLinkCode.update({
      where: { id: linkCode.id },
      data: { used: true },
    });

    for (const c of characters as CharacterInput[]) {
      await tx.riftCharacter.upsert({
        where: { name_shard: { name: c.name, shard: c.shard } },
        create: {
          webAccountId,
          name: c.name,
          shard: c.shard,
          calling: c.calling,
          level: c.level,
          guild: c.guild ?? null,
          lastSeenAt: now,
        },
        update: {
          webAccountId,
          calling: c.calling,
          level: c.level,
          guild: c.guild ?? null,
          lastSeenAt: now,
        },
      });
    }
  });

  return NextResponse.json({ success: true, linkedAt: now });
}
