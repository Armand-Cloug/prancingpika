import UploadRunRow from "@/components/page/public/last-uploads/UploadRunRow";
import { getLastUploads } from "@/lib/last-uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LastUploadsPage() {
  const runs = await getLastUploads(20);

  return (
    <main className="min-h-screen bg-[#1F2B3A] text-zinc-100">
      {/* Background (same as leaderboards) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_15%_10%,rgba(56,189,248,0.10),transparent_55%),radial-gradient(1000px_circle_at_85%_15%,rgba(167,139,250,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(31,43,58,0.45),rgba(31,43,58,0.95))]" />
      </div>

      <section className="w-full px-4 sm:px-6 lg:px-10 pt-24 pb-14 space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold tracking-wide text-zinc-100">Latest Uploads</h1>
            <p className="mt-1 text-[12px] text-zinc-300/70">Last 20 boss parses uploaded by players.</p>
          </div>
        </div>

        {runs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-zinc-300/70">
            No uploads yet.
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <UploadRunRow key={run.runId} run={run} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
