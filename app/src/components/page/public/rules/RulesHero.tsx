// src/components/page/public/rules/RulesHero.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RulesHero() {
  return (
    <header className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs tracking-wide text-zinc-300/90">RIFT COMBATLOG PARSER</p>
          <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Rules & Guidelines
          </h1>
          <p className="mt-3 max-w-3xl text-pretty text-sm leading-relaxed text-zinc-200/90 sm:text-base">
            These rules define what is and is not permitted to be uploaded on PrancingPika, and what
            qualifies for the “Top” leaderboards. Keep logs honest so rankings stay meaningful.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            className="bg-emerald-500 text-white hover:bg-emerald-400"
          >
            <Link href="/account">Accept & upload</Link>
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

      <div className="rounded-xl border border-white/10 bg-[#2A3B4F]/70 px-4 py-3 text-sm text-zinc-200/90">
        <span className="font-medium text-zinc-100">Note:</span>{" "}
        “Top” rules apply <span className="text-zinc-100">in addition</span> to the main rules below.
        If you violate Top rules, your parse can be removed from Top and may be hidden from public views.
      </div>
    </header>
  );
}
