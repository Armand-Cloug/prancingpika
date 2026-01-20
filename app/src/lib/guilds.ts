import { prisma } from "@/lib/prisma";

export type GuildDetailsDTO = {
  guild: { id: string; name: string; tag: string | null; createdAt: string };
  bossKills: Array<{ boss: string; kills: number }>;
  runs: Array<{
    runId: string;
    endedAt: string;
    bossName: string;
    durationTotalS: number;
    bossDurationS: number | null;
    raidDps: number | null;
    raidHps: number | null;
    uploader: string;
    groupLabel: string | null;
  }>;
  truncated: boolean;
};

const RUN_LIMIT = 500;

export async function getGuildDetails(guildId: bigint): Promise<GuildDetailsDTO | null> {
  const guild = await prisma.guild.findUnique({
    where: { id: guildId },
    select: { id: true, name: true, tag: true, createdAt: true },
  });
  if (!guild) return null;

  const runs = await prisma.run.findMany({
    where: { guildId },
    select: {
      id: true,
      endedAt: true,
      durationTotalS: true,
      bossDurationS: true,
      dpsGroup: true,
      hpsGroup: true,
      boss: { select: { name: true } },
      group: { select: { label: true } },
      uploader: { select: { pseudo: true } },
    },
    orderBy: { endedAt: "desc" },
    take: RUN_LIMIT + 1,
  });

  const truncated = runs.length > RUN_LIMIT;
  const sliced = truncated ? runs.slice(0, RUN_LIMIT) : runs;

  // boss kill counts
  const map = new Map<string, number>();
  for (const r of sliced) {
    const k = r.boss.name;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  const bossKills = Array.from(map.entries())
    .map(([boss, kills]) => ({ boss, kills }))
    .sort((a, b) => b.kills - a.kills || a.boss.localeCompare(b.boss));

  return {
    guild: {
      id: guild.id.toString(),
      name: guild.name,
      tag: guild.tag ?? null,
      createdAt: guild.createdAt.toISOString(),
    },
    bossKills,
    runs: sliced.map((r) => ({
      runId: r.id.toString(),
      endedAt: r.endedAt.toISOString(),
      bossName: r.boss.name,
      durationTotalS: r.durationTotalS,
      bossDurationS: r.bossDurationS ?? null,
      raidDps: r.dpsGroup ?? null,
      raidHps: r.hpsGroup ?? null,
      uploader: r.uploader.pseudo,
      groupLabel: r.group.label ?? null,
    })),
    truncated,
  };
}
