import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DISPLAY_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export async function POST(req: Request) {
  let body: { displayName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const displayName = body.displayName?.trim() ?? "";

  if (!displayName || displayName.length > 32 || !DISPLAY_NAME_REGEX.test(displayName)) {
    return NextResponse.json({ error: "Invalid display name" }, { status: 400 });
  }

  const account = await prisma.webAccount.findUnique({
    where: { displayName },
    select: {
      displayName: true,
      createdAt: true,
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
  });

  if (!account) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    displayName: account.displayName!,
    memberSince: account.createdAt,
    characters: account.riftCharacters.map((c) => ({
      name: c.name,
      shard: c.shard,
      calling: c.calling,
      level: c.level,
      guild: c.guild,
      lastSeenAt: c.lastSeenAt,
    })),
  });
}
