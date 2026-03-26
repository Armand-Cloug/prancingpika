// src/app/(public)/leaderboards/page.tsx
import type { Metadata } from "next";
import RaidSection    from "@/components/page/public/leaderboards/RaidSection";
import { getLeaderboards } from "@/lib/leaderboards";
import { buildMetadata, getSiteUrl, siteName } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Leaderboards",
  description:
    "Browse RIFT boss kill leaderboards — fastest raid clears and top DPS compositions per encounter, updated as new logs are parsed.",
  path: "/leaderboards",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `Leaderboards – ${siteName}`,
  url: `${getSiteUrl()}/leaderboards`,
  description: "RIFT boss kill leaderboards — fastest raid clears and top DPS compositions per encounter.",
};

export default async function LeaderboardsPage() {
  const raids = await getLeaderboards();

  return (
    <div className="mx-auto max-w-7xl 2xl:max-w-[1600px] px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Page header */}
      <div className="mb-10">
        <p className="text-[10px] tracking-[0.2em] text-sky-400/70 font-medium uppercase mb-2">
          Rankings
        </p>
        <h1 className="text-4xl font-bold text-gradient tracking-tight">
          Leaderboards
        </h1>
        <p className="mt-2 text-[13px] text-zinc-500">
          Fastest kills &amp; best raid compositions per boss
        </p>
      </div>

      {raids.map((raid) => (
        <RaidSection key={raid.raid.key} data={raid} />
      ))}
    </div>
  );
}
