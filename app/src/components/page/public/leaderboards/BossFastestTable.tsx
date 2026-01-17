// src/components/page/public/leaderboards/BossFastestTable.tsx
import { formatTime, type FastestEntry } from "@/lib/leaderboards";

export default function BossFastestTable({
  bossName,
  rows,
}: {
  bossName: string;
  rows: FastestEntry[];
}) {
  const showBossTime = rows.some((r) => r.bossDurationS != null);

  return (
    <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
      {/* subtle top glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(700px_circle_at_20%_0%,rgba(56,189,248,0.14),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="flex items-center justify-between px-4 pt-5 pb-7">
        <div className="text-sm font-semibold text-zinc-100">{bossName}</div>
        <div className="text-[11px] text-zinc-300/65">Fastest kills</div>
      </div>

      <div className="px-3 pb-3">
        {/* Fix: header/table never “bleeds” into other content */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
          <table className="w-full table-fixed text-[12px]">
            <colgroup>
              <col />
              <col className="w-[130px]" />
              {/* Time column gets wider when split time is displayed */}
              <col className={showBossTime ? "w-[132px]" : "w-[76px]"} />
            </colgroup>

            <thead className="bg-white/[0.03] text-[11px] text-zinc-300/60">
              <tr className="border-b border-white/10">
                <th className="py-2 pl-3 pr-2 text-left font-medium">Guild</th>
                <th className="whitespace-nowrap py-2 px-3 text-right font-medium">
                  Raid DPS
                </th>
                <th className="whitespace-nowrap py-2 pl-3 pr-4 text-right font-medium">
                  Time{showBossTime ? " (Total | Boss)" : ""}
                </th>
              </tr>
            </thead>

            <tbody className="text-zinc-100">
              {rows.length === 0 ? (
                <tr>
                  <td className="py-3 pl-3 text-zinc-300/60" colSpan={3}>
                    No data
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => {
                  const total = formatTime(r.durationS);
                  const bossOnly =
                    r.bossDurationS != null ? formatTime(r.bossDurationS) : null;

                  return (
                    <tr
                      key={`${r.runId}-${idx}`}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="min-w-0 py-2 pl-3 pr-2">
                        <div className="truncate">
                          <span className="text-sky-200/90">{r.guildName}</span>
                          {r.guildTag ? (
                            <span className="text-zinc-300/60"> [{r.guildTag}]</span>
                          ) : null}
                        </div>
                      </td>

                      <td className="whitespace-nowrap py-2 px-3 text-right tabular-nums text-zinc-200/90">
                        {r.dpsGroup
                          ? Math.round(r.dpsGroup).toLocaleString("en-US")
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap py-2 pl-3 pr-4 text-right tabular-nums">
                        <span className="text-zinc-100">{total}</span>
                        {bossOnly && (
                          <>
                            <span className="mx-1 text-zinc-400/80">|</span>
                            <span className="text-zinc-200/90">{bossOnly}</span>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-2 text-[11px] text-zinc-400/70">Top 10 — 1 entry per guild</div>
      </div>
    </div>
  );
}
