// src/components/page/private/oldschool/OldSchoolGearRules.tsx

const allowed = [
  "BIS helm / hood, BIS bow and wand are allowed.",
  "Cape : use the old winter cape if you have it; otherwise, use whatever you currently have.",
  "Omnox and Berserker are allowed as trinkets.",
  "Seal : use the PvP seal if you have one; otherwise, use your summer event seal.",
  "Focus & planar fragments : no restrictions.",
];

const banned = [
  "All T2 gear — whether purchased from the store or obtained from raids.",
  "No level 65 weapon that provides a healing boost.",
  "Planar weapons — eternal weapons remain allowed.",
  "Event jewelry : Autumn Necklace, Carnival Earring. Upgraded jewelry is also banned.",
  "All other trinkets, in particular those from CoA.",
];

export default function OldSchoolGearRules() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="relative px-6 pt-6 pb-2">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,191,36,0.07),transparent_70%)]" />
        <p className="mono text-[10px] tracking-widest text-amber-400/60 uppercase mb-1">Equipment</p>
        <h2 className="text-[17px] font-bold text-zinc-100" style={{ fontFamily: "'Syne', sans-serif" }}>
          Gear Rules
        </h2>
        <p className="mt-1 text-[12px] text-zinc-500">What is allowed and what is banned — slot by slot.</p>
      </div>

      <div className="px-6 pb-6 pt-4 space-y-4">
        {/* Core rule banner */}
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3">
          <span className="text-[12px] font-semibold text-amber-300">Core rule — </span>
          <span className="text-[13px] text-zinc-200/90">
            All <span className="text-zinc-100 font-medium">T2</span> gear is{" "}
            <span className="text-rose-400 font-semibold">banned</span>. You must use{" "}
            <span className="text-zinc-100 font-medium">T1</span> gear.
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Allowed */}
          <div className="rounded-xl border border-emerald-400/15 bg-black/20 p-4">
            <p className="text-[11px] font-semibold text-emerald-400 tracking-wide uppercase mb-3">
              ✓ Allowed exceptions
            </p>
            <ul className="space-y-2.5">
              {allowed.map((item) => (
                <li key={item} className="flex gap-2.5 text-[12.5px] text-zinc-300/85 leading-snug">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/70" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Banned */}
          <div className="rounded-xl border border-rose-400/15 bg-black/20 p-4">
            <p className="text-[11px] font-semibold text-rose-400 tracking-wide uppercase mb-3">
              ✕ Banned items
            </p>
            <ul className="space-y-2.5">
              {banned.map((item) => (
                <li key={item} className="flex gap-2.5 text-[12.5px] text-zinc-300/85 leading-snug">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400/70" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Runes */}
        <div className="rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3 text-[13px] text-zinc-400/80 leading-relaxed">
          <span className="font-medium text-zinc-300">Runes : </span>
          No official restriction. That said, if you have unused EoA runes, avoid placing them on
          T1 gear — use crafted runes instead.
        </div>
      </div>
    </div>
  );
}
