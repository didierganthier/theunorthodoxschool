/**
 * Returns a safe internal redirect path, preventing open-redirect attacks.
 *
 * Only same-site absolute paths are allowed. External URLs, protocol-relative
 * URLs ("//evil.com"), and backslash tricks ("/\\evil.com") fall back to the
 * default destination.
 */
export function safeNextPath(
  next: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  // Reject protocol-relative and backslash-escaped external targets.
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
