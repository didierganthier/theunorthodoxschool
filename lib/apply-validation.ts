/**
 * Pure validation + normalization for /apply submissions.
 *
 * Kept free of I/O so it can be unit-tested and reused by the API route. The
 * form submits camelCase keys; this module normalizes them to the snake_case
 * shape that `submit_application(jsonb)` expects.
 */

export const APPLICATION_MAX_LENGTHS = {
  full_name: 200,
  email: 254,
  phone: 50,
  situation: 100,
  ai_experience: 100,
  motivation: 2000,
  goal_3_months: 2000,
  commit_hours: 10,
  ready_to_act: 10,
} as const;

export const AGE_MIN = 13;
export const AGE_MAX = 70;

export interface NormalizedApplication {
  full_name: string;
  email: string;
  phone: string;
  age: string;
  situation: string;
  ai_experience: string;
  motivation: string;
  goal_3_months: string;
  commit_hours: string;
  ready_to_act: string;
}

export type ApplicationValidation =
  | { ok: true; data: NormalizedApplication }
  | { ok: false; message: string; errors: Record<string, string> };

/** Conservative email check: single @, non-empty local/domain, a dotted TLD. */
export function isValidEmail(email: string): boolean {
  if (typeof email !== "string") return false;
  if (email.length > APPLICATION_MAX_LENGTHS.email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Validates and normalizes a raw request body.
 *
 * Rejects malformed bodies, missing required fields, invalid emails, invalid
 * ages, and oversized fields. On success returns the normalized snake_case
 * record ready to persist.
 */
export function validateApplication(body: unknown): ApplicationValidation {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, message: "Invalid request.", errors: {} };
  }

  const b = body as Record<string, unknown>;

  const normalized: NormalizedApplication = {
    full_name: str(b.fullName),
    email: str(b.email).toLowerCase(),
    phone: str(b.phone),
    age: str(b.age),
    situation: str(b.situation),
    ai_experience: str(b.aiExperience),
    motivation: str(b.motivation),
    goal_3_months: str(b.goal3months),
    commit_hours: str(b.commitHours),
    ready_to_act: str(b.readyToAct),
  };

  const errors: Record<string, string> = {};

  const required: (keyof NormalizedApplication)[] = [
    "full_name",
    "email",
    "phone",
    "age",
    "situation",
    "ai_experience",
    "motivation",
    "goal_3_months",
    "commit_hours",
    "ready_to_act",
  ];
  for (const key of required) {
    if (!normalized[key]) errors[key] = "This field is required.";
  }

  if (normalized.email && !isValidEmail(normalized.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (normalized.age) {
    const ageNum = Number(normalized.age);
    if (!Number.isInteger(ageNum) || ageNum < AGE_MIN || ageNum > AGE_MAX) {
      errors.age = `Age must be a number between ${AGE_MIN} and ${AGE_MAX}.`;
    }
  }

  // Enforce maximum lengths (reject rather than silently truncate).
  for (const [key, max] of Object.entries(APPLICATION_MAX_LENGTHS)) {
    const value = normalized[key as keyof NormalizedApplication];
    if (value && value.length > max) {
      errors[key] = `Please keep this under ${max} characters.`;
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      errors,
    };
  }

  return { ok: true, data: normalized };
}
