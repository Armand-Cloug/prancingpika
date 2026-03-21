// src/components/page/private/oldschool/OldSchoolRestrictions.tsx

const bannedTanks = ["Bofotank", "PrimaTankDPS", "Defitank", "LiberatorTank"];

export default function OldSchoolRestrictions() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="relative px-5 pt-5 pb-2">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,191,36,0.07),transparent_70%)]" />
        <p className="mono text-[10px] tracking-widest text-amber-400/60 uppercase mb-1">Composition</p>
        <h2 className="text-[16px] font-bold text-zinc-100" style={{ fontFamily: "'Syne', sans-serif" }}>
          Other Restrictions
        </h2>
        <p className="mt-1 text-[12px] text-zinc-500">Raid composition rules for tanks.</p>
      </div>

      <div className="px-5 pb-5 pt-4 space-y-3">
        <ul className="rounded-xl border border-white/[0.07] bg-black/20 divide-y divide-white/[0.05]">
          {[
            "No hybrid tank specialization is allowed.",
            "The raid must include at least one Main Tank (61 pts in Tank spec).",
            "The Off Tank may use hybrid builds within the spec rules above.",
          ].map((rule) => (
            <li key={rule} className="flex gap-3 px-4 py-3 text-[12.5px] text-zinc-300/85 leading-snug">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/70" />
              {rule}
            </li>
          ))}
        </ul>

        <div className="rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3">
          <p className="text-[11px] font-semibold text-rose-400 tracking-wide uppercase mb-2">
            Banned tank examples
          </p>
          <div className="flex flex-wrap gap-2">
            {bannedTanks.map((ex) => (
              <span
                key={ex}
                className="rounded-md border border-rose-400/20 bg-rose-400/10 px-2 py-0.5 text-[11px] font-medium text-rose-300 mono"
              >
                {ex}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
