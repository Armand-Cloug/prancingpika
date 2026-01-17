// src/components/page/public/home/PresentationCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PresentationCard() {
  return (
    <Card className="border-white/10 bg-[#253649]/70 backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl text-zinc-100">Site presentation</CardTitle>
        <p className="text-sm text-zinc-200/85">
          Designed to feel like the OG Prancing Turtle : data-first, readable, fast.
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
              Get your scores and compare on leaderboards
            </li>
          </ol>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-zinc-300/80">Sessions</p>
            <p className="mt-1 text-sm font-semibold text-zinc-100">Clean boundaries</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-zinc-300/80">Metrics</p>
            <p className="mt-1 text-sm font-semibold text-zinc-100">DPS / HPS</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-zinc-300/80">Special</p>
            <p className="mt-1 text-sm font-semibold text-zinc-100">Boss-only</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-zinc-100">Other things :</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-200/85">
            The OG will always be Prancing Turtle
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
