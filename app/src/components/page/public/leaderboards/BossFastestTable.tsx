// src/components/page/public/leaderboards/BossFastestTable.tsx
import GroupDpsDialog from "@/components/forms/GroupDpsDialog";
import { formatTime } from "@/lib/format";
import type { FastestEntry } from "@/lib/leaderboards";

function parseGuildName(raw: string): { flag: string; name: string; tag?: string } {
  const s = (raw ?? "").trimStart();
  const m = s.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (!m) return { flag: "🌐", name: s };
  const tag = String(m[1] ?? "").toUpperCase().replace(/[^A-Z]/g, "");
  const name = String(m[2] ?? "").trim() || s;
  if (tag === "EU") return { flag: "🇪🇺", name, tag };
  if (tag === "NA") return { flag: "🇺🇸", name, tag };
  return { flag: "🌐", name };
}

export default function BossFastestTable({
  bossName,
  rows,
}: {
  bossName: string;
  rows: FastestEntry[];
}) {
  const hasBossTime = rows.some((r) => r.bossDurationS != null);

  return (
    <div className="relative overflow-hidden rounded-2xl glass h-full">
      {/* Top accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20
                      bg-[radial-gradient(ellipse_600px_circle_at_30%_0%,rgba(56,189,248,0.1),transparent_60%)]" />

      {/* Header */}
      <div className="flex items-baseline justify-between px-5 pt-5 pb-2">
        <h3 className="text-[13px] font-bold text-zinc-100" style={{ fontFamily: "'Syne', sans-serif" }}>
          {bossName}
        </h3>
        <span className="text-[10px] text-zinc-500 tracking-wide uppercase">Fastest kills</span>
      </div>

      {/* Table */}
      <div className="px-3 pb-4">
        <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-black/20">
          <table className="w-full table-fixed text-[11.5px] 2xl:text-[13px] min-w-[260px]">
            <colgroup>
              <col />
              <col className="w-[84px]" />
              <col className={hasBossTime ? "w-[108px]" : "w-[60px]"} />
            </colgroup>
            <thead>
              <tr className="border-b border-white/[0.07] bg-black/20">
                <th className="py-2 pl-4 pr-2 text-left text-[10px] 2xl:text-[11px] font-medium text-zinc-500 tracking-wide uppercase">
                  Guild
                </th>
                <th className="py-2 px-3 text-right text-[10px] 2xl:text-[11px] font-medium text-zinc-500 tracking-wide uppercase whitespace-nowrap">
                  Raid DPS
                </th>
                <th className="py-2 pl-3 pr-4 text-right text-[10px] 2xl:text-[11px] font-medium text-zinc-500 tracking-wide uppercase whitespace-nowrap">
                  {hasBossTime ? "Total | Boss" : "Time"}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 pl-4 text-[11px] text-zinc-600">
                    No data yet
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => {
                  const { flag, name, tag } = parseGuildName(String(r.guildName ?? ""));
                  const total    = formatTime(r.durationS);
                  const bossOnly = r.bossDurationS != null ? formatTime(r.bossDurationS) : null;

                  return (
                    <tr key={`${r.runId}-${i}`} className="tr-hover border-b border-white/[0.05] last:border-0">
                      <td className="py-2 pl-4 pr-2 min-w-0">
                        <GroupDpsDialog
                          runId={String(r.runId)}
                          trigger={
                            <button type="button" className="w-full text-left min-w-0 block">
                              <span className="truncate flex items-center gap-1.5">
                                <span className="text-xs" aria-hidden>{flag}</span>
                                <span className="text-sky-300/90 hover:text-sky-200 hover:underline truncate">
                                  {name}
                                </span>
                              </span>
                            </button>
                          }
                        />
                      </td>
                      <td className="py-2 px-3 text-right mono text-zinc-300 whitespace-nowrap">
                        {r.dpsGroup != null ? Math.round(r.dpsGroup).toLocaleString("en-US") : "—"}
                      </td>
                      <td className="py-2 pl-3 pr-4 text-right mono whitespace-nowrap">
                        <span className="text-zinc-200">{total}</span>
                        {bossOnly && (
                          <>
                            <span className="mx-1 text-zinc-600">|</span>
                            <span className="text-sky-300/80">{bossOnly}</span>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10px] text-zinc-600">1 entry per guild · Top 10</p>
      </div>
    </div>
  );
}
