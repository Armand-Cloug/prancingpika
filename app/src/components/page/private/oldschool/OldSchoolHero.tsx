// src/components/page/private/oldschool/OldSchoolHero.tsx
import Link from "next/link";

export default function OldSchoolHero() {
  return (
    <div className="relative mb-10">
      {/* Amber glow behind the title */}
      <div className="pointer-events-none absolute -top-8 left-0 h-40 w-96 rounded-full bg-amber-400/10 blur-3xl" />

      <p className="mono text-[11px] tracking-[0.2em] text-amber-400/70 uppercase mb-3">
        Bastion of Steel · Community Event
      </p>

      <h1
        className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-100 mb-4"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        Old School
      </h1>

      <p className="max-w-2xl text-[15px] leading-relaxed text-zinc-300/80 mb-6">
        Back to basics. BoS raids played under 2018 conditions — with the gear of that era,
        the specs of that era, and the difficulty of that era. For those who want to understand
        where we came from.
      </p>

      <div className="flex flex-wrap gap-3 mb-8">
        <a
          href="https://discord.gg/EFwRa4DhBa"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-amber-400 active:scale-95"
        >
          Join the event
        </a>
        <Link
          href="/leaderboards"
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-[13px] font-medium text-zinc-200 transition hover:bg-white/10 active:scale-95"
        >
          View leaderboards
        </Link>
      </div>

      {/* Banner note */}
      <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-5 py-3.5 text-[13px] leading-relaxed text-zinc-200/85">
        <span className="font-semibold text-amber-300">Note :</span>{" "}
        All rules below apply together. The goal is to rediscover the spirit and the{" "}
        <span className="text-zinc-100 font-medium">real difficulty</span> of the first BoS
        runs — not to chase numbers.
      </div>
    </div>
  );
}
