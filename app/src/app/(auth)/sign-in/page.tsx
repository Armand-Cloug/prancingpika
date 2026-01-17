// src/app/sign-in/page.tsx
'use client';

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const params = useSearchParams();
  const [loading, setLoading] = useState<"google" | "discord" | null>(null);

  const errorLabel = useMemo(() => {
    const err = params.get("error");
    if (!err) return null;

    // NextAuth error codes (common ones)
    const map: Record<string, string> = {
      OAuthSignin: "OAuth sign-in failed. Please retry.",
      OAuthCallback: "OAuth callback failed. Please retry.",
      OAuthCreateAccount: "Account creation failed. Please retry.",
      EmailCreateAccount: "Account creation failed. Please retry.",
      Callback: "Sign-in callback failed. Please retry.",
      OAuthAccountNotLinked: "This email is already linked to another provider.",
      SessionRequired: "Please sign in to continue.",
      AccessDenied: "Access denied.",
      Configuration: "Authentication is not configured correctly.",
      Default: "Sign-in failed. Please retry.",
    };

    return map[err] ?? map.Default;
  }, [params]);

  const callbackUrl = params.get("callbackUrl") ?? "/";

  async function onGoogle() {
    setLoading("google");
    await signIn("google", { callbackUrl });
  }

  async function onDiscord() {
    setLoading("discord");
    await signIn("discord", { callbackUrl });
  }

  return (
    <main className="min-h-screen bg-[#1F2B3A] text-zinc-100">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_10%,rgba(56,189,248,0.12),transparent_55%),radial-gradient(900px_circle_at_85%_20%,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(31,43,58,0.45),rgba(31,43,58,0.92))]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:140px_140px]" />
      </div>

      <section className="mx-auto flex min-h-screen max-w-6xl items-center px-6">
        <div className="w-full">
          <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#253649]/70 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200/90">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
              Sign in
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-zinc-200/85">
              Choose a provider to continue.
            </p>

            {errorLabel && (
              <div className="mt-5 rounded-xl border border-rose-300/20 bg-rose-500/10 p-4 text-sm text-rose-100">
                {errorLabel}
              </div>
            )}

            <div className="mt-6 space-y-3">
              {/* Google */}
              <Button
                type="button"
                onClick={onGoogle}
                disabled={loading !== null}
                className="h-11 w-full justify-center gap-2 bg-white text-zinc-900 hover:bg-white/90"
              >
                <GoogleIcon />
                {loading === "google" ? "Connecting…" : "Continue with Google"}
              </Button>

              {/* Discord */}
              <Button
                type="button"
                onClick={onDiscord}
                disabled={loading !== null}
                className="h-11 w-full justify-center gap-2 bg-[#5865F2] text-white hover:bg-[#4F5AE6]"
              >
                <DiscordIcon />
                {loading === "discord" ? "Connecting…" : "Continue with Discord"}
              </Button>
            </div>

            <div className="pointer-events-none mx-auto mt-6 h-px w-2/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" />

            <p className="mt-4 text-center text-xs text-zinc-200/60">
              By signing in, you agree to the site rules.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

/** Minimal brand-ish icons (no extra deps) */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.648 32.657 29.239 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.268 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.217 0-9.615-3.317-11.289-7.946l-6.52 5.02C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.793 2.22-2.231 4.081-4.084 5.238l.003-.002 6.19 5.238C36.971 39.03 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 256 199" aria-hidden="true">
      <path
        fill="currentColor"
        d="M216.9 16.5A208.5 208.5 0 0 0 164.1 0a145.3 145.3 0 0 0-6.8 14.2a193.7 193.7 0 0 0-58.6 0A145.3 145.3 0 0 0 92 0a208.5 208.5 0 0 0-52.9 16.5C5.2 67.2-3.1 117.1 1 166.4a211.2 211.2 0 0 0 64.5 32.7a155.6 155.6 0 0 0 13.9-22.6a135.6 135.6 0 0 1-21.9-10.5c1.8-1.3 3.6-2.7 5.3-4.1a150.3 150.3 0 0 0 130.5 0c1.7 1.4 3.5 2.8 5.3 4.1a135.6 135.6 0 0 1-21.9 10.5a155.6 155.6 0 0 0 13.9 22.6A211.2 211.2 0 0 0 255 166.4c4.7-56.9-8-106.3-38.1-149.9ZM85.5 135.4c-12.5 0-22.7-11.5-22.7-25.6c0-14.1 10.1-25.6 22.7-25.6c12.6 0 22.8 11.5 22.7 25.6c0 14.1-10.1 25.6-22.7 25.6Zm85 0c-12.5 0-22.7-11.5-22.7-25.6c0-14.1 10.1-25.6 22.7-25.6c12.6 0 22.8 11.5 22.7 25.6c0 14.1-10.1 25.6-22.7 25.6Z"
      />
    </svg>
  );
}
