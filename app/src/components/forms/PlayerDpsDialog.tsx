// src/components/forms/PlayerDpsDialog.tsx
"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { RunPlayerDpsResponse } from "@/lib/run-player-dps";
import { SpecBadge } from "@/components/ui/badges";
import { getAbilityIconKeyByIdOrName, getAbilityIconUrl, getEnglishAbilityName } from "@/lib/ability-icons";
import GroupDpsDialog from "@/components/forms/GroupDpsDialog";

function fmtNum(n: number) { return Math.round(n).toLocaleString("en-US"); }
function fmtPct(n: number) { return `${n.toFixed(1)}%`; }

export default function PlayerDpsDialog({
  runId, playerName, trigger, modal = true,
}: { runId: string; playerName: string; trigger: React.ReactNode; modal?: boolean; }) {
  const [open, setOpen]       = useState(false);
  const [data, setData]       = useState<RunPlayerDpsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function onOpen() {
    setOpen(true);
    if (data) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/public/run-player-dps?runId=${runId}&player=${encodeURIComponent(playerName)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }

  return (
    <>
      <span onClick={onOpen} className="cursor-pointer">{trigger}</span>
      <Dialog open={open} onOpenChange={setOpen} modal={modal}>
        <DialogContent
          className="max-w-2xl border-white/[0.1] text-zinc-100 p-0 overflow-hidden"
          style={{ background: "rgba(11, 18, 32, 0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", maxWidth: "min(95vw, 860px)" }}
        >
          <div className="relative px-6 pt-5 pb-4 border-b border-white/[0.08]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.12),transparent_70%)]" />
            <div className="flex items-center justify-between gap-3 pr-8">
              <DialogTitle className="text-base font-bold text-zinc-100" style={{ fontFamily:"'Syne',sans-serif" }}>
                {playerName}
                {data?.player.spec && <span className="ml-2"><SpecBadge spec={data.player.spec} /></span>}
              </DialogTitle>
              <GroupDpsDialog
                runId={runId}
                trigger={
                  <button
                    type="button"
                    className="shrink-0 px-3 py-1 text-[11px] font-medium rounded-lg bg-white/[0.05] border border-white/[0.1] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.09] transition-colors"
                  >
                    Group DPS
                  </button>
                }
              />
            </div>
            {data && (
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px]">
                {[
                  { label:"Boss",  value:data.run.bossName },
                  { label:"DPS",   value:fmtNum(data.player.dps),  accent:"sky" as const },
                  { label:"HPS",   value:fmtNum(data.player.hps),  accent:"teal" as const },
                  ...(data.player.aps > 0 ? [{ label:"APS", value:fmtNum(data.player.aps), accent:"amber" as const }] : []),
                  { label:"Class", value:data.player.class ?? "—" },
                  { label:"Role",  value:data.player.role  ?? "—" },
                ].map(({ label, value, accent }) => (
                  <span key={label} className="flex items-center gap-1">
                    <span className="text-zinc-600">{label}:</span>
                    <span className={`font-semibold mono ${accent === "sky" ? "text-sky-400" : accent === "teal" ? "text-teal-400" : accent === "amber" ? "text-amber-400" : "text-zinc-300"}`}>{value}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 pb-5 pt-3 max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="h-5 w-5 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
              </div>
            )}
            {error && <p className="text-[12px] text-red-400 py-4">{error}</p>}
            {data && (
              <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-black/20">
                <table className="w-full text-[11.5px]">
                  <colgroup>
                    <col className="w-[36px]" />  {/* Icon */}
                    <col />                         {/* Ability name */}
                    <col className="w-[90px]" />  {/* Total */}
                    <col className="w-[52px]" />  {/* Hits */}
                    <col className="w-[58px]" />  {/* Crit% */}
                    <col className="w-[80px]" />  {/* Min */}
                    <col className="w-[80px]" />  {/* Max */}
                    <col className="w-[80px]" />  {/* Avg */}
                    <col className="w-[70px]" />  {/* DPS */}
                    <col className="w-[50px]" />  {/* % */}
                  </colgroup>
                  <thead>
                    <tr className="border-b border-white/[0.07] bg-black/20">
                      <th className="py-2 pl-3 pr-1" />
                      {["Ability","Total","Hits","Crit%","Min","Max","Avg","DPS","%"].map((h) => (
                        <th key={h} className={`py-2 text-[10px] font-medium text-zinc-500 tracking-wide uppercase whitespace-nowrap ${h==="Ability"?"pr-3 text-left":"px-2 text-right last:pr-4"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.abilities.map((a, i) => {
                      const displayName = getEnglishAbilityName(a.abilityName, a.abilityId);
                      const iconKey = getAbilityIconKeyByIdOrName(a.abilityId, a.abilityName);
                      const iconUrl = iconKey ? getAbilityIconUrl(iconKey) : null;
                      return (
                        <tr key={a.abilityId || i} className="tr-hover border-b border-white/[0.04] last:border-0">
                          <td className="py-1.5 pl-3 pr-1 align-middle">
                            {iconUrl ? (
                              <img
                                src={iconUrl}
                                alt=""
                                width={24}
                                height={24}
                                className="rounded-[4px] object-cover shrink-0"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-[4px] bg-white/[0.04]" />
                            )}
                          </td>
                          <td className="py-1.5 pr-3 text-zinc-200 font-medium">
                            <div className="truncate" title={displayName}>{displayName}</div>
                            {a.abilityId > 0 && <div className="mono text-[9px] text-zinc-600">{a.abilityId}</div>}
                          </td>
                          <td className="py-1.5 px-2 text-right mono text-zinc-300 whitespace-nowrap">{fmtNum(a.total)}</td>
                          <td className="py-1.5 px-2 text-right mono text-zinc-400 whitespace-nowrap">{a.hits}</td>
                          <td className="py-1.5 px-2 text-right mono text-zinc-400 whitespace-nowrap">{fmtPct(a.critRate)}</td>
                          <td className="py-1.5 px-2 text-right mono text-zinc-500 whitespace-nowrap">{fmtNum(a.minHit)}</td>
                          <td className="py-1.5 px-2 text-right mono text-zinc-400 whitespace-nowrap">{fmtNum(a.maxHit)}</td>
                          <td className="py-1.5 px-2 text-right mono text-zinc-400 whitespace-nowrap">{fmtNum(a.avgHit)}</td>
                          <td className="py-1.5 px-2 text-right mono stat-sky whitespace-nowrap">{a.rate.toFixed(0)}</td>
                          <td className="py-1.5 pl-2 pr-4 text-right mono text-zinc-500 whitespace-nowrap">{fmtPct(a.pct)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
