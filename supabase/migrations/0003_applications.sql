-- ============================================================================
-- 0003 — applications (pilot / sponsored-seat intake)
-- ============================================================================
-- Stores every submission from the public /apply form. Supabase is the SINGLE
-- SOURCE OF TRUTH for applications.
--
-- Security model:
--   * RLS is enabled with NO anon/authenticated policies, so the public role
--     can neither read, update, nor delete applications.
--   * Public submission happens ONLY through the SECURITY DEFINER function
--     `public.submit_application(jsonb)`, which validates + de-duplicates and
--     inserts a controlled row (status is always 'submitted').
--   * Administrative reads/updates run through the service-role key (server
--     only) or the Supabase dashboard — never the browser.
-- ============================================================================

-- Controlled application lifecycle status.
do $$ begin
  create type application_status as enum (
    'submitted',
    'under_review',
    'accepted',
    'waitlisted',
    'rejected',
    'enrolled'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,                       -- WhatsApp / phone, as collected
  age smallint,                     -- exact age collected by the form
  situation text,                   -- current situation (student/working/...)
  ai_experience text,               -- prior AI-tool experience
  motivation text not null,         -- why they want to join
  goal_3_months text,               -- learning goal (next 3 months)
  commit_hours text,                -- weekly commitment (availability)
  ready_to_act text,                -- readiness to build
  status application_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,          -- administrative
  reviewer_notes text,              -- administrative
  user_id uuid references auth.users (id) on delete set null, -- nullable: applicants may be unauthenticated
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists applications_email_idx on public.applications (email);
create index if not exists applications_status_idx on public.applications (status);
create index if not exists applications_submitted_at_idx on public.applications (submitted_at desc);

alter table public.applications enable row level security;

-- Intentionally NO policies for anon/authenticated: RLS denies all direct
-- access. Submission is only possible via submit_application() below, and
-- reads/updates are service-role only.

-- ----------------------------------------------------------------------------
-- submit_application — the only public write path.
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER so an unauthenticated visitor can submit without any table
-- policy. It de-duplicates recent pending submissions from the same email and
-- always forces status = 'submitted'. Primary validation still happens in the
-- API route; this is defense in depth.
create or replace function public.submit_application(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Identity is derived from the session, NEVER from the request body, so a
  -- caller cannot attribute an application to another user's account.
  v_uid uuid := auth.uid();
  v_email text := lower(trim(coalesce(p->>'email', '')));
  v_full_name text := trim(coalesce(p->>'full_name', ''));
  v_phone text := nullif(trim(coalesce(p->>'phone', '')), '');
  v_age_txt text := nullif(trim(coalesce(p->>'age', '')), '');
  v_situation text := nullif(trim(coalesce(p->>'situation', '')), '');
  v_ai_experience text := nullif(trim(coalesce(p->>'ai_experience', '')), '');
  v_motivation text := trim(coalesce(p->>'motivation', ''));
  v_goal text := nullif(trim(coalesce(p->>'goal_3_months', '')), '');
  v_commit text := nullif(trim(coalesce(p->>'commit_hours', '')), '');
  v_ready text := nullif(trim(coalesce(p->>'ready_to_act', '')), '');
  v_age smallint;
  v_existing uuid;
  v_id uuid;
  v_submitted timestamptz;
begin
  if v_email = '' or v_full_name = '' or v_motivation = '' then
    raise exception 'missing_required_fields';
  end if;

  -- Defense-in-depth length limits (mirror the API validation). Reject rather
  -- than silently truncate, so the RPC cannot be abused to store huge blobs.
  if char_length(v_full_name) > 200
     or char_length(v_email) > 254
     or char_length(coalesce(v_phone, '')) > 50
     or char_length(coalesce(v_situation, '')) > 100
     or char_length(coalesce(v_ai_experience, '')) > 100
     or char_length(v_motivation) > 2000
     or char_length(coalesce(v_goal, '')) > 2000
     or char_length(coalesce(v_commit, '')) > 10
     or char_length(coalesce(v_ready, '')) > 10 then
    raise exception 'invalid_input';
  end if;

  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'invalid_email';
  end if;

  if v_age_txt is not null then
    begin
      v_age := v_age_txt::smallint;
    exception when others then
      raise exception 'invalid_age';
    end;
    if v_age < 13 or v_age > 70 then
      raise exception 'invalid_age';
    end if;
  end if;

  -- De-duplicate: a still-pending application from the same (normalized) email
  -- in the last 24 hours is treated as a duplicate. The response NEVER echoes
  -- any stored application data — only a boolean flag.
  select id into v_existing
  from public.applications
  where email = v_email
    and status in ('submitted', 'under_review')
    and submitted_at > now() - interval '24 hours'
  limit 1;

  if v_existing is not null then
    return jsonb_build_object('duplicate', true);
  end if;

  -- Only these columns are written. status is FORCED to 'submitted' and the
  -- administrative columns (status override, reviewer_notes, reviewed_at) are
  -- never read from the request body.
  insert into public.applications (
    full_name, email, phone, age, situation, ai_experience,
    motivation, goal_3_months, commit_hours, ready_to_act,
    user_id, status, metadata
  ) values (
    v_full_name,
    v_email,
    v_phone,
    v_age,
    v_situation,
    v_ai_experience,
    v_motivation,
    v_goal,
    v_commit,
    v_ready,
    v_uid,
    'submitted',
    coalesce(p->'metadata', '{}'::jsonb)
  )
  returning id, submitted_at into v_id, v_submitted;

  -- Safe result only: the new row's own id + timestamp.
  return jsonb_build_object(
    'duplicate', false,
    'id', v_id,
    'submitted_at', v_submitted
  );
end;
$$;

-- Only the controlled function is exposed to the public roles.
revoke all on function public.submit_application(jsonb) from public;
grant execute on function public.submit_application(jsonb) to anon, authenticated;
