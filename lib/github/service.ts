import type {
  AssignmentDefinition,
  GithubSubmission,
} from "./types";

/**
 * GitHub service interface.
 *
 * This is the contract a real implementation will fulfil in a later sprint
 * (backed by a GitHub App + webhooks). It lives in a client-safe module as a
 * TYPE ONLY. Real network calls must live under `lib/github/server/` and never
 * ship to the browser.
 */
export interface GithubService {
  /** Begin the OAuth/App connection flow. Returns a redirect URL. */
  getConnectUrl(state: string): string;

  /** Create a learner's copy of an assignment's template repository. */
  startAssignment(input: {
    userId: string;
    assignment: AssignmentDefinition;
  }): Promise<GithubSubmission>;

  /** Fetch the latest status of a learner's assignment submission. */
  getAssignmentStatus(input: {
    userId: string;
    assignmentSlug: string;
  }): Promise<GithubSubmission | null>;
}

/**
 * Whether the GitHub integration is live.
 *
 * Sprint 1: always false. Flipped on only when the GitHub App credentials and
 * server implementation exist. The UI reads this to show honest states.
 */
export function isGithubIntegrationEnabled(): boolean {
  return process.env.GITHUB_APP_ENABLED === "true";
}
