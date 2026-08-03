/**
 * Supabase configuration guards.
 *
 * Authentication and learner data require a Supabase project. Until the
 * environment variables are provided, the app degrades gracefully and shows
 * honest "not configured" states instead of crashing or faking data.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/**
 * Public client key. Supabase's newer "publishable" key (sb_publishable_…) is
 * the drop-in replacement for the legacy anon key and is preferred; we fall
 * back to the legacy anon key for compatibility.
 */
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

/** True only when both public Supabase values are present. */
export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.trim().length > 0 && SUPABASE_ANON_KEY.trim().length > 0;
}
