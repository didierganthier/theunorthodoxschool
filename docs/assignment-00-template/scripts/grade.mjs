#!/usr/bin/env node
// Assignment 00 grader (runs in the learner's repository via GitHub Actions).
//
// This is a first-pass check that gives the learner fast feedback. The school
// ALSO re-verifies the submission server-side (protected files + this same
// profile validation) before completing the lesson, so this workflow is never
// the sole source of truth.
//
// Pure Node, no dependencies. Exits non-zero on failure so the workflow run
// concludes as "failure".

import { readFile } from "node:fs/promises";

const PROFILE_PATH = "student/profile.json";

const REQUIRED_FIELDS = ["name", "github_username", "favorite_language", "why_join"];
const MAX_LENGTHS = {
  name: 120,
  github_username: 39,
  favorite_language: 60,
  why_join: 1000,
};
const PLACEHOLDER = /^(TODO|FIXME|your |replace )/i;

function fail(messages) {
  console.error("❌ Assignment 00 checks failed:\n");
  for (const m of messages) console.error(`  • ${m}`);
  console.error("\nEdit student/profile.json with your own details and commit again.");
  process.exit(1);
}

async function main() {
  let raw;
  try {
    raw = await readFile(PROFILE_PATH, "utf8");
  } catch {
    fail([`${PROFILE_PATH} is missing.`]);
    return;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    fail([`${PROFILE_PATH} is not valid JSON.`]);
    return;
  }

  const errors = [];
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    fail([`${PROFILE_PATH} must be a JSON object.`]);
    return;
  }

  for (const field of REQUIRED_FIELDS) {
    const value = data[field];
    if (typeof value !== "string" || value.trim().length === 0) {
      errors.push(`"${field}" is required and must be a non-empty string.`);
      continue;
    }
    if (value.length > MAX_LENGTHS[field]) {
      errors.push(`"${field}" must be at most ${MAX_LENGTHS[field]} characters.`);
    }
    if (PLACEHOLDER.test(value.trim())) {
      errors.push(`"${field}" still contains starter placeholder text — replace it with your own.`);
    }
  }

  if (errors.length > 0) {
    fail(errors);
    return;
  }

  console.log("✅ student/profile.json looks good. Nice work!");
}

main();
