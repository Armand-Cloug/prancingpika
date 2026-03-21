// src/components/forms/UploadLogForm.tsx
"use client";
import { useState } from "react";

type GuildOption = { id: string; name: string; tag: string };

type UploadResult = {
  ok: boolean;
  file?: { fileName: string; fileSize: number };
  parser?: {
    ok: boolean;
    fightsDetected: number;
    runsInserted: number;
    runsSkipped: number;
    message: string;
  } | null;
  guild?: { name: string; tag?: string | null };
  error?: string;
  message?: string;
};

export default function UploadLogForm({
  guilds,
  disabled = false,
  helper,
}: {
  guilds: GuildOption[];
  disabled?: boolean;
  helper?: string;
}) {
  const [selectedGuildId, setSelectedGuildId] = useState(guilds[0]?.id ?? "");
  const [file, setFile]     = useState<File | null>(null);
  const [date, setDate]     = useState("");
  const [label, setLabel]   = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<UploadResult | null>(null);
  const [drag, setDrag]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true); setResult(null);

    const fd = new FormData();
    fd.append("file",    file);
    fd.append("guildId", selectedGuildId);
    if (date)  fd.append("logDate", date);
    if (label) fd.append("label",   label);

    try {
      const res  = await fetch("/api/public/upload", { method: "POST", body: fd });
      const json = await res.json();
      setResult(json);
    } catch (e) {
      setResult({ ok: false, error: String(e) });
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  const bytes = file ? (file.size / 1024 / 1024).toFixed(2) + " MB" : null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Helper text */}
      {helper && (
        <p className="text-[12px] text-zinc-500">{helper}</p>
      )}

      {/* Guild selector */}
      {guilds.length > 1 && (
        <div>
          <label className="block text-[11px] text-zinc-600 mb-1.5 tracking-wide uppercase">
            Guild
          </label>
          <select
            value={selectedGuildId}
            onChange={(e) => setSelectedGuildId(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 text-[13px] rounded-xl glass text-zinc-300
                       border border-white/[0.08] focus:border-sky-500/40 focus:outline-none
                       transition-colors bg-transparent disabled:opacity-40"
          >
            {guilds.map((g) => (
              <option key={g.id} value={g.id} className="bg-zinc-900">
                {g.tag ? `[${g.tag}] ` : ""}{g.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("log-file-input")?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all
                    ${drag
                      ? "border-sky-400/60 bg-sky-400/5"
                      : "border-white/[0.12] hover:border-white/[0.2] hover:bg-white/[0.02]"}`}
      >
        <input
          id="log-file-input"
          type="file"
          accept=".txt,.log"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div>
            <p className="text-[14px] font-semibold text-zinc-200">{file.name}</p>
            <p className="mt-1 mono text-[11px] text-zinc-500">{bytes}</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="mt-2 text-[11px] text-zinc-600 hover:text-zinc-400 underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <p className="text-[13px] text-zinc-400">
              Drop your <span className="text-zinc-200 font-medium">.txt</span> combat log here, or click to browse
            </p>
            <p className="mt-1 text-[11px] text-zinc-600">Max 200 MB</p>
          </div>
        )}
      </div>

      {/* Optional fields */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-[11px] text-zinc-600 mb-1.5 tracking-wide uppercase">
            Log date <span className="text-zinc-700">(optional)</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-[13px] rounded-xl glass text-zinc-300
                       border border-white/[0.08] focus:border-sky-500/40 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] text-zinc-600 mb-1.5 tracking-wide uppercase">
            Raid label <span className="text-zinc-700">(optional)</span>
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Tuesday raid"
            className="w-full px-3 py-2 text-[13px] rounded-xl glass text-zinc-300 placeholder-zinc-700
                       border border-white/[0.08] focus:border-sky-500/40 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={disabled || !file || loading}
        className="w-full py-3 text-[13px] font-semibold rounded-xl btn-sky disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Uploading &amp; parsing…
          </>
        ) : "Upload &amp; Parse"}
      </button>

      {/* Result */}
      {result && (
        <div className={`rounded-xl px-4 py-4 border text-[13px] ${
          result.ok
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
            : "bg-red-500/10 border-red-500/20 text-red-300"
        }`}>
          {result.ok ? (
            <div className="flex flex-col gap-2">
              <p className="font-semibold">✅ Upload successful</p>
              {result.file && (
                <p className="text-[11px] text-emerald-300/70 mono">{result.file.fileName}</p>
              )}
              {result.parser && (
                <div className="flex flex-wrap gap-3 mt-1">
                  <Chip label="Fights" value={String(result.parser.fightsDetected)} />
                  <Chip label="Inserted" value={String(result.parser.runsInserted)} />
                  {result.parser.runsSkipped > 0 && (
                    <Chip label="Skipped" value={String(result.parser.runsSkipped)} />
                  )}
                </div>
              )}
              {result.parser && !result.parser.ok && (
                <p className="text-[11px] text-amber-400/80 mt-1">{result.parser.message}</p>
              )}
            </div>
          ) : (
            <p>❌ {result.message ?? result.error ?? "Unknown error"}</p>
          )}
        </div>
      )}
    </form>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px]">
      <span className="text-emerald-300/60">{label}:</span>
      <span className="mono font-bold text-emerald-200">{value}</span>
    </span>
  );
}
