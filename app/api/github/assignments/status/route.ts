import { NextResponse } from "next/server";
import { getGithubConfig } from "@/lib/github/config";
import { getInstallationOctokit } from "@/lib/github/server/client";
import {
  mapSubmissionRow,
  SUBMISSION_COLUMNS,
  type SubmissionRow,
} from "@/lib/github/server/submissions";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ASSIGNMENT_SLUG = "assignment-00";

/**
 * Returns the authenticated learner's Assignment 00 submission.
 *
 * Also reconciles a pending invitation: if the repo is provisioned but the
 * invitation has not been marked accepted, it verifies collaborator access via
 * the GitHub API and flips the repo to "ready" only once access is confirmed.
 */
export async function GET() {
  const cfg = getGithubConfig();
  if (!cfg) {
    return NextResponse.json({ enabled: false, submission: null });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ enabled: false, submission: null });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  }

  const { data: row } = await supabase
    .from("github_submissions")
    .select(SUBMISSION_COLUMNS)
    .eq("user_id", user.id)
    .eq("assignment_slug", ASSIGNMENT_SLUG)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ enabled: true, submission: null });
  }

  let submissionRow = row as SubmissionRow;

  // Reconcile a pending invitation into "ready" once access is verified.
  if (
    submissionRow.repository_status === "creating" &&
    !submissionRow.invitation_accepted &&
    submissionRow.repository_full_name
  ) {
    const { data: account } = await supabase
      .from("github_accounts")
      .select("github_username")
      .eq("user_id", user.id)
      .maybeSingle();
    const login = account?.github_username as string | undefined;
    const [owner, repo] = submissionRow.repository_full_name.split("/");

    if (login && owner && repo) {
      try {
        const octokit = await getInstallationOctokit();
        if (octokit) {
          const check = await octokit.rest.repos.checkCollaborator({
            owner,
            repo,
            username: login,
          });
          if (check.status === 204) {
            const { data: updated } = await supabase
              .from("github_submissions")
              .update({
                invitation_accepted: true,
                repository_status: "ready",
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", user.id)
              .eq("assignment_slug", ASSIGNMENT_SLUG)
              .select(SUBMISSION_COLUMNS)
              .maybeSingle();
            if (updated) submissionRow = updated as SubmissionRow;
          }
        }
      } catch {
        // 404 => invitation still pending. Leave state unchanged.
      }
    }
  }

  return NextResponse.json({ enabled: true, submission: mapSubmissionRow(submissionRow) });
}

