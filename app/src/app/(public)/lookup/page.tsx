// src/app/(public)/lookup/page.tsx
import LookupClient from "@/components/page/public/lookup/LookupClient";

export const dynamic = "force-dynamic";

export default function LookupPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.2em] text-sky-400/70 font-medium uppercase mb-2">Search</p>
        <h1 className="text-4xl font-bold text-gradient tracking-tight">Player Lookup</h1>
        <p className="mt-2 text-[13px] text-zinc-500">Search a player's full run history</p>
      </div>
      <LookupClient />
    </div>
  );
}
