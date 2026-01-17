// src/app/api/public/top-players/route.ts
import { NextResponse } from "next/server";
import { getTopPlayersForBoss } from "@/lib/top-players";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const boss = (url.searchParams.get("boss") || "").trim();

  if (!boss) {
    return NextResponse.json({ error: "Missing boss" }, { status: 400 });
  }

  const data = await getTopPlayersForBoss(boss);
  return NextResponse.json(data, { status: 200 });
}
