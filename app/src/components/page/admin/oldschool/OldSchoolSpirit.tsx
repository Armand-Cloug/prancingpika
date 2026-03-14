// src/components/page/public/oldschool/OldSchoolSpirit.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OldSchoolSpirit() {
  return (
    <Card className="border-amber-400/15 bg-[#253649]/70 backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl text-zinc-100">Spirit of the Event</CardTitle>
        <p className="text-sm text-zinc-200/85">
          What actually matters.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl border border-amber-400/15 bg-amber-400/5 p-4 text-sm text-zinc-200/90 leading-relaxed space-y-3">
          <p>
            No rules are imposed on strategies. The current strats might not work at all anymore —
            and you might have to rethink everything from scratch. We&apos;ll see.
          </p>
          <p>
            That&apos;s where it gets interesting.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-sm font-medium text-amber-300">What was BoS like in 2018?</p>
          <ul className="mt-2 space-y-2 text-sm text-zinc-200/85">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400/70" />
              Rigid compositions with very little margin for error.
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400/70" />
              DPS numbers far below modern standards.
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400/70" />
              Mechanics that actually hurt — because you couldn&apos;t just blow through them with raw
              damage.
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400/70" />
              And a lot of wipes.
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#1F2B3A]/55 p-3">
          <p className="text-sm text-zinc-200/80 leading-relaxed italic">
            &quot;The goal isn&apos;t to perform. It&apos;s to feel what it was like again.&quot;
          </p>
        </div>
      </CardContent>
    </Card>
  );
}