// src/lib/top-players.ts
import { prisma } from "@/lib/prisma";

export type CallingKey = "rogue" | "cleric" | "warrior" | "primalist" | "mage";

export type TopPlayerRow = {
  date: string; // yyyy-mm-dd
  player: string;
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
  warrior: ["WARRIOR", "Warrior", "warrior"],
  primalist: ["PRIMALIST", "Primalist", "primalist", "PRIMA", "Prima", "prima"],
  mage: ["MAGE", "Mage", "mage"],
};

async function topForClass(bossName: string, key: CallingKey): Promise<TopPlayerRow[]> {
  const variants = CLASS_MATCH[key];

  const rows = await prisma.runPlayer.findMany({
    where: {
      run: { boss: { name: bossName } },
      player: {
        OR: variants.map((v) => ({ class: v })),
      },
    },
    include: {
      player: { select: { name: true } },
      run: { select: { endedAt: true, durationTotalS: true, bossDurationS: true } },
    },
    orderBy: [{ dps: "desc" }],
    take: 100,
  });

  return rows.map((r) => ({
    date: toYMD(r.run.endedAt),
    player: r.player.name,
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
