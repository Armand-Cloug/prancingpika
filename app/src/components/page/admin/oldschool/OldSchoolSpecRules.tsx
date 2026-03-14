// src/components/page/public/oldschool/OldSchoolSpecRules.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const classes = [
  {
    name: "Primalist",
    color: "bg-emerald-400",
    allowed: [],
    banned: ["Tank"],
    notes: null,
  },
  {
    name: "Warrior",
    color: "bg-sky-400",
    allowed: ["Warchanter (allowed for now)"],
    banned: ["Liberator", "Double proc — both in healing and DPS"],
    notes: null,
  },
  {
    name: "Rogue",
    color: "bg-violet-400",
    allowed: ["Nightblade", "Marksman"],
    banned: ["All Destroyer specializations"],
    notes: null,
  },
  {
    name: "Mage",
    color: "bg-cyan-400",
    allowed: [],
    banned: [],
    notes: "No restrictions — all specs are allowed.",
  },
  {
    name: "Cleric",
    color: "bg-amber-400",
    allowed: [],
    banned: [
      "All Defiance-based builds",
      "Inquisitor DPS",
      "Shaman DPS",
    ],
    notes:
      "At the time, Inquisitor and Shaman had not yet received their reworks. Clerics struggled to reach one million DPS — today they would be far too strong in a DPS role.",
  },
];

export default function OldSchoolSpecRules() {
  return (
    <Card className="border-white/10 bg-[#253649]/70 backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl text-zinc-100">Specialization Rules</CardTitle>
        <p className="text-sm text-zinc-200/85">
          Certain souls or specs are banned per class to stay true to the spirit of the era.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {classes.map((cls) => (
          <div
            key={cls.name}
            className="rounded-xl border border-white/10 bg-[#1F2B3A]/55 p-4"
          >
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${cls.color}`} />
              <p className="text-sm font-medium text-zinc-100">{cls.name}</p>
            </div>

            {cls.notes && (
              <p className="mt-2 text-sm text-zinc-200/80 leading-relaxed">{cls.notes}</p>
            )}

            {cls.banned.length > 0 && (
              <ul className="mt-3 space-y-2 text-sm text-zinc-200/90">
                {cls.banned.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-400" />
                    <span>
                      <span className="text-rose-300/80 font-medium">Banned :</span> {item}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {cls.allowed.length > 0 && (
              <ul className="mt-2 space-y-2 text-sm text-zinc-200/90">
                {cls.allowed.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                    <span>
                      <span className="text-emerald-300/80 font-medium">Allowed :</span> {item}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {cls.banned.length === 0 && cls.allowed.length === 0 && !cls.notes && (
              <p className="mt-2 text-sm text-emerald-400/80">No restrictions.</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}