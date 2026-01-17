// src/components/footer.tsx
'use client';

import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/10 bg-[#253649]/80 text-zinc-200 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        {/* Links */}
        <nav aria-label="Footer links">
          <ul className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-center md:gap-8">
            <li>
              <Link
                href="/legal-notice"
                className="text-sm text-zinc-200/80 underline-offset-4 hover:text-zinc-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
              >
                Legal notice
              </Link>
            </li>

            <li>
              <Link
                href="/privacy"
                className="text-sm text-zinc-200/80 underline-offset-4 hover:text-zinc-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
              >
                Privacy policy
              </Link>
            </li>

            <li>
              <Link
                href="/accessibility"
                className="text-sm text-zinc-200/80 underline-offset-4 hover:text-zinc-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
              >
                Accessibility
              </Link>
            </li>

            <li>
              <Link
                href="/sitemap"
                className="text-sm text-zinc-200/80 underline-offset-4 hover:text-zinc-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
              >
                Sitemap
              </Link>
            </li>
          </ul>
        </nav>

        {/* Separator */}
        <div className="mt-5 border-t border-white/10" />

        {/* Copyright */}
        <p className="mt-4 text-center text-xs text-zinc-200/60">
          © {year} PrancingPika — All rights reserved — By{" "}
          <Link
            href="https://github.com/Armand-Cloug"
            target="_blank"
            className="text-zinc-200/75 underline-offset-4 hover:text-zinc-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
          >
            Cloug
          </Link>
        </p>

        {/* Subtle highlight line */}
        <div className="pointer-events-none mx-auto mt-5 h-px w-2/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      </div>
    </footer>
  );
}
