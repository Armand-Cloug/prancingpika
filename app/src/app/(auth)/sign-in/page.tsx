// src/app/sign-in/page.tsx
import { Suspense } from "react";
import SignInClient from "@/components/page/auth/sign-in/SignInClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#1F2B3A] text-zinc-100">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#253649]/70 p-6">
              Loading…
            </div>
          </div>
        </main>
      }
    >
      <SignInClient />
    </Suspense>
  );
}
