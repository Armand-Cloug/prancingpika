"use client";

import { cn } from "@/lib/utils";
import type { GuildListItem } from "./GuildsClient";

export default function GuildList({
  guilds,
  selectedId,
  onSelect,
}: {
  guilds: GuildListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="max-h-[640px] overflow-y-auto px-3 pb-3">
      <div className="space-y-2">
        {guilds.map((g) => {
          const active = g.id === selectedId;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onSelect(g.id)}
              className={cn(
                "w-full rounded-xl border px-3 py-2 text-left transition",
                active
                  ? "border-white/15 bg-white/10 ring-1 ring-white/10"
                  : "border-white/10 bg-black/20 hover:bg-black/30"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-zinc-100">{g.name}</div>
                  <div className="text-[11px] text-zinc-300/60">{g.tag ? `[${g.tag}]` : "—"}</div>
                </div>
                <div className={cn("h-2 w-2 rounded-full", active ? "bg-sky-300/80" : "bg-white/10")} />
              </div>
            </button>
          );
        })}

        {guilds.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-zinc-300/70">
            No guilds
          </div>
        ) : null}
      </div>
    </div>
  );
}
