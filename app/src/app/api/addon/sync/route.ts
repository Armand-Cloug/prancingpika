import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAddonSignature } from "@/lib/addon-auth";

type CharacterInput = {
  name: string;
  shard: string;
  calling: string;
  level: number;
  guild?: string;
};

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-addon-signature") ?? "";
  const timestamp = req.headers.get("x-addon-timestamp") ?? "";

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const { riftAccountId, characters } = body;

  if (!riftAccountId || typeof riftAccountId !== "string") {
    return NextResponse.json({ error: "INVALID_RIFT_ACCOUNT_ID" }, { status: 400 });
  }

  if (!verifyAddonSignature(riftAccountId, signature, timestamp)) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
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

  const account = await prisma.webAccount.findUnique({
    where: { riftAccountId },
  });

  if (!account || !account.riftLocked) {
    return NextResponse.json({ error: "ACCOUNT_NOT_LINKED" }, { status: 404 });
  }

  const now = new Date();
  const webAccountId = account.id;

  await prisma.$transaction(async (tx) => {
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
          level: c.level,
          guild: c.guild ?? null,
          lastSeenAt: now,
        },
      });
    }
  });

  return NextResponse.json({ success: true, synced: (characters as CharacterInput[]).length });
}
