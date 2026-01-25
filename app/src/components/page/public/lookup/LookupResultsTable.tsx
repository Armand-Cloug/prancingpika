// src/components/page/public/lookup/LookupResultsTable.tsx
"use client";

import { useMemo } from "react";
import GroupDpsDialog from "@/components/forms/GroupDpsDialog";

function formatTime(s: number) {
  const sec = Math.max(0, Math.floor(s));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const r = sec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function toYMD(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Player = { name: string; class: string | null };

type LookupRecord = {
  runId: string;
  endedAt: string;
  bossName: string;
  dps: number;
  hps: number;
  raidDps: number | null;
  raidHps: number | null;
  timeS: number;
  guildName: string | null;
  guildTag: string | null;
  groupLabel: string | null;
};

export default function LookupResultsTable({
  query,
  player,
  records,
  truncated,
  loading,
}: {
  query: string;
  player: Player;
  records: LookupRecord[];
  truncated: boolean;
  loading: boolean;
}) {
  const sorted = useMemo(() => {
    // "fait juste un trie" => tri simple par bossName, rien d'autre
    return [...records].sort((a, b) => a.bossName.localeCompare(b.bossName));
  }, [records]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(700px_circle_at_20%_0%,rgba(56,189,248,0.14),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="flex flex-col gap-1 px-4 pt-5 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-zinc-100">
            Records — <span className="text-sky-200/90">{player.name}</span>
          </div>
          <div className="mt-1 text-[12px] text-zinc-300/70">
            Query: “{query}” • {player.class ?? "Unknown class"} • {records.length} runs
            {truncated ? <span className="text-zinc-400/70"> (truncated)</span> : null}
          </div>
        </div>
      </div>

      <div className="px-3 pb-3">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
          <table className="w-full table-fixed text-[12px]">
            <colgroup>
              <col className="w-[92px]" /> {/* Date */}
              <col /> {/* Boss */}
              <col className="w-[140px]" /> {/* Player click */}
              <col className="w-[96px]" /> {/* DPS */}
              <col className="hidden md:table-column w-[96px]" /> {/* HPS */}
              <col className="hidden lg:table-column w-[110px]" /> {/* Raid DPS */}
              <col className="w-[76px]" /> {/* Time */}
            </colgroup>

            <thead className="bg-white/[0.03] text-[11px] text-zinc-300/60">
              <tr className="border-b border-white/10">
                <th className="py-2 pl-3 pr-2 text-left font-medium">Date</th>
                <th className="py-2 px-2 text-left font-medium">Boss</th>
                <th className="py-2 px-2 text-left font-medium">Player</th>
                <th className="py-2 px-2 text-right font-medium whitespace-nowrap">ST DPS</th>
                <th className="hidden md:table-cell py-2 px-2 text-right font-medium whitespace-nowrap">HPS</th>
                <th className="hidden lg:table-cell py-2 px-2 text-right font-medium whitespace-nowrap">Raid DPS</th>
                <th className="py-2 pl-2 pr-4 text-right font-medium">Time</th>
              </tr>
            </thead>

            <tbody className="text-zinc-100">
              {loading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="py-2 pl-3 pr-2 text-zinc-300/40">----</td>
                    <td className="py-2 px-2 text-zinc-300/40">Loading…</td>
                    <td className="py-2 px-2 text-zinc-300/40">—</td>
                    <td className="py-2 px-2 text-right text-zinc-300/40">—</td>
                    <td className="hidden md:table-cell py-2 px-2 text-right text-zinc-300/40">—</td>
                    <td className="hidden lg:table-cell py-2 px-2 text-right text-zinc-300/40">—</td>
                    <td className="py-2 pl-2 pr-4 text-right text-zinc-300/40">—</td>
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td className="py-3 pl-3 text-zinc-300/60" colSpan={7}>
                    No data
                  </td>
                </tr>
              ) : (
                sorted.map((r, idx) => (
                  <tr key={`${r.runId}-${idx}`} className="border-b border-white/5 last:border-0">
                    <td className="py-2 pl-3 pr-2 tabular-nums text-zinc-200/85 whitespace-nowrap">
                      {toYMD(r.endedAt)}
                    </td>

                    <td className="py-2 px-2 min-w-0">
                      <div className="truncate" title={r.bossName}>
                        {r.bossName}
                        {r.groupLabel ? (
                          <span className="ml-2 text-[11px] text-zinc-300/55">({r.groupLabel})</span>
                        ) : null}
                      </div>
                      {r.guildName ? (
                        <div className="truncate text-[11px] text-zinc-300/60">
                          <span className="text-sky-200/80">{r.guildName}</span>
                          {r.guildTag ? <span className="text-zinc-300/60"> [{r.guildTag}]</span> : null}
                        </div>
                      ) : null}
                    </td>

                    <td className="py-2 px-2">
                      <GroupDpsDialog
                        runId={r.runId}
                        bossLabel={r.bossName}
                        dateLabel={toYMD(r.endedAt)}
                        trigger={
                          <button type="button" className="block w-full min-w-0 text-left">
                            <span
                              className="block w-full min-w-0 truncate whitespace-nowrap text-sky-200/90 hover:text-sky-200"
                              title={player.name}
                            >
                              {player.name}
                            </span>
                          </button>
                        }
                      />
                    </td>

                    <td className="py-2 px-2 text-right tabular-nums whitespace-nowrap">
                      {Math.round(r.dps).toLocaleString("en-US")}
                    </td>

                    <td className="hidden md:table-cell py-2 px-2 text-right tabular-nums whitespace-nowrap text-zinc-200/90">
                      {Math.round(r.hps).toLocaleString("en-US")}
                    </td>

                    <td className="hidden lg:table-cell py-2 px-2 text-right tabular-nums whitespace-nowrap text-zinc-200/90">
                      {r.raidDps != null ? Math.round(r.raidDps).toLocaleString("en-US") : "—"}
                    </td>

                    <td className="py-2 pl-2 pr-4 text-right tabular-nums whitespace-nowrap">
                      {formatTime(r.timeS)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-2 text-[11px] text-zinc-400/70">
          Player column is clickable (opens the group DPS table for that run).
          {truncated ? " Results are capped server-side." : ""}
        </div>
      </div>
    </div>
  );
}
