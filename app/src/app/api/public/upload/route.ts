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

const MAX_BYTES = 200 * 1024 * 1024;

function headersToObject(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((v, k) => (obj[k] = v));
  return obj;
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

export async function POST(req: NextRequest) {
  const auth = await requireAuthIdentity(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const account = await getOrCreateWebAccount(auth.identity);

  const baseDir =
    process.env.COMBATLOG_DIR || path.join(process.cwd(), "..", "combat.log"); // dev: /prancingpika/combat.log
  const tmpDir = path.join(baseDir, ".tmp");

  await mkdir(baseDir, { recursive: true });
  await mkdir(tmpDir, { recursive: true });

  let guildIdRaw = "";
  let storedName = "";
  let tmpPath = "";
  let fileSize = 0;
  let hadFile = false;

  const bb = Busboy({
    headers: headersToObject(req.headers),
    limits: { fileSize: MAX_BYTES },
  });

  const done = new Promise<NextResponse>((resolve) => {
    bb.on("field", (name, value) => {
      if (name === "guildId") guildIdRaw = String(value || "").trim();
    });

    bb.on("file", (name, file, info) => {
      if (name !== "file") {
        file.resume();
        return;
      }

      hadFile = true;

      const original = info.filename || "combat.log.txt";
      storedName = sanitizeFileName(original);

      // IMPORTANT: rules
      // - Authorized format: .txt (we enforce storedName ends with .txt)
      // - We tolerate "combat.log" & ".log" as input but we store as .txt
      if (!storedName.toLowerCase().endsWith(".txt")) {
        file.resume();
        resolve(NextResponse.json({ error: "BAD_REQUEST", message: "Only .txt files are allowed." }, { status: 400 }));
        return;
      }

      const id = crypto.randomUUID();
      tmpPath = path.join(tmpDir, `${id}.upload`);

      const ws = createWriteStream(tmpPath);

      file.on("data", (chunk) => {
        fileSize += chunk.length;
      });

      file.on("limit", async () => {
        ws.end();
        try { await rm(tmpPath, { force: true }); } catch {}
        resolve(NextResponse.json({ error: "BAD_REQUEST", message: "Max size is 200MB." }, { status: 400 }));
      });

      file.pipe(ws);
    });

    bb.on("error", async () => {
      try { if (tmpPath) await rm(tmpPath, { force: true }); } catch {}
      resolve(NextResponse.json({ error: "BAD_REQUEST", message: "Upload parse error." }, { status: 400 }));
    });

    bb.on("finish", async () => {
      if (!hadFile || !tmpPath) {
        resolve(NextResponse.json({ error: "BAD_REQUEST", message: "Missing file." }, { status: 400 }));
        return;
      }

      if (!guildIdRaw) {
        try { await rm(tmpPath, { force: true }); } catch {}
        resolve(NextResponse.json({ error: "BAD_REQUEST", message: "Missing guildId." }, { status: 400 }));
        return;
      }

      // Verify membership for chosen guild
      let guildIdBig: bigint;
      try {
        guildIdBig = BigInt(guildIdRaw);
      } catch {
        try { await rm(tmpPath, { force: true }); } catch {}
        resolve(NextResponse.json({ error: "BAD_REQUEST", message: "Invalid guildId." }, { status: 400 }));
        return;
      }

      const membership = await prisma.guildMember.findFirst({
        where: { accountId: account.id, guildId: guildIdBig },
        include: { guild: true },
      });

      if (!membership) {
        try { await rm(tmpPath, { force: true }); } catch {}
        resolve(NextResponse.json({ error: "FORBIDDEN", message: "You must be a member of that guild." }, { status: 403 }));
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
      const parserUrl = process.env.PARSER_URL; // ex: http://parser:8080
      let parser: any = null;

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

          parser = await r.json().catch(() => null);
        } catch {
          parser = { ok: false, error: "PARSER_UNREACHABLE" };
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
            path: `combat.log/${finalName}`, // relative for parser command
          },
          parser,
        })
      );
    });
  });

  // Pipe request body to busboy
  const { Readable } = await import("node:stream");
  Readable.fromWeb(req.body as any).pipe(bb);

  return done;
}
