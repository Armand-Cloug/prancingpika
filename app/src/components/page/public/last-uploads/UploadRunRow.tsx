// src/components/page/public/last-uploads/UploadRunRow.tsx
import { formatTime } from "@/lib/leaderboards";
import type { LastUploadRun } from "@/lib/last-uploads";
import UploadRunTable from "./UploadRunTable";

function ymd(iso: string) {
  return iso.slice(0, 10);
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-[11px] text-zinc-300/65">{label}</div>
      <div className="mt-0.5 text-[13px] font-semibold tabular-nums text-zinc-100">{value}</div>
    </div>
  );
}

export default function UploadRunRow({ run }: { run: LastUploadRun }) {
  const date = ymd(run.createdAt);

  const total = formatTime(run.durationS);
  const bossOnly = run.bossDurationS != null ? formatTime(run.bossDurationS) : null;
  const timeLabel = bossOnly ? `${total} | ${bossOnly}` : `${total}`;

  const guildLabel = run.guildTag ? `${run.guildName} [${run.guildTag}]` : run.guildName;

  return (
    <details className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(700px_circle_at_20%_0%,rgba(56,189,248,0.14),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <summary className="cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
        <div className="px-4 pt-5 pb-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[18px] font-semibold text-zinc-100 truncate">{run.bossName}</div>
              <div className="mt-1 text-[13px] text-sky-200/90 truncate" title={guildLabel}>
                {guildLabel}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-right">
                <div className="text-[11px] text-zinc-300/65">Group</div>
                <div className="mt-0.5 text-[13px] font-semibold tabular-nums text-zinc-100">
                  {run.groupId}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-right">
                <div className="text-[11px] text-zinc-300/65">Date</div>
                <div className="mt-0.5 text-[13px] font-semibold tabular-nums text-zinc-100">
                  {date}
                </div>
              </div>

              <div className="h-10 w-10 grid place-items-center rounded-xl border border-white/10 bg-black/20 transition group-open:rotate-180">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80">
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Big stats row */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <StatPill label="Time" value={timeLabel} />
            <StatPill
              label="Raid DPS"
              value={run.dpsGroup != null ? Math.round(run.dpsGroup).toLocaleString("en-US") : "—"}
            />
            <StatPill
              label="Raid HPS"
              value={run.hpsGroup != null ? Math.round(run.hpsGroup).toLocaleString("en-US") : "—"}
            />
          </div>

          <div className="mt-3 text-[11px] text-zinc-300/55">Click to expand players table.</div>
        </div>
      </summary>

      {/* Expanded */}
      <div className="border-t border-white/10 bg-black/10 px-3 pb-4 pt-4">
        <UploadRunTable run={run} />
      </div>
    </details>
  );
}
