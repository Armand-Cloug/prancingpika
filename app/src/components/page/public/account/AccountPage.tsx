// src/components/page/public/account/AccountPage.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import GreetingCard from "./GreetingCard";
import GuildPanel   from "./GuildPanel";
import RiftPanel, { type RiftCharacterDTO } from "./RiftPanel";

type GuildDTO = {
  id: string;
  name: string;
  tag: string;
  role: string;
  joinedAt: string;
};

type RiftData = {
  locked: boolean;
  linkedAt: string | null;
  characters: RiftCharacterDTO[];
};

type AccountData = {
  account: { id: string; pseudo: string; provider: string };
  guilds: GuildDTO[];
  rift: RiftData;
};

export default function AccountPage() {
  const [data, setData]       = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/account/me");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const guilds    = data?.guilds ?? [];
  const pseudo    = data?.account.pseudo ?? "";
  const guildName = guilds[0]?.name ?? null;
  const rift      = data?.rift ?? { locked: false, linkedAt: null, characters: [] };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.2em] text-sky-400/70 font-medium uppercase mb-2">
          Profile
        </p>
        <h1 className="text-4xl font-bold text-gradient tracking-tight">Account</h1>
        <p className="mt-2 text-[13px] text-zinc-500">Upload logs and manage your guild</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <GreetingCard
          name={pseudo}
          guilds={guilds.map((g) => ({ id: g.id, name: g.name, tag: g.tag ?? "" }))}
        />
        <GuildPanel
          guildName={guildName}
          guilds={guilds}
          loading={loading}
          error={error}
          onRefresh={fetchData}
        />
        <div className="lg:col-span-2">
          <RiftPanel
            locked={rift.locked}
            linkedAt={rift.linkedAt}
            characters={rift.characters}
            onImported={fetchData}
          />
        </div>
      </div>
    </div>
  );
}
