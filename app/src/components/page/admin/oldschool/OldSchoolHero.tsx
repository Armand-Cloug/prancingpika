// src/components/page/public/oldschool/OldSchoolHero.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OldSchoolHero() {
  return (
    <header className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs tracking-widest text-amber-400/80 uppercase">
            Bastion of Steel · Community Event
          </p>
          <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Old School
          </h1>
          <p className="mt-3 max-w-3xl text-pretty text-sm leading-relaxed text-zinc-200/90 sm:text-base">
            Back to basics. BoS raids played under 2018 conditions — with the gear of that era, the
            specs of that era, and the difficulty of that era. For those who want to understand where
            we came from.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            className="bg-amber-500 text-white hover:bg-amber-400"
          >
            <Link
              href="https://discord.gg/EFwRa4DhBa"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join the event
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10"
          >
            <Link href="/leaderboards">View leaderboards</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-zinc-200/90">
        <span className="font-medium text-amber-300">Note:</span>{" "}
        All rules below apply together. The goal is to rediscover the spirit and the{" "}
        <span className="text-zinc-100">real difficulty</span> of the first BoS runs — not to
        chase numbers.
      </div>
    </header>
  );
}