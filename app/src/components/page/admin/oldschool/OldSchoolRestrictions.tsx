// src/components/page/public/oldschool/OldSchoolRestrictions.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OldSchoolRestrictions() {
  return (
    <Card className="border-white/10 bg-[#253649]/70 backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl text-zinc-100">Other Restrictions</CardTitle>
        <p className="text-sm text-zinc-200/85">
          Raid composition rules, in particular regarding tanks.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-[#1F2B3A]/55 p-4 text-sm text-zinc-200/90 leading-relaxed">
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-400" />
              No hybrid tank specialization is allowed.
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-400" />
              The raid must always include at least one Main Tank (61 Point in Tank spec).
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-400" />
              The Off Tank may use hybrid builds within the spec rules above.
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-sm font-medium text-zinc-100">Banned tank examples</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Bofotank", "PrimaTankDPS", "Defitank", "LiberatorTank"].map((ex) => (
              <span
                key={ex}
                className="rounded-md border border-rose-400/20 bg-rose-400/10 px-2 py-0.5 text-xs text-rose-300"
              >
                {ex}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}