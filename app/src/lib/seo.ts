// src/lib/seo.ts
// Shared SEO utilities — canonical URL helpers and metadata builder.

import type { Metadata } from "next";

export const siteName = "PrancingPika";

/**
 * Returns the canonical site origin (no trailing slash).
 * Priority: NEXT_PUBLIC_SITE_URL → NEXTAUTH_URL → fallback.
 */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://prancingpika.fr";
  try {
    return new URL(raw).origin;
  } catch {
    return raw.replace(/\/+$/, "");
  }
}

/**
 * Builds a consistent Metadata object for any page.
 *
 * @param title       Short page title (inserted into template: "<title> – PrancingPika")
 * @param description 150-160 character description for meta + OG.
 * @param path        Absolute path starting with "/" (e.g. "/leaderboards").
 * @param noIndex     Set true for auth-gated or private pages.
 */
export function buildMetadata(opts: {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}): Metadata {
  const url = `${getSiteUrl()}${opts.path}`;

  const meta: Metadata = {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${opts.title} – ${siteName}`,
      description: opts.description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${opts.title} – ${siteName}`,
      description: opts.description,
    },
  };

  if (opts.noIndex) {
    meta.robots = { index: false, follow: false };
  }

  return meta;
}
