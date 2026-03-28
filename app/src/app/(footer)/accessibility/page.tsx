// src/app/(footer)/accessibility/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata, getSiteUrl, siteName } from "@/lib/seo";
import LegalLayout, { LegalSection, LegalList } from "@/components/page/footer/LegalLayout";

export const metadata: Metadata = buildMetadata({
  title: "Accessibility Statement",
  description:
    "Accessibility statement for PrancingPika — RGAA v4.1 conformity level, known non-conformities, and how to report issues.",
  path: "/accessibility",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `Accessibility Statement – ${siteName}`,
  url: `${getSiteUrl()}/accessibility`,
  description: "RGAA v4.1 accessibility statement — loi République Numérique 2016-1321.",
};

const nonConformities: { criterion: string; detail: string }[] = [
  {
    criterion: "No skip navigation links",
    detail:
      "No skip-navigation (\"skip to content\") links are present to allow screen reader users to bypass the header and jump directly to the main content. (RGAA 12.7)",
  },
  {
    criterion: "Icon buttons missing accessible labels",
    detail:
      "Several buttons that display only an icon (upload trigger, mobile navigation toggle) lack an aria-label attribute or equivalent accessible text, making their purpose undiscoverable to assistive technologies. (RGAA 11.9)",
  },
  {
    criterion: "Insufficient color contrast on glassmorphism elements",
    detail:
      "Secondary text in zinc-500 / zinc-600 rendered over semi-transparent dark backgrounds does not consistently meet the 4.5:1 contrast ratio required for normal text. (RGAA 3.2)",
  },
  {
    criterion: "Modal dialogs do not trap keyboard focus",
    detail:
      "When a modal dialog (e.g. the log-upload overlay) is open, keyboard focus is not contained within it. Users can navigate to elements behind the overlay without closing it first. (RGAA 10.8)",
  },
  {
    criterion: "File upload form does not expose accessible error messages",
    detail:
      "Error messages on the combat log upload form are not programmatically associated with their respective fields (no aria-describedby linkage) and are not announced by screen readers. (RGAA 11.10)",
  },
];

export default function AccessibilityPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <LegalLayout
        eyebrow="Accessibility"
        title="Accessibility Statement"
        subtitle="RGAA v4.1 — French law n° 2016-1321 for a Digital Republic."
        lastUpdated="March 2025"
      >
        {/* Conformity level */}
        <LegalSection id="conformity" title="Conformity Level">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-300"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              aria-label="Conformity level: partial"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" aria-hidden="true" />
              Partial conformity
            </span>
          </div>
          <LegalList
            items={[
              "PrancingPika is partially compliant with the RGAA v4.1 (Référentiel Général d'Amélioration de l'Accessibilité) due to the non-conformities listed in the next section.",
              "This statement is the result of a self-assessment carried out by the site operator. No third-party audit has been conducted.",
              "Date of assessment: March 2025.",
            ]}
          />
        </LegalSection>

        {/* Known non-conformities */}
        <LegalSection id="non-conformities" title="Known Non-Conformities">
          <ol
            className="flex flex-col gap-4"
            aria-label="List of known RGAA v4.1 non-conformities"
          >
            {nonConformities.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="mt-[2px] shrink-0 text-[11px] font-semibold text-sky-400/70"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-[13px] font-semibold text-zinc-200">{item.criterion}</p>
                  <p className="text-[12px] text-zinc-500 leading-relaxed">{item.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </LegalSection>

        {/* Technologies */}
        <LegalSection id="technologies" title="Technologies Used">
          <LegalList
            items={[
              "Next.js 16 (App Router)",
              "React 19",
              "TypeScript",
              "Tailwind CSS v4",
              "HTML5 / WAI-ARIA",
            ]}
          />
        </LegalSection>

        {/* Contact */}
        <LegalSection id="contact" title="Report an Accessibility Issue">
          <ul className="flex flex-col gap-2">
            <li className="flex items-start gap-3 text-[13px] text-zinc-400">
              <span
                className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50"
                aria-hidden="true"
              />
              If you encounter a barrier preventing access to any content or feature, please contact
              the site operator:{" "}
              <a
                href="mailto:armandzireg@gmail.com"
                className="text-sky-400/80 hover:text-sky-400 underline underline-offset-4 transition-colors"
              >
                armandzireg@gmail.com
              </a>
            </li>
            <li className="flex items-start gap-3 text-[13px] text-zinc-400">
              <span
                className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50"
                aria-hidden="true"
              />
              Please include in your message: the URL of the affected page, a description of the
              issue, and the assistive technology you are using (if applicable).
            </li>
            <li className="flex items-start gap-3 text-[13px] text-zinc-400">
              <span
                className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50"
                aria-hidden="true"
              />
              A response will be provided as soon as possible.
            </li>
          </ul>
        </LegalSection>

        {/* Recourse */}
        <LegalSection id="recourse" title="Escalation Path">
          <ul className="flex flex-col gap-2">
            <li className="flex items-start gap-3 text-[13px] text-zinc-400">
              <span
                className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50"
                aria-hidden="true"
              />
              If you do not receive a satisfactory response within two months of your report, you
              may refer the matter to the{" "}
              <Link
                href="https://www.defenseurdesdroits.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400/80 hover:text-sky-400 underline underline-offset-4 transition-colors"
              >
                Défenseur des droits
              </Link>
              .
            </li>
            <li className="flex items-start gap-3 text-[13px] text-zinc-400">
              <span
                className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50"
                aria-hidden="true"
              />
              You may also contact the Défenseur des droits by post (postage-free):{" "}
              <span
                className="text-zinc-300"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px" }}
              >
                Défenseur des droits — Libre réponse 71120 — 75342 Paris CEDEX 07
              </span>
              .
            </li>
          </ul>
        </LegalSection>
      </LegalLayout>
    </>
  );
}
