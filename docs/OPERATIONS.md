# Operations Guide

Operational notes for the features shipped in these sprints:

1. Reliable application submissions (`/apply`).
2. The reusable quiz checkpoint engine (Level 0).
3. GitHub Assignment 00 (Level 0 onboarding) — section 5.

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

---

## 5. GitHub Assignment 00 (Level 0)

The final Level 0 lesson (`first-repository-exercise`) is a real GitHub
assignment. The whole integration is **feature-flagged**: with
`GITHUB_APP_ENABLED` unset/false (and/or the App env vars missing), the UI shows
honest "not available yet" states and no repositories are ever created.

**Do not enable in production until the flow has been verified in a preview
deployment.**

### 5.1 Apply the migration

Run `supabase/migrations/0005_github_assignment_00.sql` (SQL Editor or
`supabase db push`). It seeds the `assignment-00` definition, extends
`github_submissions` with repository/invitation/grading columns (+ a unique
index on `repository_full_name`), and adds `github_accounts.avatar_url`.

### 5.2 The template repository

Proposed template files live under `docs/assignment-00-template/` for review.
Once approved, push them to `unorthodox-school/uos-assignment-00-template` and
mark that repo as a **template repository** in its GitHub settings. Files:

- `student/profile.json` — the only file learners edit (ships with placeholders).
- `.github/workflows/grade.yml` — runs on push; gives fast learner feedback.
- `scripts/grade.mjs` — pure-Node validator (no dependencies).
- `.uos/protected.json` — manifest of protected paths.
- `README.md` — learner instructions.

The protected files are verified server-side by comparing git blob SHAs against
the frozen template commit, so learners must not modify them.

### 5.3 Create the GitHub App (org: `unorthodox-school`)

**Repository permissions (least privilege):**

| Permission     | Access       |
| -------------- | ------------ |
| Administration | Read & write |
| Contents       | Read-only    |
| Actions        | Read-only    |
| Metadata       | Read-only    |

Do **not** grant Contents write. Do **not** enable "Request user authorization
(OAuth) during installation" — learner authorization is a separate flow.

**Subscribe to events:** `workflow_run`, `installation`,
`installation_repositories`.

**Callback URL:** `https://<site>/api/github/callback`
**Webhook URL:** `https://<site>/api/github/webhook` (set a webhook secret).

### 5.4 Install the App — least privilege

Install the App on the org with access to **only** the
`uos-assignment-00-template` repository (NOT "All repositories"). The App
automatically gains access to the private repos it creates from the template.

After a learner starts the assignment, the server verifies via the GitHub API
that the installation can access the newly created repo **before** continuing.
If that verification fails, provisioning stops and the exact GitHub response is
logged — do not broaden the installation scope without investigating.

### 5.5 Environment variables (server scope — never `NEXT_PUBLIC`)

```
GITHUB_APP_ENABLED=true
GITHUB_APP_ID=...
GITHUB_APP_CLIENT_ID=...
GITHUB_APP_CLIENT_SECRET=...
GITHUB_APP_PRIVATE_KEY=...            # PEM (raw, escaped \n, or base64)
GITHUB_APP_INSTALLATION_ID=...        # numeric
GITHUB_WEBHOOK_SECRET=...
GITHUB_ORG=unorthodox-school
GITHUB_ASSIGNMENT00_TEMPLATE=unorthodox-school/uos-assignment-00-template
NEXT_PUBLIC_SITE_URL=https://<site>
SUPABASE_SERVICE_ROLE_KEY=...         # trusted webhook/grading writes only
```

The service-role key is used only by server-side trusted writes
(`lib/supabase/admin.ts`) and the webhook grader; it is never exposed to the
browser.

### 5.6 The learner flow

1. Learner clicks **Connect GitHub** → signed CSRF state → GitHub authorization
   → `/api/github/callback` validates state, exchanges the code, stores the
   numeric id/login/avatar, and discards the user token.
2. Learner clicks **Start Assignment 00** → the server generates a private repo
   from the template, verifies installation access, freezes the template commit,
   and invites the learner as a collaborator (a `201` means the invitation is
   pending acceptance; the repo is only marked "ready" once access is verified).
3. Learner accepts the invitation and edits `student/profile.json`.
4. GitHub Actions runs; on completion a `workflow_run` webhook is delivered.
5. The webhook verifies the HMAC signature, re-checks the protected files at
   `workflow_run.head_sha` against the frozen template, and validates the
   profile server-side. A pass requires **workflow success AND intact protected
   files AND a valid profile**.
6. On pass, the service-role client completes the final Level 0 lesson.

