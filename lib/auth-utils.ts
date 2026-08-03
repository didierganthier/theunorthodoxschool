/**
 * Authentication helpers shared by the login UI and tests.
 */

/** Validates an email address for the magic-link form. */
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Rewrites raw Supabase auth errors into calm, user-friendly language.
 * Never surfaces internal details or tokens.
 */
export function friendlyAuthError(message: string | undefined | null): string {
  const m = (message ?? "").toLowerCase();
  if (!m) return "We couldn't send your sign-in link. Please try again.";
  if (
    m.includes("rate limit") ||
    m.includes("too many") ||
    m.includes("seconds") ||
    m.includes("after")
  ) {
    return "Too many attempts. Please wait a minute, then try again.";
  }
  if (m.includes("invalid") && m.includes("email")) {
    return "That email address doesn't look valid. Please check it and try again.";
  }
  if (m.includes("signups not allowed") || m.includes("not allowed")) {
    return "Sign-ups are currently disabled. Please contact support.";
  }
  if (m.includes("smtp") || m.includes("email") || m.includes("send")) {
    return "We couldn't send the email right now. Please try again shortly.";
  }
  return "We couldn't send your sign-in link. Please try again.";
}

/** Maps a callback error code to a safe, user-friendly message. */
export function callbackErrorMessage(code: string | null | undefined): string {
  switch (code) {
    case "missing_code":
      return "That sign-in link was incomplete or has expired. Please request a new one.";
    case "auth":
      return "That sign-in link has expired or was already used. Please request a new one.";
    case "unconfigured":
      return "Sign-in is temporarily unavailable. Please try again shortly.";
    default:
      return "";
  }
}

/** Builds the magic-link callback URL for the current environment. */
export function magicLinkRedirectUrl(origin: string, nextPath: string): string {
  return `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}

/** True when the callback URL carries usable auth credentials. */
export function callbackHasCredentials(params: {
  code?: string | null;
  tokenHash?: string | null;
  type?: string | null;
}): boolean {
  return Boolean(params.code) || Boolean(params.tokenHash && params.type);
}
