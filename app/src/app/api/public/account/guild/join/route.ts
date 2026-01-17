import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateWebAccount } from "@/lib/account";
import { authOptions } from "@/lib/auth-options";

const schema = z.object({
  tagOrCode: z.string().trim().min(2).max(64),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "BAD_REQUEST", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const account = await getOrCreateWebAccount(session.user as any);
  const raw = parsed.data.tagOrCode;
  const tag = raw.toUpperCase();

  const guild = await prisma.guild.findFirst({
    where: { OR: [{ tag }, { name: raw }] },
  });

  if (!guild) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Guild not found." },
      { status: 404 }
    );
  }

  try {
    await prisma.guildMember.create({
      data: { guildId: guild.id, accountId: account.id, role: "MEMBER" },
    });

    return NextResponse.json({
      ok: true,
      guild: { id: guild.id.toString(), name: guild.name, tag: guild.tag },
    });
  } catch {
    return NextResponse.json(
      { error: "CONFLICT", message: "Already a member of this guild." },
      { status: 409 }
    );
  }
}
