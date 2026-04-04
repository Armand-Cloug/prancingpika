import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateWebAccount } from "@/lib/account";
import { authOptions } from "@/lib/auth-options";

type CharacterInput = {
  name: string;
  shard: string;
  calling: string;
  level: number;
  guild?: string | null;
};

type ImportPayload = {
  riftAccountId: string;
  characters: CharacterInput[];
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const { payload } = body;

  // ── Validation du format PP:<base64> ────────────────────────────────────
  if (!payload || typeof payload !== "string") {
    return NextResponse.json({ error: "Missing payload" }, { status: 400 });
  }
  if (!payload.startsWith("PP:")) {
    return NextResponse.json(
      { error: "Invalid format — payload must start with PP:" },
      { status: 400 }
    );
  }

  const b64 = payload.slice(3);
  if (!b64) {
    return NextResponse.json({ error: "Empty base64 data" }, { status: 400 });
  }

  let parsed: ImportPayload;
  try {
    const json = Buffer.from(b64, "base64").toString("utf-8");
    parsed = JSON.parse(json);
  } catch {
    return NextResponse.json(
      { error: "Failed to decode payload — make sure you copied it correctly" },
      { status: 400 }
    );
  }

  // ── Validation du contenu JSON ───────────────────────────────────────────
  const { riftAccountId, characters } = parsed;

  if (
    !riftAccountId ||
    typeof riftAccountId !== "string" ||
    riftAccountId.trim().length === 0 ||
    riftAccountId.length > 128
  ) {
    return NextResponse.json(
      { error: "Invalid or missing riftAccountId in payload" },
      { status: 400 }
    );
  }

  if (!Array.isArray(characters) || characters.length === 0) {
    return NextResponse.json(
      { error: "No characters found in payload" },
      { status: 400 }
    );
  }

  if (characters.length > 20) {
    return NextResponse.json(
      { error: "Too many characters in payload (max 20)" },
      { status: 400 }
    );
  }

  for (const c of characters) {
    if (
      !c.name || typeof c.name !== "string" ||
      !c.shard || typeof c.shard !== "string" ||
      !c.calling || typeof c.calling !== "string" ||
      typeof c.level !== "number" ||
      c.level < 0 ||
      c.level > 100
    ) {
      return NextResponse.json(
        { error: `Invalid character data for "${c.name ?? "unknown"}"` },
        { status: 400 }
      );
    }
  }

  // ── Logique métier ───────────────────────────────────────────────────────
  const account = await getOrCreateWebAccount(session.user as any);
  const now = new Date();
  let linked = false;

  if (account.riftLocked) {
    // Compte déjà lié — vérifier que le riftAccountId correspond
    if (account.riftAccountId !== riftAccountId) {
      return NextResponse.json(
        { error: "Account already linked to a different RIFT account" },
        { status: 403 }
      );
    }
    // Même compte → re-sync des personnages uniquement
  } else {
    // Première liaison — vérifier unicité du riftAccountId
    const existing = await prisma.webAccount.findUnique({
      where: { riftAccountId },
    });
    if (existing) {
      return NextResponse.json(
        { error: "This RIFT account is already linked to another profile" },
        { status: 409 }
      );
    }

    await prisma.webAccount.update({
      where: { id: account.id },
      data: { riftAccountId, riftLocked: true, riftLinkedAt: now },
    });
    linked = true;
  }

  // Upsert des personnages
  await prisma.$transaction(
    characters.map((c) =>
      prisma.riftCharacter.upsert({
        where: { name_shard: { name: c.name, shard: c.shard } },
        create: {
          webAccountId: account.id,
          name: c.name,
          shard: c.shard,
          calling: c.calling,
          level: c.level,
          guild: c.guild ?? null,
          lastSeenAt: now,
        },
        update: {
          calling: c.calling,
          level: c.level,
          guild: c.guild ?? null,
          lastSeenAt: now,
        },
      })
    )
  );

  // Lier immédiatement les players existants dont le nom correspond
  for (const c of characters) {
    await prisma.player.updateMany({
      where: { name: c.name, webAccountId: null },
      data:  { webAccountId: account.id },
    });
  }

  return NextResponse.json({
    success: true,
    linked,
    synced: characters.length,
    linkedAt: linked ? now : account.riftLinkedAt,
  });
}
