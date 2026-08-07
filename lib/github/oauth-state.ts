import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Signed, expiring CSRF state for the GitHub App web authorization flow.
 *
 * The state travels to GitHub and back; a matching `nonce` is also stored in an
 * httpOnly cookie (double-submit) so a forged callback cannot complete the
 * flow. The token is HMAC-signed so its contents cannot be tampered with.
 */

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes.

interface StatePayload {
  n: string; // nonce
  exp: number; // expiry (ms epoch)
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}

export interface CreatedState {
  /** Opaque token to send as the `state` query parameter. */
  token: string;
  /** Nonce to store in an httpOnly cookie for double-submit verification. */
  nonce: string;
}

export function createOauthState(secret: string, now = Date.now()): CreatedState {
  const nonce = b64url(randomBytes(16));
  const payload: StatePayload = { n: nonce, exp: now + STATE_TTL_MS };
  const body = b64url(JSON.stringify(payload));
  const token = `${body}.${sign(body, secret)}`;
  return { token, nonce };
}

/**
 * Verifies a returned state token against the cookie nonce and secret.
 * Returns true only when the signature is valid, the token is unexpired, and
 * the embedded nonce matches the cookie.
 */
export function verifyOauthState(
  token: string | null,
  cookieNonce: string | null,
  secret: string,
  now = Date.now(),
): boolean {
  if (!token || !cookieNonce) return false;

  const dot = token.indexOf(".");
  if (dot <= 0) return false;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expectedSig = sign(body, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  let payload: StatePayload;
  try {
    payload = JSON.parse(fromB64url(body).toString("utf8"));
  } catch {
    return false;
  }

  if (typeof payload.exp !== "number" || payload.exp < now) return false;
  if (typeof payload.n !== "string" || payload.n.length === 0) return false;

  const na = Buffer.from(payload.n);
  const nb = Buffer.from(cookieNonce);
  return na.length === nb.length && timingSafeEqual(na, nb);
}
