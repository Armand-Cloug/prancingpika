// src/components/page/public/account/DisplayNamePanel.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DISPLAY_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export default function DisplayNamePanel({
  currentDisplayName,
  onSaved,
}: {
  currentDisplayName: string | null;
  onSaved: (name: string) => void;
}) {
  const [value, setValue]   = React.useState(currentDisplayName ?? "");
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError]   = React.useState<string | null>(null);

  // Sync when parent updates (e.g. after initial load)
  React.useEffect(() => {
    setValue(currentDisplayName ?? "");
  }, [currentDisplayName]);

  const clientError = (() => {
    if (value.length === 0) return null;
    if (value.length < 3) return "At least 3 characters required";
    if (value.length > 32) return "Maximum 32 characters";
    if (!DISPLAY_NAME_REGEX.test(value)) return "Only letters, numbers, _ and - allowed";
    return null;
  })();

  async function handleSave() {
    setError(null);
    setSuccess(null);
    if (clientError) return;
    setSaving(true);
    try {
      const res = await fetch("/api/public/account/display-name", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "An error occurred");
      } else {
        setSuccess(data.displayName);
        onSaved(data.displayName);
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  const displayedName = success ?? currentDisplayName;

  return (
    <Card className="border-white/10 bg-[#253649]/70 backdrop-blur shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl text-zinc-100">
          <span className="mr-2">🏷️</span>Public Profile
        </CardTitle>
        <p className="text-sm text-zinc-200/85">
          Choose a name to appear on the profiles page. Letters, numbers, _ -
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
              setSuccess(null);
            }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            placeholder="YourName"
            maxLength={32}
            className="flex-1 rounded-lg border border-white/10 bg-[#1F2B3A]/55 px-3 py-2
                       text-sm text-zinc-100 placeholder-zinc-500
                       focus:outline-none focus:ring-1 focus:ring-sky-400/50"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !!clientError || value.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg btn-sky
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : null}
            Save
          </button>
        </div>

        {(clientError && value.length > 0) && (
          <p className="text-xs text-amber-400">{clientError}</p>
        )}
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
        {displayedName && !error && (
          <p className="text-xs text-emerald-400">
            ✅ Visible as &ldquo;{displayedName}&rdquo; on /profiles
          </p>
        )}
      </CardContent>
    </Card>
  );
}
