// src/lib/role.ts
export type Role = "tank" | "dps" | "support" | "heal";

export function inferRole(
  dpsRaw: number,
  hpsRaw: number,
  opts: { topDps?: number | null; raidDps?: number | null } = {}
): Role {
  const dps = Math.max(0, dpsRaw || 0);
  const hps = Math.max(0, hpsRaw || 0);

  if (hps > dps) return "heal";

  const tankLimit =
    opts.topDps  ? opts.topDps * 0.18 :
    opts.raidDps ? opts.raidDps * 0.03 :
    200_000;

  if (dps <= tankLimit) return "tank";
  if (hps > 0 && hps >= dps * 0.25) return "support";

  if (opts.topDps) {
    const r = dps / opts.topDps;
    if (r >= 0.30 && r <= 0.45) return "support";
    if (r > 0.45 && r <= 0.70 && hps >= 700) return "support";
  }

  return "dps";
}
