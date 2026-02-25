// src/components/page/public/rules/DpsRules.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DpsRules() {
  return (
    <Card className="border-white/10 bg-[#253649]/70 backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl text-zinc-100">
          DPS & HPS Rules — What counts for DPS/HPS calculations
        </CardTitle>
        <p className="text-sm text-zinc-200/85">
          These rules define what events are included in DPS/HPS computations and in Top eligibility. Any
          violation can invalidate a parse for Top and may hide the session from public views.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* General details */}
        <div className="rounded-xl border border-white/10 bg-[#1F2B3A]/55 p-4">
          <p className="text-sm font-medium text-zinc-100">General details</p>

          <ul className="mt-3 space-y-3 text-sm text-zinc-200/90">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-400" />
              <span>
                <span className="text-zinc-100">Classes:</span> deduced from buffs detected during the
                fight.
              </span>
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-400" />
              <span>
                <span className="text-zinc-100">Specs:</span> deduced from core ability usage. Example:
                <span className="text-zinc-100"> Bofors</span> is identified via{" "}
                <span className="text-zinc-100">DS + CS + RFS + Poison</span>, while{" "}
                <span className="text-zinc-100">BQQ</span> is identified via{" "}
                <span className="text-zinc-100">DS + CS + RFS + EB</span>.
              </span>
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-400" />
              <span>
                <span className="text-zinc-100">Unknown specs can happen:</span> if a player runs a mixed
                setup but does not use the key identifying abilities, the parser may not recognize the
                spec (e.g. Riftblade + Reaver without using <span className="text-zinc-100">Soul Sickness</span>).
              </span>
            </li>
          </ul>
        </div>

        {/* Boss inclusion rules */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-zinc-100">Boss inclusion rules (what is counted)</p>

          <ul className="mt-3 space-y-3 text-sm text-zinc-200/90">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-400" />
              <span>
                <span className="text-zinc-100">Ereandorn:</span> boss damage/healing only — no volcano.
              </span>
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-400" />
              <span>
                <span className="text-zinc-100">Beruhast:</span> boss only.
              </span>
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-400" />
              <span>
                <span className="text-zinc-100">Silgen:</span> boss only.
              </span>
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-400" />
              <span>
                <span className="text-zinc-100">Phoenix:</span> both Phoenix targets (small + big) are
                included — no adds.
              </span>
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-400" />
              <span>
                <span className="text-zinc-100">Beli:</span> boss only — no adds.
              </span>
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-400" />
              <span>
                <span className="text-zinc-100">Tarjulia:</span> only the main boss target — no soul.
              </span>
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-400" />
              <span>
                <span className="text-zinc-100">Malanon:</span> boss only — no adds and no pillars.
              </span>
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-400" />
              <span>
                <span className="text-zinc-100">Azranel:</span> boss only — no towers.
              </span>
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-400" />
              <span>
                <span className="text-zinc-100">Isiel:</span> Vindicator ST and Isiel ST only — no adds,
                and no combined Vindicator + Isiel damage counted together.
              </span>
            </li>

            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-400" />
              <span>
                <span className="text-zinc-100">Titan:</span> boss only — no adds and no crates.
              </span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}