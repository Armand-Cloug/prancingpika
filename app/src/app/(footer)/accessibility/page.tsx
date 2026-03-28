// src/app/(footer)/accessibility/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata, getSiteUrl, siteName } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Accessibilité",
  description:
    "Déclaration d'accessibilité de PrancingPika — niveau de conformité RGAA v4.1, non-conformités connues et contacts.",
  path: "/accessibility",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `Déclaration d'accessibilité – ${siteName}`,
  url: `${getSiteUrl()}/accessibility`,
  description: "Déclaration d'accessibilité RGAA v4.1 — loi République Numérique 2016-1321.",
};

const nonConformities = [
  {
    criterion: "Navigation — absence de liens d'évitement",
    detail:
      "Aucun lien d'évitement (skip navigation) n'est présent pour permettre aux utilisateurs de lecteurs d'écran de passer directement au contenu principal. (RGAA 12.7)",
  },
  {
    criterion: "Boutons icône — libellés ARIA manquants",
    detail:
      "Certains boutons affichant uniquement une icône (upload, navigation mobile) ne possèdent pas d'attribut aria-label ni de texte alternatif explicite. (RGAA 11.9)",
  },
  {
    criterion: "Contraste — éléments en glassmorphisme",
    detail:
      "Des textes secondaires (zinc-500, zinc-600) affichés sur les fonds translucides glassmorphisme n'atteignent pas le ratio de contraste de 4,5:1 requis. (RGAA 3.2)",
  },
  {
    criterion: "Modales — gestion du focus clavier",
    detail:
      "La fenêtre modale de chargement de log ne piège pas le focus : il est possible de naviguer au clavier en dehors de la fenêtre active sans fermer celle-ci. (RGAA 10.8)",
  },
  {
    criterion: "Formulaire d'upload — messages d'erreur non accessibles",
    detail:
      "Les messages d'erreur du formulaire d'import de combat log ne sont pas liés programmatiquement au champ concerné (absence d'aria-describedby) et ne sont pas annoncés par les lecteurs d'écran. (RGAA 11.10)",
  },
];

export default function AccessibilityPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mb-8">
        <p className="text-[10px] tracking-[0.2em] text-sky-400/70 font-medium uppercase mb-2">
          Accessibilité
        </p>
        <h1 className="text-4xl font-bold text-gradient tracking-tight">
          Déclaration d'accessibilité
        </h1>
        <p className="mt-2 text-[13px] text-zinc-500">
          RGAA v4.1 — loi n°&nbsp;2016-1321 pour une République Numérique.
        </p>
      </header>

      <main>
        <div className="flex flex-col gap-5">

          {/* Conformity level */}
          <section className="glass rounded-2xl p-5" aria-labelledby="section-niveau">
            <h2
              id="section-niveau"
              className="text-[15px] font-bold text-zinc-100 mb-3"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Niveau de conformité
            </h2>
            <div className="flex items-center gap-3 mb-3">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-300"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                aria-label="Niveau : conformité partielle"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" aria-hidden="true" />
                Conformité partielle
              </span>
            </div>
            <ul className="flex flex-col gap-2">
              <li className="flex items-start gap-3 text-[13px] text-zinc-400">
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50" aria-hidden="true" />
                PrancingPika est en conformité partielle avec le Référentiel Général d'Amélioration de l'Accessibilité (RGAA v4.1) en raison des non-conformités listées ci-dessous.
              </li>
              <li className="flex items-start gap-3 text-[13px] text-zinc-400">
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50" aria-hidden="true" />
                Cette déclaration est le résultat d'une auto-évaluation réalisée par l'éditeur. Aucun audit externe n'a été conduit.
              </li>
              <li className="flex items-start gap-3 text-[13px] text-zinc-400">
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50" aria-hidden="true" />
                Date de l'évaluation : mars 2025.
              </li>
            </ul>
          </section>

          {/* Known non-conformities */}
          <section className="glass rounded-2xl p-5" aria-labelledby="section-nonconformites">
            <h2
              id="section-nonconformites"
              className="text-[15px] font-bold text-zinc-100 mb-4"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Non-conformités connues
            </h2>
            <ol className="flex flex-col gap-4" aria-label="Liste des non-conformités RGAA v4.1">
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
          </section>

          {/* Technologies */}
          <section className="glass rounded-2xl p-5" aria-labelledby="section-techno">
            <h2
              id="section-techno"
              className="text-[15px] font-bold text-zinc-100 mb-3"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Technologies utilisées
            </h2>
            <ul className="flex flex-col gap-2">
              {["Next.js 16 (App Router)", "React 19", "TypeScript", "Tailwind CSS v4", "HTML5 / WAI-ARIA"].map((tech) => (
                <li key={tech} className="flex items-start gap-3 text-[13px] text-zinc-400">
                  <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50" aria-hidden="true" />
                  {tech}
                </li>
              ))}
            </ul>
          </section>

          {/* Contact */}
          <section className="glass rounded-2xl p-5" aria-labelledby="section-contact">
            <h2
              id="section-contact"
              className="text-[15px] font-bold text-zinc-100 mb-3"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Signaler un problème d'accessibilité
            </h2>
            <ul className="flex flex-col gap-2">
              <li className="flex items-start gap-3 text-[13px] text-zinc-400">
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50" aria-hidden="true" />
                Si vous rencontrez une difficulté d'accès à un contenu ou à une fonctionnalité, contactez l'éditeur par e-mail :{" "}
                <a
                  href="mailto:armandzireg@gmail.com"
                  className="text-sky-400/80 hover:text-sky-400 underline underline-offset-4 transition-colors"
                >
                  armandzireg@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-[13px] text-zinc-400">
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50" aria-hidden="true" />
                Précisez dans votre message : la page concernée, la nature du problème, la technologie d'assistance utilisée (si applicable).
              </li>
              <li className="flex items-start gap-3 text-[13px] text-zinc-400">
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50" aria-hidden="true" />
                Une réponse sera apportée dans les meilleurs délais.
              </li>
            </ul>
          </section>

          {/* Recourse */}
          <section className="glass rounded-2xl p-5" aria-labelledby="section-recours">
            <h2
              id="section-recours"
              className="text-[15px] font-bold text-zinc-100 mb-3"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Voie de recours
            </h2>
            <ul className="flex flex-col gap-2">
              <li className="flex items-start gap-3 text-[13px] text-zinc-400">
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50" aria-hidden="true" />
                Si vous n'obtenez pas de réponse satisfaisante dans un délai de deux mois suite à votre signalement, vous pouvez contacter le{" "}
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
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50" aria-hidden="true" />
                Vous pouvez contacter le Défenseur des droits par voie postale (gratuite, sans affranchissement) : Défenseur des droits — Libre réponse 71120 — 75342 Paris CEDEX 07.
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
