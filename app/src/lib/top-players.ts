// src/lib/top-players.ts
import { prisma } from "@/lib/prisma";

// Same alias map as leaderboards.ts — covers FR/DE log names stored in older DB imports
const BOSS_DB_ALIASES: Record<string, string[]> = {
  "Vindicator MK1":      ["Vengeur I", "Vergelter Ausf. 1", "Vindicator", "Vengeur", "Vergelter"],
  "Commandant Isiel":    ["Commander Isiel", "Kommandant Isiel"],
  "Grand-Prêtre Arakhurn": ["Grand-prêtre Arakhurn", "High Priest Arakhurn"],
  "Général Silgen":      ["General Silgen", "Général Silgen (Intrepid)"],
};

function bossNameVariants(name: string): string[] {
  return [name, ...(BOSS_DB_ALIASES[name] ?? [])];
}

export type CallingKey = "rogue" | "cleric" | "warrior" | "primalist" | "mage";

export type TopPlayerRow = {
  runId: string; // BigInt serialized
  date: string; // yyyy-mm-dd
  player: string;
  webAccount?: { displayName: string | null } | null;
  dps: number;
  timeS: number;
};

export type TopPlayersResponse = {
  boss: string;
  classes: Record<CallingKey, TopPlayerRow[]>;
};

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * You might store player.class as "ROGUE"/"CLERIC"/... or any casing.
 * We match multiple variants to be safe.
 */
const CLASS_MATCH: Record<CallingKey, string[]> = {
  rogue: ["ROGUE", "Rogue", "rogue"],
  cleric: ["CLERIC", "Cleric", "cleric"],
  warrior: ["WARRIOR", "Warrior", "warrior", "WAR", "War", "war"],
  primalist: ["PRIMALIST", "Primalist", "primalist", "PRIMA", "Prima", "prima"],
  mage: ["MAGE", "Mage", "mage"],
};

async function topForClass(bossName: string, key: CallingKey): Promise<TopPlayerRow[]> {
  const variants = CLASS_MATCH[key];

  const rows = await prisma.runPlayer.findMany({
    where: {
      run: { boss: { name: { in: bossNameVariants(bossName) } } },
      player: {
        // simpler + faster than OR list
        class: { in: variants },
      },
    },
    select: {
      dps: true,
      player: {
        select: {
          name: true,
          webAccount: { select: { displayName: true } },
        },
      },
      run: { select: { id: true, endedAt: true, durationTotalS: true, bossDurationS: true } },
    },
    orderBy: [{ dps: "desc" }],
    take: 100,
  });

  return rows.map((r) => ({
    runId: r.run.id.toString(),
    date: toYMD(r.run.endedAt),
    player: r.player.name,
    webAccount: r.player.webAccount ?? null,
    dps: Math.round(r.dps),
    timeS: r.run.bossDurationS ?? r.run.durationTotalS,
  }));
}

export async function getTopPlayersForBoss(boss: string): Promise<TopPlayersResponse> {
  const [rogue, cleric, warrior, primalist, mage] = await Promise.all([
    topForClass(boss, "rogue"),
    topForClass(boss, "cleric"),
    topForClass(boss, "warrior"),
    topForClass(boss, "primalist"),
    topForClass(boss, "mage"),
  ]);

  return {
    boss,
    classes: { rogue, cleric, warrior, primalist, mage },
  };
}
