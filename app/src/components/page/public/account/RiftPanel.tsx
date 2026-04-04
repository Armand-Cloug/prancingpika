// src/components/page/public/account/RiftPanel.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type RiftCharacterDTO = {
  name: string;
  shard: string;
  calling: string;
  level: number;
  guild: string | null;
  lastSeenAt: string;
};

export default function RiftPanel({
  riftLocked,
  riftLinkedAt,
  characters,
  onRefresh,
}: {
  riftLocked: boolean;
  riftLinkedAt: string | null;
  characters: RiftCharacterDTO[];
  onRefresh: () => Promise<void> | void;
}) {
  const [generatedCode, setGeneratedCode] = React.useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = React.useState<Date | null>(null);
  const [generating, setGenerating] = React.useState(false);
  const [codeError, setCodeError] = React.useState<string | null>(null);
  const [countdown, setCountdown] = React.useState("");
  const [polling, setPolling] = React.useState(false);

  // Countdown affiché sous le code
  React.useEffect(() => {
    if (!codeExpiresAt) return;
    const tick = () => {
      const remaining = Math.floor((codeExpiresAt.getTime() - Date.now()) / 1000);
      if (remaining <= 0) {
        setCountdown("Expiré");
        setGeneratedCode(null);
        setCodeExpiresAt(null);
        return;
      }
      const m = Math.floor(remaining / 60).toString().padStart(2, "0");
      const s = (remaining % 60).toString().padStart(2, "0");
      setCountdown(`${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [codeExpiresAt]);

  // Polling indépendant : vérifie toutes les 3 s si le compte est désormais lié
  React.useEffect(() => {
    if (!polling) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/public/account/me");
        if (!res.ok) return;
        const json = await res.json();
        if (json.rift?.locked) {
          setPolling(false);
          await onRefresh();
        }
      } catch {
        // erreurs réseau ignorées silencieusement
      }
    }, 3000);
    return () => clearInterval(id);
  }, [polling, onRefresh]);

  // Démarrer le polling dès qu'un code est affiché (et que le compte n'est pas encore lié)
  React.useEffect(() => {
    if (generatedCode && !riftLocked) {
      setPolling(true);
    } else {
      setPolling(false);
    }
  }, [generatedCode, riftLocked]);

  // Arrêter le polling si le composant reçoit riftLocked=true depuis le parent
  React.useEffect(() => {
    if (riftLocked) {
      setPolling(false);
      setGeneratedCode(null);
      setCodeExpiresAt(null);
    }
  }, [riftLocked]);

  async function handleGenerateCode() {
    setGenerating(true);
    setCodeError(null);
    try {
      const res = await fetch("/api/public/rift/generate-code", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setCodeError(json.error ?? "Erreur inconnue");
        return;
      }
      setGeneratedCode(json.code);
      setCodeExpiresAt(new Date(json.expiresAt));
    } catch {
      setCodeError("Erreur réseau");
    } finally {
      setGenerating(false);
    }
  }

  // ── État lié ──────────────────────────────────────────────────────────────
  if (riftLocked) {
    const lastSync =
      characters.length > 0
        ? new Date(
            Math.max(...characters.map((c) => new Date(c.lastSeenAt).getTime()))
          )
        : null;

    return (
      <Card className="border-white/10 bg-[#253649]/70 backdrop-blur shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-zinc-100 flex items-center gap-3">
            Compte RIFT
            <span className="text-sm font-normal text-emerald-400">✓ Lié</span>
          </CardTitle>
          <p className="text-sm text-zinc-200/85">
            {riftLinkedAt
              ? `Lié le ${new Date(riftLinkedAt).toLocaleDateString("fr-FR")} · `
              : ""}
            {characters.length} personnage{characters.length > 1 ? "s" : ""}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {characters.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-[#1F2B3A]/35 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-zinc-200/60 text-xs">Personnage</TableHead>
                    <TableHead className="text-zinc-200/60 text-xs">Niveau</TableHead>
                    <TableHead className="text-zinc-200/60 text-xs">Classe</TableHead>
                    <TableHead className="text-zinc-200/60 text-xs">Shard</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {characters.map((c) => (
                    <TableRow
                      key={`${c.name}-${c.shard}`}
                      className="border-white/10 hover:bg-white/5"
                    >
                      <TableCell className="text-zinc-100 font-medium">{c.name}</TableCell>
                      <TableCell className="text-zinc-200/80">{c.level}</TableCell>
                      <TableCell className="text-zinc-200/80">{c.calling}</TableCell>
                      <TableCell className="text-zinc-200/80">{c.shard}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {lastSync && (
            <p className="text-xs text-zinc-200/60">
              Dernière sync : {formatRelativeTime(lastSync)}
            </p>
          )}

          <p className="text-xs text-zinc-200/60">
            Pour modifier la liaison, contacte un administrateur.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── État non lié ─────────────────────────────────────────────────────────
  return (
    <Card className="border-white/10 bg-[#253649]/70 backdrop-blur shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl text-zinc-100">Compte RIFT</CardTitle>
        <p className="text-sm text-zinc-200/85">
          Associe ton compte RIFT in-game à ce profil.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="rounded-xl border border-white/10 bg-[#1F2B3A]/55 p-4">
          <ol className="text-sm text-zinc-200/80 space-y-1.5 list-decimal list-inside">
            <li>Installe l'addon PrancingPika in-game</li>
            <li>
              Tape{" "}
              <code className="font-mono text-sky-400 bg-sky-400/10 px-1 rounded">
                /pp generate
              </code>{" "}
              en jeu
            </li>
            <li>Clique sur &quot;Générer un code&quot; ci-dessous</li>
            <li>Entre le code affiché sur l'écran RIFT</li>
          </ol>
        </div>

        <div className="flex gap-3">
          <Input
            readOnly
            placeholder="PP-______"
            value={generatedCode ?? ""}
            maxLength={9}
            className="font-mono text-sky-300 bg-[#1F2B3A]/55 border-white/10"
          />
          <Button
            onClick={handleGenerateCode}
            disabled={generating}
            className="shrink-0"
          >
            {generating ? (
              <>
                <SpinnerIcon />
                Génération…
              </>
            ) : (
              "Générer un code"
            )}
          </Button>
        </div>

        {codeError && (
          <p className="text-xs text-red-300">{codeError}</p>
        )}

        {generatedCode && codeExpiresAt && (
          <p className="text-xs text-zinc-200/60">
            Code actif jusqu&apos;à{" "}
            {codeExpiresAt.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}{" "}
            ({countdown})
          </p>
        )}

        {generatedCode && (
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 flex items-center gap-2">
            <SpinnerIcon className="text-sky-400/70 shrink-0" />
            <p className="text-xs text-sky-300/80">
              En attente de confirmation depuis l'addon…
            </p>
          </div>
        )}

        <p className="text-xs text-amber-300/70">
          ⚠ Une fois lié, impossible de changer de compte RIFT sans contacter un
          administrateur.
        </p>
      </CardContent>
    </Card>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`size-3.5 animate-spin ${className ?? ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

function formatRelativeTime(date: Date): string {
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} minute${diffMin > 1 ? "s" : ""}`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} heure${diffH > 1 ? "s" : ""}`;
  const diffD = Math.floor(diffH / 24);
  return `il y a ${diffD} jour${diffD > 1 ? "s" : ""}`;
}
