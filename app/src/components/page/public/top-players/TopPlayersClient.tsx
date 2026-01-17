// src/components/page/public/top-players/TopPlayersClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ClassTopTable from "./ClassTopTable";
import type { CallingKey, TopPlayersResponse } from "@/lib/top-players";

const ORDER: CallingKey[] = ["rogue", "cleric", "warrior", "primalist", "mage"];

export default function TopPlayersClient({
  bosses,
  defaultBoss,
}: {
  bosses: string[];
  defaultBoss: string;
}) {
  const [boss, setBoss] = useState(defaultBoss);
  const [data, setData] = useState<TopPlayersResponse | null>(null);
  const [loading, setLoading] = useState(false);

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
        setData(j);
      })
      .catch(() => {
        if (!alive) return;
        setData({
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

  return (
    <div className="w-full">
      {/* Header + Boss picker */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Top Players</h1>
          <p className="mt-1 text-sm text-zinc-200/75">
            Top 100 ST DPS by calling — pick a boss.
          </p>
        </div>

        <div className="w-full sm:w-[320px]">
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

      {/* Tables */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
