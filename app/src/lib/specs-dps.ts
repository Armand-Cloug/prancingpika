// src/lib/specs-dps.ts
import { prisma } from "@/lib/prisma";
import { RAIDS } from "@/lib/leaderboards";

const BOSS_DB_ALIASES: Record<string, string[]> = {
  "Vindicator MK1":        ["Vengeur I", "Vergelter Ausf. 1", "Vindicator", "Vengeur", "Vergelter"],
  "Commandant Isiel":      ["Commander Isiel", "Kommandant Isiel"],
  "Grand-Prêtre Arakhurn": ["Grand-prêtre Arakhurn", "High Priest Arakhurn"],
  "Général Silgen":        ["General Silgen", "Général Silgen (Intrepid)"],
};

function bossVariants(name: string): string[] {
  return [name, ...(BOSS_DB_ALIASES[name] ?? [])];
}

export type SpecDpsRow = {
  runId: string;
  player: string;
  dps: number;
  timeS: number;
  date: string;
};

export type SpecBossResult = {
  bossName: string;
  rows: SpecDpsRow[];
};

export type SpecDpsResponse = {
  spec: string;
  raidKey: string;
  bosses: SpecBossResult[];
};

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export async function getAvailableSpecs(): Promise<string[]> {
  const result = await prisma.runPlayer.groupBy({
    by: ["spec"],
    where: { spec: { not: null } },
    orderBy: { spec: "asc" },
  });
  return result.map((r) => r.spec as string);
}

export async function getSpecDpsForRaid(spec: string, raidKey: string): Promise<SpecDpsResponse> {
  const raid = RAIDS.find((r) => r.key === raidKey);
  if (!raid) throw new Error(`Unknown raid: ${raidKey}`);

  const bossResults: SpecBossResult[] = await Promise.all(
    raid.bosses.map(async (bossName) => {
      const variants = bossVariants(bossName);

      const raw = await prisma.runPlayer.findMany({
        where: {
          spec,
          run: { boss: { name: { in: variants } } },
        },
        select: {
          dps: true,
          player: { select: { name: true } },
          run: {
            select: {
              id: true,
              endedAt: true,
              bossDurationS: true,
              durationTotalS: true,
            },
          },
        },
        orderBy: { dps: "desc" },
        take: 500,
      });

      // Un seul score par joueur (meilleur DPS)
      const seen = new Set<string>();
      const deduped: typeof raw = [];
      for (const r of raw) {
        if (seen.has(r.player.name)) continue;
        seen.add(r.player.name);
        deduped.push(r);
        if (deduped.length >= 10) break;
      }

      return {
        bossName,
        rows: deduped.map((r) => ({
          runId: r.run.id.toString(),
          player: r.player.name,
          dps: Math.round(r.dps),
          timeS: r.run.bossDurationS ?? r.run.durationTotalS,
          date: toYMD(r.run.endedAt),
        })),
      };
    })
  );

  return { spec, raidKey, bosses: bossResults };
}
