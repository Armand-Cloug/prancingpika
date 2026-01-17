// src/app/(public)/leaderboards/page.tsx
import RaidSection, {
  type RaidSectionData,
} from "@/components/page/public/leaderboards/RaidSection";
import { getLeaderboards } from "@/lib/leaderboards";

function normalizeRaid(r: any, idx: number): RaidSectionData {
  // Case A: r.bosses is an array of objects like:
  // [{ bossName, fastest, comp1, comp2 }, ...]
  if (
    Array.isArray(r?.bosses) &&
    r.bosses.length > 0 &&
    typeof r.bosses[0] === "object" &&
    r.bosses[0] !== null &&
    "bossName" in r.bosses[0]
  ) {
    const bossObjs = r.bosses as any[];

    const bosses = bossObjs.map((b) => String(b?.bossName ?? "Unknown"));

    const fastestByBoss = Object.fromEntries(
      bossObjs.map((b) => [String(b?.bossName ?? "Unknown"), b?.fastest ?? []])
    );

    const comp1ByBoss = Object.fromEntries(
      bossObjs.map((b) => [String(b?.bossName ?? "Unknown"), b?.comp1 ?? null])
    );

    const comp2ByBoss = Object.fromEntries(
      bossObjs.map((b) => [String(b?.bossName ?? "Unknown"), b?.comp2 ?? null])
    );

    return {
      title: String(r?.title ?? `Raid ${idx + 1}`),
      bosses,
      fastestByBoss,
      comp1ByBoss,
      comp2ByBoss,
    };
  }

  // Case B: r already matches our expected structure
  return {
    title: String(r?.title ?? `Raid ${idx + 1}`),
    bosses: Array.isArray(r?.bosses) ? r.bosses.map(String) : [],
    fastestByBoss: r?.fastestByBoss ?? r?.fastest ?? {},
    comp1ByBoss: r?.comp1ByBoss ?? r?.comp1 ?? {},
    comp2ByBoss: r?.comp2ByBoss ?? r?.comp2 ?? {},
  };
}

export default async function LeaderboardsPage() {
  const raw = await getLeaderboards();
  const raids: RaidSectionData[] = (raw ?? []).map(normalizeRaid);

  return (
    <main className="min-h-screen bg-[#1F2B3A] text-zinc-100">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_15%_10%,rgba(56,189,248,0.10),transparent_55%),radial-gradient(1000px_circle_at_85%_15%,rgba(167,139,250,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(31,43,58,0.45),rgba(31,43,58,0.95))]" />
      </div>

      {/* Full width container */}
      <section className="w-full px-4 sm:px-6 lg:px-10 pt-24 pb-14 space-y-16">
        {raids.map((raid, i) => (
          <RaidSection key={`${raid.title}-${i}`} raid={raid} />
        ))}
      </section>
    </main>
  );
}
