// src/lib/leaderboards.ts
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/role";
import { normalizeRoleLabel, roleCategoryFromDbOrInfer } from "@/lib/rift-role-map";

export type RaidDef = {
  key: string;
  title: string;
  bosses: string[]; // must match Boss.name in DB
};

export const RAIDS: RaidDef[] = [
  {
    key: "BOS",
    title: "Raid BOS",
    bosses: ["Azranel", "Vengeur", "Commandant Isiel", "Titan X"],
  },
  {
    key: "TDNM",
    title: "Raid TDNM",
    bosses: ["Beligosh", "Tarjulia", "Le Concile du Destin", "Malannon"],
  },
  {
    key: "IROTP",
    title: "Raid IROTP",
    bosses: ["Ereandorn", "Beruhast", "Général Silgen", "Grand-Prêtre Arakhurn"],
  },
];

export type FastestEntry = {
  guildName: string;
  guildTag?: string | null;

  durationS: number;
  bossDurationS?: number | null;

  dpsGroup?: number | null;
  runId: string; // BigInt -> string
};

export type CompEntry = {
  /** Category used for colors in UI (dps/heal/tank/support) */
  role: Role;
  /** Raw role from DB (Rift-specific) shown in UI */
  roleLabel: string;

  player: string;
  playerClass?: string | null;
  dps: number;
  hps: number;
};

export type BossLeaderboard = {
  bossName: string;
  fastest: FastestEntry[]; // top 10 distinct guilds
  comp1: CompEntry[] | null; // from rank #1 run
  comp2: CompEntry[] | null; // from rank #2 run
};

export type RaidLeaderboard = {
  raid: RaidDef;
  bosses: BossLeaderboard[];
};

function fmtTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function pickTopDistinctGuildRuns<T extends { guildId: bigint }>(runs: T[], limit = 10) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of runs) {
    const k = r.guildId.toString();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
    if (out.length >= limit) break;
  }
  return out;
}

export async function getLeaderboards(): Promise<RaidLeaderboard[]> {
  const allBossNames = Array.from(new Set(RAIDS.flatMap((r) => r.bosses)));

  const bosses = await prisma.boss.findMany({
    where: { name: { in: allBossNames } },
    select: { id: true, name: true },
  });

  const bossIdByName = new Map<string, bigint>();
  for (const b of bosses) bossIdByName.set(b.name, b.id);

  const raidResults: RaidLeaderboard[] = [];

  for (const raid of RAIDS) {
    const bossResults: BossLeaderboard[] = [];

    for (const bossName of raid.bosses) {
      const bossId = bossIdByName.get(bossName);

      if (!bossId) {
        bossResults.push({ bossName, fastest: [], comp1: null, comp2: null });
        continue;
      }

      // Get many fastest runs then keep first per guild until 10
      const runs = await prisma.run.findMany({
        where: { bossId },
        orderBy: { durationTotalS: "asc" },
        take: 300,
        select: {
          id: true,
          durationTotalS: true,
          bossDurationS: true,
          dpsGroup: true,
          guildId: true,
          guild: { select: { name: true, tag: true } },
        },
      });

      const distinct = pickTopDistinctGuildRuns(runs, 10);

      const fastest: FastestEntry[] = distinct.map((r) => ({
        guildName: r.guild?.name ?? "Unknown",
        guildTag: r.guild?.tag ?? null,
        durationS: r.durationTotalS,
        bossDurationS: r.bossDurationS ?? null,
        dpsGroup: r.dpsGroup ?? null,
        runId: r.id.toString(),
      }));

      const run1 = distinct[0]?.id ?? null;
      const run2 = distinct[1]?.id ?? null;

      async function loadComp(runId: bigint | null): Promise<CompEntry[] | null> {
        if (!runId) return null;

        const players = await prisma.runPlayer.findMany({
          where: { runId },
          include: { player: { select: { name: true, class: true } } },
          orderBy: { dps: "desc" },
        });

        return players.slice(0, 12).map((p) => {
          const dps = Math.round(p.dps ?? 0);
          const hps = Math.round(p.hps ?? 0);

          return {
            roleLabel: normalizeRoleLabel(p.role),
            role: roleCategoryFromDbOrInfer(p.role, dps, hps),
            player: p.player.name,
            playerClass: p.player.class ?? null,
            dps,
            hps,
          };
        });
      }

      const [comp1, comp2] = await Promise.all([loadComp(run1), loadComp(run2)]);
      bossResults.push({ bossName, fastest, comp1, comp2 });
    }

    raidResults.push({ raid, bosses: bossResults });
  }

  return raidResults;
}

// export helper for UI formatting
export const formatTime = fmtTime;