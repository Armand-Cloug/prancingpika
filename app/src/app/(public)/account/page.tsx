// src/app/account/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

import AccountPage from "@/components/page/public/account/AccountPage";

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/sign-in");
  }

  return <AccountPage />;
}
