// src/app/(footer)/legal/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata, getSiteUrl, siteName } from "@/lib/seo";
import LegalLayout, { LegalSection, LegalList } from "@/components/page/footer/LegalLayout";

export const metadata: Metadata = buildMetadata({
  title: "Legal Notice",
  description:
    "Legal notice for PrancingPika — publisher, hosting provider, intellectual property, and fan-site disclaimer.",
  path: "/legal",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `Legal Notice – ${siteName}`,
  url: `${getSiteUrl()}/legal`,
  description: "Mandatory legal notice under French LCEN art. 6.",
};

export default function LegalNoticePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <LegalLayout
        eyebrow="Legal"
        title="Legal Notice"
        subtitle="Mandatory disclosure under French law n° 2004-575 of 21 June 2004 (LCEN, art. 6)."
        lastUpdated="March 2025"
      >
        {/* Publisher */}
        <LegalSection id="publisher" title="Publisher">
          <LegalList
            items={[
              "PrancingPika is published by a private individual (personne physique non-professionnelle) under article 6 III bis of the French LCEN law.",
              "As a private individual, the publisher's full identity is held confidentially by the hosting provider OVH SAS and can be disclosed to competent authorities upon lawful request.",
              "Public contact: armandzireg@gmail.com",
            ]}
          />
        </LegalSection>

        {/* Hosting */}
        <LegalSection id="hosting" title="Hosting Provider">
          <LegalList
            items={[
              "OVH SAS — 2 rue Kellermann, 59100 Roubaix, France",
              "Website: https://www.ovh.com",
              "OVH SAS provides infrastructure (servers, network) only. OVH has no access to user data stored on the server.",
            ]}
          />
        </LegalSection>

        {/* Intellectual Property */}
        <LegalSection id="ip" title="Intellectual Property">
          <LegalList
            items={[
              "RIFT, RIFT: Planes of Telara, and all related names, trademarks, logos, and assets are the exclusive property of Gamigo AG and/or its subsidiaries. All rights reserved.",
              "PrancingPika is not affiliated with, endorsed by, or associated with Gamigo AG in any way. This is an unofficial, non-commercial fan project.",
              "The PrancingPika application source code is released under the MIT License © Armand Zireg. You may reuse it under the terms of that license.",
              "Leaderboard data (DPS/HPS scores, character names) is derived from combat log files submitted by users and remains their property.",
            ]}
          />
        </LegalSection>

        {/* Disclaimer */}
        <LegalSection id="disclaimer" title="Fan Site Disclaimer">
          <LegalList
            items={[
              "PrancingPika is a community-driven tool built by players, for players. It is in no way an official publication of Gamigo AG.",
              "Statistics and rankings displayed are generated from user-submitted combat logs and may contain inaccuracies. They do not represent any official position of Gamigo.",
              "Use of this site is at the user's own risk. The publisher accepts no liability for errors in the data displayed.",
            ]}
          />
        </LegalSection>

        {/* Applicable Law */}
        <LegalSection id="law" title="Applicable Law & Jurisdiction">
          <LegalList
            items={[
              "This site is governed by French law. Any dispute arising from its use falls under the exclusive jurisdiction of the competent French courts.",
              "In the event of a dispute, an amicable resolution will be sought before initiating legal proceedings.",
            ]}
          />
        </LegalSection>

        {/* Related pages */}
        <LegalSection id="related" title="Related Pages">
          <ul className="flex flex-col gap-2">
            {[
              { href: "/privacy", label: "Privacy Policy" },
              { href: "/accessibility", label: "Accessibility Statement (RGAA v4.1)" },
            ].map(({ href, label }) => (
              <li key={href} className="flex items-start gap-3 text-[13px] text-zinc-400">
                <span
                  className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50"
                  aria-hidden="true"
                />
                <Link
                  href={href}
                  className="text-sky-400/80 hover:text-sky-400 underline underline-offset-4 transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </LegalSection>
      </LegalLayout>
    </>
  );
}
