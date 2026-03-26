// src/app/layout.tsx
import type { Metadata } from "next";
import "@/styles/globals.css";
import Providers from "@/lib/providers";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { getSiteUrl, siteName } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    template: `%s – ${siteName}`,
    default: `${siteName} — RIFT Combat Log Tracker`,
  },
  description:
    "Upload RIFT combat logs, track DPS and HPS, explore boss leaderboards, manage guilds, and compare performance across specs.",
  icons: {
    icon: [{ url: "/favicon.png" }],
    apple: [{ url: "/favicon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    siteName,
    type: "website",
    locale: "en_US",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${siteName} — RIFT Combat Log Tracker` }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 pt-[72px]">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
