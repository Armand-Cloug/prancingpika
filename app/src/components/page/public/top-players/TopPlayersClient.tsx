// src/components/page/public/top-players/TopPlayersClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import ClassTopTable from "./ClassTopTable";
import type { CallingKey, TopPlayersResponse, TopPlayerRow } from "@/lib/top-players";

const ORDER: CallingKey[] = ["rogue", "cleric", "warrior", "primalist", "mage"];

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
  const [boss, setBoss] = useState(defaultBoss);
  const [raw, setRaw] = useState<TopPlayersResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Checkbox: show only best score per player
  const [bestOnly, setBestOnly] = useState<boolean>(false);

  const safeBosses = useMemo(() => (bosses.length ? bosses : [defaultBoss]), [bosses, defaultBoss]);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    fetch(`/api/public/top-players?boss=${encodeURIComponent(boss)}`, { cache: "no-store" })
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
          boss,
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
  }, [boss]);

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Top Players</h1>
          <p className="mt-1 text-sm text-zinc-200/75">Top 100 ST DPS by calling — pick a boss.</p>
        </div>

        {/* Controls: checkbox left of select, select pinned to far right */}
        <div className="w-full sm:w-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
          <label className="flex select-none items-center gap-2 text-sm text-zinc-200/85 sm:order-1">
            <Checkbox
              checked={bestOnly}
              onCheckedChange={(v) => setBestOnly(Boolean(v))}
              className="border-white/15 data-[state=checked]:bg-white/15"
            />
            Meilleur score par joueur
          </label>

          <div className="w-full sm:w-[220px] sm:order-2 sm:shrink-0">
            <Select value={boss} onValueChange={setBoss}>
              <SelectTrigger className="bg-white/5 border-white/10 text-zinc-100">
                <SelectValue placeholder="Choose a boss" />
              </SelectTrigger>
              <SelectContent className="bg-[#0b1220] border-white/10 text-zinc-100">
                {safeBosses.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tables grid */}
      <div className="mt-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
        {ORDER.map((k) => (
          <ClassTopTable
            key={k}
            calling={k}
            boss={boss}
            rows={data?.classes?.[k] ?? []}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}
