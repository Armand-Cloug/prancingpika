// src/lib/leaderboards.ts
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/role";
import { normalizeRoleLabel, roleCategoryFromDbOrInfer } from "@/lib/rift-role-map";

export type RaidDef = {
  key: string;
  title: string;
  bosses: string[];
};

// Log names vary by client language (FR/EN/DE). Maps canonical leaderboard name
// → all possible names that may exist in the DB from older imports.
const BOSS_DB_ALIASES: Record<string, string[]> = {
  "Vindicator MK1":      ["Vengeur I", "Vergelter Ausf. 1", "Vindicator", "Vengeur", "Vergelter"],
  "Commandant Isiel":    ["Commander Isiel", "Kommandant Isiel"],
  "Grand-Prêtre Arakhurn": ["Grand-prêtre Arakhurn", "High Priest Arakhurn"],
  "Général Silgen":      ["General Silgen", "Général Silgen (Intrepid)"],
};

export const RAIDS: RaidDef[] = [
  {
    key: "BOS",
    title: "Bastion of Steel",
    bosses: ["Azranel", "Vindicator MK1", "Commandant Isiel", "Titan X"],
  },
  {
    key: "TDNM",
    title: "Tartaric Depths Normal Mode",
    bosses: ["Beligosh", "Tarjulia", "Le Concile du Destin", "Malannon"],
  },
  {
    key: "IROTP",
    title: "Intrepid Rise of the Phoenix",
    bosses: ["Ereandorn", "Beruhast", "Général Silgen", "Grand-Prêtre Arakhurn"],
  },
];

export type FastestEntry = {
  guildName: string;
  guildTag?: string | null;
  durationS: number;
  bossDurationS?: number | null;
  dpsGroup?: number | null;
  apsGroup?: number | null;
  runId: string;
};

export type CompEntry = {
  role: Role;
  roleLabel: string;
  spec?: string | null;
  player: string;
  playerClass?: string | null;
  webAccount?: { displayName: string | null } | null;
  dps: number;
  hps: number;
  aps: number;
};

export type BossLeaderboard = {
  bossName: string;
  fastest: FastestEntry[];
  comp1: CompEntry[] | null;
  comp2: CompEntry[] | null;
};

export type RaidLeaderboard = {
  raid: RaidDef;
  bosses: BossLeaderboard[];
};

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

  // Expand query to include all language aliases for each canonical boss name
  const expandedNames = allBossNames.flatMap((n) => [n, ...(BOSS_DB_ALIASES[n] ?? [])]);

  const bosses = await prisma.boss.findMany({
    where: { name: { in: expandedNames } },
    select: { id: true, name: true },
  });

  // Map every DB name (canonical or alias) → list of boss IDs under that canonical name
  const bossIdsByCanonical = new Map<string, bigint[]>();
  for (const b of bosses) {
    const canonical = allBossNames.find(
      (n) => n === b.name || (BOSS_DB_ALIASES[n] ?? []).includes(b.name)
    ) ?? b.name;
    const list = bossIdsByCanonical.get(canonical) ?? [];
    list.push(b.id);
    bossIdsByCanonical.set(canonical, list);
  }

  const raidResults: RaidLeaderboard[] = [];

  for (const raid of RAIDS) {
    const bossResults: BossLeaderboard[] = [];

    for (const bossName of raid.bosses) {
      const bossIds = bossIdsByCanonical.get(bossName) ?? [];

      if (bossIds.length === 0) {
        bossResults.push({ bossName, fastest: [], comp1: null, comp2: null });
        continue;
      }

      const runs = await prisma.run.findMany({
        where: { bossId: { in: bossIds } },
        orderBy: { durationTotalS: "asc" },
        take: 300,
        select: {
          id: true,
          durationTotalS: true,
          bossDurationS: true,
          dpsGroup: true,
          apsGroup: true,
          guildId: true,
          guild: { select: { name: true, tag: true } },
        },
      });

      const distinct = pickTopDistinctGuildRuns(runs, 10);

      const fastest: FastestEntry[] = distinct.map((r) => ({
        guildName:    r.guild?.name ?? "Unknown",
        guildTag:     r.guild?.tag ?? null,
        durationS:    r.durationTotalS,
        bossDurationS: r.bossDurationS ?? null,
        dpsGroup:     r.dpsGroup ?? null,
        apsGroup:     r.apsGroup ?? null,
        runId:        r.id.toString(),
      }));

      async function loadComp(runId: bigint | null): Promise<CompEntry[] | null> {
        if (!runId) return null;

        const players = await prisma.runPlayer.findMany({
          where: { runId },
          select: {
            dps: true,
            hps: true,
            role: true,
            spec: true,
            player: {
              select: {
                name: true,
                class: true,
                webAccount: { select: { displayName: true } },
              },
            },
          },
          orderBy: { dps: "desc" },
        });

        return players.slice(0, 12).map((p) => {
          const dps = Math.round(p.dps ?? 0);
          const hps = Math.round(p.hps ?? 0);
          const aps = Math.round((p as any).aps ?? 0);

          return {
            roleLabel:   normalizeRoleLabel(p.role),
            role:        roleCategoryFromDbOrInfer(p.role, dps, hps),
            spec:        p.spec ?? null,
            player:      p.player.name,
            playerClass: p.player.class ?? null,
            webAccount:  p.player.webAccount ?? null,
            dps,
            hps,
            aps,
          };
        });
      }

      const run1 = distinct[0]?.id ?? null;
      const run2 = distinct[1]?.id ?? null;
      const [comp1, comp2] = await Promise.all([loadComp(run1), loadComp(run2)]);
      bossResults.push({ bossName, fastest, comp1, comp2 });
    }

    raidResults.push({ raid, bosses: bossResults });
  }

  return raidResults;
}
