// src/app/not-found.tsx
// 404 page – modern, minimal, dark-slate (not black), no "navigation" section.

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#1F2B3A] text-zinc-100">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_10%,rgba(56,189,248,0.12),transparent_55%),radial-gradient(900px_circle_at_85%_20%,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(31,43,58,0.45),rgba(31,43,58,0.92))]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:140px_140px]" />
      </div>

      <section className="mx-auto flex min-h-screen max-w-6xl items-center px-6">
        <div className="w-full">
          <div className="mx-auto max-w-2xl text-center">

            {/* Big 404 */}
            <div className="relative mt-8">
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.18),rgba(56,189,248,0.06),transparent_70%)] blur-2xl" />
              <h1 className="text-7xl font-semibold tracking-tight sm:text-8xl">
                404
              </h1>
            </div>

            <p className="mt-4 text-pretty text-base text-zinc-200/90">
              This page doesn’t exist (or it was moved). If you followed a link, it may be outdated.
            </p>

            {/* Actions */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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

            {/* Subtle card with short text */}
            <div className="mt-10 rounded-2xl border border-white/10 bg-[#253649]/60 p-5 text-left shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
              <p className="text-sm font-medium text-zinc-100">Quick check</p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-200/85">
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/60" />
                  Verify the URL spelling.
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/60" />
                  Go back home and use the menu.
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/60" />
                  If you expected content, the route may not be implemented yet.
                </li>
              </ul>

              <div className="pointer-events-none mx-auto mt-6 h-px w-2/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
