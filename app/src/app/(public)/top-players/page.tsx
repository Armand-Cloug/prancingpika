// src/app/(public)/top-players/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import TopPlayersClient from "@/components/page/public/top-players/TopPlayersClient";
import { RAIDS } from "@/lib/leaderboards";
import { buildMetadata, getSiteUrl, siteName } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Top Players",
  description:
    "Discover the best DPS players per boss encounter in RIFT — ranked by calling (Warrior, Rogue, Mage, Cleric) from community combat logs.",
  path: "/top-players",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `Top Players – ${siteName}`,
  url: `${getSiteUrl()}/top-players`,
  description: "Best DPS players per boss in RIFT, ranked by calling from community-uploaded combat logs.",
};

export const dynamic = "force-dynamic";

const BOSS_DB_ALIASES: Record<string, string[]> = {
  "Vindicator MK1":        ["Vengeur I", "Vergelter Ausf. 1", "Vindicator", "Vengeur", "Vergelter"],
  "Commandant Isiel":      ["Commander Isiel", "Kommandant Isiel"],
  "Grand-Prêtre Arakhurn": ["Grand-prêtre Arakhurn", "High Priest Arakhurn"],
  "Général Silgen":        ["General Silgen", "Général Silgen (Intrepid)"],
};

export default async function TopPlayersPage() {
  const allBossNames = Array.from(new Set(RAIDS.flatMap((r) => r.bosses)));

  // Expansion des alias : cherche les noms canoniques ET leurs variantes FR/DE
  const expandedNames = allBossNames.flatMap((n) => [n, ...(BOSS_DB_ALIASES[n] ?? [])]);
  const found = await prisma.boss.findMany({
    where: { name: { in: expandedNames } },
    select: { name: true },
  });
  const foundSet = new Set(found.map((b) => b.name));

  // Retourne les noms canoniques (pas les alias) pour les noms qui ont des données en DB
  const bossNames = allBossNames.filter((canonical) =>
    [canonical, ...(BOSS_DB_ALIASES[canonical] ?? [])].some((v) => foundSet.has(v))
  );
  const defaultBoss = bossNames[0] ?? "";

  return (
    <div className="mx-auto max-w-7xl 2xl:max-w-[1600px] px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.2em] text-sky-400/70 font-medium uppercase mb-2">
          Rankings
        </p>
        <h1 className="text-4xl font-bold text-gradient tracking-tight">
          Top Players
        </h1>
        <p className="mt-2 text-[13px] text-zinc-500">
          Best DPS per boss, per calling
        </p>
      </div>
      <TopPlayersClient bosses={bossNames} defaultBoss={defaultBoss} />
    </div>
  );
}
