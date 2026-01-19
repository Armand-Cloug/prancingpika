// src/components/navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function MainNav() {
  const pathname = usePathname();
  const { status } = useSession();
  const isAuth = status === "authenticated";

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const itemClass = (href: string) =>
    cn(
      "relative rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap",
      isActive(href)
        ? "text-zinc-50 bg-white/10 ring-1 ring-white/10"
        : "text-zinc-200/70 hover:text-zinc-100 hover:bg-white/5"
    );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#253649]/85 backdrop-blur supports-[backdrop-filter]:bg-[#253649]/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-3">
          <img
            src="/favicon.png"
            alt="PrancingPika"
            width={44}
            height={44}
            className="h-11 w-11 object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
          />

          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-zinc-50">PrancingPika</div>
            <div className="text-[11px] text-zinc-200/60 group-hover:text-zinc-200/80 transition-colors">
              Rift parser & leaderboards
            </div>
          </div>
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-2 md:flex">
          <Link className={itemClass("/")} href="/">
            Home
          </Link>
          <Link className={itemClass("/leaderboards")} href="/leaderboards">
            Leaderboards
          </Link>
          <Link className={itemClass("/top-players")} href="/top-players">
            Top Players
          </Link>
          <Link className={itemClass("/guilds")} href="/guilds">
            Guilds
          </Link>
          <Link className={itemClass("/lookup")} href="/lookup">
            Lookup
          </Link>
          <Link className={itemClass("/last-uploads")} href="/last-uploads">
            Last Uploads
          </Link>
          <Link className={itemClass("/account")} href="/account">
            Account
          </Link>
        </nav>

        {/* Desktop action: Sign in / Sign out */}
        <div className="hidden md:flex items-center gap-3">
          {status === "loading" ? null : isAuth ? (
            <Button
              type="button"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="bg-white/10 text-zinc-100 hover:bg-white/15 border border-white/10"
            >
              Sign out
            </Button>
          ) : (
            <Button asChild size="sm" className="bg-sky-500 text-white hover:bg-sky-400">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Highlight line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      {/* Mobile row (scrollable links + action pinned right) */}
      <div className="md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-3">
          {/* Scroll area for links */}
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link className={itemClass("/")} href="/">
              Home
            </Link>
            <Link className={itemClass("/leaderboards")} href="/leaderboards">
              Leaderboards
            </Link>
            <Link className={itemClass("/top-players")} href="/top-players">
              Top Players
            </Link>
            <Link className={itemClass("/guilds")} href="/guilds">
              Guilds
            </Link>
            <Link className={itemClass("/lookup")} href="/lookup">
              Lookup
            </Link>
            <Link className={itemClass("/last-uploads")} href="/last-uploads">
              Last Uploads
            </Link>
            <Link className={itemClass("/account")} href="/account">
              Account
            </Link>
          </div>

          {/* Action pinned */}
          <div className="shrink-0">
            {status === "loading" ? null : isAuth ? (
              <Button
                type="button"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-white/10 text-zinc-100 hover:bg-white/15 border border-white/10"
              >
                Sign out
              </Button>
            ) : (
              <Button asChild size="sm" className="bg-sky-500 text-white hover:bg-sky-400">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
