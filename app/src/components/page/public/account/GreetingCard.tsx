// src/components/page/public/account/GreetingCard.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadLogForm } from "@/components/forms/UploadLogForm";

type GuildOption = { id: string; name: string; tag: string };

type Props = {
  name: string;
  guilds: GuildOption[];
};

export default function GreetingCard({ name, guilds }: Props) {
  return (
    <Card className="border-white/10 bg-[#253649]/70 backdrop-blur shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl text-zinc-100">Hello, {name}</CardTitle>
        <p className="text-sm text-zinc-200/85">How are you today?</p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Upload box */}
        <UploadLogForm
          guilds={guilds}
          disabled={guilds.length === 0}
          helper={
            guilds.length
              ? "Choose a guild, then upload your .txt combat log (max 200MB)."
              : "Join or create a guild to enable uploads."
          }
        />

        <div className="pointer-events-none mx-auto h-px w-2/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-sky-500 text-white hover:bg-sky-400">
            <Link href="/leaderboards">Go to leaderboards</Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10"
          >
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
