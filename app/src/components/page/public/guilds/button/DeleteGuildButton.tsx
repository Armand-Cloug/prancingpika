"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function DeleteGuildButton({ guildId, guildName }: { guildId: string; guildName: string }) {
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm(`Delete guild "${guildName}"?\nThis will also delete its runs.`)) return;

    setLoading(true);
    try {
      const r = await fetch("/api/public/guilds/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Delete failed");
      window.location.reload();
    } catch (e: any) {
      alert(String(e?.message || "Delete failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={loading}
      onClick={onDelete}
      className="bg-red-500/15 text-red-200 hover:bg-red-500/25 border border-red-500/20"
    >
      {loading ? "Deleting…" : "Delete guild"}
    </Button>
  );
}
