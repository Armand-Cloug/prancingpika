"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type MemberRow = {
  pseudo: string;
  role: "OWNER" | "OFFICER" | "MEMBER";
  joinedAt: string; // ISO
};

export default function GuildMembersDialog({ guildId }: { guildId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let alive = true;
    setLoading(true);
    setError(null);

    fetch(`/api/public/guilds/members?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Failed to load members");
        return j as { members: MemberRow[] };
      })
      .then((j) => {
        if (!alive) return;
        setRows(j.members);
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
          Members
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[720px] bg-[#0b1220] border-white/10 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Guild members</DialogTitle>
        </DialogHeader>

        <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
          <table className="w-full text-[12px]">
            <thead className="bg-white/[0.03] text-[11px] text-zinc-300/60">
              <tr className="border-b border-white/10">
                <th className="py-2 pl-3 pr-2 text-left font-medium">Pseudo</th>
                <th className="py-2 px-2 text-left font-medium">Role</th>
                <th className="py-2 pl-2 pr-4 text-right font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="py-3 pl-3 text-zinc-300/60" colSpan={3}>
                    Loading…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="py-3 pl-3 text-zinc-300/60" colSpan={3}>
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="py-3 pl-3 text-zinc-300/60" colSpan={3}>
                    No members
                  </td>
                </tr>
              ) : (
                rows.map((m) => (
                  <tr key={m.pseudo} className="border-b border-white/5 last:border-0">
                    <td className="py-2 pl-3 pr-2 text-zinc-100">{m.pseudo}</td>
                    <td className="py-2 px-2 text-zinc-200/85">{m.role}</td>
                    <td className="py-2 pl-2 pr-4 text-right text-zinc-200/85">
                      {new Date(m.joinedAt).toLocaleDateString("fr-FR")}
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
