// src/app/sitemap.xml/route.ts
// Serves the XML sitemap at /sitemap.xml as a regular route handler.
// Using a route handler instead of app/sitemap.ts frees up /sitemap for the HTML sitemap page.
import { getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency: string;
  priority: number;
};

function buildXml(entries: SitemapEntry[]): string {
  const items = entries
    .map(
      (e) => `  <url>
    <loc>${e.url}</loc>
    <lastmod>${e.lastModified.toISOString()}</lastmod>
    <changefreq>${e.changeFrequency}</changefreq>
    <priority>${e.priority.toFixed(1)}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>`;
}

export function GET() {
  const base = getSiteUrl();
  const now = new Date();

  const entries: SitemapEntry[] = [
    { url: `${base}/`,             lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${base}/leaderboards`, lastModified: now, changeFrequency: "hourly",  priority: 0.9 },
    { url: `${base}/top-players`,  lastModified: now, changeFrequency: "hourly",  priority: 0.9 },
    { url: `${base}/lookup`,       lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${base}/specs-dps`,    lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${base}/guilds`,       lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${base}/last-uploads`, lastModified: now, changeFrequency: "hourly",  priority: 0.6 },
    { url: `${base}/rules`,        lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/sitemap`,      lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal`,        lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
    { url: `${base}/privacy`,      lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
    { url: `${base}/accessibility`,lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
  ];

  return new Response(buildXml(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
