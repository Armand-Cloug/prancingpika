import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateWebAccount } from "@/lib/account";
import { authOptions } from "@/lib/auth-options";

const schema = z.object({
  name: z.string().trim().min(3).max(32),
  tag: z
    .string()
    .trim()
    .min(2)
    .max(6)
    .regex(/^[A-Za-z0-9]+$/)
    .transform((v) => v.toUpperCase()),
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
  const { name, tag } = parsed.data;

  try {
    const guild = await prisma.guild.create({
      data: {
        name,
        tag,
        members: {
          create: {
            accountId: account.id,
            role: "OWNER",
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      guild: { id: guild.id.toString(), name: guild.name, tag: guild.tag },
    });
  } catch {
    return NextResponse.json(
      { error: "CONFLICT", message: "Guild name or tag already exists." },
      { status: 409 }
    );
  }
}
