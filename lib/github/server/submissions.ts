import "server-only";

import type { GithubSubmission } from "../types";
import { dbToAssignmentStatus, dbToRepositoryStatus } from "../helpers";

/** Raw shape of a `github_submissions` row as selected from Supabase. */
export interface SubmissionRow {
  assignment_slug: string;
  repository_url: string | null;
  repository_full_name: string | null;
  repository_status: string;
  invitation_url: string | null;
  invitation_accepted: boolean | null;
  commit_sha: string | null;
  workflow_run_id: string | null;
  workflow_status: string;
  protected_files_valid: boolean | null;
  passed_at: string | null;
}

/** The columns to select for the public submission view. */
export const SUBMISSION_COLUMNS =
  "assignment_slug, repository_url, repository_full_name, repository_status, invitation_url, invitation_accepted, commit_sha, workflow_run_id, workflow_status, protected_files_valid, passed_at";

export function mapSubmissionRow(row: SubmissionRow): GithubSubmission {
  return {
    assignmentSlug: row.assignment_slug,
    repositoryUrl: row.repository_url,
    repositoryFullName: row.repository_full_name,
    repositoryStatus: dbToRepositoryStatus(row.repository_status),
    invitationUrl: row.invitation_url,
    invitationAccepted: row.invitation_accepted ?? false,
    commitSha: row.commit_sha,
    workflowRunId: row.workflow_run_id,
    workflowStatus: dbToAssignmentStatus(row.workflow_status),
    protectedFilesValid: row.protected_files_valid,
    passedAt: row.passed_at,
  };
}
