// src/components/page/public/rules/RulesMainRules.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MainRules() {
  return (
    <Card className="border-white/10 bg-[#253649]/70 backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl text-zinc-100">PrancingPika.com Rules & Guidelines</CardTitle>
        <p className="text-sm text-zinc-200/85">
          These rules pertain to what is and is not permitted to be uploaded on PrancingPika.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="rounded-xl border border-white/10 bg-[#1F2B3A]/55 p-4">
          <p className="text-sm font-medium text-zinc-100">Uploads & integrity</p>

          <ul className="mt-3 space-y-3 text-sm text-zinc-200/90">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Do not use broken or knowingly bugged abilities to gain an unfair advantage on charts/rankings.
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Exploitable abilities may remain unfixed; abusing them still invalidates rankings (example: Frostkeeper “Hailblast”).
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Do not upload prior-tier raids — upload current-tier only.
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Current tier (example set): Bastion of Steel, Intrepid Rise of the Phoenix, and Tartaric Depths (Normal Mode).
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              DPS Dummy parses are allowed (recommended: level 70 / end level dummies).
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Absolutely do not toggle <span className="text-zinc-100">/combatlog</span> on/off once an encounter has begun.
              Keep it enabled for the full session from start to finish.
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              No edited logs or “half parses”. Manual modifications or fudging segments is grounds for removal.
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-zinc-100">Session uniqueness</p>

          <ul className="mt-3 space-y-3 text-sm text-zinc-200/90">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-400" />
              Each Raid Lock ID is its own session — no duplicates.
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-400" />
              If your Raid ID is “123”, only one combatlog from Raid ID 123 should be upload.
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
