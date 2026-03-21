// src/components/page/public/top-players/ClassTopTable.tsx
"use client";
import { useState } from "react";
import PlayerDpsDialog from "@/components/forms/PlayerDpsDialog";
import type { TopPlayerRow } from "@/lib/top-players";

type Calling = "rogue" | "cleric" | "warrior" | "primalist" | "mage";

const CLASS_COLORS: Record<Calling, { bg: string; text: string; dot: string }> = {
  rogue:     { bg: "bg-amber-400/10",  text: "text-amber-300",  dot: "bg-amber-400"   },
  cleric:    { bg: "bg-emerald-400/10",text: "text-emerald-300",dot: "bg-emerald-400" },
  warrior:   { bg: "bg-red-400/10",    text: "text-red-300",    dot: "bg-red-400"     },
  primalist: { bg: "bg-sky-400/10",    text: "text-sky-300",    dot: "bg-sky-400"     },
  mage:      { bg: "bg-violet-400/10", text: "text-violet-300", dot: "bg-violet-400"  },
};

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function ClassTopTable({
  calling,
  rows,
  limit = 10,
}: {
  calling: Calling;
  rows: TopPlayerRow[];
  limit?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const col = CLASS_COLORS[calling];
  const display = expanded ? rows : rows.slice(0, limit);

  return (
    <div className="relative overflow-hidden rounded-2xl glass">
      {/* Class color top bar */}
      <div className={`absolute inset-x-0 top-0 h-0.5 ${col.dot} opacity-60`} />

      {/* Header */}
      <div className={`flex items-center gap-2 px-4 pt-4 pb-3`}>
        <span className={`h-2 w-2 rounded-full ${col.dot}`} />
        <h3
          className={`text-[13px] font-bold capitalize ${col.text}`}
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          {calling}
        </h3>
        <span className="ml-auto mono text-[10px] text-zinc-600">
          {rows.length} entries
        </span>
      </div>

      {/* Table */}
      <div className="px-3 pb-3">
        <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-black/20">
          <table className="w-full table-fixed text-[11.5px]">
            <colgroup>
              <col className="w-9" />     {/* # */}
              <col />                      {/* Player */}
              <col className="w-[88px]" /> {/* DPS */}
              <col className="w-[64px]" /> {/* Time */}
            </colgroup>
            <thead>
              <tr className="border-b border-white/[0.07] bg-black/20">
                <th className="py-2 pl-4 pr-1 text-left text-[10px] font-medium text-zinc-600">#</th>
                <th className="py-2 px-2 text-left text-[10px] font-medium text-zinc-500 tracking-wide uppercase">Player</th>
                <th className="py-2 px-3 text-right text-[10px] font-medium text-zinc-500 tracking-wide uppercase">DPS</th>
                <th className="py-2 pl-3 pr-4 text-right text-[10px] font-medium text-zinc-500 tracking-wide uppercase">Time</th>
              </tr>
            </thead>
            <tbody>
              {display.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-5 pl-4 text-[11px] text-zinc-600">No data</td>
                </tr>
              ) : (
                display.map((r, i) => (
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
                            <span className={`truncate text-[12px] font-medium ${col.text} hover:underline`}>
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
                    <td className="py-2 pl-3 pr-4 text-right mono text-zinc-400 whitespace-nowrap">
                      {fmtTime(r.timeS)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {rows.length > limit && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 w-full text-center text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors py-1"
          >
            {expanded ? "▲ Show less" : `▼ Show all ${rows.length}`}
          </button>
        )}
      </div>
    </div>
  );
}
