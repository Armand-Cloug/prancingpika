// src/components/page/public/leaderboards/RaidSection.tsx
import BossFastestTable from "./BossFastestTable";
import BossCompTable    from "./BossCompTable";
import type { RaidLeaderboard } from "@/lib/leaderboards";

export default function RaidSection({ data }: { data: RaidLeaderboard }) {
  return (
    <section className="mb-14">
      {/* Raid header */}
      <div className="mb-5 flex items-center gap-3">
        <h2
          className="text-xl font-bold text-zinc-100 tracking-tight"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          {data.raid.title}
        </h2>
        <span className="mono text-[10px] text-zinc-600 bg-white/[0.05] border border-white/[0.08]
                         rounded px-2 py-0.5 tracking-wider">
          {data.raid.key}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
      </div>

      <div className="flex flex-col gap-10">
        {data.bosses.map((boss) => (
          <div key={boss.bossName}>
            {/* Boss name sub-header */}
            <p className="mb-3 text-[11px] font-medium text-zinc-500 tracking-widest uppercase mono">
              {boss.bossName}
            </p>

            <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1.6fr 1.6fr" }}>
              {/* Fastest kills */}
              <div>
                <BossFastestTable bossName={boss.bossName} rows={boss.fastest} />
              </div>
              {/* Comps */}
              <div>
                <BossCompTable bossName={boss.bossName} rows={boss.comp1} rankLabel="#1" runId={boss.fastest[0]?.runId ?? ""} />
              </div>
              <div>
                <BossCompTable bossName={boss.bossName} rows={boss.comp2} rankLabel="#2" runId={boss.fastest[1]?.runId ?? ""} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
