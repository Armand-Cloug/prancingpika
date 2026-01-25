// src/app/api/public/run-group-dps/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/role";
import { normalizeRoleLabel, roleCategoryFromDbOrInfer } from "@/lib/rift-role-map";

type GroupDpsResponse = {
  run: {
    id: string;
    bossName: string;
    startedAt: string; // ISO
    durationTotalS: number;
    bossDurationS: number | null;
    dpsGroup: number | null;
    hpsGroup: number | null;
    guildName: string | null;
    guildTag: string | null;
    groupLabel: string | null;
    rosterSize: number | null;
  };
  rows: Array<{
    player: string;
    playerClass: string | null;

    // ✅ roles (comme leaderboards / last-uploads)
    role: Role; // category for colors
    roleLabel: string; // raw label from DB normalized for display

    dps: number;
    hps: number;
  }>;
};

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

  const run = await prisma.run.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      durationTotalS: true,
      bossDurationS: true,
      dpsGroup: true,
      hpsGroup: true,
      boss: { select: { name: true } },
      guild: { select: { name: true, tag: true } },
      players: {
        orderBy: { dps: "desc" },
        select: {
          dps: true,
          hps: true,
          role: true,
          player: { select: { name: true, class: true } },
        },
      },
    },
  });

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const rows: GroupDpsResponse["rows"] = (run.players ?? []).map((p) => {
    const dps = Math.round(Number(p.dps ?? 0));
    const hps = Math.round(Number(p.hps ?? 0));

    return {
      player: p.player?.name ?? "Unknown",
      playerClass: p.player?.class ?? null,

      roleLabel: normalizeRoleLabel(p.role),
      role: roleCategoryFromDbOrInfer(p.role, dps, hps),

      dps,
      hps,
    };
  });

  const body: GroupDpsResponse = {
    run: {
      id: run.id.toString(),
      bossName: run.boss?.name ?? "Unknown",
      startedAt: run.createdAt.toISOString(),
      durationTotalS: Number(run.durationTotalS ?? 0),
      bossDurationS: run.bossDurationS != null ? Number(run.bossDurationS) : null,
      dpsGroup: run.dpsGroup != null ? Number(run.dpsGroup) : null,
      hpsGroup: run.hpsGroup != null ? Number(run.hpsGroup) : null,
      guildName: run.guild?.name ?? null,
      guildTag: run.guild?.tag ?? null,
      groupLabel: null,
      rosterSize: rows.length,
    },
    rows,
  };

  return NextResponse.json(body, { status: 200 });
}