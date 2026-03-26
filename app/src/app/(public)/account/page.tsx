// src/app/account/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "My Account",
  description: "Manage your PrancingPika account — upload RIFT combat logs, join or create a guild, and view your parse history.",
  path: "/account",
  noIndex: true,
});

import AccountPage from "@/components/page/public/account/AccountPage";

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/sign-in");
  }

  return <AccountPage />;
}
