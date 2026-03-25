// src/components/page/public/specs-dps/SpecsDpsClient.tsx
"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SpecBossTable from "./SpecBossTable";
import type { SpecDpsResponse } from "@/lib/specs-dps";
import { RAIDS } from "@/lib/leaderboards";

export default function SpecsDpsClient({ specs }: { specs: string[] }) {
  const [spec, setSpec] = useState<string>("");
  const [raidKey, setRaidKey] = useState<string>("");
  const [data, setData] = useState<SpecDpsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!spec || !raidKey) {
      setData(null);
      return;
    }

    let alive = true;
    setLoading(true);

    fetch(
      `/api/public/specs-dps?spec=${encodeURIComponent(spec)}&raid=${encodeURIComponent(raidKey)}`,
      { cache: "no-store" }
    )
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Failed to load");
        return j as SpecDpsResponse;
      })
      .then((j) => { if (alive) setData(j); })
      .catch(() => { if (alive) setData(null); })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [spec, raidKey]);

  const selectedRaid = RAIDS.find((r) => r.key === raidKey);

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 mb-8">
        <div className="w-full sm:w-[240px] shrink-0">
          <Select value={spec} onValueChange={setSpec}>
            <SelectTrigger className="bg-white/5 border-white/10 text-zinc-100">
              <SelectValue placeholder="Choose a spec…" />
            </SelectTrigger>
            <SelectContent className="bg-[#0b1220] border-white/10 text-zinc-100 max-h-72">
              {specs.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-[220px] shrink-0">
          <Select value={raidKey} onValueChange={setRaidKey}>
            <SelectTrigger className="bg-white/5 border-white/10 text-zinc-100">
              <SelectValue placeholder="Choose a raid…" />
            </SelectTrigger>
            <SelectContent className="bg-[#0b1220] border-white/10 text-zinc-100">
              {RAIDS.map((r) => (
                <SelectItem key={r.key} value={r.key}>
                  [{r.key}] {r.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <span className="inline-block h-6 w-6 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !data && spec && raidKey && (
        <div className="glass rounded-2xl px-5 py-10 text-center">
          <p className="text-zinc-500 text-[13px]">No data found for this spec / raid combination.</p>
        </div>
      )}

      {/* Placeholder before selection */}
      {!spec || !raidKey ? (
        !loading && (
          <div className="glass rounded-2xl px-5 py-10 text-center">
            <p className="text-zinc-600 text-[13px]">Select a spec and a raid to display the top 10.</p>
          </div>
        )
      ) : null}

      {/* Results */}
      {!loading && data && (
        <>
          <div className="mb-4 text-center">
            <span className="text-2xl font-bold text-zinc-100" style={{ fontFamily: "'Syne', sans-serif" }}>
              {spec}
            </span>
            {selectedRaid && (
              <span className="ml-3 text-sm text-zinc-400">
                — [{selectedRaid.key}] {selectedRaid.title}
              </span>
            )}
          </div>

          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))] 2xl:grid-cols-4">
            {data.bosses.map((b) => (
              <SpecBossTable key={b.bossName} result={b} spec={spec} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
