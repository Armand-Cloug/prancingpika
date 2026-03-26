// src/app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata, getSiteUrl, siteName } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "RIFT Combat Log Tracker",
  description:
    "Upload RIFT combat logs, parse sessions automatically, and compare DPS and HPS performance across boss fights with clean leaderboards and spec breakdowns.",
  path: "/",
});

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: getSiteUrl(),
  description:
    "Community platform for RIFT MMORPG combat log analysis — DPS/HPS tracking, boss leaderboards, and guild management.",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${getSiteUrl()}/lookup?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* BG decorations */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[500px]
                        bg-[radial-gradient(ellipse,rgba(56,189,248,0.09)_0%,transparent_65%)]" />
        <div className="pointer-events-none absolute top-40 right-10 w-72 h-72
                        bg-[radial-gradient(circle,rgba(45,212,191,0.06)_0%,transparent_60%)]" />

        <div className="mx-auto max-w-7xl 2xl:max-w-[1600px] px-6 pt-20 pb-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

            {/* Text block */}
            <div className="max-w-2xl">
              <p className="mb-3 text-xs tracking-[0.18em] text-sky-400/80 font-medium uppercase">
                RIFT Combat Log Parser
              </p>

              <h1 className="text-5xl font-bold sm:text-6xl lg:text-7xl text-gradient leading-[0.95] tracking-tight">
                Prancing<br />Pika
              </h1>

              <p className="mt-6 text-[15px] leading-relaxed text-zinc-400 max-w-xl">
                Upload your logs, parse sessions automatically, and compare performance
                with clean metrics — including boss-only windows for multi-phase fights.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/account"
                  className="px-6 py-2.5 text-sm font-semibold rounded-xl btn-sky"
                >
                  Upload a log
                </Link>
                <Link
                  href="/leaderboards"
                  className="px-6 py-2.5 text-sm font-medium rounded-xl glass glass-hover text-zinc-200"
                >
                  Leaderboards →
                </Link>
                <Link
                  href="/top-players"
                  className="px-6 py-2.5 text-sm font-medium rounded-xl glass glass-hover text-zinc-200"
                >
                  Top Players →
                </Link>
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:w-56">
              {[
                { label: "DPS / HPS / APS",  desc: "Full metric set" },
                { label: "Boss-only window",  desc: "Phase-accurate" },
                { label: "Spec detection",    desc: "40+ specs known" },
                { label: "Multi-language",    desc: "FR / EN / DE logs" },
              ].map(({ label, desc }) => (
                <div key={label} className="glass rounded-xl px-4 py-3">
                  <p className="text-[11px] font-semibold text-zinc-200">{label}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Notices ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl 2xl:max-w-[1600px] px-6 pb-8">
        <div className="grid gap-3 sm:grid-cols-2">
          <Notice accent="sky">
            <strong className="text-zinc-100">Info:</strong>{" "}
            Leaderboards update when new logs are parsed. If something looks off,
            check the rules page or reach out on Discord.
          </Notice>
          <Notice accent="amber">
            <strong className="text-zinc-100">Guild Info:</strong>{" "}
            Guild creation is available. Invite links for members are coming soon —
            for now only the guild creator can upload parses.
          </Notice>
        </div>
      </section>

      {/* ── Cards ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl 2xl:max-w-[1600px] px-6 pb-20">
        <div className="grid gap-5 lg:grid-cols-2">
          <HowItWorksCard />
          <RulesCard />
        </div>
      </section>
    </main>
  );
}

function Notice({
  children,
  accent = "sky",
}: {
  children: React.ReactNode;
  accent?: "sky" | "amber";
}) {
  const bar = accent === "amber"
    ? "bg-amber-400/70"
    : "bg-sky-400/70";

  return (
    <div className="relative glass rounded-xl px-4 py-3 pl-5 text-[13px] text-zinc-400 leading-relaxed overflow-hidden">
      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${bar}`} />
      {children}
    </div>
  );
}

function HowItWorksCard() {
  const steps = [
    { icon: "01", text: <>Enable in-game: <code className="text-sky-400 text-[11px]">/combatlog</code></> },
    { icon: "02", text: "Upload the .txt log file on your account page" },
    { icon: "03", text: "Get your DPS/HPS scores and compare on leaderboards" },
  ];

  const features = [
    { label: "Sessions", value: "Clean boundaries" },
    { label: "Metrics",  value: "DPS / HPS / APS"  },
    { label: "Specs",    value: "40+ detected"      },
  ];

  return (
    <div className="glass rounded-2xl p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-zinc-100">How it works</h2>
        <p className="mt-1 text-[13px] text-zinc-500">Data-first, readable, fast — like the OG Prancing Turtle.</p>
      </div>

      <ol className="flex flex-col gap-3">
        {steps.map(({ icon, text }) => (
          <li key={icon} className="flex items-start gap-3">
            <span className="mono shrink-0 text-[10px] font-bold text-sky-400/60 mt-1">{icon}</span>
            <span className="text-[13px] text-zinc-300">{text}</span>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06]">
        {features.map(({ label, value }) => (
          <div key={label} className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2.5">
            <p className="text-[10px] text-zinc-500">{label}</p>
            <p className="mt-1 text-[12px] font-semibold text-zinc-200">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RulesCard() {
  const rules = [
    "Use /combatlog (standard format) — expanded logs are also supported",
    "No third-party tools that automate buffs or artificially inflate metrics",
    "Large ninja pulls (3s+ before pull) may confuse encounter detection",
    "Anti-cheat is active — if a run is missing, reach out on Discord",
    "Guild tag format: [EU] GuildName or [NA] GuildName for proper flags",
  ];

  return (
    <div className="glass rounded-2xl p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-zinc-100">Rules &amp; Guidelines</h2>
        <p className="mt-1 text-[13px] text-zinc-500">Keep it clean and fair for everyone.</p>
      </div>

      <ul className="flex flex-col gap-2.5">
        {rules.map((rule, i) => (
          <li key={i} className="flex items-start gap-3 text-[13px] text-zinc-400">
            <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50" />
            {rule}
          </li>
        ))}
      </ul>

      <div className="pt-2 border-t border-white/[0.06]">
        <Link
          href="/rules"
          className="text-[12px] text-sky-400 hover:text-sky-300 transition-colors"
        >
          Full rules page →
        </Link>
      </div>
    </div>
  );
}
