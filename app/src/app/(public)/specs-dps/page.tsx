// src/app/(public)/specs-dps/page.tsx
import type { Metadata } from "next";
import { getAvailableSpecs } from "@/lib/specs-dps";
import { RAIDS } from "@/lib/leaderboards";
import SpecsDpsClient from "@/components/page/public/specs-dps/SpecsDpsClient";
import { buildMetadata, getSiteUrl, siteName } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Specs DPS",
  description:
    "Compare top DPS by spec in RIFT — browse the 10 highest-scoring parses per boss for any available spec, sourced from community combat logs.",
  path: "/specs-dps",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `Specs DPS – ${siteName}`,
  url: `${getSiteUrl()}/specs-dps`,
  description: "Top 10 DPS parses per spec per boss in RIFT, from community-uploaded combat logs.",
};

export default async function SpecsDpsPage() {
  const specs = await getAvailableSpecs();

  return (
    <div className="mx-auto max-w-7xl 2xl:max-w-[1600px] px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.2em] text-sky-400/70 font-medium uppercase mb-2">
          Rankings
        </p>
        <h1 className="text-4xl font-bold text-gradient tracking-tight">
          Specs DPS
        </h1>
        <p className="mt-2 text-[13px] text-zinc-500">
          Top 10 DPS per boss for a given spec
        </p>
      </div>
      <SpecsDpsClient specs={specs} raids={RAIDS} />
    </div>
  );
}
