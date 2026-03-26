// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  return [
    { url: `${base}/`,             lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${base}/leaderboards`, lastModified: now, changeFrequency: "hourly",  priority: 0.9 },
    { url: `${base}/top-players`,  lastModified: now, changeFrequency: "hourly",  priority: 0.9 },
    { url: `${base}/lookup`,       lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${base}/specs-dps`,    lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${base}/guilds`,       lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${base}/last-uploads`, lastModified: now, changeFrequency: "hourly",  priority: 0.6 },
    { url: `${base}/rules`,        lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
