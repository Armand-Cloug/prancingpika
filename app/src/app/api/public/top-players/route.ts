// src/app/api/public/top-players/route.ts
import { NextResponse } from "next/server";
import { getTopPlayersForBoss } from "@/lib/top-players";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const boss = searchParams.get("boss");

  if (!boss || !boss.trim()) {
    return NextResponse.json({ error: "Missing boss" }, { status: 400 });
  }

  try {
    const data = await getTopPlayersForBoss(boss.trim());
    // ✅ data matches TopPlayersResponse from src/lib/top-players.ts
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || "Failed to load top players") },
      { status: 500 }
    );
  }
}
