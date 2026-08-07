import { describe, it, expect } from "vitest";
import { createOauthState, verifyOauthState } from "@/lib/github/oauth-state";

const SECRET = "test-oauth-secret";

describe("oauth state", () => {
  it("verifies a freshly created state against its nonce", () => {
    const { token, nonce } = createOauthState(SECRET);
    expect(verifyOauthState(token, nonce, SECRET)).toBe(true);
  });

  it("rejects when the cookie nonce does not match", () => {
    const { token } = createOauthState(SECRET);
    expect(verifyOauthState(token, "different-nonce", SECRET)).toBe(false);
  });

  it("rejects a token signed with a different secret", () => {
    const { token, nonce } = createOauthState("other-secret");
    expect(verifyOauthState(token, nonce, SECRET)).toBe(false);
  });

  it("rejects a tampered token body", () => {
    const { token, nonce } = createOauthState(SECRET);
    const [body, sig] = token.split(".");
    const tampered = `${body}x.${sig}`;
    expect(verifyOauthState(tampered, nonce, SECRET)).toBe(false);
  });

  it("rejects an expired token", () => {
    const past = Date.now() - 60 * 60 * 1000;
    const { token, nonce } = createOauthState(SECRET, past);
    expect(verifyOauthState(token, nonce, SECRET)).toBe(false);
  });

  it("rejects missing token or nonce", () => {
    const { token, nonce } = createOauthState(SECRET);
    expect(verifyOauthState(null, nonce, SECRET)).toBe(false);
    expect(verifyOauthState(token, null, SECRET)).toBe(false);
  });
});
