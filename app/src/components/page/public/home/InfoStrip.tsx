// src/components/page/public/home/InfoStrip.tsx
export default function InfoStrip() {
  return (
    <>
      <div className="rounded-xl border border-white/10 bg-[#2A3B4F]/70 px-4 py-3 text-sm text-zinc-200/90">
        <span className="font-medium text-zinc-100">Info:</span>{" "}
        Leaderboards update periodically when new parses are found. If something looks off, check the
        rules below and the help page.
        <br />
        If you think there's an issue, please reach out on Discord.
      </div>

      <div className="rounded-xl border border-white/10 bg-[#2A3B4F]/70 px-4 py-3 text-sm text-zinc-200/90">
        <span className="font-medium text-zinc-100">Dev Info :</span>{" "}
        This is a new version with a brand new log parser. Some features from the old site are
        missing and will be added back over time. Some other will never be added. Know that an 
        anti cheat is in place, so if you Sessions never shows up, it's probably because something 
        was detected. I'm really open to discuss if you thinks a mistake have been made. READ THE RULES !
      </div>

      <div className="rounded-xl border border-white/10 bg-[#2A3B4F]/70 px-4 py-3 text-sm text-zinc-200/90">
        <span className="font-medium text-zinc-100">Parser Info :</span>{" "}
          <p>
            The parser is new and it comes with an anti-cheat system. Please be patient and a bit forgiving
            while it’s being tuned — and don’t hesitate to ask why a run didn’t show up.
          </p>
          <p><strong>A few important notes :</strong></p>
          <ul>
            <li>
              - Large “ninja pulls” (more than ~3 seconds before the real pull) can break the timing, ruin your
              parse, and may trigger the anti-cheat.
            </li>
            <li>
              - Pulling a lot of adds and killing the boss with them (without a wipe/reset) can confuse encounter
              detection. In that case, the parser may not recognize the exact fight window and can set the
              combat aside.
            </li>
          </ul>
          <p>
            If you think your run was flagged incorrectly, reach out and we’ll review it together.
          </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#2A3B4F]/70 px-4 py-3 text-sm text-zinc-200/90">
        <span className="font-medium text-zinc-100">Special War Info :</span>{" "}
        The double eternal weapon proc is not counted as an abuse at the moment, so you can use it to boost you dps and heal.
        However, using third party tools to automate the proc or gain an unfair advantage is strictly prohibited and will result in a ban.
      </div>
    </>
  );
}
