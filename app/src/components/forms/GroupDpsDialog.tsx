// src/components/forms/GroupDpsDialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
    case "cleric":
      return "bg-emerald-500/22 ring-emerald-400/20";
    case "primalist":
      return "bg-sky-400/22 ring-sky-300/20";
    case "warrior":
      return "bg-red-500/22 ring-red-400/20";
    case "rogue":
      return "bg-yellow-400/20 ring-yellow-300/20";
    case "mage":
      return "bg-violet-500/22 ring-violet-400/20";
    default:
      return "bg-white/6 ring-white/10";
  }
}

function formatTime(s: number) {
  const sec = Math.max(0, Math.floor(s));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const r = sec % 60;

  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

type GroupDpsResponse = {
  run: {
    id: string;
    bossName: string;
    startedAt: string; // ISO
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
  runId: string; // BigInt serialized as string
  trigger: React.ReactNode;
  bossLabel?: string;
  dateLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GroupDpsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // fetch only when opened
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
      .then((j) => {
        if (!alive) return;
        setData(j);
      })
      .catch((e: any) => {
        if (!alive) return;
        setError(String(e?.message || "Failed to load"));
        setData(null);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [open, runId]);

  const rows = useMemo(() => {
    const r = data?.rows ?? [];
    return [...r].sort((a, b) => (b.dps ?? 0) - (a.dps ?? 0));
  }, [data]);

  const headerBoss = data?.run.bossName ?? bossLabel ?? "Group DPS";
  const headerDate =
    data?.run.startedAt
      ? new Date(data.run.startedAt).toLocaleString("fr-FR")
      : dateLabel ?? "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-w-[920px] bg-[#0b1220] border-white/10 text-zinc-100">
        {/* HEADER BLEU */}
        <div className="-mx-6 -mt-6 mb-4 rounded-t-lg bg-gradient-to-b from-sky-500/15 via-sky-500/5 to-transparent px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold pr-10">{headerBoss}</DialogTitle>
            {headerDate ? <div className="mt-1 text-[12px] text-zinc-200/70">{headerDate}</div> : null}
          </DialogHeader>
        </div>

        {/* INFOS RUN */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-zinc-200/85">
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

        {/* STATS RUN */}
        {data?.run.durationTotalS != null ? (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-zinc-200/85">
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

        {/* TABLE */}
        <div className="relative mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/25">
          <table className="w-full table-fixed text-[12px]">
            <colgroup>
              <col /> {/* Player */}
              <col className="w-[120px]" /> {/* DPS */}
              <col className="w-[120px]" /> {/* HPS */}
            </colgroup>

            <thead className="bg-[#0b1220]/70 text-[11px] text-zinc-300/60">
              <tr className="border-b border-white/10">
                <th className="py-2 pl-3 pr-2 text-left font-medium">Player</th>
                <th className="py-2 px-3 text-right font-medium whitespace-nowrap">ST DPS</th>
                <th className="py-2 pl-3 pr-4 text-right font-medium whitespace-nowrap">HPS</th>
              </tr>
            </thead>

            <tbody className="text-zinc-100">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="py-2 pl-3 pr-2">
                      <div className="h-[26px] w-full rounded-lg bg-white/5" />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="ml-auto h-[14px] w-[70px] rounded bg-white/5" />
                    </td>
                    <td className="py-2 pl-3 pr-4 text-right">
                      <div className="ml-auto h-[14px] w-[70px] rounded bg-white/5" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td className="py-3 pl-3 text-zinc-300/70" colSpan={3}>
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="py-3 pl-3 text-zinc-300/60" colSpan={3}>
                    No data
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={`${r.player}-${idx}`} className="border-b border-white/5 last:border-0">
                    <td className="py-2 pl-3 pr-2 align-middle">
                      <div className="w-full min-w-0">
                        <div
                          className={[
                            "rounded-lg px-3 py-1.5 ring-1",
                            "w-full min-w-0 truncate whitespace-nowrap",
                            classTint(r.playerClass),
                          ].join(" ")}
                          title={r.player}
                        >
                          {r.player}
                        </div>
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

        <div className="mt-2 text-[11px] text-zinc-400/70">
          Color = Calling (Cleric / Primalist / Warrior / Rogue / Mage)
        </div>
      </DialogContent>
    </Dialog>
  );
}
