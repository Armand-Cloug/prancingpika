// src/components/page/public/rules/TopRules.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TopRules() {
  return (
    <Card className="border-white/10 bg-[#253649]/70 backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl text-zinc-100">Top Leaderboards — Rules & Guidelines</CardTitle>
        <p className="text-sm text-zinc-200/85">
          These rules apply in addition to the main rules above. Violations may remove a parse from Top
          and can hide the session from public views.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="rounded-xl border border-white/10 bg-[#1F2B3A]/55 p-4">
          <p className="text-sm font-medium text-zinc-100">General details</p>

          <ul className="mt-3 space-y-3 text-sm text-zinc-200/90">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-400" />
              <span className="text-zinc-100">Date cutoff:</span> only parses after 01-01-2020 are accepted. (You can re ReUpload old logs)
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-400" />
              <span className="text-zinc-100">Raid zone limitation:</span> All Prophecy of Ankhet raid are included (for Top).
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-400" />
              <span className="text-zinc-100">Parser cadence:</span> backend runs every timmes you upload a logfile.
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-zinc-100">Top rules</p>

          <ul className="mt-3 space-y-3 text-sm text-zinc-200/90">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-400" />
              Absolutely NO second Lava Field or Flaring Power buff after a raid death within five minutes
              (“exhausted debuff resetting”). This does not forbid follow-up buffs once the five-minute debuff wears off.
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-400" />
              No stacking broken/bugged buffs to create skewed DPS (example: stacking multiple Primal Savagery buffs).
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-400" />
              No intentional skipping of hard-timed, hard-percent-set, or unskippable raid mechanics.
              <br />
              High raid DPS or server issues can cause delayed/queued mechanics — that is not the same as forcing a boss to skip an invulnerability mechanic.
              <br /> 
              Example: Azranel’s “Defensive Spin” starts at 45% then every 44 seconds. The initial 45% activation cannot be skipped; skipping it violates Top rules.
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
