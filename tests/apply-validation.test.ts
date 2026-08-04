import { describe, it, expect } from "vitest";
import {
  validateApplication,
  isValidEmail,
  AGE_MIN,
  AGE_MAX,
  APPLICATION_MAX_LENGTHS,
} from "@/lib/apply-validation";

const validBody = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  phone: "+1 555 0100",
  age: "24",
  situation: "student",
  aiExperience: "beginner",
  motivation: "I want to learn to build with AI.",
  goal3months: "Ship a small working project.",
  commitHours: "Yes",
  readyToAct: "Yes",
};

describe("isValidEmail", () => {
  it("accepts a normal address", () => {
    expect(isValidEmail("ada@example.com")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    expect(isValidEmail("ada@example")).toBe(false);
    expect(isValidEmail("ada example.com")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });

  it("rejects addresses over the max length", () => {
    const long = "a".repeat(APPLICATION_MAX_LENGTHS.email) + "@x.co";
    expect(isValidEmail(long)).toBe(false);
  });
});

describe("validateApplication", () => {
  it("normalizes a valid submission to snake_case", () => {
    const result = validateApplication(validBody);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.full_name).toBe("Ada Lovelace");
      expect(result.data.email).toBe("ada@example.com");
      expect(result.data.goal_3_months).toBe("Ship a small working project.");
      expect(result.data.commit_hours).toBe("Yes");
      expect(result.data.ready_to_act).toBe("Yes");
    }
  });

  it("lowercases and trims the email", () => {
    const result = validateApplication({ ...validBody, email: "  ADA@Example.COM " });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.email).toBe("ada@example.com");
  });

  it("rejects a non-object body", () => {
    expect(validateApplication(null).ok).toBe(false);
    expect(validateApplication("nope").ok).toBe(false);
    expect(validateApplication([]).ok).toBe(false);
  });

  it("reports every missing required field", () => {
    const result = validateApplication({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors)).toEqual(
        expect.arrayContaining([
          "full_name",
          "email",
          "phone",
          "age",
          "situation",
          "ai_experience",
          "motivation",
          "goal_3_months",
          "commit_hours",
          "ready_to_act",
        ]),
      );
    }
  });

  it("rejects an invalid email", () => {
    const result = validateApplication({ ...validBody, email: "not-an-email" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.email).toBeDefined();
  });

  it("rejects ages outside the allowed range", () => {
    for (const age of [String(AGE_MIN - 1), String(AGE_MAX + 1), "abc", "20.5"]) {
      const result = validateApplication({ ...validBody, age });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.age).toBeDefined();
    }
  });

  it("accepts the boundary ages", () => {
    expect(validateApplication({ ...validBody, age: String(AGE_MIN) }).ok).toBe(true);
    expect(validateApplication({ ...validBody, age: String(AGE_MAX) }).ok).toBe(true);
  });

  it("rejects oversized fields rather than truncating", () => {
    const result = validateApplication({
      ...validBody,
      motivation: "x".repeat(APPLICATION_MAX_LENGTHS.motivation + 1),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.motivation).toBeDefined();
  });
});
