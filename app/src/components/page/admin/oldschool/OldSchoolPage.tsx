// src/components/page/public/oldschool/OldSchoolPage.tsx
import OldSchoolHero from "./OldSchoolHero";
import OldSchoolIntro from "./OldSchoolIntro";
import OldSchoolGearRules from "./OldSchoolGearRules";
import OldSchoolSpecRules from "./OldSchoolSpecRules";
import OldSchoolRestrictions from "./OldSchoolRestrictions";
import OldSchoolSpirit from "./OldSchoolSpirit";

export default function OldSchoolPage() {
  return (
    <main className="min-h-screen text-zinc-100 bg-[#1F2B3A]">
      {/* Background — warm amber tint for the nostalgic old-school feel */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_10%,rgba(251,191,36,0.07),transparent_55%),radial-gradient(900px_circle_at_80%_20%,rgba(217,119,6,0.05),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(31,43,58,0.65),rgba(31,43,58,0.92))]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:120px_120px]" />
      </div>

      <section className="mx-auto w-full max-w-6xl px-6 pt-24 pb-14">
        <OldSchoolHero />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: main content */}
          <div className="lg:col-span-2 space-y-6">
            <OldSchoolIntro />
            <OldSchoolGearRules />
            <OldSchoolSpecRules />
          </div>

          {/* Right: restrictions + spirit */}
          <div className="space-y-6">
            <OldSchoolRestrictions />
            <OldSchoolSpirit />
          </div>
        </div>
      </section>
    </main>
  );
}