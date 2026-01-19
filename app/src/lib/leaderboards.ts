// src/lib/leaderboards.ts
import { prisma } from "@/lib/prisma";
import { inferRole, type Role } from "@/lib/role";

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

  // total encounter duration
  durationS: number;

  // OPTIONAL: boss-only duration (Isiel/Titan special cases, but we allow it for all)
  bossDurationS?: number | null;

  dpsGroup?: number | null;
  runId: string; // BigInt -> string
};

export type CompEntry = {
  role: Role;
  player: string;
  playerClass?: string | null; // Player.class
  dps: number;
  hps: number;
};

export type BossLeaderboard = {
  bossName: string;
  fastest: FastestEntry[]; // top 10 (distinct guilds)
  comp1: CompEntry[] | null; // from rank #1 run
  comp2: CompEntry[] | null; // from rank #2 run
};

export type RaidLeaderboard = {
  raid: RaidDef;
  bosses: BossLeaderboard[];
};

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
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
  // Fetch bosses ids for all raid boss names
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

      // 1) Get many fastest runs for that boss, then keep first per guild until 10
      // We take 300 to be safe if many duplicates per guild.
      const runs = await prisma.run.findMany({
        where: { bossId },
        orderBy: { durationTotalS: "asc" },
        take: 300,
        select: {
          id: true,
          durationTotalS: true,
          bossDurationS: true, // <-- NEW (for split time display)
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
        bossDurationS: r.bossDurationS ?? null, // <-- NEW
        dpsGroup: r.dpsGroup,
        runId: r.id.toString(),
      }));

      // rank #1 and #2 run ids (among distinct guilds)
      const run1 = distinct[0]?.id ?? null;
      const run2 = distinct[1]?.id ?? null;

      async function loadComp(runId: bigint | null): Promise<CompEntry[] | null> {
        if (!runId) return null;

        const players = await prisma.runPlayer.findMany({
          where: { runId },
          include: { player: { select: { name: true, class: true } } },
          orderBy: { dps: "desc" },
        });

        // show up to 12 lines
        return players.slice(0, 12).map((p) => {
          const dps = Math.round(p.dps ?? 0);
          const hps = Math.round(p.hps ?? 0);

          return {
            role: inferRole(dps, hps),
            player: p.player.name,
            playerClass: p.player.class ?? null,
            dps,
            hps,
          };
        });
      }

      const comp1 = await loadComp(run1);
      const comp2 = await loadComp(run2);

      bossResults.push({ bossName, fastest, comp1, comp2 });
    }

    raidResults.push({ raid, bosses: bossResults });
  }

  return raidResults;
}

// export helper for UI formatting
export const formatTime = fmtTime;
