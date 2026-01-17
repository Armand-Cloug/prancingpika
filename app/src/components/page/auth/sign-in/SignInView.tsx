// src/components/page/auth/sign-in/SignInView.tsx
import { Button } from "@/components/ui/button";
import SignInBackground from "./SignInBackground";
import { DiscordIcon, GoogleIcon } from "./icons";

type Provider = "google" | "discord";

export default function SignInView({
  loading,
  errorLabel,
  onGoogle,
  onDiscord,
}: {
  loading: Provider | null;
  errorLabel: string | null;
  onGoogle: () => void;
  onDiscord: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#1F2B3A] text-zinc-100">
      <SignInBackground />

      <section className="mx-auto flex min-h-screen max-w-6xl items-center px-6">
        <div className="w-full">
          <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#253649]/70 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200/90">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
              Sign in
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-zinc-200/85">Choose a provider to continue.</p>

            {errorLabel && (
              <div className="mt-5 rounded-xl border border-rose-300/20 bg-rose-500/10 p-4 text-sm text-rose-100">
                {errorLabel}
              </div>
            )}

            <div className="mt-6 space-y-3">
              <Button
                type="button"
                onClick={onGoogle}
                disabled={loading !== null}
                className="h-11 w-full justify-center gap-2 bg-white text-zinc-900 hover:bg-white/90"
              >
                <GoogleIcon />
                {loading === "google" ? "Connecting…" : "Continue with Google"}
              </Button>

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
