// src/lib/last-uploads.ts
import { prisma } from "@/lib/prisma";
import { inferRole, type Role } from "@/lib/role";

export type LastUploadPlayerRow = {
  player: string;
  playerClass?: string | null;
  role: Role;
  dps: number;
  hps: number;
};

export type LastUploadRun = {
  runId: string;

  createdAt: string; // ISO
  bossName: string;

  guildName: string;
  guildTag?: string | null;

  uploaderPseudo: string;
  uploaderProvider: "google" | "discord";

  durationS: number;
  bossDurationS?: number | null;

  dpsGroup?: number | null;
  hpsGroup?: number | null;

  players: LastUploadPlayerRow[];
};

export async function getLastUploads(limit = 10): Promise<LastUploadRun[]> {
  const runs = await prisma.run.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      createdAt: true,
      durationTotalS: true,
      bossDurationS: true,
      dpsGroup: true,
      hpsGroup: true,
      boss: { select: { name: true } },
      guild: { select: { name: true, tag: true } },
      uploader: { select: { pseudo: true, provider: true } },
      players: {
        take: 12,
        orderBy: { dps: "desc" },
        select: {
          dps: true,
          hps: true,
          player: { select: { name: true, class: true } },
        },
      },
    },
  });

  return runs.map((r) => {
    const players: LastUploadPlayerRow[] = (r.players ?? []).map((p) => {
      const dps = Math.round(p.dps ?? 0);
      const hps = Math.round(p.hps ?? 0);

      return {
        player: p.player.name,
        playerClass: p.player.class ?? null,
        role: inferRole(dps, hps),
        dps,
        hps,
      };
    });

    return {
      runId: r.id.toString(),
      createdAt: r.createdAt.toISOString(),
      bossName: r.boss?.name ?? "Unknown",
      guildName: r.guild?.name ?? "Unknown",
      guildTag: r.guild?.tag ?? null,
      uploaderPseudo: r.uploader?.pseudo ?? "Unknown",
      uploaderProvider: (r.uploader?.provider ?? "google") as "google" | "discord",
      durationS: r.durationTotalS,
      bossDurationS: r.bossDurationS ?? null,
      dpsGroup: r.dpsGroup ?? null,
      hpsGroup: r.hpsGroup ?? null,
      players,
    };
  });
}
