// src/components/page/public/lookup/LookupClient.tsx
"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LookupResultsTable from "./LookupResultsTable";

type MatchPlayer = { name: string; class: string | null };

type LookupRecord = {
  runId: string;
  endedAt: string; // ISO
  bossName: string;
  dps: number;
  hps: number;
  raidDps: number | null;
  raidHps: number | null;
  timeS: number;
  guildName: string | null;
  guildTag: string | null;
  groupLabel: string | null;
};

type LookupResponse =
  | { mode: "empty" }
  | { mode: "matches"; query: string; players: MatchPlayer[] }
  | { mode: "records"; query: string; player: MatchPlayer; records: LookupRecord[]; truncated: boolean };

export default function LookupClient() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<LookupResponse>({ mode: "empty" });
  const [error, setError] = useState<string | null>(null);

  const canSearch = useMemo(() => q.trim().length >= 2, [q]);

  async function doSearch(name: string) {
    const query = name.trim();
    if (query.length < 2) return;

    setLoading(true);
    setError(null);

    try {
      const r = await fetch(`/api/public/player-lookup?q=${encodeURIComponent(query)}`, {
        cache: "no-store",
      });
      const j = (await r.json()) as LookupResponse & { error?: string };
      if (!r.ok) throw new Error(j?.error || "Lookup failed");
      setRes(j as LookupResponse);
    } catch (e: any) {
      setError(String(e?.message || "Lookup failed"));
      setRes({ mode: "empty" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Lookup</h1>
          <p className="mt-1 text-sm text-zinc-200/75">
            Search a player and list all their records. Click the player name to open the group DPS table.
          </p>
        </div>

        <form
          className="w-full sm:w-[520px]"
          onSubmit={(e) => {
            e.preventDefault();
            doSearch(q);
          }}
        >
          <div className="flex gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Player name (ex: Cloug)"
              className="bg-white/5 border-white/10 text-zinc-100 placeholder:text-zinc-400/70"
            />
            <Button
              type="submit"
              disabled={!canSearch || loading}
              className="bg-white/10 hover:bg-white/15 text-zinc-100 border border-white/10"
            >
              {loading ? "Searching…" : "Search"}
            </Button>
          </div>
          <div className="mt-1 text-[11px] text-zinc-400/70">
            Tip: type at least 2 characters. If exact name isn’t found, suggestions are shown.
          </div>
        </form>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200/85">
          {error}
        </div>
      ) : null}

      {/* Suggestions */}
      {res.mode === "matches" ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_18px_55px_rgba(0,0,0,0.35)] overflow-hidden">
          <div className="pointer-events-none h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="px-4 pt-4 pb-3">
            <div className="text-sm font-semibold text-zinc-100">Matches</div>
            <div className="mt-1 text-[12px] text-zinc-300/70">
              No exact player found for “{res.query}”. Click a name:
            </div>
          </div>

          <div className="px-3 pb-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {res.players.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left hover:bg-black/30"
                  onClick={() => {
                    setQ(p.name);
                    doSearch(p.name);
                  }}
                >
                  <div className="truncate text-sky-200/90">{p.name}</div>
                  <div className="text-[11px] text-zinc-300/60">{p.class ?? "Unknown class"}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Records */}
      {res.mode === "records" ? (
        <div className="mt-5">
          <LookupResultsTable
            query={res.query}
            player={res.player}
            records={res.records}
            truncated={res.truncated}
            loading={loading}
          />
        </div>
      ) : null}
    </div>
  );
}
