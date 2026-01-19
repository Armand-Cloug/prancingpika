// src/app/work-in-progress/page.tsx
// Mini "Work in progress" page – dark slate theme, simple and clean.

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WorkInProgressPage() {
  return (
    <main className="min-h-screen bg-[#1F2B3A] text-zinc-100">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_10%,rgba(56,189,248,0.12),transparent_55%),radial-gradient(900px_circle_at_85%_20%,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(31,43,58,0.45),rgba(31,43,58,0.92))]" />
      </div>

      <section className="mx-auto flex min-h-screen max-w-6xl items-center px-6">
        <div className="w-full">
          <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-[#253649]/70 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200/90">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              Work in progress
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              This page is being built
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-zinc-200/85">
              The feature exists on the roadmap but isn’t available yet. Check back soon.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-sky-500 text-white hover:bg-sky-400">
                <Link href="/">Back to home</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10"
              >
                <Link href="/leaderboards">Leaderboards</Link>
              </Button>
            </div>

            <div className="pointer-events-none mx-auto mt-6 h-px w-2/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          </div>
        </div>
      </section>
    </main>
  );
}
