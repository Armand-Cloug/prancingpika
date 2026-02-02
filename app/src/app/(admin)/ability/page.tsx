// src/app/ability/page.tsx
"use client";

import { useMemo, useState } from "react";
import { ABILITY_ICON_RULES, getAbilityIconUrl } from "@/lib/ability-icons";

export default function AbilityIconsPage() {
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  const rows = useMemo(() => {
    return [...ABILITY_ICON_RULES].sort((a, b) => a.key.localeCompare(b.key));
  }, []);

  return (
    <main className="min-h-screen bg-[#0b1220] text-zinc-100 p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-xl font-semibold">Ability Icons</h1>
        <p className="mt-1 text-sm text-zinc-300/70">
          Images attendues dans <code className="text-zinc-200">public/abilities/&lt;key&gt;.png</code>
        </p>

        <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-black/25">
          <table className="w-full table-auto text-sm">
            <colgroup>
              <col className="w-[80px]" />
              <col className="w-[220px]" />
              <col />
            </colgroup>

            <thead className="bg-[#0b1220]/70 text-[12px] text-zinc-300/70">
              <tr className="border-b border-white/10">
                <th className="py-2 px-3 text-left font-medium">Icône</th>
                <th className="py-2 px-3 text-left font-medium">Key</th>
                <th className="py-2 px-3 text-left font-medium">Aliases</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="py-3 px-3 text-zinc-300/70" colSpan={3}>
                    Aucune compétence dans ABILITY_ICON_RULES.
                  </td>
                </tr>
              ) : (
                rows.map((rule) => {
                  const url = getAbilityIconUrl(rule.key);
                  const isFailed = !!failed[rule.key];

                  return (
                    <tr key={rule.key} className="border-b border-white/5 last:border-0">
                      <td className="py-2 px-3">
                        <div className="h-10 w-10 rounded-md border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                          {url && !isFailed ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={url}
                              alt={rule.key}
                              className="h-10 w-10 object-cover"
                              onError={() => setFailed((p) => ({ ...p, [rule.key]: true }))}
                            />
                          ) : (
                            <div className="text-[10px] text-zinc-300/50 px-1 text-center leading-tight">
                              no
                              <br />
                              img
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-2 px-3 font-mono text-[13px] text-zinc-200">{rule.key}</td>

                      <td className="py-2 px-3 text-zinc-200/90">
                        <div className="flex flex-wrap gap-2">
                          {rule.aliases.map((a) => (
                            <span
                              key={`${rule.key}:${a}`}
                              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[12px] text-zinc-200/90"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
