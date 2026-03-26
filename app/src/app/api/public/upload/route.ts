// src/app/api/public/upload/route.ts
export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import path from "node:path";
import crypto from "node:crypto";
import { mkdir, rename, rm } from "node:fs/promises";
import { createWriteStream, existsSync } from "node:fs";
import Busboy from "busboy";

import { prisma } from "@/lib/prisma";
import { getOrCreateWebAccount } from "@/lib/account";
import { requireAuthIdentity } from "@/lib/auth-identity";

// ─── Limits & allowed values ──────────────────────────────────────────────────

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_MB    = 50;

/** Extensions accepted on the client-supplied filename (case-insensitive). */
const ALLOWED_EXTENSIONS = new Set([".log", ".txt"]);

/** The only MIME type we accept for uploaded files. */
const ALLOWED_MIME = "text/plain";

// ─── Types ────────────────────────────────────────────────────────────────────

// Minimal Busboy file info type (avoids relying on exact @types/busboy exports)
type BusboyFileInfo = {
  filename: string;
  encoding: string;
  mimeType: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function headersToObject(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((v, k) => (obj[k] = v));
  return obj;
}

/** Best-effort extraction of the client IP from common proxy headers. */
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Log a rejected upload attempt.
 * Fields: ISO timestamp, client IP, original filename, rejection reason.
 */
function logRejection(ip: string, filename: string, reason: string): void {
  console.warn(
    `[upload-rejected] ts=${new Date().toISOString()} ip=${ip} ` +
    `file=${JSON.stringify(filename)} reason=${reason}`
  );
}

/** Return true if the first 1 024 bytes of buf contain a NUL byte. */
function hasNullBytes(buf: Buffer): boolean {
  const limit = Math.min(buf.length, 1024);
  for (let i = 0; i < limit; i++) {
    if (buf[i] === 0) return true;
  }
  return false;
}

function sanitizeFileName(name: string) {
  const cleaned = (name || "combat.log.txt")
    .replace(/[^\w.\-]+/g, "_")
    .slice(0, 120);

  // input often "combat.log" → store as "combat.log.txt"
  if (cleaned.toLowerCase().endsWith(".txt")) return cleaned;
  if (cleaned.toLowerCase() === "combat.log") return "combat.log.txt";
  if (cleaned.toLowerCase().endsWith(".log")) return `${cleaned}.txt`;
  return `${cleaned}.txt`;
}

function normalizeProvider(p: unknown): "google" | "discord" | null {
  if (p === "google" || p === "discord") return p;
  return null;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const auth = await requireAuthIdentity(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  // Normalize identity to match your DB enum (google/discord only)
  const provider = normalizeProvider((auth.identity as any)?.provider);
  if (!provider) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "Unsupported auth provider." },
      { status: 400 }
    );
  }

  const identityForAccount = { ...(auth.identity as any), provider };
  const account = await getOrCreateWebAccount(identityForAccount);

  const baseDir =
    process.env.COMBATLOG_DIR || path.join(process.cwd(), "..", "combat.log");
  const tmpDir = path.join(baseDir, ".tmp");

  await mkdir(baseDir, { recursive: true });
  await mkdir(tmpDir, { recursive: true });

  let guildIdRaw  = "";
  let storedName  = "";
  let tmpPath     = "";
  let fileSize    = 0;
  let hadFile     = false;
  let fileRejected = false; // true once any file-level rejection has fired

  const bb = Busboy({
    headers: headersToObject(req.headers),
    limits: { fileSize: MAX_BYTES },
  });

  const done = new Promise<NextResponse>((resolve) => {
    bb.on("field", (name: string, value: string) => {
      if (name === "guildId") guildIdRaw = String(value || "").trim();
    });

    bb.on(
      "file",
      (name: string, file: NodeJS.ReadableStream, info: BusboyFileInfo) => {
        if (name !== "file") {
          file.resume();
          return;
        }

        hadFile = true;
        const original = info.filename || "combat.log.txt";

        // ── 1. Extension check (on the raw, unsanitised filename) ────────────
        const ext = path.extname(original).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext)) {
          file.resume();
          fileRejected = true;
          logRejection(ip, original, `disallowed extension: "${ext}"`);
          resolve(
            NextResponse.json(
              { error: "BAD_REQUEST", message: "Only plain text log files are accepted (.log, .txt)." },
              { status: 400 }
            )
          );
          return;
        }

        // ── 2. MIME type check (client-declared; do not trust alone) ─────────
        const declaredMime = (info.mimeType || "").split(";")[0].trim().toLowerCase();
        if (declaredMime !== "" && declaredMime !== ALLOWED_MIME) {
          file.resume();
          fileRejected = true;
          logRejection(ip, original, `disallowed MIME type: "${declaredMime}"`);
          resolve(
            NextResponse.json(
              { error: "BAD_REQUEST", message: "Only plain text log files are accepted: invalid MIME type." },
              { status: 400 }
            )
          );
          return;
        }

        storedName = sanitizeFileName(original);

        const id = crypto.randomUUID();
        tmpPath = path.join(tmpDir, `${id}.upload`);
        const ws = createWriteStream(tmpPath);

        // ── 3. Binary-content sniff (first 1 024 bytes) ──────────────────────
        let sniffBuf  = Buffer.alloc(0);
        let sniffDone = false;

        const handleData = (chunk: Buffer) => {
          if (fileRejected) return;
          fileSize += chunk.length;

          if (!sniffDone) {
            sniffBuf = Buffer.concat([sniffBuf, chunk]);
            if (sniffBuf.length >= 1024) {
              sniffDone = true;
              if (hasNullBytes(sniffBuf)) {
                fileRejected = true;
                ws.destroy();
                rm(tmpPath, { force: true }).catch(() => {});
                logRejection(ip, original, "binary content (null bytes in first 1KB)");
                resolve(
                  NextResponse.json(
                    { error: "BAD_REQUEST", message: "Only plain text log files are accepted: binary content detected." },
                    { status: 400 }
                  )
                );
              }
            }
          }
        };

        const handleEnd = () => {
          if (fileRejected) return;
          // Final sniff for files smaller than 1 024 bytes
          if (!sniffDone) {
            sniffDone = true;
            if (hasNullBytes(sniffBuf)) {
              fileRejected = true;
              ws.destroy();
              rm(tmpPath, { force: true }).catch(() => {});
              logRejection(ip, original, "binary content (null bytes in file < 1KB)");
              resolve(
                NextResponse.json(
                  { error: "BAD_REQUEST", message: "Only plain text log files are accepted: binary content detected." },
                  { status: 400 }
                )
              );
            }
          }
        };

        (file as any).on("data",  handleData);
        (file as any).on("end",   handleEnd);

        (file as any).on("limit", async () => {
          ws.destroy();
          try { await rm(tmpPath, { force: true }); } catch {}
          fileRejected = true;
          logRejection(ip, original, `file too large (limit: ${MAX_MB}MB)`);
          resolve(
            NextResponse.json(
              { error: "BAD_REQUEST", message: `File too large: maximum is ${MAX_MB}MB.` },
              { status: 400 }
            )
          );
        });

        (file as any).on("error", async () => {
          ws.destroy();
          try { await rm(tmpPath, { force: true }); } catch {}
          if (!fileRejected) {
            fileRejected = true;
            resolve(
              NextResponse.json(
                { error: "BAD_REQUEST", message: "Upload stream error." },
                { status: 400 }
              )
            );
          }
        });

        ws.on("error", async () => {
          try { await rm(tmpPath, { force: true }); } catch {}
          if (!fileRejected) {
            fileRejected = true;
            resolve(
              NextResponse.json(
                { error: "BAD_REQUEST", message: "Cannot write file." },
                { status: 400 }
              )
            );
          }
        });

        file.pipe(ws);
      }
    );

    bb.on("error", async (_err: unknown) => {
      try {
        if (tmpPath) await rm(tmpPath, { force: true });
      } catch {}
      if (!fileRejected) {
        resolve(
          NextResponse.json(
            { error: "BAD_REQUEST", message: "Upload parse error." },
            { status: 400 }
          )
        );
      }
    });

    bb.on("finish", async () => {
      // Bail out if the file was already rejected during streaming
      if (fileRejected) return;

      if (!hadFile || !tmpPath) {
        resolve(
          NextResponse.json(
            { error: "BAD_REQUEST", message: "Missing file." },
            { status: 400 }
          )
        );
        return;
      }

      if (!guildIdRaw) {
        try { await rm(tmpPath, { force: true }); } catch {}
        resolve(
          NextResponse.json(
            { error: "BAD_REQUEST", message: "Missing guildId." },
            { status: 400 }
          )
        );
        return;
      }

      // Verify membership for chosen guild
      let guildIdBig: bigint;
      try {
        guildIdBig = BigInt(guildIdRaw);
      } catch {
        try { await rm(tmpPath, { force: true }); } catch {}
        resolve(
          NextResponse.json(
            { error: "BAD_REQUEST", message: "Invalid guildId." },
            { status: 400 }
          )
        );
        return;
      }

      const membership = await prisma.guildMember.findFirst({
        where: { accountId: account.id, guildId: guildIdBig },
        include: { guild: true },
      });

      if (!membership) {
        try { await rm(tmpPath, { force: true }); } catch {}
        resolve(
          NextResponse.json(
            { error: "FORBIDDEN", message: "You must be a member of that guild." },
            { status: 403 }
          )
        );
        return;
      }

      // Avoid collisions
      const base = storedName.replace(/\.txt$/i, "");
      let finalName = storedName;
      let finalPath = path.join(baseDir, finalName);

      if (existsSync(finalPath)) {
        const id = crypto.randomUUID().slice(0, 8);
        finalName = `${base}-${id}.txt`;
        finalPath = path.join(baseDir, finalName);
      }

      await rename(tmpPath, finalPath);

      // Trigger parser service (best effort)
      const parserUrl = process.env.PARSER_URL;
      let parser: unknown = null;

      if (parserUrl) {
        try {
          const r = await fetch(`${parserUrl}/parse`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: finalName,
              guildId: membership.guildId.toString(),
              uploaderAccountId: account.id.toString(),
            }),
          });
          parser = await r.json().catch(() => ({ ok: false, error: "BAD_JSON" }));
        } catch {
          parser = { ok: false, error: "PARSER_UNREACHABLE" };
        }
      }

      // Notify Discord bot API (best effort)
      const botUrl = process.env.BOT_URL;
      let bot: unknown = null;

      if (botUrl) {
        try {
          const r = await fetch(`${botUrl}/notify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "combatlog_uploaded",
              guild: {
                id: membership.guildId.toString(),
                name: membership.guild.name,
                tag: membership.guild.tag,
              },
              uploaderAccountId: account.id.toString(),
              file: {
                fileName: finalName,
                fileSize,
                relativePath: `combat.log/${finalName}`,
              },
              parser,
              at: new Date().toISOString(),
            }),
          });
          bot = await r.json().catch(() => ({ ok: false, error: "BAD_JSON" }));
        } catch {
          bot = { ok: false, error: "BOT_UNREACHABLE" };
        }
      }

      resolve(
        NextResponse.json({
          ok: true,
          guild: {
            id: membership.guildId.toString(),
            name: membership.guild.name,
            tag: membership.guild.tag,
          },
          file: {
            fileName: finalName,
            fileSize,
            path: `combat.log/${finalName}`,
          },
          parser,
          bot,
        })
      );
    });
  });

  // Pipe request body to busboy
  if (!req.body) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "Missing request body." },
      { status: 400 }
    );
  }

  const { Readable } = await import("node:stream");
  Readable.fromWeb(req.body as any).pipe(bb);

  return done;
}
