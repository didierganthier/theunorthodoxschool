-- ============================================================================
-- 0004 — quiz checkpoint support
-- ============================================================================
-- Adds attempt tracking to lesson_progress and score fields to
-- exercise_attempts, plus an atomic helper to record a quiz attempt.
--
-- Backward compatible: existing rows default attempt_count to 0 and the
-- learning-goal checkpoint flow is unaffected.
-- ============================================================================

-- Track how many times a learner has attempted a lesson's checkpoint.
alter table public.lesson_progress
  add column if not exists attempt_count integer not null default 0;

-- Persist the graded score alongside each attempt (nullable for older/other
-- checkpoint kinds that do not produce a numeric score).
alter table public.exercise_attempts
  add column if not exists score numeric;
alter table public.exercise_attempts
  add column if not exists max_score numeric;

-- ----------------------------------------------------------------------------
-- record_lesson_attempt — atomically upsert progress + increment attempts.
-- ----------------------------------------------------------------------------
-- SECURITY INVOKER (default): RLS still applies. The caller may only write
-- their own row because user_id is bound to auth.uid() and the lesson_progress
-- policies require auth.uid() = user_id.
--
-- completed_at is set once (the first passing attempt) and never cleared by a
-- later failing attempt.
create or replace function public.record_lesson_attempt(
  p_module_slug text,
  p_lesson_slug text,
  p_passed boolean
)
returns public.lesson_progress
language plpgsql
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.lesson_progress;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.lesson_progress (
    user_id, module_slug, lesson_slug, attempt_count, completed_at, updated_at
  )
  values (
    v_uid,
    p_module_slug,
    p_lesson_slug,
    1,
    case when p_passed then now() else null end,
    now()
  )
  on conflict (user_id, module_slug, lesson_slug) do update
    set attempt_count = public.lesson_progress.attempt_count + 1,
        completed_at = coalesce(
          public.lesson_progress.completed_at,
          case when p_passed then now() else null end
        ),
        updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.record_lesson_attempt(text, text, boolean) from public;
grant execute on function public.record_lesson_attempt(text, text, boolean) to authenticated;
