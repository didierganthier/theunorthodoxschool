import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies a GitHub webhook payload's `X-Hub-Signature-256` header.
 *
 * GitHub signs the RAW request body with HMAC-SHA256 using the webhook secret
 * and sends `sha256=<hexdigest>`. We recompute and compare in constant time.
 *
 * Pass the exact raw body string (do NOT re-serialize parsed JSON, since key
 * ordering/whitespace would change the bytes and break verification).
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) return false;
  if (!signatureHeader.startsWith("sha256=")) return false;

  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  // Length check first: timingSafeEqual throws on unequal lengths.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
