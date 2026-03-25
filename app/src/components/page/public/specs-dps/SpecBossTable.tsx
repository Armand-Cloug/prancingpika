// src/components/page/public/specs-dps/SpecBossTable.tsx
"use client";
import PlayerDpsDialog from "@/components/forms/PlayerDpsDialog";
import type { SpecBossResult } from "@/lib/specs-dps";

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function SpecBossTable({
  result,
  spec,
}: {
  result: SpecBossResult;
  spec: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl glass">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-sky-400 opacity-50" />

      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <span className="h-2 w-2 rounded-full bg-sky-400" />
        <h3
          className="text-[13px] font-bold text-sky-300"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          {result.bossName}
        </h3>
        <span className="ml-auto mono text-[10px] text-zinc-600">
          {result.rows.length} entries
        </span>
      </div>

      <div className="px-3 pb-3">
        <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-black/20">
          <table className="w-full table-fixed text-[11.5px] 2xl:text-[13px]">
            <colgroup>
              <col className="w-9" />
              <col />
              <col className="w-[88px]" />
              <col className="w-[68px]" />
              <col className="w-[90px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-white/[0.07] bg-black/20">
                <th className="py-2 pl-4 pr-1 text-left text-[10px] font-medium text-zinc-600">#</th>
                <th className="py-2 px-2 text-left text-[10px] font-medium text-zinc-500 tracking-wide uppercase">Player</th>
                <th className="py-2 px-3 text-right text-[10px] font-medium text-zinc-500 tracking-wide uppercase">DPS</th>
                <th className="py-2 pl-3 pr-2 text-right text-[10px] font-medium text-zinc-500 tracking-wide uppercase">Time</th>
                <th className="py-2 pl-2 pr-4 text-right text-[10px] font-medium text-zinc-500 tracking-wide uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-5 pl-4 text-[11px] text-zinc-600">No data</td>
                </tr>
              ) : (
                result.rows.map((r, i) => (
                  <tr key={`${r.runId}-${r.player}`} className="tr-hover border-b border-white/[0.04] last:border-0">
                    <td className="py-2 pl-4 pr-1">
                      <span className="mono text-[10px] text-zinc-600">{i + 1}</span>
                    </td>
                    <td className="py-2 px-2 min-w-0">
                      <PlayerDpsDialog
                        runId={r.runId}
                        playerName={r.player}
                        trigger={
                          <button type="button" className="text-left w-full min-w-0">
                            <span className="truncate text-[12px] font-medium text-sky-300 hover:underline">
                              {r.player}
                            </span>
                          </button>
                        }
                      />
                    </td>
                    <td className="py-2 px-3 text-right mono whitespace-nowrap">
                      <span className="text-zinc-200 font-semibold">
                        {r.dps.toLocaleString("en-US")}
                      </span>
                    </td>
                    <td className="py-2 pl-3 pr-2 text-right mono text-zinc-400 whitespace-nowrap">
                      {fmtTime(r.timeS)}
                    </td>
                    <td className="py-2 pl-2 pr-4 text-right mono text-zinc-600 whitespace-nowrap text-[10px]">
                      {r.date}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
