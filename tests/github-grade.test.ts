import { describe, it, expect, vi } from "vitest";

// grade.ts is server-only; stub the marker module so it imports under Node.
vi.mock("server-only", () => ({}));

import { gradeSubmission } from "@/lib/github/server/grade";
import type { Octokit } from "octokit";

const TEMPLATE_OWNER = "unorthodox-school";
const TEMPLATE_REPO = "uos-assignment-00-template";
const LEARNER_OWNER = "unorthodox-school";
const LEARNER_REPO = "assignment-00-adalovelace-ab12cd34";
const TEMPLATE_SHA = "tmplsha";
const HEAD_SHA = "headsha";

const VALID_PROFILE = JSON.stringify({
  name: "Ada Lovelace",
  github_username: "adalovelace",
  favorite_language: "Python",
  why_join: "I want to learn a lot here.",
});

interface FakeOpts {
  /** keyed by `${owner}/${repo}:${path}` -> raw file text */
  contents: Record<string, string>;
  /** keyed by `${owner}/${repo}` -> { path: blobSha } */
  trees: Record<string, Record<string, string>>;
}

function makeOctokit(opts: FakeOpts) {
  const contentCalls: Array<{ owner: string; repo: string; path: string }> = [];
  const octokit = {
    rest: {
      repos: {
        getContent: async ({
          owner,
          repo,
          path,
        }: {
          owner: string;
          repo: string;
          path: string;
          ref: string;
        }) => {
          contentCalls.push({ owner, repo, path });
          const raw = opts.contents[`${owner}/${repo}:${path}`];
          if (raw === undefined) {
            const err = new Error("Not Found") as Error & { status: number };
            err.status = 404;
            throw err;
          }
          return {
            data: { type: "file", content: Buffer.from(raw, "utf8").toString("base64") },
          };
        },
        getCommit: async ({ owner, repo }: { owner: string; repo: string; ref: string }) => ({
          data: { commit: { tree: { sha: `tree-${owner}/${repo}` } } },
        }),
      },
      git: {
        getTree: async ({ owner, repo }: { owner: string; repo: string; tree_sha: string }) => {
          const entries = opts.trees[`${owner}/${repo}`] ?? {};
          return {
            data: {
              tree: Object.entries(entries).map(([path, sha]) => ({ type: "blob", path, sha })),
            },
          };
        },
      },
    },
  } as unknown as Octokit;

  return { octokit, contentCalls };
}

const BASE_TEMPLATE_TREE = {
  ".github/workflows/grade.yml": "WWW",
  "scripts/grade.mjs": "GGG",
  ".uos/protected.json": "MMM",
  "student/profile.json": "PPP",
};

describe("gradeSubmission — protected manifest trust model", () => {
  it("enforces the mandatory baseline even when the template manifest lists no paths", async () => {
    const { octokit } = makeOctokit({
      contents: {
        // Worst case: template manifest declares an EMPTY protected set.
        [`${TEMPLATE_OWNER}/${TEMPLATE_REPO}:.uos/protected.json`]: JSON.stringify({ paths: [] }),
        [`${LEARNER_OWNER}/${LEARNER_REPO}:student/profile.json`]: VALID_PROFILE,
      },
      trees: {
        [`${TEMPLATE_OWNER}/${TEMPLATE_REPO}`]: BASE_TEMPLATE_TREE,
        [`${LEARNER_OWNER}/${LEARNER_REPO}`]: {
          ...BASE_TEMPLATE_TREE,
          "scripts/grade.mjs": "HACKED", // learner tampered with the grader
        },
      },
    });

    const result = await gradeSubmission({
      octokit,
      owner: LEARNER_OWNER,
      repo: LEARNER_REPO,
      headSha: HEAD_SHA,
      templateOwner: TEMPLATE_OWNER,
      templateRepo: TEMPLATE_REPO,
      templateSha: TEMPLATE_SHA,
      connectedUsername: "adalovelace",
    });

    expect(result.protectedFilesValid).toBe(false);
    expect(result.protected.changed).toContain("scripts/grade.mjs");
    expect(result.contentValid).toBe(false);
  });

  it("reads the protected manifest ONLY from the frozen template, never the learner repo", async () => {
    const { octokit, contentCalls } = makeOctokit({
      contents: {
        [`${TEMPLATE_OWNER}/${TEMPLATE_REPO}:.uos/protected.json`]: JSON.stringify({
          paths: [".github/workflows/grade.yml", "scripts/grade.mjs", ".uos/protected.json"],
        }),
        [`${LEARNER_OWNER}/${LEARNER_REPO}:student/profile.json`]: VALID_PROFILE,
      },
      trees: {
        [`${TEMPLATE_OWNER}/${TEMPLATE_REPO}`]: BASE_TEMPLATE_TREE,
        [`${LEARNER_OWNER}/${LEARNER_REPO}`]: BASE_TEMPLATE_TREE,
      },
    });

    await gradeSubmission({
      octokit,
      owner: LEARNER_OWNER,
      repo: LEARNER_REPO,
      headSha: HEAD_SHA,
      templateOwner: TEMPLATE_OWNER,
      templateRepo: TEMPLATE_REPO,
      templateSha: TEMPLATE_SHA,
      connectedUsername: "adalovelace",
    });

    const manifestReads = contentCalls.filter((c) => c.path === ".uos/protected.json");
    expect(manifestReads.length).toBeGreaterThan(0);
    for (const call of manifestReads) {
      expect(call.owner).toBe(TEMPLATE_OWNER);
      expect(call.repo).toBe(TEMPLATE_REPO);
    }
    // The learner's manifest is never consulted as an authority.
    expect(
      contentCalls.some((c) => c.repo === LEARNER_REPO && c.path === ".uos/protected.json"),
    ).toBe(false);
  });

  it("passes a clean submission whose protected files match the frozen template", async () => {
    const { octokit } = makeOctokit({
      contents: {
        [`${TEMPLATE_OWNER}/${TEMPLATE_REPO}:.uos/protected.json`]: JSON.stringify({
          paths: [".github/workflows/grade.yml", "scripts/grade.mjs", ".uos/protected.json"],
        }),
        [`${LEARNER_OWNER}/${LEARNER_REPO}:student/profile.json`]: VALID_PROFILE,
      },
      trees: {
        [`${TEMPLATE_OWNER}/${TEMPLATE_REPO}`]: BASE_TEMPLATE_TREE,
        [`${LEARNER_OWNER}/${LEARNER_REPO}`]: {
          ...BASE_TEMPLATE_TREE,
          "student/profile.json": "EDITED", // only the allowed file changed
        },
      },
    });

    const result = await gradeSubmission({
      octokit,
      owner: LEARNER_OWNER,
      repo: LEARNER_REPO,
      headSha: HEAD_SHA,
      templateOwner: TEMPLATE_OWNER,
      templateRepo: TEMPLATE_REPO,
      templateSha: TEMPLATE_SHA,
      connectedUsername: "AdaLovelace",
    });

    expect(result.protectedFilesValid).toBe(true);
    expect(result.profile.ok).toBe(true);
    expect(result.contentValid).toBe(true);
  });

  it("fails when the profile github_username does not match the connected account", async () => {
    const { octokit } = makeOctokit({
      contents: {
        [`${TEMPLATE_OWNER}/${TEMPLATE_REPO}:.uos/protected.json`]: JSON.stringify({ paths: [] }),
        [`${LEARNER_OWNER}/${LEARNER_REPO}:student/profile.json`]: VALID_PROFILE,
      },
      trees: {
        [`${TEMPLATE_OWNER}/${TEMPLATE_REPO}`]: BASE_TEMPLATE_TREE,
        [`${LEARNER_OWNER}/${LEARNER_REPO}`]: BASE_TEMPLATE_TREE,
      },
    });

    const result = await gradeSubmission({
      octokit,
      owner: LEARNER_OWNER,
      repo: LEARNER_REPO,
      headSha: HEAD_SHA,
      templateOwner: TEMPLATE_OWNER,
      templateRepo: TEMPLATE_REPO,
      templateSha: TEMPLATE_SHA,
      connectedUsername: "someoneelse",
    });

    expect(result.profile.ok).toBe(false);
    expect(result.contentValid).toBe(false);
  });
});
