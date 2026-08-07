import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyWebhookSignature } from "@/lib/github/webhook-signature";

const SECRET = "test-webhook-secret";

function sign(body: string, secret = SECRET): string {
  return "sha256=" + createHmac("sha256", secret).update(body, "utf8").digest("hex");
}

describe("verifyWebhookSignature", () => {
  const body = JSON.stringify({ action: "completed", hello: "world" });

  it("accepts a valid signature", () => {
    expect(verifyWebhookSignature(body, sign(body), SECRET)).toBe(true);
  });

  it("rejects a signature made with the wrong secret", () => {
    expect(verifyWebhookSignature(body, sign(body, "other"), SECRET)).toBe(false);
  });

  it("rejects a tampered body", () => {
    const sig = sign(body);
    expect(verifyWebhookSignature(body + " ", sig, SECRET)).toBe(false);
  });

  it("rejects a missing signature header", () => {
    expect(verifyWebhookSignature(body, null, SECRET)).toBe(false);
  });

  it("rejects a header without the sha256= prefix", () => {
    const bare = createHmac("sha256", SECRET).update(body).digest("hex");
    expect(verifyWebhookSignature(body, bare, SECRET)).toBe(false);
  });

  it("rejects when the secret is empty", () => {
    expect(verifyWebhookSignature(body, sign(body), "")).toBe(false);
  });
});
