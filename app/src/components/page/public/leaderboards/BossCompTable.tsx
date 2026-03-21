// src/components/page/public/leaderboards/BossCompTable.tsx
"use client";
import { RolePill, classTintClass } from "@/components/ui/badges";
import PlayerDpsDialog from "@/components/forms/PlayerDpsDialog";
import type { CompEntry } from "@/lib/leaderboards";

export default function BossCompTable({
  bossName,
  rows,
  rankLabel,
  runId,
}: {
  bossName: string;
  rows: CompEntry[] | null;
  rankLabel: string;
  runId: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl glass h-full">
      {/* Top accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20
                      bg-[radial-gradient(ellipse_600px_circle_at_70%_0%,rgba(167,139,250,0.09),transparent_60%)]" />

      {/* Header */}
      <div className="flex items-baseline justify-between px-5 pt-5 pb-2">
        <h3 className="text-[13px] font-bold text-zinc-100" style={{ fontFamily: "'Syne', sans-serif" }}>
          {bossName}
        </h3>
        <span className="text-[10px] text-zinc-500 tracking-wide uppercase">Comp {rankLabel}</span>
      </div>

      {/* Table */}
      <div className="px-3 pb-4">
        <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-black/20">
          <table className="w-full table-fixed text-[11.5px]">
            <colgroup>
              <col className="w-[110px]" /> {/* Spec */}
              <col />                        {/* Player */}
              <col className="w-[90px]" />  {/* DPS */}
              <col className="w-[80px]" />  {/* HPS */}
            </colgroup>
            <thead>
              <tr className="border-b border-white/[0.07] bg-black/20">
                <th className="py-2 pl-4 pr-2 text-left text-[10px] font-medium text-zinc-500 tracking-wide uppercase">Spec</th>
                <th className="py-2 px-2 text-left text-[10px] font-medium text-zinc-500 tracking-wide uppercase">Player</th>
                <th className="py-2 px-3 text-right text-[10px] font-medium text-zinc-500 tracking-wide uppercase whitespace-nowrap">DPS</th>
                <th className="py-2 pl-3 pr-4 text-right text-[10px] font-medium text-zinc-500 tracking-wide uppercase whitespace-nowrap">HPS</th>
              </tr>
            </thead>
            <tbody>
              {!rows || rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 pl-4 text-[11px] text-zinc-600">No data yet</td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={`${r.player}-${i}`} className="tr-hover border-b border-white/[0.05] last:border-0">
                    <td className="py-2 pl-4 pr-2 align-middle">
                      <RolePill role={r.role} label={r.roleLabel} spec={r.spec} />
                    </td>
                    <td className="py-2 px-2 align-middle min-w-0">
                      <PlayerDpsDialog
                        runId={runId}
                        playerName={r.player}
                        trigger={
                          <button
                            type="button"
                            className={`rounded-lg px-3 py-1.5 ring-1 w-full min-w-0 truncate text-left
                                        text-[12px] font-medium text-zinc-100
                                        transition hover:brightness-110 hover:ring-white/20
                                        focus:outline-none ${classTintClass(r.playerClass)}`}
                            title={r.player}
                          >
                            {r.player}
                          </button>
                        }
                      />
                    </td>
                    <td className="py-2 px-3 text-right mono text-zinc-300 whitespace-nowrap align-middle">
                      {r.dps.toLocaleString("en-US")}
                    </td>
                    <td className="py-2 pl-3 pr-4 text-right mono text-zinc-300 whitespace-nowrap align-middle">
                      {r.hps.toLocaleString("en-US")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10px] text-zinc-600">Color = Role · Click player for DPS details</p>
      </div>
    </div>
  );
}
