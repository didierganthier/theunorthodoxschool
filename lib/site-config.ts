/**
 * Centralized site configuration for The Unorthodox School.
 *
 * Values fall back to sensible production defaults but can be overridden via
 * environment variables. Never hardcode deployment-specific URLs elsewhere —
 * import from here instead.
 */

function env(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

export type EnrollmentStatus = "open" | "waitlist" | "closed";

export const siteConfig = {
  /** Public-facing school name. */
  name: "The Unorthodox School",

  /** Short tagline used in metadata and social cards. */
  tagline: "Learn differently. Build independently.",

  /** Canonical production URL (no trailing slash). */
  url: env("NEXT_PUBLIC_SITE_URL", "https://www.theunorthodoxschool.com").replace(
    /\/$/,
    "",
  ),

  /** Support / contact email. */
  supportEmail: env("NEXT_PUBLIC_SUPPORT_EMAIL", "didier@theunorthodoxschool.com"),

  /** GitHub organization that hosts learner assignment repositories. */
  githubOrgUrl: env(
    "NEXT_PUBLIC_GITHUB_ORG_URL",
    "https://github.com/unorthodox-school",
  ),

  /** Program price. Kept configurable; payments are NOT implemented yet. */
  price: {
    amount: 2500,
    currency: "HTG",
    /** Human-readable label, e.g. "2,500 HTG". */
    label: "2,500 HTG",
  },

  /**
   * Enrollment status controls public call-to-action copy.
   * "open" — accepting new learners; "waitlist" — collecting interest;
   * "closed" — not accepting.
   */
  enrollmentStatus: env("NEXT_PUBLIC_ENROLLMENT_STATUS", "open") as EnrollmentStatus,

  /**
   * Enrollment-flow copy. Kept configurable because this model changes once
   * payments are enabled. Today:
   *   - "Start Learning" creates an account and opens the available learning
   *     experience (Level 0). It does NOT require an application.
   *   - "Apply" submits an application for the managed pilot or a sponsored
   *     seat. Submitting an application does NOT automatically enroll anyone.
   */
  enrollment: {
    startLearning: {
      label: env("NEXT_PUBLIC_START_LEARNING_LABEL", "Start Learning"),
      href: "/login",
      description:
        "Create an account and open the available learning experience.",
    },
    apply: {
      label: env("NEXT_PUBLIC_APPLY_LABEL", "Apply for a seat"),
      href: "/apply",
      description:
        "Submit an application for the managed pilot or a sponsored seat.",
      disclaimer: "Applying does not guarantee a seat.",
    },
  },

  /** Recommended completion duration (self-paced guidance, not a deadline). */
  recommendedDuration: {
    levels: 5,
    typicalWeeks: 5,
    label: "5 levels — usually completed in about 5 weeks, at your own pace.",
  },

  /** Description used across metadata. */
  description:
    "A self-paced program in AI, digital skills, and project building for a new generation of Haitian builders, creators, and unorthodox thinkers.",
} as const;

export type SiteConfig = typeof siteConfig;
