// src/app/api/public/player-lookup/route.ts
import { NextResponse } from "next/server";
import { lookupPlayer } from "@/lib/player-lookup";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  try {
    const data = await lookupPlayer(q);
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || "Server error") }, { status: 500 });
  }
}
