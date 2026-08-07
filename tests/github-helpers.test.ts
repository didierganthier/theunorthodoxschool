import { describe, it, expect } from "vitest";
import {
  dbToAssignmentStatus,
  assignmentStatusToDb,
  dbToRepositoryStatus,
  repositoryStatusToDb,
  sanitizeGithubUsername,
  buildLearnerRepoName,
  compareProtectedFiles,
  validateProfileJson,
} from "@/lib/github/helpers";

describe("enum mapping", () => {
  it("maps assignment status DB <-> TS round-trip", () => {
    for (const db of ["not_started", "pending", "running", "failed", "passed"]) {
      expect(assignmentStatusToDb(dbToAssignmentStatus(db))).toBe(db);
    }
  });

  it("maps repository status DB <-> TS round-trip", () => {
    for (const db of ["not_created", "creating", "ready", "error"]) {
      expect(repositoryStatusToDb(dbToRepositoryStatus(db))).toBe(db);
    }
  });

  it("falls back safely on unknown values", () => {
    expect(dbToAssignmentStatus("bogus")).toBe("not-started");
    expect(dbToRepositoryStatus("bogus")).toBe("not-created");
  });
});

describe("sanitizeGithubUsername", () => {
  it("lowercases and strips unsafe characters", () => {
    expect(sanitizeGithubUsername("Ada_Lovelace!")).toBe("ada-lovelace");
  });

  it("caps length at 39", () => {
    expect(sanitizeGithubUsername("a".repeat(50)).length).toBe(39);
  });
});

describe("buildLearnerRepoName", () => {
  it("builds a deterministic, safe repo name", () => {
    expect(buildLearnerRepoName("assignment-00", "AdaLovelace", "AB12CD34")).toBe(
      "assignment-00-adalovelace-ab12cd34",
    );
  });

  it("falls back to 'learner' for empty logins", () => {
    expect(buildLearnerRepoName("assignment-00", "!!!", "xyz")).toBe(
      "assignment-00-learner-xyz",
    );
  });
});

describe("compareProtectedFiles", () => {
  const paths = [".github/workflows/grade.yml", "scripts/grade.mjs"];
  const expected = { ".github/workflows/grade.yml": "aaa", "scripts/grade.mjs": "bbb" };

  it("is valid when all protected blobs match", () => {
    const result = compareProtectedFiles(paths, expected, { ...expected });
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.changed).toEqual([]);
  });

  it("flags changed protected files", () => {
    const actual = { ...expected, "scripts/grade.mjs": "zzz" };
    const result = compareProtectedFiles(paths, expected, actual);
    expect(result.valid).toBe(false);
    expect(result.changed).toContain("scripts/grade.mjs");
  });

  it("flags missing protected files", () => {
    const actual = { ".github/workflows/grade.yml": "aaa" };
    const result = compareProtectedFiles(paths, expected, actual);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("scripts/grade.mjs");
  });
});

describe("validateProfileJson", () => {
  const valid = JSON.stringify({
    name: "Ada Lovelace",
    github_username: "adalovelace",
    favorite_language: "Python",
    why_join: "To build unorthodox things.",
  });

  it("accepts a complete, edited profile", () => {
    expect(validateProfileJson(valid).ok).toBe(true);
  });

  it("rejects invalid JSON", () => {
    expect(validateProfileJson("{not json").ok).toBe(false);
  });

  it("rejects a non-object", () => {
    expect(validateProfileJson("[]").ok).toBe(false);
  });

  it("rejects missing required fields", () => {
    const missing = JSON.stringify({ name: "Ada" });
    const result = validateProfileJson(missing);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects untouched starter placeholders", () => {
    const starter = JSON.stringify({
      name: "your full name",
      github_username: "your username",
      favorite_language: "your favorite language",
      why_join: "replace with your reason for joining",
    });
    expect(validateProfileJson(starter).ok).toBe(false);
  });

  it("rejects over-long fields", () => {
    const long = JSON.stringify({
      name: "a".repeat(200),
      github_username: "adalovelace",
      favorite_language: "Python",
      why_join: "Reason.",
    });
    expect(validateProfileJson(long).ok).toBe(false);
  });
});
