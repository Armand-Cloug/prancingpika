// src/components/page/public/account/RiftPanel.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type RiftCharacterDTO = {
  name: string;
  shard: string;
  calling: string;
  level: number;
  guild: string | null;
  lastSeenAt: string;
};

export default function RiftPanel({
  locked,
  linkedAt,
  characters,
  onImported,
}: {
  locked: boolean;
  linkedAt: string | null;
  characters: RiftCharacterDTO[];
  onImported: () => void;
}) {
  const [payload, setPayload]   = React.useState("");
  const [loading, setLoading]   = React.useState(false);
  const [error, setError]       = React.useState<string | null>(null);

  const trimmed = payload.trim();
  const canSubmit = trimmed.startsWith("PP:") && trimmed.length > 3;

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/rift/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: trimmed }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Unknown error");
        return;
      }
      setPayload("");
      onImported();
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  const lastSync =
    characters.length > 0
      ? new Date(Math.max(...characters.map((c) => new Date(c.lastSeenAt).getTime())))
      : null;

  return (
    <Card className="border-white/10 bg-[#253649]/70 backdrop-blur shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl text-zinc-100 flex items-center gap-3">
          RIFT Account
          {locked && (
            <span className="text-sm font-normal text-emerald-400">✓ Linked</span>
          )}
        </CardTitle>
        <p className="text-sm text-zinc-200/85">
          {locked && linkedAt
            ? `Linked on ${new Date(linkedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`
            : "Link your in-game account to this profile."}
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── Characters table (linked state) ─────────────────────── */}
        {locked && characters.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-200/70 uppercase tracking-wide">
              Characters — {characters.length} found
            </p>
            <div className="rounded-xl border border-white/10 bg-[#1F2B3A]/35 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-zinc-200/60 text-xs">Name</TableHead>
                    <TableHead className="text-zinc-200/60 text-xs">Lvl</TableHead>
                    <TableHead className="text-zinc-200/60 text-xs">Class</TableHead>
                    <TableHead className="text-zinc-200/60 text-xs">Shard</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {characters.map((c) => (
                    <TableRow
                      key={`${c.name}-${c.shard}`}
                      className="border-white/10 hover:bg-white/5"
                    >
                      <TableCell className="text-zinc-100 font-medium">{c.name}</TableCell>
                      <TableCell className="text-zinc-200/80">{c.level}</TableCell>
                      <TableCell className="text-zinc-200/80">{c.calling}</TableCell>
                      <TableCell className="text-zinc-200/80">{c.shard}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {lastSync && (
              <p className="text-xs text-zinc-200/60">
                Last sync: {formatRelativeTime(lastSync)}
              </p>
            )}
          </div>
        )}

        {/* ── Instructions (unlinked) ──────────────────────────────── */}
        {!locked && (
          <div className="rounded-xl border border-white/10 bg-[#1F2B3A]/55 p-4">
            <ol className="text-sm text-zinc-200/80 space-y-1.5 list-decimal list-inside">
              <li>Install the PrancingPika addon in RIFT</li>
              <li>
                Type{" "}
                <code className="font-mono text-sky-400 bg-sky-400/10 px-1 rounded">
                  /pp export
                </code>{" "}
                in-game
              </li>
              <li>Copy the code from the popup window</li>
              <li>Paste it below</li>
            </ol>
          </div>
        )}

        {/* ── Re-sync hint (linked) ────────────────────────────────── */}
        {locked && (
          <div>
            <p className="text-xs font-semibold text-zinc-200/70 uppercase tracking-wide mb-1">
              Want to sync new characters?
            </p>
            <p className="text-sm text-zinc-200/70">
              Run{" "}
              <code className="font-mono text-sky-400 bg-sky-400/10 px-1 rounded">
                /pp export
              </code>{" "}
              in-game and paste below.
            </p>
          </div>
        )}

        {/* ── Textarea + submit ────────────────────────────────────── */}
        <div className="space-y-2">
          <textarea
            rows={3}
            value={payload}
            onChange={(e) => {
              setPayload(e.target.value);
              setError(null);
            }}
            placeholder="Paste your PP:... export code here"
            disabled={loading}
            className="w-full resize-none rounded-md border border-white/10 bg-[#1F2B3A]/55 px-3 py-2 text-sm font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {error && (
            <p className="text-xs text-red-300">{error}</p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <SpinnerIcon />
                {locked ? "Updating…" : "Linking…"}
              </>
            ) : locked ? (
              "Update characters"
            ) : (
              "Link my RIFT account"
            )}
          </Button>
        </div>

        {/* ── Warning (unlinked) ───────────────────────────────────── */}
        {!locked && (
          <p className="text-xs text-amber-300/70">
            ⚠ Once linked, you cannot change your RIFT account without contacting an admin.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="size-3.5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

function formatRelativeTime(date: Date): string {
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} hour${diffH > 1 ? "s" : ""} ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD} day${diffD > 1 ? "s" : ""} ago`;
}
