// src/components/page/public/leaderboards/BossCompTable.tsx
import type { CompEntry } from "@/lib/leaderboards";

type Calling = "cleric" | "primalist" | "warrior" | "rogue" | "mage";

function normClass(v?: string | null): Calling | null {
  if (!v) return null;
  const s = v.trim().toLowerCase();

  if (s.startsWith("cler") || s === "c") return "cleric";
  if (s.startsWith("pri") || s.includes("prima")) return "primalist";
  if (s.startsWith("war") || s === "w") return "warrior";
  if (s.startsWith("rog") || s === "r") return "rogue";
  if (s.startsWith("mag") || s === "m") return "mage";

  if (["cleric", "primalist", "warrior", "rogue", "mage"].includes(s)) return s as Calling;
  return null;
}

function classTint(playerClass?: string | null) {
  const c = normClass(playerClass);

  switch (c) {
    case "cleric":
      return "bg-emerald-500/22 ring-emerald-400/20";
    case "primalist":
      return "bg-sky-400/22 ring-sky-300/20";
    case "warrior":
      return "bg-red-500/22 ring-red-400/20";
    case "rogue":
      return "bg-yellow-400/20 ring-yellow-300/20";
    case "mage":
      return "bg-violet-500/22 ring-violet-400/20";
    default:
      return "bg-white/6 ring-white/10";
  }
}

function rolePill(role: CompEntry["role"]) {
  const base =
    "inline-flex w-[74px] justify-center rounded-md px-2 py-[2px] text-[11px] font-semibold border";

  if (role === "heal") {
    return `${base} bg-emerald-500/15 text-emerald-200 border-emerald-500/20`;
  }
  if (role === "support") {
    return `${base} bg-violet-500/15 text-violet-200 border-violet-500/20`;
  }
  return `${base} bg-sky-500/15 text-sky-200 border-sky-500/20`;
}

export default function BossCompTable({
  bossName,
  rows,
  rankLabel,
}: {
  bossName: string;
  rows: CompEntry[] | null;
  rankLabel: string; // "#1" / "#2"
}) {
  return (
    <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(700px_circle_at_20%_0%,rgba(167,139,250,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="flex items-center justify-between px-4 pt-5 pb-7">
        <div className="text-sm font-semibold text-zinc-100">{bossName}</div>
        <div className="text-[11px] text-zinc-300/65">Comp {rankLabel}</div>
      </div>

      <div className="px-3 pb-3">
        <div className="rounded-xl border border-white/10 bg-black/25 overflow-hidden">
          <table className="w-full table-fixed text-[12px]">
            {/* Give more room to Player, keep numbers compact */}
            <colgroup>
              <col className="w-[96px]" />  {/* Role */}
              <col />                       {/* Player (flex) */}
              <col className="w-[112px]" /> {/* ST DPS */}
              <col className="w-[88px]" />  {/* HPS */}
            </colgroup>

            <thead className="bg-[#0b1220]/70 text-[11px] text-zinc-300/60">
              <tr className="border-b border-white/10">
                <th className="py-2 pl-3 pr-2 text-left font-medium">Role</th>
                <th className="py-2 px-2 text-left font-medium">Player</th>
                <th className="py-2 px-3 text-right font-medium whitespace-nowrap">
                  ST DPS
                </th>
                <th className="py-2 pl-3 pr-4 text-right font-medium whitespace-nowrap">
                  HPS
                </th>
              </tr>
            </thead>

            <tbody className="text-zinc-100">
              {!rows || rows.length === 0 ? (
                <tr>
                  <td className="py-3 pl-3 text-zinc-300/60" colSpan={4}>
                    No data
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr
                    key={`${r.player}-${idx}`}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="py-2 pl-3 pr-2 align-middle">
                      <span className={rolePill(r.role)}>{r.role}</span>
                    </td>

                    {/* Player: larger space + truncate (no wrap) */}
                    <td className="py-2 px-2 align-middle">
                      <div
                        className={[
                          "rounded-lg px-3 py-1.5 ring-1",
                          "min-w-0",              // required for truncate in table cells
                          "truncate",             // cut with ellipsis
                          "whitespace-nowrap",
                          classTint(r.playerClass),
                        ].join(" ")}
                        title={r.player} // show full name on hover
                      >
                        {r.player}
                      </div>
                    </td>

                    <td className="py-2 px-3 text-right tabular-nums text-zinc-200/90 whitespace-nowrap align-middle">
                      {r.dps.toLocaleString("en-US")}
                    </td>

                    <td className="py-2 pl-3 pr-4 text-right tabular-nums text-zinc-200/90 whitespace-nowrap align-middle">
                      {r.hps.toLocaleString("en-US")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-2 text-[11px] text-zinc-400/70">
          Color = Calling (Cleric / Primalist / Warrior / Rogue / Mage)
        </div>
      </div>
    </div>
  );
}
