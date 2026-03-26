// src/app/robots.ts
import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/leaderboards", "/top-players", "/lookup", "/specs-dps", "/guilds", "/last-uploads", "/rules"],
        disallow: ["/api/", "/account", "/sign-in", "/abilities", "/oldschool", "/wip", "/legal-notice", "/privacy-policy", "/accessibility"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
