// src/components/page/public/last-uploads/UploadRunTable.tsx
"use client";
import { formatTime } from "@/lib/format";
import type { LastUploadRun } from "@/lib/last-uploads";
import { RolePill, classTintClass } from "@/components/ui/badges";
import PlayerDpsDialog from "@/components/forms/PlayerDpsDialog";

export default function UploadRunTable({ run }: { run: LastUploadRun }) {
  const total    = formatTime(run.durationS);
  const bossOnly = run.bossDurationS != null ? formatTime(run.bossDurationS) : null;

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-black/20">
      <table className="w-full table-fixed text-[11.5px]">
        <colgroup>
          <col className="w-[110px]" />  {/* Spec */}
          <col />                         {/* Player */}
          <col className="w-[92px]" />   {/* DPS */}
          <col className="w-[80px]" />   {/* HPS */}
          <col className="w-[64px]" />   {/* APS */}
          <col className={bossOnly ? "w-[116px]" : "w-[68px]"} /> {/* Time */}
        </colgroup>

        <thead>
          <tr className="border-b border-white/[0.07] bg-black/20">
            {["Spec", "Player", "DPS", "HPS", "APS", bossOnly ? "T | Boss" : "Time"].map((h, i) => (
              <th
                key={h}
                className={`py-2 text-[10px] font-medium text-zinc-500 tracking-wide uppercase whitespace-nowrap
                            ${i === 0 ? "pl-4 pr-2 text-left" : i === 1 ? "px-2 text-left" : i === 5 ? "pl-2 pr-4 text-right" : "px-2 text-right"}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="text-zinc-200">
          {run.players.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-5 pl-4 text-[11px] text-zinc-600">No data</td>
            </tr>
          ) : (
            run.players.map((p, i) => (
              <tr key={`${run.runId}-${p.player}-${i}`} className="tr-hover border-b border-white/[0.04] last:border-0">

                <td className="py-2 pl-4 pr-2 align-middle">
                  <RolePill role={p.role} label={p.roleLabel} spec={p.spec} size="sm" />
                </td>

                <td className="py-2 px-2 align-middle min-w-0">
                  <PlayerDpsDialog
                    runId={run.runId}
                    playerName={p.player}
                    trigger={
                      <button
                        type="button"
                        className={`rounded-lg px-3 py-1.5 ring-1 w-full min-w-0 truncate text-left
                                    text-[12px] font-medium text-zinc-100
                                    transition hover:brightness-110 hover:ring-white/20
                                    focus:outline-none ${classTintClass(p.playerClass)}`}
                        title={p.player}
                      >
                        {p.player}
                      </button>
                    }
                  />
                </td>

                <td className="py-2 px-2 text-right mono text-zinc-300 whitespace-nowrap align-middle">
                  {p.dps.toLocaleString("en-US")}
                </td>

                <td className="py-2 px-2 text-right mono text-zinc-400 whitespace-nowrap align-middle">
                  {p.hps.toLocaleString("en-US")}
                </td>

                <td className="py-2 px-2 text-right mono text-zinc-500 whitespace-nowrap align-middle">
                  {p.aps > 0 ? p.aps.toLocaleString("en-US") : "—"}
                </td>

                <td className="py-2 pl-2 pr-4 text-right mono whitespace-nowrap align-middle">
                  <span className="text-zinc-200">{total}</span>
                  {bossOnly && (
                    <>
                      <span className="mx-1 text-zinc-600">|</span>
                      <span className="text-sky-300/80">{bossOnly}</span>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="px-4 py-2 text-[10px] text-zinc-600 border-t border-white/[0.06]">
        Top {run.players.length} by DPS · Color = Role · Click player for DPS details
      </div>
    </div>
  );
}
