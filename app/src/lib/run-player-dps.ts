// src/lib/run-player-dps.ts
import { prisma } from "@/lib/prisma";

export type RunPlayerAbilityRow = {
  abilityId: number;
  abilityName: string;
  total: number;
  hits: number;
  pct: number;
  critRate: number;
  minHit: number;
  maxHit: number;
  avgHit: number;
  rate: number;
  absorbed: number;
  // compat aliases
  dps: number;
  ability: string;
  critPct: number;
  min: number;
  max: number;
  avg: number;
};

export type RunPlayerDpsResponse = {
  run: {
    id: string;
    bossName: string;
    startedAt: string;
    durationS: number;
  };
  player: {
    name: string;
    class: string | null;
    spec: string | null;
    role: string | null;
    totalDamage: number;
    totalHealing: number;
    totalAbsorbed: number;
    dps: number;
    hps: number;
    aps: number;
  };
  abilities: RunPlayerAbilityRow[];
};

function safeNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function getRunPlayerDps(
  runId: bigint,
  playerName: string
): Promise<RunPlayerDpsResponse | null> {
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
      damage:   true,
      healing:  true,
      dps:      true,
      hps:      true,
      role:     true,
      player:   { select: { id: true, name: true, class: true } },
    },
  });
  if (!rp?.player) return null;

  const durationS = safeNum(run.bossDurationS ?? run.durationTotalS, 1) || 1;

  const totalDamage  = safeNum(rp.damage, 0);
  const totalHealing = safeNum(rp.healing, 0);
  const playerDps    = rp.dps != null
    ? safeNum(rp.dps, Math.round(totalDamage / durationS))
    : Math.round(totalDamage / durationS);
  const playerHps    = rp.hps != null
    ? safeNum(rp.hps, Math.round(totalHealing / durationS))
    : Math.round(totalHealing / durationS);

  // Fetch extra fields (aps, absorbed, spec) via raw to avoid typing issues
  const extras = await prisma.$queryRaw<Array<{
    aps: number | null;
    absorbed: number | null;
    spec: string | null;
  }>>`
    SELECT aps, absorbed, spec
    FROM run_players
    WHERE runId = ${runId} AND playerId = ${rp.player.id}
    LIMIT 1
  `.catch(() => [{ aps: null, absorbed: null, spec: null }]);

  const extra = extras[0] ?? { aps: null, absorbed: null, spec: null };

  const abilitiesRaw = await prisma.runPlayerAbility.findMany({
    where: { runId, playerId: rp.player.id, kind: "DAMAGE" },
    orderBy: [{ total: "desc" }],
    select: {
      abilityName: true,
      total:       true,
      hits:        true,
      critRate:    true,
      pct:         true,
      minHit:      true,
      maxHit:      true,
      avgHit:      true,
      rate:        true,
    },
  });

  // Fetch abilityId + absorbed per ability
  const abilityExtras = await prisma.$queryRaw<Array<{
    abilityId: bigint;
    abilityName: string;
    absorbed: number | null;
  }>>`
    SELECT abilityId, abilityName, absorbed
    FROM run_player_abilities
    WHERE runId = ${runId} AND playerId = ${rp.player.id} AND kind = 'DAMAGE'
  `.catch(() => [] as Array<{ abilityId: bigint; abilityName: string; absorbed: number | null }>);

  const extraByName = new Map(abilityExtras.map((a) => [a.abilityName, a]));

  const abilities: RunPlayerAbilityRow[] = abilitiesRaw.map((a) => {
    const total     = safeNum(a.total, 0);
    const hits      = safeNum(a.hits, 0);
    const rate      = a.rate != null ? safeNum(a.rate, 0) : safeNum(total / durationS, 0);
    const abilityName = (a.abilityName ?? "").trim() || "Unknown";
    const critRate  = safeNum(a.critRate, 0);
    const minHit    = Math.round(safeNum(a.minHit, 0));
    const maxHit    = Math.round(safeNum(a.maxHit, 0));
    const avgHit    = safeNum(a.avgHit, 0);
    const ext       = extraByName.get(abilityName);
    const abilityId = Number(ext?.abilityId ?? 0);
    const absorbed  = safeNum(ext?.absorbed, 0);

    return {
      abilityId,
      abilityName,
      total:    Math.round(total),
      hits:     Math.round(hits),
      pct:      safeNum(a.pct, 0),
      critRate,
      minHit,
      maxHit,
      avgHit,
      rate,
      absorbed,
      // compat aliases
      dps:      rate,
      ability:  abilityName,
      critPct:  critRate,
      min:      minHit,
      max:      maxHit,
      avg:      avgHit,
    };
  });

  return {
    run: {
      id:         run.id.toString(),
      bossName:   run.boss?.name ?? "Unknown",
      startedAt:  run.createdAt.toISOString(),
      durationS,
    },
    player: {
      name:          rp.player.name,
      class:         rp.player.class ?? null,
      spec:          extra.spec,
      role:          rp.role ?? null,
      totalDamage:   Math.round(totalDamage),
      totalHealing:  Math.round(totalHealing),
      totalAbsorbed: safeNum(extra.absorbed, 0),
      dps:           playerDps,
      hps:           playerHps,
      aps:           safeNum(extra.aps, 0),
    },
    abilities,
  };
}
