// src/app/api/public/run-group-dps/route.ts
import { NextResponse } from "next/server";
import { getRunGroupDps } from "@/lib/run-group-dps";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const runId = searchParams.get("runId");

  if (!runId) {
    return NextResponse.json({ error: "Missing runId" }, { status: 400 });
  }

  let id: bigint;
  try {
    id = BigInt(runId);
  } catch {
    return NextResponse.json({ error: "Invalid runId" }, { status: 400 });
  }

  const data = await getRunGroupDps(id);
  if (!data) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  return NextResponse.json(data, { status: 200 });
}
