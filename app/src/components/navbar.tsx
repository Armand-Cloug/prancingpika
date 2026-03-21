// src/components/navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/",              label: "Home"         },
  { href: "/leaderboards",  label: "Leaderboards" },
  { href: "/top-players",   label: "Top Players"  },
  { href: "/guilds",        label: "Guilds"       },
  { href: "/lookup",        label: "Lookup"       },
  { href: "/last-uploads",  label: "Last Uploads" },
  { href: "/account",       label: "Account"      },
];

export default function MainNav() {
  const pathname  = usePathname();
  const { status } = useSession();
  const isAuth    = status === "authenticated";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const linkClass = (href: string) =>
    cn(
      "nav-underline relative px-1 py-1.5 text-[13px] font-medium transition-colors duration-150 whitespace-nowrap",
      isActive(href)
        ? "text-zinc-50 active"
        : "text-zinc-400 hover:text-zinc-200"
    );

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-[72px]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0d1520]/80 backdrop-blur-xl border-b border-white/[0.06]" />

      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" />

      <div className="relative h-full mx-auto max-w-7xl px-6 flex items-center justify-between gap-4">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="relative">
            <img
              src="/favicon.png"
              alt="PrancingPika"
              width={36}
              height={36}
              className="h-9 w-9 object-contain drop-shadow-lg transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute -inset-1 rounded-full bg-sky-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-bold text-zinc-50 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              PrancingPika
            </div>
            <div className="text-[10px] text-zinc-500 group-hover:text-zinc-400 transition-colors">
              Rift parser &amp; leaderboards
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={linkClass(href)}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth action */}
        <div className="hidden md:flex items-center shrink-0">
          {status === "loading" ? (
            <div className="h-8 w-20 rounded-lg bg-white/5 animate-pulse" />
          ) : isAuth ? (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-4 py-1.5 text-[12px] font-medium rounded-lg bg-white/6 text-zinc-300 border border-white/10
                         hover:bg-white/10 hover:text-zinc-100 hover:border-white/15 transition-all duration-150"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/sign-in"
              className="px-4 py-1.5 text-[12px] font-semibold rounded-lg btn-sky"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile scrollable links */}
        <div className="md:hidden flex-1 flex items-center gap-4 overflow-x-auto min-w-0
                        [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={linkClass(href)}>
              {label}
            </Link>
          ))}
        </div>

        {/* Mobile auth */}
        <div className="md:hidden shrink-0">
          {isAuth ? (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-white/6 text-zinc-300 border border-white/10"
            >
              Sign out
            </button>
          ) : (
            <Link href="/sign-in" className="px-3 py-1.5 text-[11px] font-semibold rounded-lg btn-sky">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
