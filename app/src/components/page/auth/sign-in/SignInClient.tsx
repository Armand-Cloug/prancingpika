// src/components/page/auth/sign-in/SignInClient.tsx
"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import SignInView from "./SignInView";

type Provider = "google" | "discord";

export default function SignInClient() {
  const params = useSearchParams();
  const [loading, setLoading] = useState<Provider | null>(null);

  const errorLabel = useMemo(() => {
    const err = params.get("error");
    if (!err) return null;

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

  const callbackUrl = useMemo(() => {
    return params.get("callbackUrl") ?? "/";
  }, [params]);

  async function onProvider(provider: Provider) {
    setLoading(provider);
    // NextAuth redirige normalement, donc ce state ne “revient” pas souvent,
    // mais en cas d’échec, on reset.
    const res = await signIn(provider, { callbackUrl, redirect: true }).catch(() => null);
    if (res && (res as any).error) setLoading(null);
  }

  return (
    <SignInView
      loading={loading}
      errorLabel={errorLabel}
      onGoogle={() => onProvider("google")}
      onDiscord={() => onProvider("discord")}
    />
  );
}
