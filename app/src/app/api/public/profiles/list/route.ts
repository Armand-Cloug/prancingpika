import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const accounts = await prisma.webAccount.findMany({
    where: { displayName: { not: null } },
    orderBy: { displayName: "asc" },
    select: {
      displayName: true,
      riftCharacters: {
        select: { shard: true },
      },
    },
  });

  const list = accounts.map((a) => {
    const shardCounts: Record<string, number> = {};
    for (const c of a.riftCharacters) {
      shardCounts[c.shard] = (shardCounts[c.shard] ?? 0) + 1;
    }
    let mainShard: string | null = null;
    let maxCount = 0;
    for (const [shard, count] of Object.entries(shardCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mainShard = shard;
      }
    }

    return {
      displayName: a.displayName!,
      characterCount: a.riftCharacters.length,
      mainShard,
    };
  });

  return NextResponse.json(list);
}
