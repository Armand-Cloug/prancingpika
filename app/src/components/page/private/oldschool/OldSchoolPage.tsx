// src/components/page/private/oldschool/OldSchoolPage.tsx
import OldSchoolHero from "./OldSchoolHero";
import OldSchoolIntro from "./OldSchoolIntro";
import OldSchoolGearRules from "./OldSchoolGearRules";
import OldSchoolSpecRules from "./OldSchoolSpecRules";
import OldSchoolRestrictions from "./OldSchoolRestrictions";
import OldSchoolSpirit from "./OldSchoolSpirit";

export default function OldSchoolPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      {/* Subtle amber radial accent behind the hero */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_50%_0%,rgba(251,191,36,0.06),transparent_60%)]" />
      </div>

      <OldSchoolHero />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-6">
          <OldSchoolIntro />
          <OldSchoolGearRules />
          <OldSchoolSpecRules />
        </div>

        {/* Right: sidebar */}
        <div className="space-y-6">
          <OldSchoolRestrictions />
          <OldSchoolSpirit />
        </div>
      </div>
    </div>
  );
}