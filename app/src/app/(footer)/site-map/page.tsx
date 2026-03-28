// src/app/(footer)/site-map/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata, getSiteUrl, siteName } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Plan du site",
  description:
    "Plan du site PrancingPika — liste de toutes les pages disponibles avec leur description.",
  path: "/site-map",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `Plan du site – ${siteName}`,
  url: `${getSiteUrl()}/site-map`,
  description: "Plan du site HTML de PrancingPika.",
};

type SitemapSection = {
  title: string;
  links: { href: string; label: string; description: string }[];
};

const sitemapSections: SitemapSection[] = [
  {
    title: "Navigation principale",
    links: [
      {
        href: "/",
        label: "Accueil",
        description: "Page d'accueil de PrancingPika — présentation du service, statistiques globales et accès rapide.",
      },
      {
        href: "/leaderboard",
        label: "Classements",
        description: "Classements DPS/HPS par boss, spécialisation et guilde pour les rencontres RIFT.",
      },
      {
        href: "/upload",
        label: "Importer un log",
        description: "Téléversez un fichier combat.log pour analyser les performances de votre groupe.",
      },
      {
        href: "/profile",
        label: "Mon profil",
        description: "Consultez votre profil joueur, vos statistiques personnelles et votre guilde.",
      },
    ],
  },
  {
    title: "Communauté",
    links: [
      {
        href: "/rules",
        label: "Règles",
        description: "Règles de logging, de fair-play et de détection des rencontres pour les uploads.",
      },
    ],
  },
  {
    title: "Informations légales",
    links: [
      {
        href: "/legal-notice",
        label: "Mentions légales",
        description: "Informations légales obligatoires : éditeur, hébergeur et propriété intellectuelle (LCEN).",
      },
      {
        href: "/privacy-policy",
        label: "Politique de confidentialité",
        description: "Données collectées, bases légales, durées de conservation et droits RGPD.",
      },
      {
        href: "/accessibility",
        label: "Accessibilité",
        description: "Déclaration d'accessibilité RGAA v4.1 — niveau de conformité et non-conformités connues.",
      },
      {
        href: "/site-map",
        label: "Plan du site",
        description: "Cette page — liste structurée de toutes les pages disponibles sur PrancingPika.",
      },
    ],
  },
];

export default function SiteMapPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mb-8">
        <p className="text-[10px] tracking-[0.2em] text-sky-400/70 font-medium uppercase mb-2">
          Navigation
        </p>
        <h1 className="text-4xl font-bold text-gradient tracking-tight">
          Plan du site
        </h1>
        <p className="mt-2 text-[13px] text-zinc-500">
          Toutes les pages de PrancingPika en un coup d'œil.
        </p>
      </header>

      <main>
        <nav aria-label="Plan du site">
          <div className="flex flex-col gap-5">
            {sitemapSections.map((section) => (
              <section
                key={section.title}
                className="glass rounded-2xl p-5"
                aria-labelledby={`section-${section.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <h2
                  id={`section-${section.title.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-[15px] font-bold text-zinc-100 mb-3"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {section.title}
                </h2>
                <ul className="flex flex-col gap-3">
                  {section.links.map(({ href, label, description }) => (
                    <li key={href} className="flex items-start gap-3">
                      <span
                        className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50"
                        aria-hidden="true"
                      />
                      <div className="flex flex-col gap-0.5">
                        <Link
                          href={href}
                          className="text-[13px] font-medium text-sky-400/90 hover:text-sky-400 underline underline-offset-4 transition-colors"
                        >
                          {label}
                          <span
                            className="ml-1.5 text-[11px] font-normal text-zinc-600"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {href}
                          </span>
                        </Link>
                        <p className="text-[12px] text-zinc-500 leading-relaxed">
                          {description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </nav>

        <p className="mt-8 text-[11px] text-zinc-600 text-center">
          Dernière mise à jour : mars 2025
        </p>
      </main>
    </div>
  );
}
