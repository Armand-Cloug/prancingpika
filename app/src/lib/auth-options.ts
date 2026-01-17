// src/lib/auth-options.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";

type SupportedProvider = "google" | "discord";

function pickPseudo(provider: SupportedProvider, profile: any, user: any) {
  if (provider === "discord") {
    // Discord: global_name > username
    return (
      profile?.global_name ||
      profile?.username ||
      user?.name ||
      "DiscordUser"
    );
  }

  // Google: full name
  return profile?.name || user?.name || "GoogleUser";
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, account, profile, user }) {
      // Au moment du login, NextAuth fournit `account`
      if (account) {
        // IMPORTANT : account.provider = "google" | "discord"
        // (et account.type = "oauth" -> ne pas utiliser)
        const provider = account.provider as SupportedProvider;

        token.provider = provider;
        token.providerAccountId = account.providerAccountId;

        token.pseudo = pickPseudo(provider, profile, user);
        token.email = token.email ?? (user as any)?.email ?? null;
        token.picture = token.picture ?? (user as any)?.image ?? null;
      }

      return token;
    },

    async session({ session, token }) {
      // On expose les champs dans session.user
      (session.user as any).provider = (token as any).provider;
      (session.user as any).providerAccountId = (token as any).providerAccountId;
      (session.user as any).pseudo = (token as any).pseudo ?? session.user?.name ?? "User";

      // on garde les champs utiles
      session.user = {
        ...session.user,
        name: (session.user?.name ?? (token as any).pseudo ?? "User") as string,
        email: (session.user?.email ?? (token as any).email ?? null) as any,
        image: (session.user as any)?.image ?? (token as any).picture ?? null,
      };

      return session;
    },
  },
};
