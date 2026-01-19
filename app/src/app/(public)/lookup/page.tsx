// src/app/(public)/lookup/page.tsx
import LookupClient from "@/components/page/public/lookup/LookupClient";

export const dynamic = "force-dynamic";

export default function LookupPage() {
  return (
    <main className="min-h-screen bg-[#1F2B3A] text-zinc-100">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_15%_10%,rgba(56,189,248,0.10),transparent_55%),radial-gradient(1000px_circle_at_85%_15%,rgba(167,139,250,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(31,43,58,0.45),rgba(31,43,58,0.95))]" />
      </div>

      <section className="w-full px-4 sm:px-6 lg:px-10 pt-24 pb-14">
        <LookupClient />
      </section>
    </main>
  );
}
