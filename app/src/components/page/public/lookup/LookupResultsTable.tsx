// src/components/page/public/lookup/LookupResultsTable.tsx
"use client";
import { useMemo, useState } from "react";
import PlayerDpsDialog from "@/components/forms/PlayerDpsDialog";
import type { LookupRecord } from "@/lib/player-lookup";
import { resolvePlayerName } from "@/lib/player-alias";

type SortKey = "newest" | "oldest" | "dps_desc" | "dps_asc" | "timer_desc" | "timer_asc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest",     label: "Newest → Oldest" },
  { value: "oldest",     label: "Oldest → Newest" },
  { value: "dps_desc",   label: "Highest DPS" },
  { value: "dps_asc",    label: "Lowest DPS" },
  { value: "timer_desc", label: "Longest timer" },
  { value: "timer_asc",  label: "Shortest timer" },
];

function sortRecords(records: LookupRecord[], sort: SortKey): LookupRecord[] {
  const s = [...records];
  switch (sort) {
    case "newest":     return s.sort((a, b) => +new Date(b.endedAt) - +new Date(a.endedAt));
    case "oldest":     return s.sort((a, b) => +new Date(a.endedAt) - +new Date(b.endedAt));
    case "dps_desc":   return s.sort((a, b) => b.dps - a.dps);
    case "dps_asc":    return s.sort((a, b) => a.dps - b.dps);
    case "timer_desc": return s.sort((a, b) => b.timeS - a.timeS);
    case "timer_asc":  return s.sort((a, b) => a.timeS - b.timeS);
  }
}

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
  playerWebAccount,
  records,
  truncated,
}: {
  player: string;
  playerClass: string | null;
  playerWebAccount?: { displayName: string | null } | null;
  records: LookupRecord[];
  truncated: boolean;
}) {
  const [sort, setSort] = useState<SortKey>("newest");
  const sorted = useMemo(() => sortRecords(records, sort), [records, sort]);

  return (
    <div className="flex flex-col gap-3">
      {/* Player header */}
      <div className="glass rounded-2xl px-5 py-4 flex items-center gap-4">
        <div>
          <p className="text-[10px] text-zinc-600 tracking-wide uppercase mb-0.5">Player</p>
          <p className="text-lg font-bold text-zinc-100" style={{ fontFamily: "'Syne', sans-serif" }}>
            {resolvePlayerName({ name: player, webAccount: playerWebAccount })}
          </p>
          {playerWebAccount?.displayName && playerWebAccount.displayName !== player && (
            <p className="text-xs text-zinc-500">({player})</p>
          )}
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
        {/* Sort control */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
          <span className="text-[11px] text-zinc-400/70 shrink-0">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="text-[11px] bg-white/[0.06] border border-white/10 rounded-md px-2 py-1 text-zinc-200 cursor-pointer focus:outline-none hover:bg-white/[0.09] transition-colors overscroll-contain"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12px] 2xl:text-[13.5px] min-w-[620px]">
            <thead>
              <tr className="border-b border-white/[0.07] bg-black/20">
                {["Date","Boss","Spec","DPS","HPS","Time","Guild"].map((h, i) => (
                  <th
                    key={h}
                    className={`py-2.5 text-[10px] 2xl:text-[11px] font-medium text-zinc-500 tracking-wide uppercase whitespace-nowrap
                                ${i === 0 ? "pl-5 pr-3 text-left" : i <= 2 ? "px-3 text-left" : i === 6 ? "px-5 text-left" : "px-3 text-right"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 pl-5 text-[12px] text-zinc-600">No records found.</td>
                </tr>
              ) : (
                sorted.map((r) => (
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
                    <td className="py-2 px-3 text-left whitespace-nowrap">
                      {r.spec
                        ? <span className="spec-badge">{r.spec}</span>
                        : <span className="text-zinc-600 text-[11px]">—</span>}
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
