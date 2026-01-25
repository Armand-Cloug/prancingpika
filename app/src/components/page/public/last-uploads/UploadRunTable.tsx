// src/components/page/public/last-uploads/UploadRunTable.tsx
import { formatTime } from "@/lib/leaderboards";
import type { LastUploadRun } from "@/lib/last-uploads";
import type { Role } from "@/lib/role";

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

/**
 * Color pill uses category (dps/heal/tank/support),
 * but displayed text must be the raw DB role label (rift-specific).
 */
function rolePill(category: Role) {
  const base =
    "inline-flex w-[92px] max-w-[92px] justify-center rounded-md px-2 py-[2px] text-[11px] font-semibold border truncate";

  if (category === "heal") return `${base} bg-emerald-500/15 text-emerald-200 border-emerald-500/20`;
  if (category === "support") return `${base} bg-violet-500/15 text-violet-200 border-violet-500/20`;
  if (category === "tank") return `${base} bg-sky-500/15 text-sky-200 border-sky-500/20`;
  return `${base} bg-red-500/15 text-red-200 border-red-500/20`;
}

export default function UploadRunTable({ run }: { run: LastUploadRun }) {
  const total = formatTime(run.durationS);
  const bossOnly = run.bossDurationS != null ? formatTime(run.bossDurationS) : null;
  const timeLabel = bossOnly ? `${total} | ${bossOnly}` : `${total}`;

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 overflow-hidden">
      <table className="w-full table-fixed text-[12px]">
        <colgroup>
          <col className="w-[112px]" /> {/* Role label */}
          <col /> {/* Player */}
          <col className="w-[110px]" /> {/* ST DPS */}
          <col className="w-[92px]" /> {/* HPS */}
          <col className={bossOnly ? "w-[132px]" : "w-[84px]"} /> {/* Time */}
        </colgroup>

        <thead className="bg-[#0b1220]/70 text-[11px] text-zinc-300/60">
          <tr className="border-b border-white/10">
            <th className="py-2 pl-3 pr-2 text-left font-medium">Role</th>
            <th className="py-2 px-2 text-left font-medium">Player</th>
            <th className="py-2 px-3 text-right font-medium whitespace-nowrap">ST DPS</th>
            <th className="py-2 pl-3 pr-2 text-right font-medium whitespace-nowrap">HPS</th>
            <th className="py-2 pl-2 pr-4 text-right font-medium whitespace-nowrap">
              Time{bossOnly ? " (T|B)" : ""}
            </th>
          </tr>
        </thead>

        <tbody className="text-zinc-100">
          {run.players.length === 0 ? (
            <tr>
              <td className="py-3 pl-3 text-zinc-300/60" colSpan={5}>
                No data
              </td>
            </tr>
          ) : (
            run.players.map((p, idx) => (
              <tr key={`${run.runId}-${p.player}-${idx}`} className="border-b border-white/5 last:border-0">
                <td className="py-2 pl-3 pr-2 align-middle">
                  {/* ✅ Show DB role label, color = category */}
                  <span className={rolePill(p.role)} title={`Category: ${p.role}`}>
                    {p.roleLabel}
                  </span>
                </td>

                <td className="py-2 px-2 align-middle min-w-0">
                  <div
                    className={[
                      "rounded-lg px-3 py-1.5 ring-1",
                      "truncate whitespace-nowrap",
                      classTint(p.playerClass),
                    ].join(" ")}
                    title={p.player}
                  >
                    {p.player}
                  </div>
                </td>

                <td className="py-2 px-3 text-right tabular-nums text-zinc-200/90 whitespace-nowrap align-middle">
                  {p.dps.toLocaleString("en-US")}
                </td>

                <td className="py-2 pl-3 pr-2 text-right tabular-nums text-zinc-200/90 whitespace-nowrap align-middle">
                  {p.hps.toLocaleString("en-US")}
                </td>

                <td className="py-2 pl-2 pr-4 text-right tabular-nums text-zinc-200/90 whitespace-nowrap align-middle">
                  {timeLabel}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="px-3 py-2 text-[11px] text-zinc-400/70 border-t border-white/10">
        Top {run.players.length} players by DPS — Color = Calling
      </div>
    </div>
  );
}