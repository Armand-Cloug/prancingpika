// src/components/page/public/home/HomeHero.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomeHero() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs tracking-wide text-zinc-300/90">RIFT COMBATLOG PARSER</p>

        <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Prancing Pika
        </h1>

        <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-zinc-200/90 sm:text-base">
          Upload your logs, parse sessions automatically, and compare performance with clean, fair
          metrics (including boss-only windows when fights include waves/adds).
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild className="bg-sky-500 text-white hover:bg-sky-400">
          <Link href="/account">Upload a log</Link>
        </Button>

        <Button
          asChild
          variant="outline"
          className="border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10"
        >
          <Link href="/leaderboards">Leaderboards</Link>
        </Button>
      </div>
    </div>
  );
}
