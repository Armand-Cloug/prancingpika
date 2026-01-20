"use client";

import { useEffect, useMemo, useState } from "react";
import GroupDpsDialog from "@/components/forms/GroupDpsDialog";
import DeleteGuildButton from "./button/DeleteGuildButton";
import GuildMembersDialog from "./button/GuildMembersDialog";
import GuildRequestsDialog from "./button/GuildRequestsDialog";

type BossKill = { boss: string; kills: number };

type RunRow = {
  runId: string;
  endedAt: string; // ISO
  bossName: string;
  durationTotalS: number;
  bossDurationS: number | null;
  raidDps: number | null;
  raidHps: number | null;
  groupLabel: string | null;
};

type GuildDetailsResponse = {
  guild: { id: string; name: string; tag: string | null; createdAt: string };
  isOwner: boolean;
  bossKills: BossKill[];
  runs: RunRow[];
  truncated: boolean;
};

function formatTime(s: number) {
  const sec = Math.max(0, Math.floor(s));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const r = sec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function ymd(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function GuildDetails({ guildId }: { guildId: string | null }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GuildDetailsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!guildId) {
      setData(null);
      setError(null);
      return;
    }

    let alive = true;
    setLoading(true);
    setError(null);

    fetch(`/api/public/guilds/guild-details?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Failed to load guild details");
        return j as GuildDetailsResponse;
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
  }, [guildId]);

  const header = useMemo(() => {
    if (!data) return null;

    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-zinc-100">
            <span className="truncate">{data.guild.name}</span>{" "}
            {data.guild.tag ? <span className="text-zinc-300/70">[{data.guild.tag}]</span> : null}
          </div>
          <div className="mt-1 text-[12px] text-zinc-300/70">
            Created: {new Date(data.guild.createdAt).toLocaleDateString("fr-FR")}
          </div>
        </div>

        {data.isOwner ? (
          <div className="flex flex-wrap gap-2">
            <DeleteGuildButton guildId={data.guild.id} guildName={data.guild.name} />
            <GuildMembersDialog guildId={data.guild.id} />
            <GuildRequestsDialog guildId={data.guild.id} />
          </div>
        ) : null}
      </div>
    );
  }, [data]);

  if (!guildId) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_18px_55px_rgba(0,0,0,0.35)] px-4 py-4">
        Select a guild
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(700px_circle_at_20%_0%,rgba(56,189,248,0.14),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="px-4 pt-5 pb-4">{header}</div>

      {loading ? (
        <div className="px-4 pb-6 text-sm text-zinc-300/70">Loading…</div>
      ) : error ? (
        <div className="px-4 pb-6 text-sm text-zinc-300/70">{error}</div>
      ) : !data ? (
        <div className="px-4 pb-6 text-sm text-zinc-300/70">No data</div>
      ) : (
        <div className="px-4 pb-6 space-y-4">
          {/* Boss kills */}
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-sm font-semibold text-zinc-100">Boss kills</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.bossKills.length === 0 ? (
                <div className="text-[12px] text-zinc-300/60">No kills</div>
              ) : (
                data.bossKills.map((b) => (
                  <div
                    key={b.boss}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[12px]"
                    title={b.boss}
                  >
                    <span className="text-zinc-200/90">{b.boss}</span>
                    <span className="ml-2 tabular-nums text-sky-200/90">{b.kills}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Runs */}
          <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
            <div className="flex items-center justify-between px-3 pt-3 pb-2">
              <div className="text-sm font-semibold text-zinc-100">Runs</div>
              <div className="text-[11px] text-zinc-400/70">
                {data.runs.length} runs{data.truncated ? " (truncated)" : ""}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-[12px]">
                <colgroup>
                  <col className="w-[92px]" /> {/* Date */}
                  <col /> {/* Boss */}
                  <col className="w-[96px]" /> {/* Raid DPS */}
                  <col className="hidden md:table-column w-[96px]" /> {/* Raid HPS */}
                  <col className="w-[88px]" /> {/* Time */}
                </colgroup>

                <thead className="bg-white/[0.03] text-[11px] text-zinc-300/60">
                  <tr className="border-b border-white/10">
                    <th className="py-2 pl-3 pr-2 text-left font-medium">Date</th>
                    <th className="py-2 px-2 text-left font-medium">Boss</th>
                    <th className="py-2 px-2 text-right font-medium whitespace-nowrap">Raid DPS</th>
                    <th className="hidden md:table-cell py-2 px-2 text-right font-medium whitespace-nowrap">
                      Raid HPS
                    </th>
                    <th className="py-2 pl-2 pr-4 text-right font-medium">Time</th>
                  </tr>
                </thead>

                <tbody className="text-zinc-100">
                  {data.runs.length === 0 ? (
                    <tr>
                      <td className="py-3 pl-3 text-zinc-300/60" colSpan={5}>
                        No runs
                      </td>
                    </tr>
                  ) : (
                    data.runs.map((r) => (
                      <tr key={r.runId} className="border-b border-white/5 last:border-0">
                        <td className="py-2 pl-3 pr-2 tabular-nums text-zinc-200/85 whitespace-nowrap">
                          {ymd(r.endedAt)}
                        </td>

                        <td className="py-2 px-2 min-w-0">
                          <GroupDpsDialog
                            runId={r.runId}
                            bossLabel={r.bossName}
                            dateLabel={ymd(r.endedAt)}
                            trigger={
                              <button type="button" className="block w-full min-w-0 text-left">
                                <div
                                  className="truncate text-sky-200/90 hover:text-sky-200 hover:underline"
                                  title={r.bossName}
                                >
                                  {r.bossName}
                                  {r.groupLabel ? (
                                    <span className="ml-2 text-[11px] text-zinc-300/55">({r.groupLabel})</span>
                                  ) : null}
                                </div>
                              </button>
                            }
                          />
                        </td>

                        <td className="py-2 px-2 text-right tabular-nums whitespace-nowrap">
                          {r.raidDps != null ? Math.round(r.raidDps).toLocaleString("en-US") : "—"}
                        </td>

                        <td className="hidden md:table-cell py-2 px-2 text-right tabular-nums whitespace-nowrap text-zinc-200/90">
                          {r.raidHps != null ? Math.round(r.raidHps).toLocaleString("en-US") : "—"}
                        </td>

                        <td className="py-2 pl-2 pr-4 text-right tabular-nums whitespace-nowrap">
                          {formatTime(r.bossDurationS ?? r.durationTotalS)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-3 pb-3 text-[11px] text-zinc-400/70">
              Click a boss name to open the Group DPS table for that run.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
