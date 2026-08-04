# Operations Guide

Operational notes for the two features shipped in this sprint:

1. Reliable application submissions (`/apply`).
2. The reusable quiz checkpoint engine (Level 0).

---

## 1. Applying the database migrations (REQUIRED)

Two new migrations must be run against the Supabase project **before** these
features work in production:

- `supabase/migrations/0003_applications.sql`
- `supabase/migrations/0004_quiz_support.sql`

### How to run

Open the Supabase dashboard → **SQL Editor** → paste each file's contents (in
order, 0003 then 0004) → **Run**. Or, with the Supabase CLI linked to the
project:

```bash
supabase db push
```

### What they create

**0003_applications.sql**

- Enum `application_status` (`submitted`, `under_review`, `accepted`,
  `waitlisted`, `rejected`, `enrolled`).
- Table `public.applications` with all applicant fields, a nullable `user_id`
  (linked to the signed-in user when available), `status`, timestamps, and a
  `metadata` jsonb column.
- **RLS is enabled with no anon/authenticated policies** — no one can read or
  write the table directly from the client.
- A `SECURITY DEFINER` function `public.submit_application(p jsonb)` that
  validates required fields, de-duplicates repeat submissions from the same
  email within 24h, and inserts with a forced `status = 'submitted'`. Only this
  function is granted to `anon` / `authenticated`.

**0004_quiz_support.sql**

- `lesson_progress.attempt_count integer not null default 0`.
- `exercise_attempts.score` and `exercise_attempts.max_score` (nullable
  numeric).
- A `SECURITY INVOKER` function `public.record_lesson_attempt(...)` that
  atomically increments `attempt_count` and sets `completed_at` on the first
  passing attempt (never clearing it on a later failure).

---

## 2. Reviewing applications (admin)

There is **no public admin UI** in this sprint. Applications are readable only
with elevated privileges:

- **Supabase dashboard** → **Table Editor** → `applications` (uses the service
  role, so RLS does not restrict you). Sort by `submitted_at desc`.
- Or query with the service-role key from a trusted backend context.

Because RLS denies all direct client access, applicant answers are never exposed
to the browser or to other users. The API route never logs applicant answers.

### Optional: submission webhook

If `WEBHOOK_URL` is set in the environment (e.g. a Vercel env var), each
successful submission triggers a best-effort `POST` with a small notification
payload (name, email, timestamp — no long free-text answers). Failures are
swallowed and never block the applicant's submission.

---

## 3. The quiz checkpoint engine

### Architecture

- **Answer keys never reach the browser.** Quiz definitions live in
  `lib/quiz/definitions.ts`, which imports `server-only`. The lesson page calls
  `toPublicQuiz()` to strip correct answers/explanations before rendering.
- **Grading is authoritative on the server** at `POST /api/learn/quiz`. It
  verifies auth, lesson access, that the quiz belongs to the lesson, valid
  question ids, and the max-attempts limit, then grades and records the attempt.
- **Progression reuses `lesson_progress`.** Passing a quiz sets `completed_at`
  via `record_lesson_attempt`, unlocking the next lesson exactly like other
  checkpoints. Learning-goal and reading checkpoints are unchanged.

### Authoring a new quiz

1. Add a `QuizDefinition` to `lib/quiz/definitions.ts` with its `moduleSlug` /
   `lessonSlug` and register it in the lookup maps.
2. Add a `checkpoint` of `kind: "quiz"` to the matching lesson in
   `lib/curriculum.ts`, using the same `slug` as the quiz.

Supported question types: `single-choice`, `multiple-choice`, `ordering`.
Grading is all-or-nothing per question; `passingScore` is a percentage.

---

## 4. Deploying

Pushing to `main` triggers the Vercel production deploy. Run the migrations
(section 1) **before or immediately after** deploying so the new routes have the
tables/functions they depend on.
