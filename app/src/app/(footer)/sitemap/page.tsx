// src/app/(footer)/sitemap/page.tsx
// Human-readable HTML sitemap (not the XML /sitemap.xml).
import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata, getSiteUrl, siteName } from "@/lib/seo";
import LegalLayout, { LegalSection } from "@/components/page/footer/LegalLayout";

export const metadata: Metadata = buildMetadata({
  title: "Site Map",
  description:
    "Human-readable site map for PrancingPika — a structured overview of all available pages.",
  path: "/sitemap",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `Site Map – ${siteName}`,
  url: `${getSiteUrl()}/sitemap`,
  description: "HTML site map for PrancingPika.",
};

type SitemapSection = {
  title: string;
  links: { href: string; label: string; description: string }[];
};

const sections: SitemapSection[] = [
  {
    title: "Main Navigation",
    links: [
      {
        href: "/",
        label: "Home",
        description:
          "Landing page — overview of the service, global stats, and quick access to key features.",
      },
      {
        href: "/leaderboard",
        label: "Leaderboard",
        description:
          "DPS/HPS rankings by boss, specialization, and guild for RIFT encounters.",
      },
      {
        href: "/upload",
        label: "Upload a log",
        description:
          "Upload a combat.log file to analyse your group's performance and submit it to the leaderboard.",
      },
      {
        href: "/profile",
        label: "My profile",
        description:
          "View your player profile, personal statistics, and guild membership.",
      },
    ],
  },
  {
    title: "Community",
    links: [
      {
        href: "/rules",
        label: "Rules",
        description:
          "Logging requirements, fair-play guidelines, and encounter detection rules for uploads.",
      },
    ],
  },
  {
    title: "Legal & Information",
    links: [
      {
        href: "/legal",
        label: "Legal Notice",
        description:
          "Mandatory legal disclosures: publisher identity regime, hosting provider, and intellectual property (French LCEN).",
      },
      {
        href: "/privacy",
        label: "Privacy Policy",
        description:
          "Data collected, legal bases, retention periods, and your GDPR rights.",
      },
      {
        href: "/accessibility",
        label: "Accessibility",
        description:
          "RGAA v4.1 accessibility statement — conformity level and known non-conformities.",
      },
      {
        href: "/sitemap",
        label: "Site Map",
        description:
          "This page — a structured list of all pages available on PrancingPika.",
      },
    ],
  },
];

export default function SiteMapPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <LegalLayout
        eyebrow="Navigation"
        title="Site Map"
        subtitle="All PrancingPika pages at a glance."
        lastUpdated="March 2025"
      >
        <nav aria-label="Site map">
          {sections.map((section) => (
            <LegalSection
              key={section.title}
              id={section.title.toLowerCase().replace(/\s+/g, "-")}
              title={section.title}
            >
              <ul className="flex flex-col gap-3">
                {section.links.map(({ href, label, description }) => (
                  <li key={href} className="flex items-start gap-3">
                    <span
                      className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50"
                      aria-hidden="true"
                    />
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <Link
                          href={href}
                          className="text-[13px] font-medium text-sky-400/90 hover:text-sky-400 underline underline-offset-4 transition-colors"
                        >
                          {label}
                        </Link>
                        <span
                          className="text-[11px] text-zinc-600"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {href}
                        </span>
                      </div>
                      <p className="text-[12px] text-zinc-500 leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </LegalSection>
          ))}
        </nav>
      </LegalLayout>
    </>
  );
}
