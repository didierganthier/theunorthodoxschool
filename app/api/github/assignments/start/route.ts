import { NextResponse } from "next/server";
import { getGithubConfig } from "@/lib/github/config";
import { provisionLearnerRepository } from "@/lib/github/server/provision";
import {
  mapSubmissionRow,
  SUBMISSION_COLUMNS,
  type SubmissionRow,
} from "@/lib/github/server/submissions";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ASSIGNMENT_SLUG = "assignment-00";

/**
 * Starts Assignment 00: generates the learner's private repository from the
 * template and invites them as a collaborator.
 *
 * - Requires an authenticated learner with a connected GitHub account.
 * - Idempotent: a repository is provisioned at most once per learner via the
 *   unique(user_id, assignment_slug) constraint and the "creating" claim.
 * - Honest 503 when the integration is not configured.
 */
export async function POST() {
  const cfg = getGithubConfig();
  if (!cfg) {
    return NextResponse.json(
      { status: "unavailable", message: "Technical assignments are not open yet." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { message: "Service unavailable." },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  }

  // Must have a connected GitHub account.
  const { data: account } = await supabase
    .from("github_accounts")
    .select("github_username")
    .eq("user_id", user.id)
    .maybeSingle();
  const learnerLogin = account?.github_username as string | undefined;
  if (!learnerLogin) {
    return NextResponse.json(
      { message: "Connect your GitHub account first." },
      { status: 409 },
    );
  }

  // Idempotency: return an existing provisioned submission unchanged.
  const { data: existing } = await supabase
    .from("github_submissions")
    .select(SUBMISSION_COLUMNS)
    .eq("user_id", user.id)
    .eq("assignment_slug", ASSIGNMENT_SLUG)
    .maybeSingle();
  if (existing && (existing as SubmissionRow).repository_full_name) {
    return NextResponse.json({ submission: mapSubmissionRow(existing as SubmissionRow) });
  }

  // Claim the provisioning slot (idempotent on the unique constraint).
  const { error: claimError } = await supabase.from("github_submissions").upsert(
    {
      user_id: user.id,
      assignment_slug: ASSIGNMENT_SLUG,
      repository_status: "creating",
      workflow_status: "not_started",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,assignment_slug" },
  );
  if (claimError) {
    return NextResponse.json({ message: "Could not start the assignment." }, { status: 500 });
  }

  const result = await provisionLearnerRepository({
    assignmentSlug: ASSIGNMENT_SLUG,
    learnerLogin,
  });

  if (!result.ok) {
    // Report the exact failure for operators (incl. verify-access GitHub body).
    console.error("[github] provisioning failed", {
      stage: result.stage,
      status: result.status,
      message: result.message,
      detail: result.detail,
    });
    await supabase
      .from("github_submissions")
      .update({
        repository_status: "error",
        error_message: `${result.stage}: ${result.message}`,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("assignment_slug", ASSIGNMENT_SLUG);

    return NextResponse.json(
      { message: "We could not create your repository. Please try again shortly.", stage: result.stage },
      { status: 502 },
    );
  }

  // Ready only when access is already active (204). A pending invitation (201)
  // keeps the repo in "creating" until acceptance is verified.
  const repositoryStatus = result.invitation.accepted ? "ready" : "creating";

  const { data: updated, error: updateError } = await supabase
    .from("github_submissions")
    .update({
      repository_url: result.repositoryUrl,
      repository_full_name: result.repositoryFullName,
      repository_status: repositoryStatus,
      installation_id: result.installationId,
      template_sha: result.templateSha,
      invitation_id: result.invitation.id,
      invitation_url: result.invitation.url,
      invitation_accepted: result.invitation.accepted,
      invited_at: new Date().toISOString(),
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("assignment_slug", ASSIGNMENT_SLUG)
    .select(SUBMISSION_COLUMNS)
    .maybeSingle();

  if (updateError || !updated) {
    return NextResponse.json({ message: "Could not save your repository." }, { status: 500 });
  }

  return NextResponse.json({ submission: mapSubmissionRow(updated as SubmissionRow) });
}

