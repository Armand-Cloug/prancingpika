// src/lib/run-group-dps.ts
import { prisma } from "@/lib/prisma";

export type RunGroupDpsResponse = {
  run: {
    id: string;
    bossName: string;
    startedAt: string;
    durationTotalS: number;
    bossDurationS: number | null;
    dpsGroup: number | null;
    hpsGroup: number | null;
    guildName: string | null;
    guildTag: string | null;
    groupLabel: string | null;
    rosterSize: number | null;
  };
  rows: Array<{
    player: string;
    playerClass: string | null;
    dps: number;
    hps: number;
  }>;
};

export async function getRunGroupDps(runId: bigint): Promise<RunGroupDpsResponse | null> {
  const run = await prisma.run.findUnique({
    where: { id: runId },
    select: {
      id: true,
      startedAt: true,
      durationTotalS: true,
      bossDurationS: true,
      dpsGroup: true,
      hpsGroup: true,
      boss: { select: { name: true } },
      guild: { select: { name: true, tag: true } },
      group: { select: { label: true, rosterSize: true } },
    },
  });

  if (!run) return null;

  const players = await prisma.runPlayer.findMany({
    where: { runId },
    select: {
      dps: true,
      hps: true,
      player: { select: { name: true, class: true } },
    },
  });

  return {
    run: {
      id: run.id.toString(),
      bossName: run.boss.name,
      startedAt: run.startedAt.toISOString(),
      durationTotalS: run.durationTotalS,
      bossDurationS: run.bossDurationS,
      dpsGroup: run.dpsGroup,
      hpsGroup: run.hpsGroup,
      guildName: run.guild?.name ?? null,
      guildTag: run.guild?.tag ?? null,
      groupLabel: run.group?.label ?? null,
      rosterSize: run.group?.rosterSize ?? null,
    },
    rows: players.map((p) => ({
      player: p.player.name,
      playerClass: p.player.class ?? null,
      dps: p.dps,
      hps: p.hps,
    })),
  };
}
