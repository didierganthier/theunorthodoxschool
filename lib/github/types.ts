/**
 * GitHub integration types.
 *
 * These describe the SHAPE of the future GitHub App integration. No live
 * GitHub requests are made in Sprint 1 — these types let the UI and future
 * server code share a contract without faking any results.
 */

/** Connection state between a learner and their GitHub account. */
export type GithubConnectionStatus =
  | "unavailable" // Feature not open yet (Sprint 1 default).
  | "disconnected" // Available, but the learner has not connected.
  | "connected"; // Learner has connected a real GitHub account.

export interface GithubAccount {
  githubUserId: string;
  githubUsername: string;
  connectedAt: string;
}

/** Lifecycle of an automated assignment check. */
export type AssignmentStatus =
  | "not-started"
  | "pending"
  | "running"
  | "failed"
  | "passed";

/** State of a learner's assignment repository. */
export type RepositoryStatus =
  | "not-created"
  | "creating"
  | "ready"
  | "error";

export interface AssignmentDefinition {
  slug: string;
  title: string;
  /** Template repository the learner's copy is created from. */
  templateRepository: string;
  passingScore: number;
}

export interface GithubSubmission {
  assignmentSlug: string;
  repositoryUrl: string | null;
  repositoryStatus: RepositoryStatus;
  commitSha: string | null;
  workflowRunId: string | null;
  workflowStatus: AssignmentStatus;
  protectedFilesValid: boolean | null;
  passedAt: string | null;
}
