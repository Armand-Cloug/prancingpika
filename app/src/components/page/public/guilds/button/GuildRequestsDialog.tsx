"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ReqRow = {
  pseudo: string;
  requestedAt: string; // ISO
};

export default function GuildRequestsDialog({ guildId }: { guildId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ReqRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let alive = true;
    setLoading(true);
    setError(null);

    fetch(`/api/public/guilds/requests?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Failed to load requests");
        return j as { requests: ReqRow[]; note?: string };
      })
      .then((j) => {
        if (!alive) return;
        setRows(j.requests);
        if (j.note) setError(j.note); // show note as info
      })
      .catch((e: any) => {
        if (!alive) return;
        setError(String(e?.message || "Failed"));
        setRows([]);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [open, guildId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" className="bg-white/10 hover:bg-white/15 text-zinc-100 border border-white/10">
          Join requests
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[720px] bg-[#0b1220] border-white/10 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Join requests</DialogTitle>
        </DialogHeader>

        {error ? <div className="text-[12px] text-zinc-300/70">{error}</div> : null}

        <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
          <table className="w-full text-[12px]">
            <thead className="bg-white/[0.03] text-[11px] text-zinc-300/60">
              <tr className="border-b border-white/10">
                <th className="py-2 pl-3 pr-2 text-left font-medium">Pseudo</th>
                <th className="py-2 pl-2 pr-4 text-right font-medium">Requested</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="py-3 pl-3 text-zinc-300/60" colSpan={2}>
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="py-3 pl-3 text-zinc-300/60" colSpan={2}>
                    No data
                  </td>
                </tr>
              ) : (
                rows.map((m) => (
                  <tr key={`${m.pseudo}-${m.requestedAt}`} className="border-b border-white/5 last:border-0">
                    <td className="py-2 pl-3 pr-2 text-zinc-100">{m.pseudo}</td>
                    <td className="py-2 pl-2 pr-4 text-right text-zinc-200/85">
                      {new Date(m.requestedAt).toLocaleString("fr-FR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
