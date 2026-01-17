// src/components/page/public/rules/ModerationCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ModerationCard() {
  return (
    <Card className="border-white/10 bg-[#253649]/70 backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl text-zinc-100">Moderation</CardTitle>
        <p className="text-sm text-zinc-200/85">
          Fair play enforcement — transparent actions, consistent rules, and an open Discord for discussion.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-[#1F2B3A]/55 p-4 text-sm text-zinc-200/90 leading-relaxed">
          <p>
            If rules are not respected, moderation is progressive and aims to keep the leaderboards clean
            without punishing honest mistakes.
          </p>

          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-sm font-medium text-zinc-100">What happens when rules are broken</p>

            <ul className="mt-2 space-y-2 text-sm text-zinc-200/90">
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-400" />
                First step: suspicious or non-compliant scores can be removed from public leaderboards.
              </li>

              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-400" />
                If it continues: the uploader account can be banned from uploading.
              </li>

              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-400" />
                Severe or repeated abuse: actions can target the offending in-game character (IG player) involved
                in the manipulation/abuse.
              </li>
            </ul>
          </div>

          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-sm font-medium text-zinc-100">Impartiality</p>
            <p className="mt-2 text-sm text-zinc-200/85 leading-relaxed">
              I’m impartial. Even if I play in raids myself, the goal is never to boost one guild over another.
              This project exists to bring back a baseline of competitiveness and trust across all raids.
            </p>
          </div>

          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-sm font-medium text-zinc-100">Need to discuss a decision?</p>
            <p className="mt-2 text-sm text-zinc-200/85 leading-relaxed">
              If you think something was misclassified, or you want to contest a removal, my Discord is open.
              We can review the context together and keep things fair for everyone.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
