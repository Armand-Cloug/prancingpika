import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateWebAccount } from "@/lib/account";
import { authOptions } from "@/lib/auth-options";

const DISPLAY_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: { displayName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const displayName = body.displayName?.trim() ?? "";

  if (displayName.length < 3 || displayName.length > 32) {
    return NextResponse.json(
      { error: "Display name must be between 3 and 32 characters" },
      { status: 400 }
    );
  }

  if (!DISPLAY_NAME_REGEX.test(displayName)) {
    return NextResponse.json(
      { error: "Only letters, numbers, _ and - allowed" },
      { status: 400 }
    );
  }

  const account = await getOrCreateWebAccount(session.user as any);

  try {
    await prisma.webAccount.update({
      where: { id: account.id },
      data: { displayName },
    });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "This name is already taken" },
        { status: 409 }
      );
    }
    throw e;
  }

  return NextResponse.json({ displayName });
}
