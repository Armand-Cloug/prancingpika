// src/components/page/private/oldschool/OldSchoolSpecRules.tsx

type ClassEntry = {
  name: string;
  dot: string;
  pill: string;
  allowed: string[];
  banned: string[];
  notes?: string;
};

const classes: ClassEntry[] = [
  {
    name: "Primalist",
    dot: "bg-sky-400",
    pill: "bg-sky-400/10 text-sky-300 border-sky-400/20",
    allowed: [],
    banned: ["Tank"],
  },
  {
    name: "Warrior",
    dot: "bg-red-400",
    pill: "bg-red-400/10 text-red-300 border-red-400/20",
    allowed: ["Warchanter (allowed for now)"],
    banned: ["Liberator", "Double proc — both in healing and DPS"],
  },
  {
    name: "Rogue",
    dot: "bg-amber-400",
    pill: "bg-amber-400/10 text-amber-300 border-amber-400/20",
    allowed: ["Nightblade", "Marksman"],
    banned: ["All Destroyer specializations"],
  },
  {
    name: "Mage",
    dot: "bg-violet-400",
    pill: "bg-violet-400/10 text-violet-300 border-violet-400/20",
    allowed: [],
    banned: [],
    notes: "No restrictions — all specs are allowed.",
  },
  {
    name: "Cleric",
    dot: "bg-emerald-400",
    pill: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
    allowed: [],
    banned: ["All Defiance-based builds", "Inquisitor DPS", "Shaman DPS"],
    notes:
      "At the time, Inquisitor and Shaman had not yet received their reworks. Clerics struggled to reach one million DPS — today they would be far too strong in a DPS role.",
  },
];

export default function OldSchoolSpecRules() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="relative px-6 pt-6 pb-2">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,191,36,0.07),transparent_70%)]" />
        <p className="mono text-[10px] tracking-widest text-amber-400/60 uppercase mb-1">Per class</p>
        <h2 className="text-[17px] font-bold text-zinc-100" style={{ fontFamily: "'Syne', sans-serif" }}>
          Specialization Rules
        </h2>
        <p className="mt-1 text-[12px] text-zinc-500">
          Certain souls or specs are banned per class to stay true to the spirit of the era.
        </p>
      </div>

      <div className="px-6 pb-6 pt-4 space-y-3">
        {classes.map((cls) => (
          <div key={cls.name} className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
            {/* Class header */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`h-2 w-2 rounded-full ${cls.dot}`} />
              <span
                className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold mono ${cls.pill}`}
              >
                {cls.name.toUpperCase()}
              </span>
              {cls.banned.length === 0 && cls.allowed.length === 0 && !cls.notes && (
                <span className="text-[12px] text-emerald-400/80 ml-1">No restrictions</span>
              )}
            </div>

            {cls.notes && (
              <p className="text-[12.5px] text-zinc-400/80 leading-relaxed mb-3 italic">{cls.notes}</p>
            )}

            <div className="space-y-2">
              {cls.banned.map((item) => (
                <div key={item} className="flex items-start gap-2.5 text-[12.5px]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400/70" />
                  <span className="text-zinc-300/85 leading-snug">
                    <span className="text-rose-300/80 font-medium">Banned : </span>
                    {item}
                  </span>
                </div>
              ))}
              {cls.allowed.map((item) => (
                <div key={item} className="flex items-start gap-2.5 text-[12.5px]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/70" />
                  <span className="text-zinc-300/85 leading-snug">
                    <span className="text-emerald-300/80 font-medium">Allowed : </span>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
