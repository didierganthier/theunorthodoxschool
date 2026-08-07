import "server-only";

import { Octokit } from "octokit";
import {
  compareProtectedFiles,
  validateProfileJson,
  type ProtectedFileComparison,
  type ProfileValidation,
} from "../helpers";

const PROTECTED_MANIFEST_PATH = ".uos/protected.json";
const PROFILE_PATH = "student/profile.json";

/**
 * Paths that are ALWAYS protected regardless of the manifest contents. This
 * guarantees a learner can never drop the grader, the workflow, or the manifest
 * itself out of protection — even if the manifest is tampered with. The
 * authoritative source is still the FROZEN template, not the learner repo.
 */
const MANDATORY_PROTECTED_PATHS: readonly string[] = [
  ".github/workflows/grade.yml",
  "scripts/grade.mjs",
  ".uos/protected.json",
];

export interface GradeResult {
  protectedFilesValid: boolean;
  protected: ProtectedFileComparison;
  profile: ProfileValidation;
  /** True only when protected files are intact AND the profile is valid. */
  contentValid: boolean;
}

/** Resolves the recursive tree of a commit into a path -> blob SHA map. */
async function readTreeShas(
  octokit: Octokit,
  owner: string,
  repo: string,
  commitSha: string,
): Promise<Record<string, string>> {
  const commit = await octokit.rest.repos.getCommit({ owner, repo, ref: commitSha });
  const treeSha = commit.data.commit.tree.sha;
  const tree = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: treeSha,
    recursive: "true",
  });

  const map: Record<string, string> = {};
  for (const entry of tree.data.tree) {
    if (entry.type === "blob" && entry.path && entry.sha) {
      map[entry.path] = entry.sha;
    }
  }
  return map;
}

/** Reads and decodes a UTF-8 file at a specific ref. Returns null if missing. */
async function readFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  ref: string,
): Promise<string | null> {
  try {
    const res = await octokit.rest.repos.getContent({ owner, repo, path, ref });
    const data = res.data;
    if (Array.isArray(data) || data.type !== "file" || typeof data.content !== "string") {
      return null;
    }
    return Buffer.from(data.content, "base64").toString("utf8");
  } catch {
    return null;
  }
}

/**
 * Authoritative, server-side grade of a learner submission.
 *
 * Verifies the protected files at the graded commit (workflow_run.head_sha) by
 * comparing git blob SHAs against the frozen template commit, and validates
 * student/profile.json. This does NOT trust the learner's workflow output for
 * these checks — the caller combines this with the workflow conclusion.
 */
export async function gradeSubmission(params: {
  octokit: Octokit;
  owner: string;
  repo: string;
  headSha: string;
  templateOwner: string;
  templateRepo: string;
  templateSha: string;
  /** Connected GitHub login the profile's github_username must match. */
  connectedUsername?: string | null;
}): Promise<GradeResult> {
  const {
    octokit,
    owner,
    repo,
    headSha,
    templateOwner,
    templateRepo,
    templateSha,
    connectedUsername,
  } = params;

  // Protected paths come from the FROZEN template manifest (read at the frozen
  // templateSha) — never from the learner's copy. We additionally union in a
  // mandatory baseline so protection can never be narrowed.
  const manifestRaw = await readFile(octokit, templateOwner, templateRepo, PROTECTED_MANIFEST_PATH, templateSha);
  const manifestPaths: string[] = [];
  if (manifestRaw) {
    try {
      const parsed = JSON.parse(manifestRaw);
      if (Array.isArray(parsed)) {
        manifestPaths.push(...parsed.filter((p): p is string => typeof p === "string"));
      } else if (parsed && Array.isArray(parsed.paths)) {
        manifestPaths.push(
          ...parsed.paths.filter((p: unknown): p is string => typeof p === "string"),
        );
      }
    } catch {
      // Ignore a malformed manifest — the mandatory baseline still applies.
    }
  }
  const protectedPaths = Array.from(new Set([...MANDATORY_PROTECTED_PATHS, ...manifestPaths]));

  const [expected, actual] = await Promise.all([
    readTreeShas(octokit, templateOwner, templateRepo, templateSha),
    readTreeShas(octokit, owner, repo, headSha),
  ]);

  const protectedComparison = compareProtectedFiles(protectedPaths, expected, actual);

  const profileRaw = await readFile(octokit, owner, repo, PROFILE_PATH, headSha);
  const profile = validateProfileJson(profileRaw ?? "", { expectedUsername: connectedUsername });

  const contentValid = protectedComparison.valid && profile.ok;

  return {
    protectedFilesValid: protectedComparison.valid,
    protected: protectedComparison,
    profile,
    contentValid,
  };
}
