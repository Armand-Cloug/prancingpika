// src/components/page/public/rules/RulesPage.tsx
import RulesHero from "./RulesHero";
import MainRules from "./RulesMainRules";
import TopRules from "./TopRules";
import AntiCheatCard from "./AntiCheatCard";
import ModerationCard from "./Moderation";

export default function RulesPage() {
  return (
    <main className="min-h-screen text-zinc-100 bg-[#1F2B3A]">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_10%,rgba(56,189,248,0.10),transparent_55%),radial-gradient(900px_circle_at_80%_20%,rgba(34,211,238,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(31,43,58,0.65),rgba(31,43,58,0.92))]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:120px_120px]" />
      </div>

      <section className="mx-auto w-full max-w-6xl px-6 pt-24 pb-14">
        <RulesHero />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: main rules */}
          <div className="lg:col-span-2 space-y-6">
            <MainRules />
            <TopRules />
          </div>

          {/* Right: anti cheat + footer note */}
          <div className="space-y-6">
            <AntiCheatCard />
            <ModerationCard />
          </div>
        </div>
      </section>
    </main>
  );
}
