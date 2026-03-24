// src/components/page/public/lookup/LookupResultsTable.tsx
"use client";
import PlayerDpsDialog from "@/components/forms/PlayerDpsDialog";
import type { LookupRecord } from "@/lib/player-lookup";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function LookupResultsTable({
  player,
  playerClass,
  records,
  truncated,
}: {
  player: string;
  playerClass: string | null;
  records: LookupRecord[];
  truncated: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Player header */}
      <div className="glass rounded-2xl px-5 py-4 flex items-center gap-4">
        <div>
          <p className="text-[10px] text-zinc-600 tracking-wide uppercase mb-0.5">Player</p>
          <p className="text-lg font-bold text-zinc-100" style={{ fontFamily: "'Syne', sans-serif" }}>
            {player}
          </p>
        </div>
        {playerClass && (
          <div className="border-l border-white/[0.08] pl-4">
            <p className="text-[10px] text-zinc-600 tracking-wide uppercase mb-0.5">Class</p>
            <p className="text-sm font-medium text-zinc-300">{playerClass}</p>
          </div>
        )}
        <div className="ml-auto border-l border-white/[0.08] pl-4">
          <p className="text-[10px] text-zinc-600 tracking-wide uppercase mb-0.5">Runs</p>
          <p className="mono text-sm font-bold stat-sky">{records.length}{truncated ? "+" : ""}</p>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] 2xl:text-[13.5px] min-w-[520px]">
            <thead>
              <tr className="border-b border-white/[0.07] bg-black/20">
                {["Date","Boss","DPS","HPS","Time","Guild"].map((h, i) => (
                  <th
                    key={h}
                    className={`py-2.5 text-[10px] 2xl:text-[11px] font-medium text-zinc-500 tracking-wide uppercase whitespace-nowrap
                                ${i === 0 ? "pl-5 pr-3 text-left" : i <= 1 ? "px-3 text-left" : i === 5 ? "px-5 text-left" : "px-3 text-right"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 pl-5 text-[12px] text-zinc-600">No records found.</td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.runId} className="tr-hover border-b border-white/[0.04] last:border-0">
                    <td className="py-2 pl-5 pr-3 mono text-zinc-500 whitespace-nowrap">{fmtDate(r.endedAt)}</td>
                    <td className="py-2 px-3 text-zinc-200 font-medium whitespace-nowrap">
                      <PlayerDpsDialog
                        runId={r.runId}
                        playerName={player}
                        trigger={
                          <span className="text-sky-300/90 hover:text-sky-200 hover:underline cursor-pointer">
                            {r.bossName}
                          </span>
                        }
                      />
                    </td>
                    <td className="py-2 px-3 text-right mono stat-sky whitespace-nowrap">
                      {Math.round(r.dps).toLocaleString("en-US")}
                    </td>
                    <td className="py-2 px-3 text-right mono text-zinc-400 whitespace-nowrap">
                      {Math.round(r.hps).toLocaleString("en-US")}
                    </td>
                    <td className="py-2 px-3 text-right mono text-zinc-400 whitespace-nowrap">
                      {fmtTime(r.timeS)}
                    </td>
                    <td className="py-2 px-5 text-zinc-500 whitespace-nowrap text-[11px]">
                      {r.guildName ?? "—"}
                      {r.guildTag && <span className="text-zinc-700 ml-1">[{r.guildTag}]</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {truncated && (
          <div className="px-5 py-3 border-t border-white/[0.06]">
            <p className="text-[11px] text-zinc-600">Showing first 2000 records only</p>
          </div>
        )}
      </div>
    </div>
  );
}
