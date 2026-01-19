// src/app/(public)/last-uploads/page.tsx
import UploadRunCard from "@/components/page/public/last-uploads/UploadRunCard";
import { getLastUploads } from "@/lib/last-uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function toYMD(iso: string) {
  return iso.slice(0, 10);
}

export default async function LastUploadsPage() {
  const runs = await getLastUploads(10);

  // group by date (YYYY-MM-DD) like the PrancingTurtle screenshot style
  const grouped = runs.reduce<Record<string, typeof runs>>((acc, r) => {
    const k = toYMD(r.createdAt);
    (acc[k] ??= []).push(r);
    return acc;
  }, {});

  const dates = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

  return (
    <main className="min-h-screen bg-[#1F2B3A] text-zinc-100">
      {/* Background (same as leaderboards) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_15%_10%,rgba(56,189,248,0.10),transparent_55%),radial-gradient(1000px_circle_at_85%_15%,rgba(167,139,250,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(31,43,58,0.45),rgba(31,43,58,0.95))]" />
      </div>

      <section className="w-full px-4 sm:px-6 lg:px-10 pt-24 pb-14 space-y-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold tracking-wide text-zinc-100">
              Latest Uploads
            </h1>
            <p className="mt-1 text-[12px] text-zinc-300/70">
              Last 10 boss parses uploaded by players.
            </p>
          </div>
        </div>

        {dates.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-zinc-300/70">
            No uploads yet.
          </div>
        ) : (
          dates.map((d) => (
            <div key={d} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide text-zinc-100">
                  {d}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3 items-stretch">
                {grouped[d].map((run) => (
                  <UploadRunCard key={run.runId} run={run} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
