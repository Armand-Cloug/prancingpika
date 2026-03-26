// src/app/(public)/last-uploads/page.tsx
import type { Metadata } from "next";
import { getLastUploads } from "@/lib/last-uploads";
import UploadRunRow from "@/components/page/public/last-uploads/UploadRunRow";
import { buildMetadata, getSiteUrl, siteName } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Last Uploads",
  description:
    "See the most recently parsed RIFT boss kills on PrancingPika — live feed of community log uploads with roster details and DPS breakdowns.",
  path: "/last-uploads",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `Last Uploads – ${siteName}`,
  url: `${getSiteUrl()}/last-uploads`,
  description: "Live feed of recently parsed RIFT boss kills from community-uploaded combat logs.",
};

export default async function LastUploadsPage() {
  const runs = await getLastUploads(20);

  return (
    <div className="mx-auto max-w-7xl 2xl:max-w-[1600px] px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.2em] text-sky-400/70 font-medium uppercase mb-2">
          Activity
        </p>
        <h1 className="text-4xl font-bold text-gradient tracking-tight">
          Last Uploads
        </h1>
        <p className="mt-2 text-[13px] text-zinc-500">
          Most recently parsed boss kills — click to expand roster
        </p>
      </div>

      {runs.length === 0 ? (
        <div className="glass rounded-2xl px-6 py-12 text-center">
          <p className="text-zinc-500">No runs uploaded yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(() => {
            let shade = 0;
            let lastGroupId: string | null = null;
            return runs.map((run) => {
              if (lastGroupId !== null && run.groupId !== lastGroupId) shade++;
              lastGroupId = run.groupId;
              return <UploadRunRow key={run.runId} run={run} shade={shade} />;
            });
          })()}
        </div>
      )}
    </div>
  );
}
