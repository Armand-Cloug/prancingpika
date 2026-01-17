// src/components/page/public/account/GuildPanel.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateGuildForm } from "@/components/forms/CreateGuildForm";
import { JoinGuildForm } from "@/components/forms/JoinGuildForm";

type GuildDTO = {
  id: string;
  name: string;
  tag: string;
  role: string;
  joinedAt: string;
};

export default function GuildPanel({
  guildName,
  guilds,
  loading,
  error,
  onRefresh,
}: {
  guildName: string | null;
  guilds: GuildDTO[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void> | void;
}) {
  const hasGuild = guilds.length > 0;

  return (
    <Card className="border-white/10 bg-[#253649]/70 backdrop-blur shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl text-zinc-100">Your guilds</CardTitle>
        <p className="text-sm text-zinc-200/85">
          Manage your guilds to unlock uploads and rankings.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Current status */}
        <div className="rounded-xl border border-white/10 bg-[#1F2B3A]/55 p-4">
          {hasGuild ? (
            <>
              <p className="text-xs text-zinc-200/60">Current guild</p>
              <p className="mt-1 text-lg font-semibold text-zinc-50">
                {guildName}
              </p>
              <p className="mt-2 text-xs text-zinc-200/60">
                You belong to {guilds.length} guild{guilds.length > 1 ? "s" : ""}.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-zinc-100">
                You are not in a guild yet.
              </p>
              <p className="mt-2 text-sm text-zinc-200/80">
                Create one for your group, or join an existing guild.
              </p>
            </>
          )}
        </div>

        {/* Loading / error */}
        {loading && <p className="text-xs text-zinc-200/70">Loading guilds…</p>}
        {error && (
          <p className="text-xs text-red-300">
            {error}
          </p>
        )}

        {/* List guilds */}
        {hasGuild && (
          <div className="rounded-xl border border-white/10 bg-[#1F2B3A]/35">
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-sm font-semibold text-zinc-100">Memberships</p>
            </div>

            <ul className="divide-y divide-white/10">
              {guilds.map((g) => (
                <li key={g.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-50">
                        {g.name} <span className="text-zinc-200/70">[{g.tag}]</span>
                      </p>
                      <p className="text-xs text-zinc-200/70">
                        Role: {g.role} • Joined: {new Date(g.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Create / Join */}
        <div className="space-y-4">
          <CreateGuildForm
            disabled={false}
            onCreated={async () => {
              await onRefresh();
            }}
          />
          <JoinGuildForm
            disabled={true}
            onJoined={async () => {
              await onRefresh();
            }}
          />
        </div>

        <p className="text-xs text-zinc-200/60">
          Tip: after creating/joining, the list refreshes automatically.
        </p>
      </CardContent>
    </Card>
  );
}
