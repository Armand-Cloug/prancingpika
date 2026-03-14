// src/components/page/public/oldschool/OldSchoolIntro.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OldSchoolIntro() {
  return (
    <Card className="border-white/10 bg-[#253649]/70 backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl text-zinc-100">The Project</CardTitle>
        <p className="text-sm text-zinc-200/85">
          Why go back and what mindset to bring.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-[#1F2B3A]/55 p-4 text-sm text-zinc-200/90 leading-relaxed space-y-3">
          <p>
            The Old School event is straightforward : run{" "}
            <span className="text-zinc-100 font-medium">Bastion of Steel</span> under conditions
            close to the guild&apos;s first raids back in{" "}
            <span className="text-amber-300 font-medium">2018</span>. Same gear, same specs, same
            constraints — or as close as we can get.
          </p>
          <p>
            The goal is to have fun. But also to remember — or discover for the first time — the{" "}
            <span className="text-zinc-100">"real difficulty"</span> BoS represented back then. An era
            that only <span className="text-amber-300">Endless</span> and{" "}
            <span className="text-amber-300">Cloug</span>, among the players still active on the FR
            side, truly experienced. And even then.
          </p>
        </div>

        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
          <p className="text-sm font-medium text-amber-300">Why these rules?</p>
          <p className="mt-2 text-sm text-zinc-200/85 leading-relaxed">
            The game has evolved enormously since 2018. Without any guardrails, an &quot;old
            school&quot; raid would just be a normal BoS with a modern composition. These rules aim
            to recreate a context as faithful as possible to what FR raids were experiencing at the
            time — without going overboard on perfectionism.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}