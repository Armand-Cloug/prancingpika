// src/app/api/public/specs-dps/route.ts
import { NextResponse } from "next/server";
import { getSpecDpsForRaid } from "@/lib/specs-dps";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const spec = searchParams.get("spec")?.trim();
  const raid = searchParams.get("raid")?.trim();

  if (!spec) return NextResponse.json({ error: "Missing spec" }, { status: 400 });
  if (!raid) return NextResponse.json({ error: "Missing raid" }, { status: 400 });

  try {
    const data = await getSpecDpsForRaid(spec, raid);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || "Failed to load") },
      { status: 500 }
    );
  }
}
