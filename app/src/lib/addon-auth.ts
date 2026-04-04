// src/lib/addon-auth.ts
// Vérification HMAC-SHA256 pour les requêtes de l'addon RIFT

import { createHmac, timingSafeEqual } from "crypto";

/**
 * Vérifie la signature HMAC-SHA256 d'une requête addon.
 *
 * Signature attendue :
 *   HMAC-SHA256(key = ADDON_API_SECRET, data = riftAccountId + ":" + timestamp)
 *
 * Anti-replay : le timestamp doit être dans une fenêtre de ±5 minutes.
 */
export function verifyAddonSignature(
  riftAccountId: string,
  signature: string,
  timestamp: string
): boolean {
  const secret = process.env.ADDON_API_SECRET;
  if (!secret) return false;
  if (!signature || !timestamp) return false;

  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 300) return false; // tolérance ±5 min

  const expected = createHmac("sha256", secret)
    .update(`${riftAccountId}:${timestamp}`)
    .digest("hex");

  // Comparaison en temps constant pour éviter les timing attacks
  const expectedBuf = Buffer.from(expected, "hex");
  let sigBuf: Buffer;
  try {
    sigBuf = Buffer.from(signature, "hex");
  } catch {
    return false;
  }

  if (expectedBuf.length !== sigBuf.length) return false;
  return timingSafeEqual(expectedBuf, sigBuf);
}
