-- ============================================================================
-- Seed the core self-paced course
-- ============================================================================
-- Learners are enrolled into this single course on first login. Published so
-- it is publicly readable under the existing "Published courses are public"
-- RLS policy. Idempotent: safe to run multiple times.
-- ============================================================================

insert into public.courses (slug, title, description, published)
values (
  'core',
  'The Unorthodox School',
  'The core self-paced program: learn by building and prove it with real projects.',
  true
)
on conflict (slug) do nothing;
