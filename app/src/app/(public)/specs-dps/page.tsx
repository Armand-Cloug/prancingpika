// src/app/(public)/specs-dps/page.tsx
import { getAvailableSpecs } from "@/lib/specs-dps";
import SpecsDpsClient from "@/components/page/public/specs-dps/SpecsDpsClient";

export const dynamic = "force-dynamic";

export default async function SpecsDpsPage() {
  const specs = await getAvailableSpecs();

  return (
    <div className="mx-auto max-w-7xl 2xl:max-w-[1600px] px-6 py-10">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.2em] text-sky-400/70 font-medium uppercase mb-2">
          Rankings
        </p>
        <h1 className="text-4xl font-bold text-gradient tracking-tight">
          Specs DPS
        </h1>
        <p className="mt-2 text-[13px] text-zinc-500">
          Top 10 DPS per boss for a given spec
        </p>
      </div>
      <SpecsDpsClient specs={specs} />
    </div>
  );
}
