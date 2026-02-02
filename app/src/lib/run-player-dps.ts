// src/lib/run-player-dps.ts
import { prisma } from "@/lib/prisma";

export type RunPlayerDpsAbilityRow = {
  // Canonique (DB)
  abilityName: string;
  total: number;
  hits: number;
  pct: number;
  critRate: number;
  minHit: number;
  maxHit: number;
  avgHit: number;

  // DPS/HPS ability
  dps: number; // compat UI
  rate: number; // alias

  // Aliases compat (au cas où tu as déjà du code qui les lit)
  ability: string; // alias de abilityName
  critPct: number; // alias de critRate
  min: number; // alias de minHit
  max: number; // alias de maxHit
  avg: number; // alias de avgHit
};

export type RunPlayerDpsResponse = {
  run: {
    id: string;
    bossName: string;
    phaseLabel: string | null;
    startedAt: string;
    durationS: number;
  };
  player: {
    name: string;
    class: string | null;
    totalDamage: number;
    dps: number;
  };
  abilities: RunPlayerDpsAbilityRow[];
};

// ✅ Compat alias
export type PlayerDpsResponse = RunPlayerDpsResponse;

function safeNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function getRunPlayerDps(runId: bigint, playerName: string): Promise<RunPlayerDpsResponse | null> {
  const run = await prisma.run.findUnique({
    where: { id: runId },
    select: {
      id: true,
      createdAt: true,
      durationTotalS: true,
      bossDurationS: true,
      boss: { select: { name: true } },
    },
  });
  if (!run) return null;

  const rp = await prisma.runPlayer.findFirst({
    where: { runId, player: { name: playerName } },
    select: {
      damage: true,
      dps: true,
      player: { select: { id: true, name: true, class: true } },
    },
  });
  if (!rp?.player) return null;

  const durationS = safeNum(run.bossDurationS ?? run.durationTotalS, 0) || 1;

  const totalDamage = safeNum(rp.damage, 0);
  const playerDps =
    rp.dps != null ? safeNum(rp.dps, Math.round(totalDamage / durationS)) : Math.round(totalDamage / durationS);

  const abilitiesRaw = await prisma.runPlayerAbility.findMany({
    where: {
      runId,
      playerId: rp.player.id,
      kind: "DAMAGE",
    },
    orderBy: [{ total: "desc" }],
    select: {
      abilityName: true,
      total: true,
      hits: true,
      critRate: true,
      pct: true,
      minHit: true,
      maxHit: true,
      avgHit: true,
      rate: true,
    },
  });

  const abilities: RunPlayerDpsAbilityRow[] = abilitiesRaw.map((a) => {
    const total = safeNum(a.total, 0);
    const hits = safeNum(a.hits, 0);

    const dps = a.rate != null ? safeNum(a.rate, 0) : safeNum(total / durationS, 0);

    const abilityName = (a.abilityName ?? "").trim() || "Unknown";
    const critRate = safeNum(a.critRate, 0);
    const minHit = Math.round(safeNum(a.minHit, 0));
    const maxHit = Math.round(safeNum(a.maxHit, 0));
    const avgHit = safeNum(a.avgHit, 0);

    return {
      abilityName,
      total: Math.round(total),
      hits: Math.round(hits),
      pct: safeNum(a.pct, 0),
      critRate,
      minHit,
      maxHit,
      avgHit,
      dps,
      rate: dps,

      // aliases compat
      ability: abilityName,
      critPct: critRate,
      min: minHit,
      max: maxHit,
      avg: avgHit,
    };
  });

  return {
    run: {
      id: run.id.toString(),
      bossName: run.boss?.name ?? "Unknown",
      phaseLabel: "Boss",
      startedAt: run.createdAt.toISOString(),
      durationS: safeNum(run.bossDurationS ?? run.durationTotalS, 0),
    },
    player: {
      name: rp.player.name,
      class: rp.player.class ?? null,
      totalDamage: Math.round(totalDamage),
      dps: playerDps,
    },
    abilities,
  };
}
