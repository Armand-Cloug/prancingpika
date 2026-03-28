// src/app/(footer)/privacy-policy/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata, getSiteUrl, siteName } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité de PrancingPika — données collectées, bases légales, durées de conservation et droits RGPD.",
  path: "/privacy-policy",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `Politique de confidentialité – ${siteName}`,
  url: `${getSiteUrl()}/privacy-policy`,
  description: "Politique de confidentialité conforme au RGPD (arts. 13–14).",
};

type TableRow = { data: string; basis: string; retention: string };

const dataTable: TableRow[] = [
  {
    data: "Fichiers de combat log (téléversés)",
    basis: "Exécution du service (art. 6.1.b RGPD)",
    retention: "Supprimés après traitement (< 24 h)",
  },
  {
    data: "Identifiant Discord (OAuth)",
    basis: "Exécution du service / consentement",
    retention: "Conservé tant que le compte est actif",
  },
  {
    data: "Nom d'utilisateur (pseudo)",
    basis: "Exécution du service",
    retention: "Conservé tant que le compte est actif",
  },
  {
    data: "Scores de classement (DPS/HPS)",
    basis: "Intérêt légitime — classements publics",
    retention: "Conservés tant que le compte est actif",
  },
  {
    data: "Logs de connexion (adresse IP, horodatage)",
    basis: "Intérêt légitime — sécurité du service",
    retention: "30 jours glissants",
  },
];

const sections: { id: string; title: string; items: string[] }[] = [
  {
    id: "responsable",
    title: "Responsable du traitement",
    items: [
      "Le responsable du traitement des données personnelles est Armand Zireg (alias Cloug), personne physique non-professionnelle.",
      "Contact : armandzireg@gmail.com — pour toute question relative à vos données personnelles.",
    ],
  },
  {
    id: "donnees",
    title: "Données collectées",
    items: [
      "PrancingPika collecte uniquement les données strictement nécessaires au fonctionnement du service (principe de minimisation, art. 5.1.c RGPD).",
      "Aucune donnée sensible (santé, origine ethnique, opinions politiques, etc.) n'est collectée.",
      "Les fichiers de combat log sont traités côté serveur pour en extraire les statistiques, puis supprimés dans les 24 heures suivant le traitement.",
    ],
  },
  {
    id: "finalites",
    title: "Finalités du traitement",
    items: [
      "Fourniture du service : analyse des journaux de combat et affichage des classements DPS/HPS.",
      "Gestion des comptes : authentification via Discord OAuth, identification des joueurs dans les classements.",
      "Sécurité : journaux de connexion pour détecter et prévenir les abus.",
      "Aucun profilage comportemental, aucune publicité ciblée, aucune cession de données à des tiers à des fins commerciales.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies et traceurs",
    items: [
      "PrancingPika utilise uniquement un cookie de session strictement nécessaire au fonctionnement de l'authentification (NextAuth).",
      "Aucun cookie de suivi, aucune analytics tierce (Google Analytics, etc.), aucun pixel publicitaire.",
      "Le cookie de session est détruit à la fermeture du navigateur ou à la déconnexion.",
    ],
  },
  {
    id: "partage",
    title: "Partage des données",
    items: [
      "Les données ne sont ni vendues, ni cédées, ni louées à des tiers.",
      "L'hébergeur OVH SAS (2 rue Kellermann, 59100 Roubaix, France) accède techniquement aux données dans le cadre de la prestation d'hébergement, conformément au RGPD.",
      "Discord peut recevoir des données lors de l'authentification OAuth ; leur traitement est soumis à la politique de confidentialité de Discord.",
    ],
  },
  {
    id: "droits",
    title: "Vos droits (RGPD arts. 15–21)",
    items: [
      "Droit d'accès (art. 15) : obtenir une copie de vos données personnelles.",
      "Droit de rectification (art. 16) : corriger des données inexactes.",
      "Droit à l'effacement (art. 17) : demander la suppression de vos données.",
      "Droit à la portabilité (art. 20) : recevoir vos données dans un format structuré.",
      "Droit d'opposition (art. 21) : vous opposer à un traitement fondé sur l'intérêt légitime.",
      "Droit à la limitation (art. 18) : demander la suspension temporaire d'un traitement.",
      "Pour exercer ces droits, contactez : armandzireg@gmail.com — réponse sous 30 jours.",
    ],
  },
  {
    id: "cnil",
    title: "Réclamation auprès de la CNIL",
    items: [
      "Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL).",
      "Site de la CNIL : https://www.cnil.fr",
    ],
  },
];

export default function PrivacyPolicyPage() {
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
          Politique de confidentialité
        </h1>
        <p className="mt-2 text-[13px] text-zinc-500">
          Conformément au Règlement Général sur la Protection des Données (RGPD — UE 2016/679, arts.&nbsp;13–14).
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

          {/* Data table */}
          <section className="glass rounded-2xl p-5 overflow-hidden" aria-labelledby="section-tableau">
            <h2
              id="section-tableau"
              className="text-[15px] font-bold text-zinc-100 mb-4"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Récapitulatif des traitements
            </h2>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-[12px] border-collapse" aria-label="Tableau des traitements de données personnelles">
                <thead>
                  <tr className="border-b border-white/10">
                    <th scope="col" className="text-left py-2 pr-4 text-zinc-300 font-semibold whitespace-nowrap">
                      Donnée
                    </th>
                    <th scope="col" className="text-left py-2 pr-4 text-zinc-300 font-semibold whitespace-nowrap">
                      Base légale
                    </th>
                    <th scope="col" className="text-left py-2 text-zinc-300 font-semibold whitespace-nowrap">
                      Durée de conservation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dataTable.map((row, i) => (
                    <tr key={i} className="border-b border-white/[0.05] last:border-0">
                      <td className="py-2 pr-4 text-zinc-400 align-top">{row.data}</td>
                      <td className="py-2 pr-4 text-zinc-400 align-top">{row.basis}</td>
                      <td className="py-2 text-zinc-400 align-top">{row.retention}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

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
                  href="/legal-notice"
                  className="text-sky-400/80 hover:text-sky-400 underline underline-offset-4 transition-colors"
                >
                  Mentions légales
                </Link>
              </li>
              <li className="flex items-start gap-3 text-[13px] text-zinc-400">
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/50" aria-hidden="true" />
                <Link
                  href="https://www.cnil.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400/80 hover:text-sky-400 underline underline-offset-4 transition-colors"
                >
                  CNIL — Commission Nationale de l'Informatique et des Libertés
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
