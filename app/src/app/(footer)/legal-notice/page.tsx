// src/app/(footer)/legal-notice/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata, getSiteUrl, siteName } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Mentions légales",
  description:
    "Mentions légales de PrancingPika — éditeur, hébergeur, propriété intellectuelle et avertissement concernant RIFT.",
  path: "/legal-notice",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `Mentions légales – ${siteName}`,
  url: `${getSiteUrl()}/legal-notice`,
  description: "Mentions légales obligatoires au sens de la LCEN art. 6.",
};

const sections: { id: string; title: string; items: string[] }[] = [
  {
    id: "editeur",
    title: "Éditeur du site",
    items: [
      "Le site PrancingPika est édité par une personne physique non-professionnelle au sens de l'article 6 III bis de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN).",
      "Conformément à ce régime, l'identité complète de l'éditeur est tenue confidentielle et conservée par l'hébergeur OVH SAS, qui peut la communiquer aux autorités compétentes sur requête.",
      "Contact public de l'éditeur : armandzireg@gmail.com",
    ],
  },
  {
    id: "hebergeur",
    title: "Hébergeur",
    items: [
      "OVH SAS — 2 rue Kellermann, 59100 Roubaix, France",
      "Site web : https://www.ovh.com",
      "OVH SAS est une société par actions simplifiée immatriculée au RCS de Lille Métropole sous le numéro 424 761 419.",
    ],
  },
  {
    id: "propriete-intellectuelle",
    title: "Propriété intellectuelle",
    items: [
      "RIFT, RIFT: Planes of Telara, ainsi que tous les noms, marques, logos et éléments visuels associés sont la propriété exclusive de Gamigo AG et/ou de ses filiales. Tous droits réservés.",
      "PrancingPika n'est affilié à Gamigo en aucune manière et n'est ni approuvé, ni sponsorisé, ni associé à Gamigo ou à ses produits. Ce site est un projet fan non-officiel, à but non-lucratif.",
      "Le code source original de PrancingPika ainsi que son design spécifique sont © Armand Zireg (alias Cloug). Toute reproduction ou utilisation sans autorisation expresse est interdite.",
      "Les données de classement (scores DPS/HPS, noms de personnages) sont issues des journaux de combat fournis par les utilisateurs et restent leur propriété.",
    ],
  },
  {
    id: "avertissement",
    title: "Site fan non-officiel — avertissement",
    items: [
      "PrancingPika est un outil communautaire créé par des joueurs, pour des joueurs. Il ne constitue en aucun cas une publication officielle de Gamigo AG.",
      "Les statistiques de combat et classements présentés sont générés à partir de journaux de jeu (combat logs) et peuvent contenir des imprécisions. Ils n'engagent pas Gamigo.",
      "L'utilisation de ce site s'effectue sous la seule responsabilité de l'utilisateur. L'éditeur décline toute responsabilité quant aux erreurs d'interprétation des données affichées.",
    ],
  },
  {
    id: "droit-applicable",
    title: "Droit applicable et juridiction",
    items: [
      "Le présent site est soumis au droit français. Tout litige relatif à son utilisation relève de la compétence exclusive des juridictions françaises compétentes.",
      "En cas de litige, une solution amiable sera recherchée avant toute action judiciaire.",
    ],
  },
];

export default function LegalNoticePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mb-8">
        <p className="text-[10px] tracking-[0.2em] text-sky-400/70 font-medium uppercase mb-2">
          Légal
        </p>
        <h1 className="text-4xl font-bold text-gradient tracking-tight">
          Mentions légales
        </h1>
        <p className="mt-2 text-[13px] text-zinc-500">
          Conformément à la loi n°&nbsp;2004-575 du 21 juin 2004 (LCEN, art.&nbsp;6).
        </p>
      </header>

      <main>
        <div className="flex flex-col gap-5">
          {sections.map(({ id, title, items }) => (
            <section key={id} className="glass rounded-2xl p-5" aria-labelledby={`section-${id}`}>
              <h2
                id={`section-${id}`}
                className="text-[15px] font-bold text-zinc-100 mb-3"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                {title}
              </h2>
              <ul className="flex flex-col gap-2">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[13px] text-zinc-400">
                    <span
                      className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="glass rounded-2xl p-5" aria-labelledby="section-liens">
            <h2
              id="section-liens"
              className="text-[15px] font-bold text-zinc-100 mb-3"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Pages associées
            </h2>
            <ul className="flex flex-col gap-2">
              <li className="flex items-start gap-3 text-[13px] text-zinc-400">
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50" aria-hidden="true" />
                <Link
                  href="/privacy-policy"
                  className="text-sky-400/80 hover:text-sky-400 underline underline-offset-4 transition-colors"
                >
                  Politique de confidentialité
                </Link>
              </li>
              <li className="flex items-start gap-3 text-[13px] text-zinc-400">
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50" aria-hidden="true" />
                <Link
                  href="/accessibility"
                  className="text-sky-400/80 hover:text-sky-400 underline underline-offset-4 transition-colors"
                >
                  Déclaration d'accessibilité (RGAA v4.1)
                </Link>
              </li>
            </ul>
          </section>
        </div>

        <p className="mt-8 text-[11px] text-zinc-600 text-center">
          Dernière mise à jour : mars 2025
        </p>
      </main>
    </div>
  );
}
