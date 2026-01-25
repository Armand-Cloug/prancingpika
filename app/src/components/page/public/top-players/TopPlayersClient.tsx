// src/components/page/public/top-players/TopPlayersClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import ClassTopTable from "./ClassTopTable";
import type { CallingKey, TopPlayersResponse, TopPlayerRow } from "@/lib/top-players";

const ORDER: CallingKey[] = ["rogue", "cleric", "warrior", "primalist", "mage"];

// ✅ Manual list: label shown in UI -> exact DB boss name
const BOSS_LABEL_TO_DB: Array<{ label: string; db: string }> = [
  { label: "[BOS] Azranel", db: "Azranel" },
  { label: "[BOS] Vindicator", db: "Vengeur" },
  { label: "[BOS] Commander Isiel", db: "Commandant Isiel" },
  { label: "[BOS] Titan X", db: "Titan X" },
  { label: "[TDNM] Beligosh", db: "Beligosh" },
  { label: "[TDNM] Tarjulia", db: "Tarjulia" },
  { label: "[TDNM] Council of Fate", db: "Le Concile du Destin" },
  { label: "[TDNM] Malannon", db: "Malannon" },
  { label: "[IROTP] Ereandorn", db: "Ereandorn" },
  { label: "[IROTP] Beruhast", db: "Beruhast" },
  { label: "[IROTP] General Silgen", db: "Général Silgen" },
  { label: "[IROTP] Hight-Priest", db: "Grand-Prêtre Arakhurn" },
];

function keepBestPerPlayer(rows: TopPlayerRow[]): TopPlayerRow[] {
  const best = new Map<string, TopPlayerRow>();

  for (const r of rows) {
    const prev = best.get(r.player);
    if (!prev) {
      best.set(r.player, r);
      continue;
    }

    // Best = DPS max
    if (r.dps > prev.dps) {
      best.set(r.player, r);
      continue;
    }

    // Tie-breakers: shorter time, then most recent date
    if (r.dps === prev.dps) {
      if (r.timeS < prev.timeS) {
        best.set(r.player, r);
        continue;
      }
      if (r.timeS === prev.timeS && r.date > prev.date) {
        best.set(r.player, r);
        continue;
      }
    }
  }

  return Array.from(best.values()).sort((a, b) => {
    if (b.dps !== a.dps) return b.dps - a.dps;
    return a.timeS - b.timeS;
  });
}

export default function TopPlayersClient({
  bosses,
  defaultBoss,
}: {
  bosses: string[];
  defaultBoss: string;
}) {
  // ✅ store the UI label in state (not the DB name)
  const initialLabel = useMemo(() => {
    const byDb = BOSS_LABEL_TO_DB.find((x) => x.db === defaultBoss)?.label;
    return byDb ?? BOSS_LABEL_TO_DB[0]?.label ?? defaultBoss;
  }, [defaultBoss]);

  const [bossLabel, setBossLabel] = useState<string>(initialLabel);
  const [raw, setRaw] = useState<TopPlayersResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Checkbox: show only best score per player
  const [bestOnly, setBestOnly] = useState<boolean>(false);

  // ✅ resolve to DB boss name for API calls
  const bossDb = useMemo(() => {
    return BOSS_LABEL_TO_DB.find((x) => x.label === bossLabel)?.db ?? defaultBoss;
  }, [bossLabel, defaultBoss]);

  // ✅ keep a human label for titles (fallback to db if needed)
  const bossTitle = bossLabel || bossDb;

  // ✅ optional: disable items not present in DB list you already compute server-side
  const dbSet = useMemo(() => new Set(bosses), [bosses]);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    fetch(`/api/public/top-players?boss=${encodeURIComponent(bossDb)}`, { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Failed to load");
        return j as TopPlayersResponse;
      })
      .then((j) => {
        if (!alive) return;
        setRaw(j);
      })
      .catch(() => {
        if (!alive) return;
        setRaw({
          boss: bossDb,
          classes: { rogue: [], cleric: [], warrior: [], primalist: [], mage: [] },
        });
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [bossDb]);

  const data = useMemo<TopPlayersResponse | null>(() => {
    if (!raw) return null;
    if (!bestOnly) return raw;

    return {
      boss: raw.boss,
      classes: {
        rogue: keepBestPerPlayer(raw.classes.rogue),
        cleric: keepBestPerPlayer(raw.classes.cleric),
        warrior: keepBestPerPlayer(raw.classes.warrior),
        primalist: keepBestPerPlayer(raw.classes.primalist),
        mage: keepBestPerPlayer(raw.classes.mage),
      },
    };
  }, [raw, bestOnly]);

  return (
    <div className="w-full">
      {/* Header + controls */}
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Top Players</h1>
          <p className="mt-1 text-sm text-zinc-200/75">Top 100 ST DPS by calling — pick a boss.</p>
        </div>

        {/* Boss name centered */}
        <div className="pointer-events-none hidden sm:block absolute left-1/2 -translate-x-1/2 bottom-0">
          <div className="max-w-[420px] truncate text-4xl font-semibold text-zinc-100/90" title={bossTitle}>
            {bossTitle}
          </div>
        </div>

        {/* Controls: checkbox + select on the right */}
        <div className="w-full sm:w-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
          <label className="flex select-none items-center gap-2 text-sm text-zinc-200/85">
            <Checkbox
              checked={bestOnly}
              onCheckedChange={(v) => setBestOnly(Boolean(v))}
              className="border-white/15 data-[state=checked]:bg-white/15"
            />
            Best Score with no duplicates
          </label>

          <div className="w-full sm:w-[220px] sm:shrink-0">
            {/* ✅ Select now uses manual labels */}
            <Select value={bossLabel} onValueChange={setBossLabel}>
              <SelectTrigger className="bg-white/5 border-white/10 text-zinc-100">
                <SelectValue placeholder="Choose a boss" />
              </SelectTrigger>
              <SelectContent className="bg-[#0b1220] border-white/10 text-zinc-100">
                {BOSS_LABEL_TO_DB.map((b) => (
                  <SelectItem key={b.label} value={b.label} disabled={bosses.length > 0 && !dbSet.has(b.db)}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Boss name centered (mobile) */}
          <div className="sm:hidden text-center">
            <div className="truncate text-base font-semibold text-zinc-100/90" title={bossTitle}>
              {bossTitle}
            </div>
          </div>
        </div>
      </div>

      {/* Tables grid */}
      <div className="mt-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
        {ORDER.map((k) => (
          <ClassTopTable
            key={k}
            calling={k}
            // ✅ keep passing DB boss name to tables (they likely use it for links / titles / etc.)
            boss={bossDb}
            rows={data?.classes?.[k] ?? []}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}