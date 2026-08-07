/**
 * Pure GitHub helpers — no I/O, no `server-only`, safe to unit-test directly.
 *
 * Covers the DB<->TS enum mapping, learner repository naming, protected-file
 * comparison, and server-side validation of `student/profile.json`.
 */

import type { AssignmentStatus, RepositoryStatus } from "./types";

// ── Enum mapping (DB uses snake_case, TS types use kebab-case) ──────────────

const DB_TO_ASSIGNMENT: Record<string, AssignmentStatus> = {
  not_started: "not-started",
  pending: "pending",
  running: "running",
  failed: "failed",
  passed: "passed",
};

const ASSIGNMENT_TO_DB: Record<AssignmentStatus, string> = {
  "not-started": "not_started",
  pending: "pending",
  running: "running",
  failed: "failed",
  passed: "passed",
};

const DB_TO_REPOSITORY: Record<string, RepositoryStatus> = {
  not_created: "not-created",
  creating: "creating",
  ready: "ready",
  error: "error",
};

const REPOSITORY_TO_DB: Record<RepositoryStatus, string> = {
  "not-created": "not_created",
  creating: "creating",
  ready: "ready",
  error: "error",
};

export function dbToAssignmentStatus(value: string): AssignmentStatus {
  return DB_TO_ASSIGNMENT[value] ?? "not-started";
}

export function assignmentStatusToDb(value: AssignmentStatus): string {
  return ASSIGNMENT_TO_DB[value] ?? "not_started";
}

export function dbToRepositoryStatus(value: string): RepositoryStatus {
  return DB_TO_REPOSITORY[value] ?? "not-created";
}

export function repositoryStatusToDb(value: RepositoryStatus): string {
  return REPOSITORY_TO_DB[value] ?? "not_created";
}

// ── Repository naming ───────────────────────────────────────────────────────

/**
 * Sanitize a GitHub login into a repo-name-safe slug. GitHub logins are already
 * `[A-Za-z0-9-]`, but we defend against anything unexpected and lowercase for
 * consistency.
 */
export function sanitizeGithubUsername(login: string): string {
  return login
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 39); // GitHub username max length.
}

/**
 * Deterministic-prefix, unique-suffix learner repository name.
 * `suffix` should be a short random token (caller-provided for testability).
 */
export function buildLearnerRepoName(
  assignmentSlug: string,
  login: string,
  suffix: string,
): string {
  const user = sanitizeGithubUsername(login) || "learner";
  const safeSuffix = suffix.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
  return `${assignmentSlug}-${user}-${safeSuffix}`;
}

// ── Protected-file verification ─────────────────────────────────────────────

export interface ProtectedFileComparison {
  valid: boolean;
  /** Paths that are missing in the learner repo. */
  missing: string[];
  /** Paths whose blob SHA differs from the frozen template. */
  changed: string[];
}

/**
 * Compares the learner repo's protected files (by git blob SHA, keyed by path)
 * against the frozen template's known-good SHAs. Any missing or changed
 * protected file makes the submission invalid — the learner may only modify
 * non-protected files (i.e. `student/profile.json`).
 */
export function compareProtectedFiles(
  protectedPaths: string[],
  expected: Record<string, string>,
  actual: Record<string, string>,
): ProtectedFileComparison {
  const missing: string[] = [];
  const changed: string[] = [];

  for (const path of protectedPaths) {
    const expectedSha = expected[path];
    const actualSha = actual[path];
    if (!actualSha) {
      missing.push(path);
    } else if (!expectedSha || actualSha !== expectedSha) {
      changed.push(path);
    }
  }

  return { valid: missing.length === 0 && changed.length === 0, missing, changed };
}

// ── student/profile.json validation ─────────────────────────────────────────

export interface ProfileValidation {
  ok: boolean;
  errors: string[];
}

/** Required non-empty string fields in the learner's profile. */
export const PROFILE_REQUIRED_FIELDS = [
  "name",
  "github_username",
  "favorite_language",
  "why_join",
] as const;

const PROFILE_MAX_LENGTHS: Record<string, number> = {
  name: 120,
  github_username: 39,
  favorite_language: 60,
  why_join: 1000,
};

/**
 * Server-side validation of the learner's profile content. Accepts the RAW
 * file text so we can also reject invalid JSON. Never trusts the workflow's own
 * pass/fail — this is an independent check.
 */
export function validateProfileJson(raw: string): ProfileValidation {
  const errors: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, errors: ["profile.json is not valid JSON."] };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, errors: ["profile.json must be a JSON object."] };
  }

  const obj = parsed as Record<string, unknown>;

  for (const field of PROFILE_REQUIRED_FIELDS) {
    const value = obj[field];
    if (typeof value !== "string" || value.trim().length === 0) {
      errors.push(`Field "${field}" is required and must be a non-empty string.`);
      continue;
    }
    const max = PROFILE_MAX_LENGTHS[field];
    if (max && value.length > max) {
      errors.push(`Field "${field}" must be at most ${max} characters.`);
    }
    // Reject the untouched starter placeholders so a learner must actually edit.
    if (/^(TODO|FIXME|your |replace )/i.test(value.trim())) {
      errors.push(`Field "${field}" still contains the starter placeholder.`);
    }
  }

  return { ok: errors.length === 0, errors };
}
