// src/app/api/public/run-player-dps/route.ts
import { NextResponse } from "next/server";
import { getRunPlayerDps } from "@/lib/run-player-dps";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const runIdStr = searchParams.get("runId");
  const player = searchParams.get("player");

  if (!runIdStr) return NextResponse.json({ error: "Missing runId" }, { status: 400 });
  if (!player) return NextResponse.json({ error: "Missing player" }, { status: 400 });

  let runId: bigint;
  try {
    runId = BigInt(runIdStr);
  } catch {
    return NextResponse.json({ error: "Invalid runId" }, { status: 400 });
  }

  try {
    const data = await getRunPlayerDps(runId, player);
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    console.error("[run-player-dps] error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
