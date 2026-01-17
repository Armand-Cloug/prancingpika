// src/lib/auth-identity.ts
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";

function inferProviderFromIss(iss?: string): "google" | "discord" | "oauth" | undefined {
  if (!iss) return undefined;
  const s = iss.toLowerCase();
  if (s.includes("google")) return "google";
  if (s.includes("discord")) return "discord";
  return "oauth";
}

export async function requireAuthIdentity(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { ok: false as const, status: 401 as const, message: "UNAUTHORIZED" };
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });

  const provider =
    (session.user as any).provider ??
    (token as any)?.provider ??
    inferProviderFromIss((token as any)?.iss);

  const providerAccountId =
    (session.user as any).providerAccountId ??
    (token as any)?.providerAccountId ??
    token?.sub;

  const pseudo =
    (session.user as any).pseudo ??
    (token as any)?.pseudo ??
    session.user.name ??
    session.user.email ??
    "User";

  if (!provider || !providerAccountId) {
    return {
      ok: false as const,
      status: 500 as const,
      message: "AUTH_IDENTITY_MISSING (set NEXTAUTH_SECRET and re-login)",
    };
  }

  return {
    ok: true as const,
    identity: {
      provider: provider as "google" | "discord" | "oauth",
      providerAccountId: String(providerAccountId),
      pseudo: String(pseudo),
      email: session.user.email ?? null,
      image: (session.user as any).image ?? null,
    },
  };
}
