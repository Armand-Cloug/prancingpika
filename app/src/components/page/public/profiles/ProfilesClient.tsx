// src/components/page/public/profiles/ProfilesClient.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProfileSummary = {
  displayName: string;
  characterCount: number;
  mainShard: string | null;
};

type ProfileDetail = {
  displayName: string;
  memberSince: string;
  characters: {
    name: string;
    shard: string;
    calling: string;
    level: number;
    guild: string | null;
    lastSeenAt: string;
  }[];
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function formatMonth(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function ProfilesClient({
  initialProfiles,
}: {
  initialProfiles: ProfileSummary[];
}) {
  const [selectedName, setSelectedName] = React.useState<string | null>(null);
  const [detail, setDetail]             = React.useState<ProfileDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailError, setDetailError]   = React.useState<string | null>(null);

  async function openProfile(displayName: string) {
    setSelectedName(displayName);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const res = await fetch("/api/public/profiles/detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDetailError(data.error ?? "Error loading profile");
      } else {
        setDetail(data);
      }
    } catch {
      setDetailError("Network error");
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDialog() {
    setSelectedName(null);
    setDetail(null);
    setDetailError(null);
  }

  const lastSync = React.useMemo(() => {
    if (!detail?.characters.length) return null;
    const latest = detail.characters.reduce((acc, c) =>
      new Date(c.lastSeenAt) > new Date(acc.lastSeenAt) ? c : acc
    );
    return latest.lastSeenAt;
  }, [detail]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.2em] text-sky-400/70 font-medium uppercase mb-2">
          Community
        </p>
        <h1 className="text-4xl font-bold text-gradient tracking-tight">Players</h1>
        <p className="mt-2 text-[13px] text-zinc-500">Browse community profiles</p>
      </div>

      {/* Grid */}
      {initialProfiles.length === 0 ? (
        <p className="text-sm text-zinc-500">No profiles yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialProfiles.map((p) => (
            <button
              key={p.displayName}
              type="button"
              onClick={() => openProfile(p.displayName)}
              className="text-left rounded-xl border border-white/10 bg-[#253649]/70 backdrop-blur
                         p-4 hover:border-sky-400/30 hover:bg-[#253649]/90 transition-all duration-150
                         shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
            >
              <p className="text-base font-semibold text-zinc-100 truncate">{p.displayName}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {p.characterCount} char{p.characterCount !== 1 ? "s" : ""}
              </p>
              {p.mainShard && (
                <p className="mt-0.5 text-xs text-sky-400/80">{p.mainShard}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={selectedName !== null} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="border-white/10 bg-[#0f1e2e] text-zinc-100 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-zinc-50">
              {selectedName}
            </DialogTitle>
            {detail && (
              <p className="text-sm text-zinc-400">
                Member since {formatMonth(detail.memberSince)}
              </p>
            )}
          </DialogHeader>

          {detailLoading && (
            <div className="flex justify-center py-8">
              <span className="h-6 w-6 rounded-full border-2 border-white/20 border-t-sky-400 animate-spin" />
            </div>
          )}

          {detailError && (
            <p className="text-sm text-red-400 py-4">{detailError}</p>
          )}

          {detail && !detailLoading && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                RIFT Characters ({detail.characters.length})
              </p>

              {detail.characters.length === 0 ? (
                <p className="text-sm text-zinc-500">No characters linked yet</p>
              ) : (
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-zinc-400 text-xs">Name</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Lvl</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Class</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Shard</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.characters.map((c) => (
                        <TableRow key={`${c.name}-${c.shard}`} className="border-white/10 hover:bg-white/5">
                          <TableCell className="text-zinc-100 font-medium text-sm">{c.name}</TableCell>
                          <TableCell className="text-zinc-300 text-sm">
                            {c.level > 0 ? c.level : "—"}
                          </TableCell>
                          <TableCell className="text-zinc-300 text-sm capitalize">
                            {c.calling && c.calling.toLowerCase() !== "unknown" ? c.calling : "—"}
                          </TableCell>
                          <TableCell className="text-zinc-400 text-sm">{c.shard}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {lastSync && (
                <p className="text-xs text-zinc-500">
                  Last sync: {timeAgo(lastSync)}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
