// src/app/(public)/rules/page.tsx
export default function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.2em] text-sky-400/70 font-medium uppercase mb-2">Guidelines</p>
        <h1 className="text-4xl font-bold text-gradient tracking-tight">Rules</h1>
        <p className="mt-2 text-[13px] text-zinc-500">Keep it fair. Keep it clean.</p>
      </div>

      <div className="flex flex-col gap-5">
        {[
          {
            title: "Logging",
            rules: [
              "Use /combatlog (standard) or /combatlogexpanded (expanded, millisecond-accurate)",
              "Log files must be .txt format — maximum 200 MB",
              "Only upload your own guild's parses",
            ],
          },
          {
            title: "Fair play",
            rules: [
              "No third-party tools that automate buffs, procs, or otherwise inflate metrics",
              "The double eternal weapon proc is currently allowed — automation of the proc is not",
              "Anti-cheat is active. Flagged runs are silently set aside for review",
            ],
          },
          {
            title: "Pull rules",
            rules: [
              "Large ninja pulls (3s+ before the real pull) can confuse encounter detection",
              "Pulling large waves of adds without a wipe may affect boss window detection",
              "If you think a run was incorrectly flagged, reach out on Discord",
            ],
          },
          {
            title: "Guilds & regions",
            rules: [
              "Guild name format: [EU] GuildName or [NA] GuildName for correct region flags",
              "Currently only the guild creator can upload parses (member invites coming soon)",
            ],
          },
        ].map(({ title, rules }) => (
          <div key={title} className="glass rounded-2xl p-5">
            <h2 className="text-[15px] font-bold text-zinc-100 mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
              {title}
            </h2>
            <ul className="flex flex-col gap-2">
              {rules.map((r, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px] text-zinc-400">
                  <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
