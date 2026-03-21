// src/components/page/private/oldschool/OldSchoolIntro.tsx
export default function OldSchoolIntro() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Amber top accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

      <div className="relative px-6 pt-6 pb-2">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,191,36,0.08),transparent_70%)]" />
        <p className="mono text-[10px] tracking-widest text-amber-400/60 uppercase mb-1">Overview</p>
        <h2 className="text-[17px] font-bold text-zinc-100" style={{ fontFamily: "'Syne', sans-serif" }}>
          The Project
        </h2>
        <p className="mt-1 text-[12px] text-zinc-500">Why go back and what mindset to bring.</p>
      </div>

      <div className="px-6 pb-6 pt-4 space-y-4">
        <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4 text-[13px] leading-relaxed text-zinc-300/90 space-y-3">
          <p>
            The Old School event is straightforward : run{" "}
            <span className="text-zinc-100 font-medium">Bastion of Steel</span> under conditions
            close to the guild&apos;s first raids back in{" "}
            <span className="text-amber-300 font-medium">2018</span>. Same gear, same specs, same
            constraints — or as close as we can get.
          </p>
          <p>
            The goal is to have fun. But also to remember — or discover for the first time — the{" "}
            <span className="text-zinc-100">&ldquo;real difficulty&rdquo;</span> BoS represented
            back then. An era that only{" "}
            <span className="text-amber-300">Endless</span> and{" "}
            <span className="text-amber-300">Cloug</span>, among the players still active on the
            FR side, truly experienced. And even then.
          </p>
        </div>

        <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
          <p className="text-[12px] font-semibold text-amber-300 mb-2">Why these rules?</p>
          <p className="text-[13px] text-zinc-300/85 leading-relaxed">
            The game has evolved enormously since 2018. Without guardrails, an &ldquo;old school&rdquo;
            raid would just be a normal BoS with a modern composition. These rules aim to recreate a
            context as faithful as possible to what FR raids were experiencing at the time — without
            going overboard on perfectionism.
          </p>
        </div>
      </div>
    </div>
  );
}
