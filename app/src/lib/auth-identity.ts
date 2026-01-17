// src/lib/auth-identity.ts
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth-options";

// NextAuth v4 (souvent)
import { getServerSession } from "next-auth/next";
// Si tu es en NextAuth v5, remplace la ligne au-dessus par :
// import { getServerSession } from "next-auth";

export type AuthProvider = "google" | "discord";

export type AuthIdentity = {
  provider: AuthProvider;
  providerAccountId: string;
  pseudo: string;
  email: string | null;
  image: string | null;
};

export type AuthResult =
  | { ok: true; status: 200; identity: AuthIdentity }
  | { ok: false; status: 401 | 403; message: string };

export async function requireAuthIdentity(_req: NextRequest): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  const user = session?.user as any;
  if (!user) return { ok: false, status: 401, message: "Not authenticated" };

  const provider = user.provider as AuthProvider | undefined;
  const providerAccountId = user.providerAccountId as string | undefined;

  if (!provider || (provider !== "google" && provider !== "discord")) {
    return { ok: false, status: 401, message: "Missing/invalid provider in session" };
  }

  if (!providerAccountId) {
    return { ok: false, status: 401, message: "Missing providerAccountId in session" };
  }

  return {
    ok: true,
    status: 200,
    identity: {
      provider,
      providerAccountId,
      pseudo: (user.pseudo || user.name || user.email || "User").slice(0, 128),
      email: user.email ?? null,
      image: user.image ?? null,
    },
  };
}
