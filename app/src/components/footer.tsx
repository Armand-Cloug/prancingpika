// src/components/footer.tsx
"use client";
import Link from "next/link";

const LINKS = [
  { href: "/legal-notice",    label: "Legal notice"    },
  { href: "/privacy-policy",  label: "Privacy policy"  },
  { href: "/accessibility",   label: "Accessibility"   },
  { href: "/sitemap",         label: "Sitemap"         },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/[0.06] bg-[#0d1520]/60 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col items-center gap-5">

          {/* Brand tiny */}
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="" width={20} height={20} className="h-5 w-5 opacity-60" />
            <span className="text-[11px] font-semibold text-zinc-500 tracking-wide" style={{ fontFamily: "'Syne', sans-serif" }}>
              PrancingPika
            </span>
          </div>

          {/* Nav links */}
          <nav>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors underline-offset-4 hover:underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Separator */}
          <div className="w-48 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Copyright */}
          <p className="text-[10px] text-zinc-600">
            © {year} PrancingPika — All rights reserved —{" "}
            <Link
              href="https://github.com/Armand-Cloug"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-300 underline-offset-4 hover:underline transition-colors"
            >
              By Cloug
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
