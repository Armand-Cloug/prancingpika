// src/app/page.tsx
import HomeBackground from "@/components/page/public/home/HomeBackground";
import HomeHero from "@/components/page/public/home/HomeHero";
import InfoStrip from "@/components/page/public/home/InfoStrip";
import PresentationCard from "@/components/page/public/home/PresentationCard";
import RulesCard from "@/components/page/public/home/RulesCard";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#1F2B3A] text-zinc-100">
      <HomeBackground />

      <section className="mx-auto max-w-6xl px-6 py-14 lg:py-20">
        <header className="space-y-5">
          <HomeHero />
          <InfoStrip />
        </header>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PresentationCard />
          <RulesCard />
        </div>
      </section>
    </main>
  );
}
