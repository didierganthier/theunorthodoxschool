import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  friendlyAuthError,
  callbackErrorMessage,
  magicLinkRedirectUrl,
  callbackHasCredentials,
} from "@/lib/auth-utils";

describe("isValidEmail", () => {
  it("rejects empty and whitespace", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("   ")).toBe(false);
  });

  it("rejects malformed addresses", () => {
    expect(isValidEmail("abc")).toBe(false);
    expect(isValidEmail("abc@")).toBe(false);
    expect(isValidEmail("abc@def")).toBe(false);
    expect(isValidEmail("a b@c.com")).toBe(false);
    expect(isValidEmail("a".repeat(255) + "@x.com")).toBe(false);
  });

  it("accepts valid addresses", () => {
    expect(isValidEmail("learner@example.com")).toBe(true);
    expect(isValidEmail("  learner@example.com  ")).toBe(true);
    expect(isValidEmail("first.last+tag@sub.example.co")).toBe(true);
  });
});

describe("friendlyAuthError", () => {
  it("handles a generic Supabase request failure", () => {
    expect(friendlyAuthError("Some internal failure")).toBe(
      "We couldn't send your sign-in link. Please try again.",
    );
    expect(friendlyAuthError(undefined)).toBe(
      "We couldn't send your sign-in link. Please try again.",
    );
  });

  it("maps rate-limit errors", () => {
    expect(friendlyAuthError("For security purposes, wait 46 seconds")).toMatch(
      /wait a minute/i,
    );
  });

  it("maps invalid email errors", () => {
    expect(friendlyAuthError("Invalid email address")).toMatch(/valid/i);
  });

  it("never leaks raw internals", () => {
    const raw = "SMTP connection refused token=abc123";
    expect(friendlyAuthError(raw)).not.toContain("abc123");
  });
});

describe("callbackErrorMessage", () => {
  it("maps known error codes to friendly text", () => {
    expect(callbackErrorMessage("missing_code")).toMatch(/incomplete|expired/i);
    expect(callbackErrorMessage("auth")).toMatch(/expired|already used/i);
    expect(callbackErrorMessage("unconfigured")).toMatch(/unavailable/i);
  });

  it("returns empty string for no/unknown error", () => {
    expect(callbackErrorMessage(undefined)).toBe("");
    expect(callbackErrorMessage("something-else")).toBe("");
  });
});

describe("magicLinkRedirectUrl", () => {
  it("builds an encoded callback URL for the current origin", () => {
    expect(
      magicLinkRedirectUrl("https://www.theunorthodoxschool.com", "/dashboard"),
    ).toBe("https://www.theunorthodoxschool.com/auth/callback?next=%2Fdashboard");
  });

  it("encodes nested paths", () => {
    expect(magicLinkRedirectUrl("http://localhost:3000", "/learn/x/y")).toBe(
      "http://localhost:3000/auth/callback?next=%2Flearn%2Fx%2Fy",
    );
  });
});

describe("callbackHasCredentials", () => {
  it("is false when the callback carries no code (missing_code path)", () => {
    expect(callbackHasCredentials({})).toBe(false);
    expect(callbackHasCredentials({ code: null })).toBe(false);
    expect(callbackHasCredentials({ tokenHash: "x" })).toBe(false);
    expect(callbackHasCredentials({ type: "magiclink" })).toBe(false);
  });

  it("is true with a PKCE code or a token_hash + type", () => {
    expect(callbackHasCredentials({ code: "abc" })).toBe(true);
    expect(callbackHasCredentials({ tokenHash: "abc", type: "email" })).toBe(true);
  });
});
