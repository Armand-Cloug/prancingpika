// src/app/(public)/leaderboards/page.tsx
import RaidSection    from "@/components/page/public/leaderboards/RaidSection";
import { getLeaderboards } from "@/lib/leaderboards";

export const revalidate = 60;

export default async function LeaderboardsPage() {
  const raids = await getLeaderboards();

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Page header */}
      <div className="mb-10">
        <p className="text-[10px] tracking-[0.2em] text-sky-400/70 font-medium uppercase mb-2">
          Rankings
        </p>
        <h1 className="text-4xl font-bold text-gradient tracking-tight">
          Leaderboards
        </h1>
        <p className="mt-2 text-[13px] text-zinc-500">
          Fastest kills &amp; best raid compositions per boss
        </p>
      </div>

      {raids.map((raid) => (
        <RaidSection key={raid.raid.key} data={raid} />
      ))}
    </div>
  );
}
