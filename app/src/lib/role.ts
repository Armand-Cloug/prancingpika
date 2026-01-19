// src/lib/role.ts

export type Role = "tank" | "dps" | "support" | "heal";

export type InferRoleOptions = {
  topDps?: number | null;   // meilleur DPS de la run (déduit de la liste)
  raidDps?: number | null;  // DPS du groupe (run.dpsGroup)
};

export function inferRole(dpsRaw: number, hpsRaw: number, opts: InferRoleOptions = {}): Role {
  const dps = Math.max(0, dpsRaw || 0);
  const hps = Math.max(0, hpsRaw || 0);

  const topDps = opts.topDps && opts.topDps > 0 ? opts.topDps : null;
  const raidDps = opts.raidDps && opts.raidDps > 0 ? opts.raidDps : null;

  // 1) Heal : plus de heal que de dps
  if (hps > dps) return "heal";

  // 2) Tank : très peu de DPS (priorité tank avant support/dps)
  //    -> basé sur % du topDps (stable), fallback via % du raidDps.
  const tankLimit =
    topDps != null ? topDps * 0.18 :
    raidDps != null ? raidDps * 0.03 :
    200_000;

  if (dps <= tankLimit) return "tank";

  // 3) Support : hybride (bcp de dps et bcp de heal) (mais pas heal)
  if (hps > 0 && hps >= dps * 0.25) return "support";

  // 3B) Support "mid-dps" basé sur ratio vs topDps (pas sur raidDps)
  if (topDps != null) {
    const r = dps / topDps;

    // palier 1 : support garanti (ex: Evirado 0.40)
    if (r >= 0.30 && r <= 0.45) return "support";

    // palier 2 : support probable si un minimum de heal (ex: Healsana 0.59 avec ~887 HPS)
    if (r > 0.45 && r <= 0.70 && hps >= 700) return "support";
  }

  // 4) Sinon : DPS
  return "dps";
}
