// src/lib/auth-options.ts
import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      // scope par défaut ok pour id/username, mais tu peux expliciter:
      // authorization: { params: { scope: "identify" } },
    }),
  ],

  pages: { signIn: "/sign-in" },

  callbacks: {
    async jwt({ token, account, profile, user }) {
      // Ces infos ne sont présentes que lors du login / refresh
      if (account) {
        (token as any).provider = account.provider; // "google" | "discord"
        (token as any).providerAccountId = account.providerAccountId; // ✅ clé stable
      }

      // pseudo (Google = full name, Discord = username/global_name)
      if ((token as any).provider === "google") {
        const p: any = profile;
        (token as any).pseudo = p?.name ?? user?.name ?? (token as any).pseudo;
      } else if ((token as any).provider === "discord") {
        const p: any = profile;
        (token as any).pseudo =
          p?.global_name || p?.username || user?.name || (token as any).pseudo;
      } else {
        (token as any).pseudo = user?.name ?? (token as any).pseudo;
      }

      return token;
    },

    async session({ session, token }) {
      (session.user as any).provider = (token as any).provider;
      (session.user as any).providerAccountId = (token as any).providerAccountId;
      (session.user as any).pseudo =
        (token as any).pseudo ?? session.user?.name ?? session.user?.email ?? "User";
      return session;
    },
  },
};
