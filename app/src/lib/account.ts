// src/lib/account.ts
import { prisma } from "@/lib/prisma";

type SessionUser = {
  pseudo?: string | null;
  provider?: "google" | "discord";
  providerAccountId?: string;
  email?: string | null;
  image?: string | null;
};

export async function getOrCreateWebAccount(user: SessionUser) {
  if (!user?.provider || !user?.providerAccountId) {
    throw new Error("Missing provider/providerAccountId in session.user");
  }

  const pseudo = (user.pseudo || user.email || "User").slice(0, 128);

  return prisma.webAccount.upsert({
    where: {
      provider_providerAccountId: {
        provider: user.provider,
        providerAccountId: user.providerAccountId,
      },
    },
    create: {
      provider: user.provider,
      providerAccountId: user.providerAccountId,
      pseudo,
      email: user.email ?? null,
      imageUrl: user.image ?? null,
    },
    update: {
      pseudo,
      email: user.email ?? null,
      imageUrl: user.image ?? null,
      lastLogin: new Date(),
    },
  });
}
