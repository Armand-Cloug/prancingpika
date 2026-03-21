// src/components/page/public/lookup/LookupClient.tsx
"use client";
import { useState } from "react";
import LookupResultsTable from "./LookupResultsTable";
import type { PlayerLookupResponse } from "@/lib/player-lookup";

export default function LookupClient() {
  const [query, setQuery]   = useState("");
  const [data, setData]     = useState<PlayerLookupResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/public/player-lookup?q=${encodeURIComponent(q)}`);
      setData(await res.json());
    } catch {}
    finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Player name (min. 2 characters)…"
          className="flex-1 px-4 py-2.5 text-[13px] rounded-xl glass text-zinc-200 placeholder-zinc-600
                     border border-white/[0.08] focus:border-sky-500/40 focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={loading || query.trim().length < 2}
          className="px-5 py-2.5 text-[13px] font-semibold rounded-xl btn-sky disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : "Search"}
        </button>
      </form>

      {/* Results */}
      {data && data.mode === "matches" && (
        <div className="glass rounded-2xl p-4">
          <p className="text-[12px] text-zinc-500 mb-3">
            Multiple players found for <span className="text-zinc-300">"{data.query}"</span> — click one:
          </p>
          <div className="flex flex-wrap gap-2">
            {data.players.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => { setQuery(p.name); }}
                className="px-3 py-1.5 text-[12px] rounded-lg glass glass-hover text-zinc-300"
              >
                {p.name}
                {p.class && <span className="ml-1.5 text-zinc-600">{p.class}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {data && data.mode === "records" && (
        <LookupResultsTable
          player={data.player.name}
          playerClass={data.player.class}
          records={data.records}
          truncated={data.truncated}
        />
      )}

      {data && data.mode === "empty" && (
        <div className="glass rounded-2xl px-5 py-10 text-center">
          <p className="text-zinc-500 text-[13px]">No player found matching "{query}"</p>
        </div>
      )}
    </div>
  );
}
