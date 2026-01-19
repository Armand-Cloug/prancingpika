// src/components/page/public/top-players/ClassTopTable.tsx
"use client";

import type { CallingKey, TopPlayerRow } from "@/lib/top-players";
import GroupDpsDialog from "@/components/forms/GroupDpsDialog";

function formatTime(s: number) {
  const sec = Math.max(0, Math.floor(s));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const r = sec % 60;

  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function headerStyle(c: CallingKey) {
  // Rogue yellow, Cleric green, Warrior red, Primalist sky, Mage purple
  switch (c) {
    case "rogue":
      return "bg-[#b08a14] text-black";
    case "cleric":
      return "bg-[#0b6b14] text-white";
    case "warrior":
      return "bg-[#c10000] text-white";
    case "primalist":
      return "bg-[#0b67a8] text-white";
    case "mage":
      return "bg-[#6a0a85] text-white";
  }
}

function title(c: CallingKey) {
  switch (c) {
    case "rogue":
      return "Rogue";
    case "cleric":
      return "Cleric";
    case "warrior":
      return "Warrior";
    case "primalist":
      return "Primalist";
    case "mage":
      return "Mage";
  }
}

export default function ClassTopTable({
  calling,
  boss,
  rows,
  loading,
}: {
  calling: CallingKey;
  boss: string;
  rows: TopPlayerRow[];
  loading: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Title bar */}
      <div className={`flex items-center justify-between px-3 py-2 ${headerStyle(calling)}`}>
        <div className="text-sm font-semibold">{title(calling)}</div>
        <div className="text-[11px] opacity-90">ST DPS</div>
      </div>

      {/* Table
          Objectif:
          - "Player" reste lisible sur petits écrans
          - "Date" disparaît en dessous de lg (au lieu de rogner Player)
      */}
      <table className="w-full table-fixed text-[12px]">
        <colgroup>
          <col className="w-[26px]" /> {/* rank */}
          <col className="hidden lg:table-column w-[86px]" /> {/* date (hide < lg) */}
          <col /> {/* player */}
          <col className="w-[82px] sm:w-[92px]" /> {/* dps */}
          <col className="w-[52px] sm:w-[60px]" /> {/* time */}
        </colgroup>

        <thead className="bg-[#0b1220]/50 text-[11px] text-zinc-300/75">
          <tr>
            <th colSpan={5} className="px-3 pt-2 pb-1 text-left font-medium">
              <div className="truncate" title={boss}>
                {boss} — Top 100
              </div>
            </th>
          </tr>

          <tr className="border-t border-white/10">
            <th className="py-2 pl-3 text-left font-medium">#</th>
            <th className="hidden lg:table-cell py-2 text-left font-medium">Date</th>
            <th className="py-2 text-left font-medium">Player</th>
            <th className="py-2 pr-3 text-right font-medium whitespace-nowrap">ST DPS</th>
            <th className="py-2 pr-3 text-right font-medium">Time</th>
          </tr>
        </thead>

        <tbody className="text-zinc-100">
          {loading && rows.length === 0 ? (
            Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="py-2 pl-3 text-zinc-300/50 tabular-nums">{i + 1}</td>
                <td className="hidden lg:table-cell py-2 text-zinc-300/30">----</td>
                <td className="py-2 text-zinc-300/30">
                  <div className="min-w-[120px] truncate whitespace-nowrap">Loading…</div>
                </td>
                <td className="py-2 pr-3 text-right text-zinc-300/30">—</td>
                <td className="py-2 pr-3 text-right text-zinc-300/30">—</td>
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr className="border-t border-white/10">
              <td className="py-3 px-3 text-zinc-300/60" colSpan={5}>
                No data
              </td>
            </tr>
          ) : (
            rows.map((r, idx) => (
              <tr key={`${r.player}-${r.date}-${idx}`} className="border-t border-white/5">
                <td className="py-2 pl-3 tabular-nums text-zinc-200/85">{idx + 1}</td>

                <td className="hidden lg:table-cell py-2 tabular-nums text-zinc-200/85 whitespace-nowrap">
                  {r.date}
                </td>

                <td className="py-2 pr-2">
                  <GroupDpsDialog
                    runId={r.runId}
                    bossLabel={boss}
                    dateLabel={r.date}
                    trigger={
                      <button
                        type="button"
                        className="block w-full min-w-0 text-left"
                        title={r.player}
                      >
                        <span className="block w-full min-w-0 truncate whitespace-nowrap text-sky-200/90 hover:text-sky-200">
                          {r.player}
                        </span>
                      </button>
                    }
                  />
                </td>

                <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap">
                  {r.dps.toLocaleString("en-US")}
                </td>

                <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap">
                  {formatTime(r.timeS)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* subtle bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-[#1F2B3A]/70" />
    </div>
  );
}
