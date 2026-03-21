// src/components/page/private/oldschool/OldSchoolSpirit.tsx
export default function OldSchoolSpirit() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="relative px-5 pt-5 pb-2">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,191,36,0.08),transparent_70%)]" />
        <p className="mono text-[10px] tracking-widest text-amber-400/60 uppercase mb-1">Philosophy</p>
        <h2 className="text-[16px] font-bold text-zinc-100" style={{ fontFamily: "'Syne', sans-serif" }}>
          Spirit of the Event
        </h2>
        <p className="mt-1 text-[12px] text-zinc-500">What actually matters.</p>
      </div>

      <div className="px-5 pb-5 pt-4 space-y-3">
        <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4 text-[13px] text-zinc-300/85 leading-relaxed space-y-2">
          <p>
            No rules are imposed on strategies. The current strats might not work at all anymore
            — and you might have to rethink everything from scratch.
          </p>
          <p className="text-zinc-400">That&apos;s where it gets interesting.</p>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3">
          <p className="text-[11px] font-semibold text-amber-300/80 tracking-wide uppercase mb-2.5">
            What was BoS like in 2018?
          </p>
          <ul className="space-y-2">
            {[
              "Rigid compositions with very little margin for error.",
              "DPS numbers far below modern standards.",
              "Mechanics that actually hurt — you couldn't blow through them with raw damage.",
              "And a lot of wipes.",
            ].map((item) => (
              <li key={item} className="flex gap-2.5 text-[12.5px] text-zinc-300/80 leading-snug">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/60" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Quote */}
        <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-4 py-3">
          <p className="text-[13px] text-zinc-300/70 leading-relaxed italic">
            &ldquo;The goal isn&apos;t to perform. It&apos;s to feel what it was like again.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
