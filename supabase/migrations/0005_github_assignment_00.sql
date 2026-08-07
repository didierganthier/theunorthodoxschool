-- ============================================================================
-- 0005 — GitHub Assignment 00 (Level 0 onboarding)
-- ============================================================================
-- Extends the existing github_submissions table with the fields the live
-- GitHub App integration needs (repository mapping, invitation state, frozen
-- template + graded commit, webhook idempotency) and seeds the Assignment 00
-- definition.
--
-- No enum changes: application code maps the snake_case DB enums to the
-- kebab-case TS types.
--
-- Trusted writes (webhook grading + lesson completion) use the service-role
-- key, which bypasses RLS. The learner-facing RLS policies from 0001 remain
-- unchanged (owner-scoped select/insert/update).
-- ============================================================================

-- ── github_submissions: additional columns ─────────────────────────────────

alter table public.github_submissions
  -- "owner/repo" of the learner's generated repository (webhook -> submission).
  add column if not exists repository_full_name text,
  -- The org installation that owns/created the repo (for scoped tokens).
  add column if not exists installation_id bigint,
  -- Collaborator invitation lifecycle (201 = pending accept, 204 = active).
  add column if not exists invited_at timestamptz,
  add column if not exists invitation_id bigint,
  add column if not exists invitation_url text,
  add column if not exists invitation_accepted boolean not null default false,
  -- The frozen template commit the repo was generated from, and the commit that
  -- was actually graded (workflow_run.head_sha).
  add column if not exists template_sha text,
  add column if not exists head_sha text,
  -- Webhook delivery idempotency + surfaced error detail.
  add column if not exists last_delivery_id text,
  add column if not exists error_message text;

-- One learner repository maps to exactly one submission.
create unique index if not exists github_submissions_repo_full_name_key
  on public.github_submissions (repository_full_name)
  where repository_full_name is not null;

-- ── github_accounts: store the learner's GitHub avatar for display ───────────

alter table public.github_accounts
  add column if not exists avatar_url text;

-- ── Seed the Assignment 00 definition ───────────────────────────────────────
-- Public read is allowed only because published = true (policy from 0001).

insert into public.assignments (slug, module_slug, title, template_repository, passing_score, published)
values (
  'assignment-00',
  'level-0-orientation',
  'Assignment 00 — GitHub onboarding',
  'unorthodox-school/uos-assignment-00-template',
  100,
  true
)
on conflict (slug) do update
  set module_slug = excluded.module_slug,
      title = excluded.title,
      template_repository = excluded.template_repository,
      passing_score = excluded.passing_score,
      published = excluded.published;
