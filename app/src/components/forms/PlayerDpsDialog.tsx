// src/components/forms/PlayerDpsDialog.tsx
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { RunPlayerDpsResponse } from "@/lib/run-player-dps";
import { getAbilityIconKey, getAbilityIconUrl } from "@/lib/ability-icons";

function formatTime(s: number | null | undefined) {
  const sec = Math.max(0, Math.floor(Number(s ?? 0)));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const r = sec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function n(v: unknown, fallback = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

function fmtInt(v: unknown) {
  return Math.round(n(v)).toLocaleString("en-US");
}

function fmt1(v: unknown) {
  return n(v).toLocaleString("en-US", { maximumFractionDigits: 1 });
}

function fmtPct(v: unknown) {
  return n(v).toLocaleString("en-US", { maximumFractionDigits: 1 });
}

type AbilityRow = {
  abilityName: string;
  iconKey: string | null;
  total: number;
  dps: number;
  pct: number;
  hits: number;
  critRate: number;
  minHit: number;
  maxHit: number;
  avgHit: number;
};

export default function PlayerDpsDialog({
  runId,
  player,
  trigger,
}: {
  runId: string;
  player: string;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RunPlayerDpsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let alive = true;
    setLoading(true);
    setError(null);

    fetch(`/api/public/run-player-dps?runId=${encodeURIComponent(runId)}&player=${encodeURIComponent(player)}`, {
      cache: "no-store",
    })
      .then(async (r) => {
        const text = await r.text();
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${text || "Internal error"}`);
        try {
          return JSON.parse(text) as RunPlayerDpsResponse;
        } catch {
          throw new Error("Invalid JSON response (500): " + (text?.slice(0, 200) || ""));
        }
      })
      .then((j) => {
        if (!alive) return;
        setData(j);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(String((e as any)?.message || "Failed to load"));
        setData(null);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [open, runId, player]);

  const header = useMemo(() => {
    const boss = (data as any)?.run?.bossName ?? "Encounter";
    const phase = (data as any)?.run?.phaseLabel ?? (data as any)?.run?.phase ?? "Boss";
    const dur =
      (data as any)?.run?.bossDurationS ??
      (data as any)?.run?.durationS ??
      (data as any)?.run?.durationTotalS ??
      0;
    const who = (data as any)?.player?.name ?? player;
    return { boss, phase, dur: Number(dur ?? 0), who };
  }, [data, player]);

  const summary = useMemo(() => {
    const total =
      (data as any)?.player?.totalDamage ?? (data as any)?.player?.damage ?? (data as any)?.player?.total ?? 0;
    const dps = (data as any)?.player?.dps ?? 0;
    return { total: Number(total ?? 0), dps: Number(dps ?? 0) };
  }, [data]);

  const rows: AbilityRow[] = useMemo(() => {
    const abilities = ((data as any)?.abilities ?? []) as any[];

    const mapped: AbilityRow[] = abilities.map((a) => {
      const abilityName = String(a.abilityName ?? a.ability ?? a.name ?? "Unknown").trim() || "Unknown";
      const iconKey = getAbilityIconKey(abilityName);

      const total = n(a.total, 0);
      const dps = a.dps != null ? n(a.dps, 0) : a.rate != null ? n(a.rate, 0) : 0;
      const pct = a.pct != null ? n(a.pct, 0) : a.percent != null ? n(a.percent, 0) : 0;
      const hits = n(a.hits, 0);

      const critRate =
        a.critRate != null
          ? n(a.critRate, 0)
          : a.critPct != null
            ? n(a.critPct, 0)
            : a.crit_percent != null
              ? n(a.crit_percent, 0)
              : 0;

      const minHit = a.minHit != null ? n(a.minHit, 0) : a.min != null ? n(a.min, 0) : 0;
      const maxHit = a.maxHit != null ? n(a.maxHit, 0) : a.max != null ? n(a.max, 0) : 0;
      const avgHit = a.avgHit != null ? n(a.avgHit, 0) : a.avg != null ? n(a.avg, 0) : 0;

      return { abilityName, iconKey, total, dps, pct, hits, critRate, minHit, maxHit, avgHit };
    });

    mapped.sort((a, b) => b.total - a.total);
    return mapped;
  }, [data]);

  const thNum = "py-2 px-3 text-left font-medium whitespace-nowrap";
  const tdNum = "py-2 px-3 text-left tabular-nums whitespace-nowrap text-zinc-200/90";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      {/* IMPORTANT (ton inspect le prouve):
          DialogContent shadcn a un `max-w-lg` par défaut, qui écrase ton `max-w-none`.
          Solution: forcer avec `!` pour override, sans toucher dialog.tsx.
      */}
      <DialogContent
        className="
          !w-[98vw] !max-w-none
          !h-[94vh] !max-h-none
          p-0
          overflow-hidden
          bg-[#0b1220] border-white/10 text-zinc-100
        "
      >
        <div className="h-full w-full flex flex-col">
          {/* HEADER */}
          <div className="rounded-t-lg bg-gradient-to-b from-violet-500/15 via-violet-500/5 to-transparent px-6 pt-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold pr-10">
                Encounter: {header.boss} | Player: {header.who} | Mob Type: {header.phase} | Timer:{" "}
                {formatTime(header.dur)}
              </DialogTitle>
              <div className="mt-1 text-[12px] text-zinc-200/70">Run #{runId}</div>
            </DialogHeader>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-zinc-200/85">
              <span>
                <span className="text-zinc-300/70">Player Damage</span>{" "}
                <span className="tabular-nums">{fmtInt(summary.total)}</span>
              </span>
              <span>
                <span className="text-zinc-300/70">DPS</span> <span className="tabular-nums">{fmt1(summary.dps)}</span>
              </span>
            </div>

            <div className="mt-3 text-[11px] text-zinc-400/70">
              DPS breakdown by ability.
            </div>
          </div>

          {/* TABLE ZONE */}
          <div className="flex-1 px-6 pb-6">
            <div className="h-full rounded-xl border border-white/10 bg-black/25 overflow-hidden">
              {/* Horizontal scrollbar UNIQUEMENT si l’écran est trop petit:
                  - table w-full
                  - min-width raisonnables par colonne
              */}
              <div className="h-full overflow-y-auto overflow-x-auto">
                <table className="w-full table-auto text-[12px]">
                  <thead className="bg-[#0b1220]/70 text-[11px] text-zinc-300/60 sticky top-0 z-10">
                    <tr className="border-b border-white/10">
                      <th className="py-2 pl-4 pr-3 text-left font-medium whitespace-nowrap min-w-[360px]">
                        Abilitys
                      </th>
                      <th className={`${thNum} min-w-[170px]`}>Total</th>
                      <th className={`${thNum} min-w-[150px]`}>DPS</th>
                      <th className={`${thNum} min-w-[90px]`}>%</th>
                      <th className={`${thNum} min-w-[90px]`}>Hits</th>
                      <th className={`${thNum} min-w-[90px]`}>Crit%</th>
                      <th className={`${thNum} min-w-[140px]`}>Min</th>
                      <th className={`${thNum} min-w-[140px]`}>Max</th>
                      <th className={`${thNum} min-w-[140px]`}>Avg</th>
                    </tr>
                  </thead>

                  <tbody className="text-zinc-100">
                    {loading ? (
                      Array.from({ length: 14 }).map((_, i) => (
                        <tr key={i} className="border-b border-white/5 last:border-0">
                          <td className="py-2 pl-4 pr-3 min-w-[360px]">
                            <div className="h-[14px] w-[65%] rounded bg-white/5" />
                          </td>
                          <td className="py-2 px-3">
                            <div className="h-[14px] w-[110px] rounded bg-white/5" />
                          </td>
                          <td className="py-2 px-3">
                            <div className="h-[14px] w-[100px] rounded bg-white/5" />
                          </td>
                          <td className="py-2 px-3">
                            <div className="h-[14px] w-[60px] rounded bg-white/5" />
                          </td>
                          <td className="py-2 px-3">
                            <div className="h-[14px] w-[60px] rounded bg-white/5" />
                          </td>
                          <td className="py-2 px-3">
                            <div className="h-[14px] w-[70px] rounded bg-white/5" />
                          </td>
                          <td className="py-2 px-3">
                            <div className="h-[14px] w-[100px] rounded bg-white/5" />
                          </td>
                          <td className="py-2 px-3">
                            <div className="h-[14px] w-[100px] rounded bg-white/5" />
                          </td>
                          <td className="py-2 px-3">
                            <div className="h-[14px] w-[100px] rounded bg-white/5" />
                          </td>
                        </tr>
                      ))
                    ) : error ? (
                      <tr>
                        <td className="py-3 pl-4 text-zinc-300/70" colSpan={9}>
                          {error}
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td className="py-3 pl-4 text-zinc-300/60" colSpan={9}>
                          No data
                        </td>
                      </tr>
                    ) : (
                      rows.map((r, idx) => {
                        const iconUrl = r.iconKey ? getAbilityIconUrl(r.iconKey) : null;

                        return (
                          <tr key={`${r.abilityName}-${idx}`} className="border-b border-white/5 last:border-0">
                            <td className="py-2 pl-4 pr-3 min-w-[360px]">
                              <div className="flex items-center gap-2 min-w-0">
                                {iconUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={iconUrl} alt="" className="h-4 w-4 rounded-sm opacity-90 shrink-0" />
                                ) : (
                                  <div className="h-4 w-4 rounded-sm bg-white/5 border border-white/10 shrink-0" />
                                )}

                                <div className="min-w-0">
                                  <div className="truncate" title={r.abilityName}>
                                    {r.abilityName}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className={tdNum}>{fmtInt(r.total)}</td>
                            <td className={tdNum}>{fmt1(r.dps)}</td>
                            <td className={tdNum}>{fmtPct(r.pct)}</td>
                            <td className={tdNum}>{fmtInt(r.hits)}</td>
                            <td className={tdNum}>{fmtPct(r.critRate)}</td>
                            <td className={tdNum}>{fmtInt(r.minHit)}</td>
                            <td className={tdNum}>{fmtInt(r.maxHit)}</td>
                            <td className={tdNum}>{fmt1(r.avgHit)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
