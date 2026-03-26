// src/app/(public)/lookup/page.tsx
import type { Metadata } from "next";
import LookupClient from "@/components/page/public/lookup/LookupClient";
import { buildMetadata, getSiteUrl, siteName } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Player Lookup",
  description:
    "Search any RIFT player by name to view their full combat log history — boss kills, DPS scores, specs played, and run details across all sessions.",
  path: "/lookup",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `Player Lookup – ${siteName}`,
  url: `${getSiteUrl()}/lookup`,
  description: "Search RIFT players by name to view full parse history, DPS scores, and spec details.",
};

export default function LookupPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.2em] text-sky-400/70 font-medium uppercase mb-2">Search</p>
        <h1 className="text-4xl font-bold text-gradient tracking-tight">Player Lookup</h1>
        <p className="mt-2 text-[13px] text-zinc-500">Search a player&apos;s full run history</p>
      </div>
      <LookupClient />
    </div>
  );
}
