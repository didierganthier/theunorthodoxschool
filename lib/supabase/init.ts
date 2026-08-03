import type { SupabaseClient } from "@supabase/supabase-js";

/** Slug of the single core self-paced course learners are enrolled into. */
export const CORE_COURSE_SLUG = "core";

/**
 * Idempotently initializes a learner on first (and every) login.
 *
 * - Ensures exactly one profile row exists (a DB trigger also creates it;
 *   this upsert is a belt-and-suspenders fallback).
 * - Ensures exactly one active enrollment in the core course.
 *
 * All writes are upserts guarded by database unique constraints, so repeated
 * logins never create duplicates. Runs under the learner's own session, so RLS
 * confines every write to their own rows.
 */
export async function initializeLearner(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  await supabase
    .from("profiles")
    .upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });

  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", CORE_COURSE_SLUG)
    .maybeSingle();

  if (course?.id) {
    await supabase.from("enrollments").upsert(
      { user_id: userId, course_id: course.id, status: "active" },
      { onConflict: "user_id,course_id", ignoreDuplicates: true },
    );
  }
}
