import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

/**
 * Service-role Supabase client for TRUSTED SERVER CODE ONLY.
 *
 * This client uses the service-role key, which BYPASSES Row Level Security.
 * It must never be imported by a client component or exposed to the browser —
 * the `server-only` import above makes such a mistake fail the build.
 *
 * Used by the GitHub webhook + provisioning paths to write grading results and
 * complete lessons on behalf of a learner after the server has independently
 * verified the work (signature + protected-file checks).
 *
 * Returns null when the service-role key is absent, so callers degrade to an
 * honest "unavailable" state instead of crashing.
 */
export function createAdminClient(): SupabaseClient | null {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (SUPABASE_URL.trim().length === 0 || serviceRoleKey.trim().length === 0) {
    return null;
  }

  return createClient(SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
