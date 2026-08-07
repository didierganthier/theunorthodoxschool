import { NextResponse, type NextRequest } from "next/server";
import { getGithubConfig } from "@/lib/github/config";
import { verifyWebhookSignature } from "@/lib/github/webhook-signature";
import { getInstallationOctokit } from "@/lib/github/server/client";
import { gradeSubmission } from "@/lib/github/server/grade";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// The Level 0 lesson completed when Assignment 00 passes.
const COMPLETION_MODULE = "level-0-orientation";
const COMPLETION_LESSON = "first-repository-exercise";

interface WorkflowRunPayload {
  action?: string;
  repository?: {
    full_name?: string;
    owner?: { login?: string };
  };
  workflow_run?: {
    id?: number;
    head_sha?: string;
    conclusion?: string | null;
    status?: string;
  };
}

/**
 * GitHub webhook receiver for Assignment 00 grading.
 *
 * Security: verifies the HMAC signature over the RAW body, restricts to the
 * configured org, and de-duplicates deliveries. Grading is authoritative and
 * server-side — the learner's workflow output is never trusted for the
 * protected-file or profile checks.
 */
export async function POST(request: NextRequest) {
  const cfg = getGithubConfig();
  if (!cfg) {
    return NextResponse.json({ ok: true, ignored: "unconfigured" });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  if (!verifyWebhookSignature(rawBody, signature, cfg.webhookSecret)) {
    return NextResponse.json({ message: "Invalid signature." }, { status: 401 });
  }

  const event = request.headers.get("x-github-event");
  const delivery = request.headers.get("x-github-delivery");

  // We only act on completed workflow runs. Everything else is acknowledged.
  if (event !== "workflow_run") {
    return NextResponse.json({ ok: true, ignored: `event:${event}` });
  }

  let payload: WorkflowRunPayload;
  try {
    payload = JSON.parse(rawBody) as WorkflowRunPayload;
  } catch {
    return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
  }

  if (payload.action !== "completed") {
    return NextResponse.json({ ok: true, ignored: `action:${payload.action}` });
  }

  const fullName = payload.repository?.full_name;
  const ownerLogin = payload.repository?.owner?.login;
  const headSha = payload.workflow_run?.head_sha;
  const runId = payload.workflow_run?.id;
  const conclusion = payload.workflow_run?.conclusion ?? null;

  // Restrict to our org and require the fields we need.
  if (!fullName || !headSha || ownerLogin !== cfg.org || !fullName.startsWith(`${cfg.org}/`)) {
    return NextResponse.json({ ok: true, ignored: "scope" });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    // Cannot process trusted writes without the service role. Let GitHub retry.
    return NextResponse.json({ message: "Service unavailable." }, { status: 503 });
  }

  const { data: submission } = await supabase
    .from("github_submissions")
    .select("user_id, assignment_slug, template_sha, last_delivery_id, passed_at")
    .eq("repository_full_name", fullName)
    .maybeSingle();

  if (!submission) {
    return NextResponse.json({ ok: true, ignored: "no-submission" });
  }

  // Delivery idempotency.
  if (delivery && submission.last_delivery_id === delivery) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const [owner, repo] = fullName.split("/");
  const octokit = await getInstallationOctokit();
  if (!octokit || !submission.template_sha) {
    return NextResponse.json({ message: "Cannot grade submission." }, { status: 503 });
  }

  // The connected GitHub login the profile must match (authoritative binding).
  const { data: account } = await supabase
    .from("github_accounts")
    .select("github_username")
    .eq("user_id", submission.user_id)
    .maybeSingle();

  const grade = await gradeSubmission({
    octokit,
    owner,
    repo,
    headSha,
    templateOwner: cfg.templateOwner,
    templateRepo: cfg.templateRepo,
    templateSha: submission.template_sha as string,
    connectedUsername: (account?.github_username as string | undefined) ?? null,
  });

  const passed = conclusion === "success" && grade.protectedFilesValid && grade.profile.ok;

  await supabase
    .from("github_submissions")
    .update({
      workflow_run_id: runId ? String(runId) : null,
      commit_sha: headSha,
      head_sha: headSha,
      protected_files_valid: grade.protectedFilesValid,
      workflow_status: passed ? "passed" : "failed",
      passed_at: passed ? new Date().toISOString() : null,
      last_delivery_id: delivery ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", submission.user_id)
    .eq("assignment_slug", submission.assignment_slug);

  // On pass, complete the final Level 0 lesson (service role bypasses RLS).
  if (passed) {
    await supabase.from("lesson_progress").upsert(
      {
        user_id: submission.user_id,
        module_slug: COMPLETION_MODULE,
        lesson_slug: COMPLETION_LESSON,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,module_slug,lesson_slug" },
    );
  }

  return NextResponse.json({ ok: true, passed });
}

