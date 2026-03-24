// src/components/forms/GroupDpsDialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Role } from "@/lib/role";
import type { RunPlayerDpsResponse } from "@/lib/run-player-dps";
import { getAbilityIconKeyByIdOrName, getAbilityIconUrl, getEnglishAbilityName } from "@/lib/ability-icons";

type Calling = "cleric" | "primalist" | "warrior" | "rogue" | "mage";

function normClass(v?: string | null): Calling | null {
  if (!v) return null;
  const s = v.trim().toLowerCase();
  if (s.startsWith("cler") || s === "c") return "cleric";
  if (s.startsWith("pri") || s.includes("prima")) return "primalist";
  if (s.startsWith("war") || s === "w") return "warrior";
  if (s.startsWith("rog") || s === "r") return "rogue";
  if (s.startsWith("mag") || s === "m") return "mage";
  if (["cleric", "primalist", "warrior", "rogue", "mage"].includes(s)) return s as Calling;
  return null;
}

function classTint(playerClass?: string | null) {
  const c = normClass(playerClass);
  switch (c) {
    case "cleric":    return "bg-emerald-500/22 ring-emerald-400/20";
    case "primalist": return "bg-sky-400/22 ring-sky-300/20";
    case "warrior":   return "bg-red-500/22 ring-red-400/20";
    case "rogue":     return "bg-yellow-400/20 ring-yellow-300/20";
    case "mage":      return "bg-violet-500/22 ring-violet-400/20";
    default:          return "bg-white/6 ring-white/10";
  }
}

function rolePill(category: Role) {
  const base = "inline-flex w-[108px] max-w-[108px] justify-center rounded-md px-2 py-[2px] text-[11px] font-semibold border truncate";
  if (category === "heal")    return `${base} bg-emerald-500/15 text-emerald-200 border-emerald-500/20`;
  if (category === "support") return `${base} bg-violet-500/15 text-violet-200 border-violet-500/20`;
  if (category === "tank")    return `${base} bg-sky-500/15 text-sky-200 border-sky-500/20`;
  return `${base} bg-red-500/15 text-red-200 border-red-500/20`;
}

function formatTime(s: number) {
  const sec = Math.max(0, Math.floor(s));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const r = sec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function fmtNum(n: number) { return Math.round(n).toLocaleString("en-US"); }
function fmtPct(n: number) { return `${n.toFixed(1)}%`; }

type GroupDpsResponse = {
  run: {
    id: string;
    bossName: string;
    startedAt: string;
    durationTotalS: number;
    bossDurationS: number | null;
    dpsGroup: number | null;
    hpsGroup: number | null;
    guildName: string | null;
    guildTag: string | null;
    groupLabel: string | null;
    rosterSize: number | null;
  };
  rows: Array<{
    player: string;
    playerClass: string | null;
    role: Role;
    roleLabel: string;
    spec: string | null;
    dps: number;
    hps: number;
  }>;
};

export default function GroupDpsDialog({
  runId,
  trigger,
  bossLabel,
  dateLabel,
}: {
  runId: string;
  trigger: React.ReactNode;
  bossLabel?: string;
  dateLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GroupDpsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Inline player DPS state
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [playerData, setPlayerData] = useState<RunPlayerDpsResponse | null>(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    setError(null);

    fetch(`/api/public/run-group-dps?runId=${encodeURIComponent(runId)}`, { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Failed to load group DPS");
        return j as GroupDpsResponse;
      })
      .then((j) => { if (alive) setData(j); })
      .catch((e: any) => { if (alive) { setError(String(e?.message || "Failed to load")); setData(null); } })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [open, runId]);

  // Reset player selection when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedPlayer(null);
      setPlayerData(null);
      setPlayerError(null);
    }
  }, [open]);

  async function selectPlayer(name: string) {
    if (selectedPlayer === name) {
      setSelectedPlayer(null);
      setPlayerData(null);
      return;
    }
    setSelectedPlayer(name);
    setPlayerData(null);
    setPlayerLoading(true);
    setPlayerError(null);
    try {
      const res = await fetch(`/api/public/run-player-dps?runId=${runId}&player=${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPlayerData(await res.json());
    } catch (e) {
      setPlayerError(String(e));
    } finally {
      setPlayerLoading(false);
    }
  }

  const rows = useMemo(() => {
    const r = data?.rows ?? [];
    return [...r].sort((a, b) => (b.dps ?? 0) - (a.dps ?? 0));
  }, [data]);

  const headerBoss = data?.run.bossName ?? bossLabel ?? "Group DPS";
  const headerDate = data?.run.startedAt
    ? new Date(data.run.startedAt).toLocaleString("fr-FR")
    : dateLabel ?? "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent
        className="max-w-[920px] bg-[#0b1220] border-white/10 text-zinc-100 flex flex-col overflow-hidden"
        style={{ maxHeight: "min(90vh, 820px)" }}
      >
        {/* Header fixe */}
        <div className="-mx-6 -mt-6 mb-4 rounded-t-lg bg-gradient-to-b from-sky-500/15 via-sky-500/5 to-transparent px-6 pt-6 pb-4 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold pr-10">{headerBoss}</DialogTitle>
            {headerDate ? <div className="mt-1 text-[12px] text-zinc-200/70">{headerDate}</div> : null}
          </DialogHeader>
          <div className="mt-3 text-[12px] text-zinc-200/70">
            Click on a player to see their individual DPS breakdown.
          </div>
        </div>

        {/* Méta run fixe */}
        <div className="shrink-0 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-zinc-200/85">
          <span className="text-zinc-300/70">Run</span>
          <span className="tabular-nums">{runId}</span>

          {data?.run.guildName ? (
            <>
              <span className="text-zinc-300/70">Guild</span>
              <span className="text-sky-200/90">
                {data.run.guildName}
                {data.run.guildTag ? <span className="text-zinc-300/60"> [{data.run.guildTag}]</span> : null}
              </span>
            </>
          ) : null}

          {data?.run.groupLabel ? (
            <>
              <span className="text-zinc-300/70">Group</span>
              <span>{data.run.groupLabel}</span>
            </>
          ) : null}

          {data?.run.rosterSize != null ? (
            <>
              <span className="text-zinc-300/70">Roster</span>
              <span className="tabular-nums">{data.run.rosterSize}</span>
            </>
          ) : null}
        </div>

        {data?.run.durationTotalS != null ? (
          <div className="shrink-0 mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-zinc-200/85">
            <span>
              <span className="text-zinc-300/70">Time</span>{" "}
              <span className="tabular-nums">{formatTime(data.run.durationTotalS)}</span>
              {data.run.bossDurationS != null ? (
                <>
                  <span className="mx-1 text-zinc-400/80">|</span>
                  <span className="tabular-nums">{formatTime(data.run.bossDurationS)}</span>
                </>
              ) : null}
            </span>
            <span>
              <span className="text-zinc-300/70">Raid DPS</span>{" "}
              <span className="tabular-nums">
                {data.run.dpsGroup != null ? Math.round(data.run.dpsGroup).toLocaleString("en-US") : "—"}
              </span>
            </span>
            <span>
              <span className="text-zinc-300/70">Raid HPS</span>{" "}
              <span className="tabular-nums">
                {data.run.hpsGroup != null ? Math.round(data.run.hpsGroup).toLocaleString("en-US") : "—"}
              </span>
            </span>
          </div>
        ) : null}

        {/* Zone scrollable : tableau + détail joueur + footer */}
        <div className="flex-1 overflow-y-auto min-h-0">

        {/* Group table */}
        <div className="relative mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/25">
          <table className="w-full table-fixed text-[12px]">
            <colgroup>
              <col className="w-[128px]" />
              <col />
              <col className="w-[120px]" />
              <col className="w-[120px]" />
            </colgroup>
            <thead className="bg-[#0b1220]/70 text-[11px] text-zinc-300/60">
              <tr className="border-b border-white/10">
                <th className="py-2 pl-3 pr-2 text-left font-medium">Spec</th>
                <th className="py-2 px-2 text-left font-medium">Player</th>
                <th className="py-2 px-3 text-right font-medium whitespace-nowrap">ST DPS</th>
                <th className="py-2 pl-3 pr-4 text-right font-medium whitespace-nowrap">HPS</th>
              </tr>
            </thead>
            <tbody className="text-zinc-100">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="py-2 pl-3 pr-2"><div className="h-[18px] w-[92px] rounded bg-white/5" /></td>
                    <td className="py-2 px-2"><div className="h-[26px] w-full rounded-lg bg-white/5" /></td>
                    <td className="py-2 px-3 text-right"><div className="ml-auto h-[14px] w-[70px] rounded bg-white/5" /></td>
                    <td className="py-2 pl-3 pr-4 text-right"><div className="ml-auto h-[14px] w-[70px] rounded bg-white/5" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr><td className="py-3 pl-3 text-zinc-300/70" colSpan={4}>{error}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td className="py-3 pl-3 text-zinc-300/60" colSpan={4}>No data</td></tr>
              ) : (
                rows.map((r, idx) => (
                  <tr
                    key={`${r.player}-${idx}`}
                    className={`border-b border-white/5 last:border-0 cursor-pointer transition-colors ${selectedPlayer === r.player ? "bg-sky-500/10" : "hover:bg-white/[0.03]"}`}
                    onClick={() => selectPlayer(r.player)}
                  >
                    <td className="py-2 pl-3 pr-2 align-middle">
                      <span className={rolePill(r.role)} title={r.spec ? `${r.spec} (${r.role})` : `Role: ${r.role}`}>
                        {r.spec || (r.roleLabel && r.roleLabel.trim() ? r.roleLabel : "—")}
                      </span>
                    </td>
                    <td className="py-2 px-2 align-middle">
                      <div
                        className={[
                          "rounded-lg px-3 py-1.5 ring-1",
                          "w-full min-w-0 truncate whitespace-nowrap text-left text-[12px] font-medium",
                          classTint(r.playerClass),
                        ].join(" ")}
                        title={r.player}
                      >
                        {r.player}
                        {selectedPlayer === r.player && <span className="ml-2 text-sky-300/70 text-[10px]">▼</span>}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-zinc-200/90 whitespace-nowrap align-middle">
                      {Math.round(r.dps).toLocaleString("en-US")}
                    </td>
                    <td className="py-2 pl-3 pr-4 text-right tabular-nums text-zinc-200/90 whitespace-nowrap align-middle">
                      {Math.round(r.hps).toLocaleString("en-US")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Inline player DPS detail */}
        {selectedPlayer && (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.07] bg-sky-500/5 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-zinc-100">{selectedPlayer}</span>
              {playerData && (
                <div className="flex gap-4 text-[11px]">
                  <span><span className="text-zinc-500">DPS </span><span className="text-sky-400 font-semibold mono">{fmtNum(playerData.player.dps)}</span></span>
                  {playerData.player.hps > 0 && <span><span className="text-zinc-500">HPS </span><span className="text-teal-400 font-semibold mono">{fmtNum(playerData.player.hps)}</span></span>}
                </div>
              )}
              <button
                type="button"
                onClick={() => { setSelectedPlayer(null); setPlayerData(null); }}
                className="text-zinc-500 hover:text-zinc-300 text-[11px] transition-colors ml-4"
              >
                ✕ close
              </button>
            </div>

            {playerLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="h-4 w-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
              </div>
            )}
            {playerError && <p className="text-[12px] text-red-400 px-4 py-3">{playerError}</p>}
            {playerData && playerData.abilities.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-[11.5px]">
                  <colgroup>
                    <col className="w-[36px]" />
                    <col />
                    <col className="w-[90px]" />
                    <col className="w-[52px]" />
                    <col className="w-[58px]" />
                    <col className="w-[80px]" />
                    <col className="w-[80px]" />
                    <col className="w-[80px]" />
                    <col className="w-[70px]" />
                    <col className="w-[50px]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-white/[0.07] bg-black/20">
                      <th className="py-2 pl-3 pr-1" />
                      {["Ability", "Total", "Hits", "Crit%", "Min", "Max", "Avg", "DPS", "%"].map((h) => (
                        <th key={h} className={`py-2 text-[10px] font-medium text-zinc-500 tracking-wide uppercase whitespace-nowrap ${h === "Ability" ? "pr-3 text-left" : "px-2 text-right last:pr-4"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {playerData.abilities.map((a, i) => {
                      const displayName = getEnglishAbilityName(a.abilityName, a.abilityId);
                      const iconKey = getAbilityIconKeyByIdOrName(a.abilityId, a.abilityName);
                      const iconUrl = iconKey ? getAbilityIconUrl(iconKey) : null;
                      return (
                        <tr key={a.abilityId || i} className="border-b border-white/[0.04] last:border-0">
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
            {playerData && playerData.abilities.length === 0 && (
              <p className="px-4 py-3 text-[12px] text-zinc-500">No ability data available.</p>
            )}
          </div>
        )}

        <div className="mt-2 pb-4 text-[11px] text-zinc-400/70">
          Color = Calling (Cleric / Primalist / Warrior / Rogue / Mage) · Click a row to see ability breakdown
        </div>

        </div>{/* fin zone scrollable */}
      </DialogContent>
    </Dialog>
  );
}
