import { describe, it, expect } from "vitest";
import { safeNextPath } from "@/lib/safe-redirect";

describe("safeNextPath", () => {
  it("returns the default when next is missing", () => {
    expect(safeNextPath(undefined)).toBe("/dashboard");
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath("")).toBe("/dashboard");
  });

  it("allows internal absolute paths", () => {
    expect(safeNextPath("/learn")).toBe("/learn");
    expect(safeNextPath("/learn/level-0-orientation/welcome")).toBe(
      "/learn/level-0-orientation/welcome",
    );
    expect(safeNextPath("/settings")).toBe("/settings");
  });

  it("rejects external and protocol-relative URLs (open redirect)", () => {
    expect(safeNextPath("https://evil.com")).toBe("/dashboard");
    expect(safeNextPath("//evil.com")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.com")).toBe("/dashboard");
    expect(safeNextPath("javascript:alert(1)")).toBe("/dashboard");
  });

  it("honors a custom fallback", () => {
    expect(safeNextPath(undefined, "/")).toBe("/");
  });
});
