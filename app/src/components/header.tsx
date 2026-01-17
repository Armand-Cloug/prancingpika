// src/components/header.tsx
'use client';

import Link from "next/link";
import { useSession } from "next-auth/react";

import MainNav from "./navbar";

export default function Header() {
  const { data: session, status } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  return (
    <header
      className="
        fixed top-0 left-0 right-0 z-50
        border-b border-white/10
        bg-black/40 backdrop-blur
        supports-[backdrop-filter]:bg-black/30
      "
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Left */}
        <div className="flex items-center gap-4">
          <MainNav />
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Admin (only for admins) */}
          {status === "authenticated" && isAdmin && (
            <Link
              href="/admin"
              aria-label="Admin area"
              title="Admin"
              className="
                inline-flex h-9 w-9 items-center justify-center rounded-xl
                border border-white/10 bg-white/5
                text-zinc-200 transition-colors
                hover:bg-white/10 hover:text-zinc-50
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60
              "
            >
            </Link>
          )}
        </div>
      </div>

      {/* Rift glow line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-400/35 to-transparent shadow-[0_0_18px_rgba(167,139,250,0.30)]" />
    </header>
  );
}
