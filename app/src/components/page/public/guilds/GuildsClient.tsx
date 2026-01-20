"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import GuildList from "./GuildList";
import GuildDetails from "./GuildDetails";

export type GuildListItem = {
  id: string;
  name: string;
  tag: string | null;
};

export default function GuildsClient({ initialGuilds }: { initialGuilds: GuildListItem[] }) {
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialGuilds[0]?.id ?? null);

  // keep selection valid if list changes (future-proof)
  useEffect(() => {
    if (!selectedId && initialGuilds[0]?.id) setSelectedId(initialGuilds[0].id);
  }, [selectedId, initialGuilds]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return initialGuilds;
    return initialGuilds.filter((g) => {
      const tag = (g.tag ?? "").toLowerCase();
      return g.name.toLowerCase().includes(s) || tag.includes(s);
    });
  }, [q, initialGuilds]);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Guilds</h1>
          <p className="mt-1 text-sm text-zinc-200/75">
            Select a guild on the left to see stats and runs. Click a run to open the Group DPS table.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[360px_1fr]">
        {/* Left panel */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(700px_circle_at_20%_0%,rgba(56,189,248,0.14),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="px-4 pt-5 pb-4">
            <div className="text-sm font-semibold text-zinc-100">Guild list</div>
            <div className="mt-3 pt-5 ">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search guild (name or tag)"
                className="bg-white/5 border-white/10 text-zinc-100 placeholder:text-zinc-400/70"
              />
            </div>
            <div className="mt-2 text-[11px] text-zinc-400/70">{filtered.length} guilds</div>
          </div>

          <GuildList guilds={filtered} selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        {/* Right panel */}
        <GuildDetails guildId={selectedId} />
      </div>
    </div>
  );
}
