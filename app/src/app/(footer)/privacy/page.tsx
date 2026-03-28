// src/app/(footer)/privacy/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata, getSiteUrl, siteName } from "@/lib/seo";
import LegalLayout, { LegalSection, LegalList } from "@/components/page/footer/LegalLayout";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "Privacy policy for PrancingPika — data collected, legal bases, retention periods, and your GDPR rights.",
  path: "/privacy",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `Privacy Policy – ${siteName}`,
  url: `${getSiteUrl()}/privacy`,
  description: "Privacy policy compliant with GDPR arts. 13–14.",
};

type DataRow = {
  data: string;
  basis: string;
  retention: string;
};

const dataTable: DataRow[] = [
  {
    data: "Discord user ID, username, avatar",
    basis: "Contract performance (authentication)",
    retention: "Duration of account",
  },
  {
    data: "Google account ID, email, display name",
    basis: "Contract performance (authentication)",
    retention: "Duration of account",
  },
  {
    data: "Combat log files (uploaded by user)",
    basis: "User consent",
    retention: "Not automatically deleted — periodically reviewed and deleted manually by the operator",
  },
  {
    data: "Leaderboard scores and parsed results",
    basis: "Legitimate interest (site functionality)",
    retention: "Retained indefinitely unless a justified erasure request is submitted",
  },
  {
    data: "Connection logs (IP address, timestamp)",
    basis: "Legitimate interest (security)",
    retention: "Minimum 6 months, maximum 1 year",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <LegalLayout
        eyebrow="Privacy"
        title="Privacy Policy"
        subtitle="In compliance with the General Data Protection Regulation (GDPR — EU 2016/679, arts. 13–14)."
        lastUpdated="March 2025"
      >
        {/* Controller */}
        <LegalSection id="controller" title="Data Controller">
          <LegalList
            items={[
              "Data controller: Armand Zireg (private individual), contact: armandzireg@gmail.com",
              "PrancingPika does not store passwords. Authentication is handled exclusively via third-party OAuth providers (Discord, Google).",
              "For any data-related request, contact: armandzireg@gmail.com — responses within 30 days.",
            ]}
          />
        </LegalSection>

        {/* Authentication */}
        <LegalSection id="authentication" title="Authentication">
          <LegalList
            items={[
              "Users authenticate exclusively via Discord OAuth or Google OAuth. No password is ever created or stored on PrancingPika.",
              "A user may link both a Discord account and a Google account to the same PrancingPika account.",
              "During authentication, Discord and Google receive data as part of their respective OAuth flows (user ID, email address, profile picture, depending on granted scopes). Users should refer to Discord's Privacy Policy and Google's Privacy Policy for how each provider handles this data.",
              "PrancingPika only retains the minimum identifiers necessary to maintain your account (see data table below).",
            ]}
          />
        </LegalSection>

        {/* Purposes */}
        <LegalSection id="purposes" title="Processing Purposes">
          <LegalList
            items={[
              "Account management: authenticating users via Discord/Google OAuth and identifying players in leaderboards.",
              "Service delivery: parsing combat log files and displaying DPS/HPS rankings.",
              "Security: connection logs to detect and prevent abuse.",
              "No behavioural profiling, no targeted advertising, no sale of data to any third party for commercial purposes.",
              "No automated decision-making or automated profiling with legal or similarly significant effects.",
            ]}
          />
        </LegalSection>

        {/* Data table */}
        <LegalSection id="data-table" title="Data Collected — Summary">
          <div className="overflow-x-auto -mx-1">
            <table
              className="w-full text-[12px] border-collapse"
              aria-label="Summary of personal data processing"
            >
              <thead>
                <tr className="border-b border-white/10">
                  <th
                    scope="col"
                    className="text-left py-2 pr-4 text-zinc-300 font-semibold whitespace-nowrap"
                  >
                    Data
                  </th>
                  <th
                    scope="col"
                    className="text-left py-2 pr-4 text-zinc-300 font-semibold whitespace-nowrap"
                  >
                    Legal basis
                  </th>
                  <th
                    scope="col"
                    className="text-left py-2 text-zinc-300 font-semibold whitespace-nowrap"
                  >
                    Retention
                  </th>
                </tr>
              </thead>
              <tbody>
                {dataTable.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/[0.05] last:border-0"
                  >
                    <td className="py-2.5 pr-4 text-zinc-400 align-top">{row.data}</td>
                    <td className="py-2.5 pr-4 text-zinc-400 align-top">{row.basis}</td>
                    <td className="py-2.5 text-zinc-400 align-top">{row.retention}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </LegalSection>

        {/* Cookies */}
        <LegalSection id="cookies" title="Cookies">
          <LegalList
            items={[
              "PrancingPika uses a single session cookie, strictly necessary for maintaining your authenticated session (NextAuth).",
              "This cookie is not persistent: it is deleted upon logout or when you close your browser.",
              "No tracking cookies, no third-party analytics (e.g. Google Analytics), no advertising pixels.",
            ]}
          />
        </LegalSection>

        {/* Third parties */}
        <LegalSection id="third-parties" title="Third-Party Recipients">
          <LegalList
            items={[
              "OVH SAS (2 rue Kellermann, 59100 Roubaix, France) — hosting infrastructure only. OVH has no access to user data stored on the server.",
              "Discord Inc. — receives data during Discord OAuth authentication. Subject to Discord's Privacy Policy (discord.com/privacy).",
              "Google LLC — receives data during Google OAuth authentication. Subject to Google's Privacy Policy (policies.google.com/privacy).",
              "No data is sold to, shared with, or rented to any other third party.",
            ]}
          />
        </LegalSection>

        {/* User rights */}
        <LegalSection id="rights" title="Your Rights (GDPR arts. 15–21)">
          <LegalList
            items={[
              "Right of access (art. 15) — obtain a copy of your personal data.",
              "Right of rectification (art. 16) — correct inaccurate data.",
              "Right to erasure (art. 17) — request deletion of your data. For leaderboard scores, requests must include a brief justification; the operator may refuse requests that are manifestly unfounded or abusive.",
              "Right to data portability (art. 20) — receive your data in a structured, machine-readable format.",
              "Right to object (art. 21) — object to processing based on legitimate interest.",
              "Right to restriction (art. 18) — request temporary suspension of a processing activity.",
              "To exercise any of these rights, contact: armandzireg@gmail.com — response within 30 days.",
            ]}
          />
        </LegalSection>

        {/* CNIL */}
        <LegalSection id="cnil" title="Right to Lodge a Complaint">
          <ul className="flex flex-col gap-2">
            <li className="flex items-start gap-3 text-[13px] text-zinc-400">
              <span
                className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50"
                aria-hidden="true"
              />
              If you believe your rights under GDPR are not being respected, you may lodge a complaint
              with the French supervisory authority, the{" "}
              <Link
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400/80 hover:text-sky-400 underline underline-offset-4 transition-colors"
              >
                Commission Nationale de l'Informatique et des Libertés (CNIL)
              </Link>
              .
            </li>
            <li className="flex items-start gap-3 text-[13px] text-zinc-400">
              <span
                className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50"
                aria-hidden="true"
              />
              <Link
                href="/legal"
                className="text-sky-400/80 hover:text-sky-400 underline underline-offset-4 transition-colors"
              >
                Legal Notice
              </Link>
            </li>
          </ul>
        </LegalSection>
      </LegalLayout>
    </>
  );
}
