// src/app/(public)/leaderboards/page.tsx
import RaidSection, {
  type RaidSectionData,
} from "@/components/page/public/leaderboards/RaidSection";
import { getLeaderboards } from "@/lib/leaderboards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeRaid(r: unknown, idx: number): RaidSectionData {
  const obj = (r ?? {}) as any;

  // getLeaderboards() returns: [{ raid: { title, bosses }, bosses: [...] }, ...]
  // But we accept older shapes too.
  const raidTitle = obj?.raid?.title ?? obj?.title ?? `Raid ${idx + 1}`;

  // Case A: obj.bosses is an array of objects like:
  // [{ bossName, fastest, comp1, comp2 }, ...]
  if (
    Array.isArray(obj?.bosses) &&
    obj.bosses.length > 0 &&
    typeof obj.bosses[0] === "object" &&
    obj.bosses[0] !== null &&
    "bossName" in obj.bosses[0]
  ) {
    const bossObjs = obj.bosses as any[];

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
      title: String(raidTitle),
      bosses,
      fastestByBoss,
      comp1ByBoss,
      comp2ByBoss,
    };
  }

  // Case B: already in the expected structure
  const bosses =
    Array.isArray(obj?.raid?.bosses)
      ? obj.raid.bosses.map(String)
      : Array.isArray(obj?.bosses)
        ? obj.bosses.map(String)
        : [];

  return {
    title: String(raidTitle),
    bosses,
    fastestByBoss: obj?.fastestByBoss ?? obj?.fastest ?? {},
    comp1ByBoss: obj?.comp1ByBoss ?? obj?.comp1 ?? {},
    comp2ByBoss: obj?.comp2ByBoss ?? obj?.comp2 ?? {},
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
