// src/lib/player-lookup.ts
import { prisma } from "@/lib/prisma";

export type LookupMatchPlayer = { name: string; class: string | null };

export type LookupRecord = {
  runId: string;
  endedAt: string;
  bossName: string;
  dps: number;
  hps: number;
  raidDps: number | null;
  raidHps: number | null;
  timeS: number;
  guildName: string | null;
  guildTag: string | null;
  groupLabel: string | null;
};

export type PlayerLookupResponse =
  | { mode: "empty" }
  | { mode: "matches"; query: string; players: LookupMatchPlayer[] }
  | {
      mode: "records";
      query: string;
      player: LookupMatchPlayer;
      records: LookupRecord[];
      truncated: boolean;
    };

const MAX_RECORDS = 2000;
const MAX_MATCHES = 12;

export async function lookupPlayer(queryRaw: string): Promise<PlayerLookupResponse> {
  const query = queryRaw.trim();
  if (query.length < 2) return { mode: "empty" };

  // Try exact match first (MySQL collation is often case-insensitive, but not guaranteed)
  const exact = await prisma.player.findFirst({
    where: { name: query },
    select: { id: true, name: true, class: true },
  });

  if (!exact) {
    const players = await prisma.player.findMany({
      where: { name: { contains: query } },
      select: { name: true, class: true },
      orderBy: { name: "asc" },
      take: MAX_MATCHES,
    });

    return { mode: "matches", query, players };
  }

  const rows = await prisma.runPlayer.findMany({
    where: { playerId: exact.id },
    select: {
      dps: true,
      hps: true,
      run: {
        select: {
          id: true,
          endedAt: true,
          durationTotalS: true,
          bossDurationS: true,
          dpsGroup: true,
          hpsGroup: true,
          boss: { select: { name: true } },
          guild: { select: { name: true, tag: true } },
          group: { select: { label: true } },
        },
      },
    },
    orderBy: { run: { endedAt: "desc" } },
    take: MAX_RECORDS + 1, // detect truncation
  });

  const truncated = rows.length > MAX_RECORDS;
  const sliced = truncated ? rows.slice(0, MAX_RECORDS) : rows;

  const records: LookupRecord[] = sliced.map((r) => ({
    runId: r.run.id.toString(),
    endedAt: r.run.endedAt.toISOString(),
    bossName: r.run.boss.name,
    dps: r.dps,
    hps: r.hps,
    raidDps: r.run.dpsGroup ?? null,
    raidHps: r.run.hpsGroup ?? null,
    timeS: r.run.bossDurationS ?? r.run.durationTotalS,
    guildName: r.run.guild?.name ?? null,
    guildTag: r.run.guild?.tag ?? null,
    groupLabel: r.run.group?.label ?? null,
  }));

  return {
    mode: "records",
    query,
    player: { name: exact.name, class: exact.class ?? null },
    records,
    truncated,
  };
}
