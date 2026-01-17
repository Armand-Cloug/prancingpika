// src/app/page.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen text-zinc-100 bg-[#1F2B3A]">
      {/* Background (dark slate, not black) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_10%,rgba(56,_partial_Important 189,248,0.10),transparent_55%),radial-gradient(900px_circle_at_80%_20%,rgba(34,211,238,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(31,43,58,0.65),rgba(31,43,58,0.92))]" />
        {/* subtle grid */}
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:120px_120px]" />
      </div>

      <section className="mx-auto max-w-6xl px-6 py-14 lg:py-20">
        {/* Title + info bar (like the old site) */}
        <header className="space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs tracking-wide text-zinc-300/90">
                RIFT COMBATLOG PARSER
              </p>
              <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                Prancing Pika
              </h1>
              <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-zinc-200/90 sm:text-base">
                Upload your logs, parse sessions automatically, and compare performance with clean,
                fair metrics (including boss-only windows when fights include waves/adds).
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button className="bg-sky-500 text-white hover:bg-sky-400">
                Upload a log
              </Button>
              <Button
                variant="outline"
                className="border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10"
              >
                Leaderboards
              </Button>
            </div>
          </div>

          {/* Info strip */}
          <div className="rounded-xl border border-white/10 bg-[#2A3B4F]/70 px-4 py-3 text-sm text-zinc-200/90">
            <span className="font-medium text-zinc-100">Info:</span>{" "}
            Leaderboards update periodically when new parses are found. If something looks off,
            check the rules below and the help page.
          </div>
        </header>

        {/* Two panels */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LEFT: Presentation */}
          <Card className="border-white/10 bg-[#253649]/70 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl text-zinc-100">Site presentation</CardTitle>
              <p className="text-sm text-zinc-200/85">
                Designed to feel like the classic Rift parsers: data-first, readable, fast.
              </p>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="rounded-xl border border-white/10 bg-[#1F2B3A]/55 p-4">
                <p className="text-sm font-medium text-zinc-100">How it works</p>
                <ol className="mt-3 space-y-2 text-sm text-zinc-200/90">
                  <li className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-400" />
                    Enable logging in-game: <span className="text-zinc-100">/combatlog</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-400" />
                    Upload the log (or zipped folder)
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-400" />
                    Get a session summary + per-boss details
                  </li>
                </ol>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-zinc-300/80">Sessions</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-100">
                    Clean boundaries
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-zinc-300/80">Metrics</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-100">
                    DPS / HPS
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-zinc-300/80">Special</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-100">
                    Boss-only
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-zinc-100">Text (to fill later)</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-200/85">
                  Placeholder for your home copy (lore, goals, upload tips, tier list, links, etc.).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT: Rules */}
          <Card className="border-white/10 bg-[#253649]/70 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl text-zinc-100">Rules</CardTitle>
              <p className="text-sm text-zinc-200/85">
                Keep rankings meaningful. Logs must reflect real gameplay.
              </p>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="rounded-xl border border-white/10 bg-[#1F2B3A]/55 p-4">
                <p className="text-sm font-medium text-zinc-100">Core rules</p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-200/90">
                  <li className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    No knowingly bugged/exploitable abilities to gain unfair advantage.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Do not toggle <span className="text-zinc-100">/combatlog</span> mid-encounter.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    No edited logs or “half parses” intended to skew leaderboards.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    One public “master” upload per unique session/raid ID.
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-zinc-100">
                  Extra rules (to fill later)
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-200/85">
                  Placeholder for: date cutoffs, tier list, raid limitations, top-leaderboard
                  constraints, parser cadence, fight-specific restrictions (e.g. Titan X rules).
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10"
                >
                  Read full rules
                </Button>
                <Button className="bg-emerald-500 text-white hover:bg-emerald-400">
                  Accept & upload
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
