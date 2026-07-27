-- ============================================================================
-- The Unorthodox School — initial schema
-- ============================================================================
-- Sprint 1 data model for a self-paced, autonomous digital school.
--
-- Security model:
--   * Row Level Security (RLS) is enabled on every table.
--   * Learners can read/write ONLY their own rows.
--   * Published course content (courses/modules/lessons) is publicly readable.
--   * The service-role key must NEVER be exposed to the browser. Server-only
--     operations (e.g. GitHub provisioning) use it from trusted server code.
-- ============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Enums ----------------------------------------------------------------------
do $$ begin
  create type enrollment_status as enum ('active', 'paused', 'completed', 'withdrawn');
exception when duplicate_object then null; end $$;

do $$ begin
  create type assignment_status as enum ('not_started', 'pending', 'running', 'failed', 'passed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type repository_status as enum ('not_created', 'creating', 'ready', 'error');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- profiles — one row per authenticated user
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by their owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- courses / modules / lessons — public catalog (published rows are public)
-- ============================================================================
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses (id) on delete cascade,
  slug text unique not null,
  level int not null,
  title text not null,
  objective text,
  position int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.modules (id) on delete cascade,
  slug text not null,
  title text not null,
  objective text,
  lesson_type text,
  position int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  unique (module_id, slug)
);

alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;

create policy "Published courses are public"
  on public.courses for select using (published = true);
create policy "Published modules are public"
  on public.modules for select using (published = true);
create policy "Published lessons are public"
  on public.lessons for select using (published = true);

-- ============================================================================
-- enrollments — a learner's relationship to a course
-- ============================================================================
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  status enrollment_status not null default 'active',
  enrolled_at timestamptz not null default now(),
  unique (user_id, course_id)
);

alter table public.enrollments enable row level security;

create policy "Learners see their own enrollments"
  on public.enrollments for select using (auth.uid() = user_id);
create policy "Learners create their own enrollments"
  on public.enrollments for insert with check (auth.uid() = user_id);
create policy "Learners update their own enrollments"
  on public.enrollments for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- lesson_progress — real completion records (source of truth for progress)
-- ============================================================================
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  module_slug text not null,
  lesson_slug text not null,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, module_slug, lesson_slug)
);

alter table public.lesson_progress enable row level security;

create policy "Learners see their own progress"
  on public.lesson_progress for select using (auth.uid() = user_id);
create policy "Learners insert their own progress"
  on public.lesson_progress for insert with check (auth.uid() = user_id);
create policy "Learners update their own progress"
  on public.lesson_progress for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- exercise_attempts — every checkpoint submission (passed or not)
-- ============================================================================
create table if not exists public.exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  module_slug text not null,
  lesson_slug text not null,
  checkpoint_slug text not null,
  payload jsonb,
  passed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.exercise_attempts enable row level security;

create policy "Learners see their own attempts"
  on public.exercise_attempts for select using (auth.uid() = user_id);
create policy "Learners insert their own attempts"
  on public.exercise_attempts for insert with check (auth.uid() = user_id);

-- ============================================================================
-- github_accounts — a learner's connected GitHub identity (future)
-- ============================================================================
create table if not exists public.github_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  github_user_id text not null,
  github_username text not null,
  connected_at timestamptz not null default now()
);

alter table public.github_accounts enable row level security;

create policy "Learners see their own GitHub account"
  on public.github_accounts for select using (auth.uid() = user_id);
create policy "Learners manage their own GitHub account"
  on public.github_accounts for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- assignments — definitions of automated technical assignments (public read)
-- ============================================================================
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  module_slug text not null,
  title text not null,
  template_repository text,
  passing_score int not null default 100,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.assignments enable row level security;

create policy "Published assignments are public"
  on public.assignments for select using (published = true);

-- ============================================================================
-- github_submissions — a learner's work + automated grading result (future)
-- ============================================================================
create table if not exists public.github_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  assignment_slug text not null,
  repository_url text,
  repository_status repository_status not null default 'not_created',
  commit_sha text,
  workflow_run_id text,
  workflow_status assignment_status not null default 'not_started',
  protected_files_valid boolean,
  passed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, assignment_slug)
);

alter table public.github_submissions enable row level security;

create policy "Learners see their own submissions"
  on public.github_submissions for select using (auth.uid() = user_id);
create policy "Learners insert their own submissions"
  on public.github_submissions for insert with check (auth.uid() = user_id);
create policy "Learners update their own submissions"
  on public.github_submissions for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Note: automated grading writes to github_submissions from trusted server
-- code using the service-role key, which bypasses RLS. That key must never be
-- exposed to the browser.
