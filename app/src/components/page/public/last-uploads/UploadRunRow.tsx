// src/components/page/public/last-uploads/UploadRunRow.tsx
"use client";
import { useState } from "react";
import { formatTime } from "@/lib/format";
import type { LastUploadRun } from "@/lib/last-uploads";
import UploadRunTable from "./UploadRunTable";

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime12(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function UploadRunRow({ run }: { run: LastUploadRun }) {
  const [open, setOpen] = useState(false);
  const total    = formatTime(run.durationS);
  const bossOnly = run.bossDurationS != null ? formatTime(run.bossDurationS) : null;
  const dps      = run.dpsGroup != null ? Math.round(run.dpsGroup).toLocaleString("en-US") : "—";
  const hps      = run.hpsGroup != null ? Math.round(run.hpsGroup).toLocaleString("en-US") : null;
  const aps      = run.apsGroup != null && run.apsGroup > 0
    ? Math.round(run.apsGroup).toLocaleString("en-US") : null;

  return (
    <div className="glass rounded-2xl overflow-hidden glass-hover">
      {/* Card header — clickable to expand */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-5 py-4 flex flex-wrap items-center gap-x-5 gap-y-2"
      >
        {/* Boss name */}
        <div className="min-w-[140px]">
          <p className="text-[10px] text-zinc-600 tracking-wide uppercase mb-0.5">Boss</p>
          <p className="text-[14px] font-bold text-zinc-100" style={{ fontFamily: "'Syne', sans-serif" }}>
            {run.bossName}
          </p>
        </div>

        {/* Guild */}
        <div className="min-w-[120px]">
          <p className="text-[10px] text-zinc-600 tracking-wide uppercase mb-0.5">Guild</p>
          <p className="text-[12px] font-medium text-zinc-300">
            {run.guildName}
            {run.guildTag && (
              <span className="text-zinc-600 ml-1">[{run.guildTag}]</span>
            )}
          </p>
        </div>

        {/* Metrics strip */}
        <div className="flex gap-4 flex-wrap">
          <Metric label="Raid DPS" value={dps} accent="sky" />
          {hps && <Metric label="HPS"      value={hps} accent="teal" />}
          {aps && <Metric label="APS"      value={aps} accent="amber" />}
          <Metric label="Time" value={bossOnly ? `${total} | ${bossOnly}` : total} />
        </div>

        {/* Date + uploader — pushed right */}
        <div className="ml-auto text-right shrink-0">
          <p className="text-[11px] text-zinc-400">{fmtDate(run.createdAt)}</p>
          <p className="text-[10px] text-zinc-600">{fmtTime12(run.createdAt)} · {run.uploaderPseudo}</p>
        </div>

        {/* Chevron */}
        <span className={`ml-2 text-zinc-500 text-[11px] transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
          ▶
        </span>
      </button>

      {/* Expandable table */}
      {open && (
        <div className="px-3 pb-4 border-t border-white/[0.06]">
          <div className="pt-3">
            <UploadRunTable run={run} />
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({
  label, value, accent = "default",
}: {
  label: string;
  value: string;
  accent?: "sky" | "teal" | "amber" | "default";
}) {
  const colors: Record<string, string> = {
    sky:     "stat-sky",
    teal:    "stat-teal",
    amber:   "stat-amber",
    default: "text-zinc-300",
  };
  return (
    <div>
      <p className="text-[9px] text-zinc-600 tracking-wide uppercase mb-0.5">{label}</p>
      <p className={`mono text-[12px] font-semibold ${colors[accent]}`}>{value}</p>
    </div>
  );
}
