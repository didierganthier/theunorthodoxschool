/** Routes that require an authenticated learner. */
export const PROTECTED_PREFIXES = ["/dashboard", "/learn", "/settings"] as const;

/** True when the pathname is (or is nested under) a protected route. */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
