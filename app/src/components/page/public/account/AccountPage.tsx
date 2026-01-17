// src/components/page/public/account/AccountPage.tsx
"use client";

import * as React from "react";
import { useSession } from "next-auth/react";

import GreetingCard from "./GreetingCard";
import GuildPanel from "./GuildPanel";

type GuildDTO = {
  id: string;
  name: string;
  tag: string;
  role: "OWNER" | "MEMBER" | string;
  joinedAt: string;
};

export default function AccountPage() {
  const { data: session, status } = useSession();

  const name =
    (session?.user as any)?.pseudo ||
    session?.user?.name ||
    session?.user?.email ||
    "User";

  const [guilds, setGuilds] = React.useState<GuildDTO[]>([]);
  const [loadingGuilds, setLoadingGuilds] = React.useState(false);
  const [guildError, setGuildError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    async function load() {
      setLoadingGuilds(true);
      setGuildError(null);

      try {
        const res = await fetch("/api/public/account/me", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load account data.");
        }

        if (!cancelled) {
          setGuilds(Array.isArray(data?.guilds) ? data.guilds : []);
        }
      } catch (e: any) {
        if (!cancelled) setGuildError(e?.message || "Failed to load guilds.");
      } finally {
        if (!cancelled) setLoadingGuilds(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const currentGuild = guilds[0] ?? null;

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-[#1F2B3A] text-zinc-100 px-6 pt-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-zinc-200/80">Loading…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#1F2B3A] text-zinc-100">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_10%,rgba(56,189,248,0.12),transparent_55%),radial-gradient(900px_circle_at_85%_20%,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(31,43,58,0.45),rgba(31,43,58,0.92))]" />
      </div>

      <section className="mx-auto max-w-6xl px-6 pt-24 pb-14">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GreetingCard name={name} guilds={guilds} />

          <GuildPanel
            guildName={currentGuild ? `${currentGuild.name} [${currentGuild.tag}]` : null}
            guilds={guilds}
            loading={loadingGuilds}
            error={guildError}
            onRefresh={async () => {
              // refresh on demand (after create/join)
              setLoadingGuilds(true);
              setGuildError(null);
              try {
                const res = await fetch("/api/public/account/me", { cache: "no-store" });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data?.error || "Failed to refresh.");
                setGuilds(Array.isArray(data?.guilds) ? data.guilds : []);
              } catch (e: any) {
                setGuildError(e?.message || "Failed to refresh guilds.");
              } finally {
                setLoadingGuilds(false);
              }
            }}
          />
        </div>
      </section>
    </main>
  );
}
