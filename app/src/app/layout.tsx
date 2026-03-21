// src/app/layout.tsx
import type { Metadata } from "next";
import "@/styles/globals.css";
import Providers from "@/lib/providers";
import Header from "@/components/header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "PrancingPika — Rift Combat Tracker",
  description: "Planes of Telara — combat logs, scores, leaderboards",
  icons: {
    icon: [{ url: "/favicon.png" }],
    apple: [{ url: "/favicon.png", sizes: "180x180", type: "image/png" }],
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
