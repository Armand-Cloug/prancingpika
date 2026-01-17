// src/components/page/public/leaderboards/RaidSection.tsx
import BossCompTable from "./BossCompTable";
import BossFastestTable from "./BossFastestTable";
import type { CompEntry, FastestEntry } from "@/lib/leaderboards";

export type RaidSectionData = {
  title: string;
  bosses: Array<string | { bossName: string }>;
  fastestByBoss?: Record<string, FastestEntry[]>;
  comp1ByBoss?: Record<string, CompEntry[] | null>;
  comp2ByBoss?: Record<string, CompEntry[] | null>;
};

function normalizeBossName(b: string | { bossName: string }) {
  if (typeof b === "string") return b;
  if (b && typeof b === "object" && "bossName" in b) return String(b.bossName);
  return "Unknown";
}

export default function RaidSection({ raid }: { raid: RaidSectionData }) {
  const bosses = Array.isArray(raid.bosses) ? raid.bosses.map(normalizeBossName) : [];

  const fastest = raid.fastestByBoss ?? {};
  const comp1 = raid.comp1ByBoss ?? {};
  const comp2 = raid.comp2ByBoss ?? {};

  return (
    <section className="w-full">
      {/* Fastest */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-100">
          {raid.title} — Fastest Kills
        </h2>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4 items-stretch">
        {bosses.map((boss, i) => (
          <BossFastestTable
            key={`fast-${raid.title}-${i}-${boss}`}
            bossName={boss}
            rows={fastest[boss] ?? []}
          />
        ))}
      </div>

      {/* Comp #1 */}
      <div className="mt-10 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-zinc-100">
          Record Kill Raid Comps — Rank #1
        </h3>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4 items-stretch">
        {bosses.map((boss, i) => (
          <BossCompTable
            key={`c1-${raid.title}-${i}-${boss}`}
            bossName={boss}
            rows={comp1[boss] ?? null}
            rankLabel="#1"
          />
        ))}
      </div>

      {/* Comp #2 */}
      <div className="mt-10 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-zinc-100">
          Record Kill Raid Comps — Rank #2
        </h3>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4 items-stretch">
        {bosses.map((boss, i) => (
          <BossCompTable
            key={`c2-${raid.title}-${i}-${boss}`}
            bossName={boss}
            rows={comp2[boss] ?? null}
            rankLabel="#2"
          />
        ))}
      </div>
    </section>
  );
}
