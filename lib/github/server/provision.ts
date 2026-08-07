import "server-only";

import { randomBytes } from "node:crypto";
import { getGithubConfig } from "../config";
import { buildLearnerRepoName, sanitizeGithubUsername } from "../helpers";
import { getInstallationOctokit } from "./client";

export interface ProvisionSuccess {
  ok: true;
  repositoryFullName: string;
  repositoryUrl: string;
  installationId: number;
  /** The template commit the learner repo was generated from (frozen for grading). */
  templateSha: string;
  invitation: {
    id: number | null;
    url: string | null;
    /** true only when GitHub reports access is already active (204). */
    accepted: boolean;
  };
}

export interface ProvisionFailure {
  ok: false;
  /** Which step failed, for operator diagnosis. */
  stage: "config" | "generate" | "verify-access" | "template-sha" | "invite";
  status: number | null;
  message: string;
  /** Raw GitHub API response body when available (per least-privilege audit). */
  detail?: unknown;
}

export type ProvisionResult = ProvisionSuccess | ProvisionFailure;

function errorStatus(error: unknown): number | null {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === "number") return status;
  }
  return null;
}

function errorDetail(error: unknown): unknown {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: unknown } }).response;
    return response?.data;
  }
  return undefined;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

/**
 * Generates a private learner repository from the Assignment 00 template inside
 * the org, verifies the installation can access it, freezes the template commit
 * for grading, and invites the learner as a collaborator.
 *
 * Invitation semantics are preserved: a 201 means an invitation is pending
 * acceptance; a 204 means access is already active. The caller must NOT treat a
 * successful invite call as "ready" on its own.
 */
export async function provisionLearnerRepository(params: {
  assignmentSlug: string;
  learnerLogin: string;
}): Promise<ProvisionResult> {
  const cfg = getGithubConfig();
  if (!cfg) {
    return { ok: false, stage: "config", status: null, message: "GitHub integration is not configured." };
  }

  const octokit = await getInstallationOctokit();
  if (!octokit) {
    return { ok: false, stage: "config", status: null, message: "Installation client unavailable." };
  }

  const login = sanitizeGithubUsername(params.learnerLogin);
  const suffix = randomBytes(4).toString("hex");
  const repoName = buildLearnerRepoName(params.assignmentSlug, login, suffix);

  // 1) Generate the private repository from the template (Admin write + Contents read).
  let repositoryFullName: string;
  let repositoryUrl: string;
  let defaultBranch: string;
  try {
    const created = await octokit.rest.repos.createUsingTemplate({
      template_owner: cfg.templateOwner,
      template_repo: cfg.templateRepo,
      owner: cfg.org,
      name: repoName,
      private: true,
      include_all_branches: false,
    });
    repositoryFullName = created.data.full_name;
    repositoryUrl = created.data.html_url;
    defaultBranch = created.data.default_branch ?? "main";
  } catch (error) {
    return {
      ok: false,
      stage: "generate",
      status: errorStatus(error),
      message: errorMessage(error),
      detail: errorDetail(error),
    };
  }

  // 2) Verify the installation can actually access the new repo BEFORE continuing.
  //    If this fails, stop and report — do not broaden installation scope silently.
  try {
    await octokit.rest.repos.get({ owner: cfg.org, repo: repoName });
  } catch (error) {
    return {
      ok: false,
      stage: "verify-access",
      status: errorStatus(error),
      message:
        "Repository was created but the installation cannot access it. Stop and confirm the installation scope before continuing.",
      detail: errorDetail(error),
    };
  }

  // 3) Freeze the template commit the repo was generated from (for grading).
  let templateSha: string;
  try {
    const templateDefault = await octokit.rest.repos.get({
      owner: cfg.templateOwner,
      repo: cfg.templateRepo,
    });
    const branch = await octokit.rest.repos.getBranch({
      owner: cfg.templateOwner,
      repo: cfg.templateRepo,
      branch: templateDefault.data.default_branch,
    });
    templateSha = branch.data.commit.sha;
  } catch (error) {
    return {
      ok: false,
      stage: "template-sha",
      status: errorStatus(error),
      message: errorMessage(error),
      detail: errorDetail(error),
    };
  }

  // 4) Invite the learner as a collaborator (Admin write). Preserve invitation state.
  let invitation: ProvisionSuccess["invitation"] = { id: null, url: null, accepted: false };
  try {
    const added = await octokit.rest.repos.addCollaborator({
      owner: cfg.org,
      repo: repoName,
      username: login,
      permission: "push",
    });
    if (added.status === 201 && added.data) {
      // Invitation created — learner must accept.
      invitation = {
        id: added.data.id ?? null,
        url: added.data.html_url ?? null,
        accepted: false,
      };
    } else {
      // 204 No Content — access is already active.
      invitation = { id: null, url: null, accepted: true };
    }
  } catch (error) {
    return {
      ok: false,
      stage: "invite",
      status: errorStatus(error),
      message: errorMessage(error),
      detail: errorDetail(error),
    };
  }

  void defaultBranch;

  return {
    ok: true,
    repositoryFullName,
    repositoryUrl,
    installationId: cfg.installationId,
    templateSha,
    invitation,
  };
}
