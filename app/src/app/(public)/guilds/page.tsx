import GuildsClient from "@/components/page/public/guilds/GuildsClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GuildsPage() {
  const guilds = await prisma.guild.findMany({
    select: { id: true, name: true, tag: true },
    orderBy: { name: "asc" },
  });

  const items = guilds.map((g) => ({
    id: g.id.toString(),
    name: g.name,
    tag: g.tag ?? null,
  }));

  return (
    <main className="min-h-screen bg-[#1F2B3A] text-zinc-100">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_15%_10%,rgba(56,189,248,0.10),transparent_55%),radial-gradient(1000px_circle_at_85%_15%,rgba(167,139,250,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(31,43,58,0.45),rgba(31,43,58,0.95))]" />
      </div>

      <section className="w-full px-4 sm:px-6 lg:px-10 pt-24 pb-14">
        <GuildsClient initialGuilds={items} />
      </section>
    </main>
  );
}
