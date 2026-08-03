import { describe, it, expect } from "vitest";
import { isProtectedPath, PROTECTED_PREFIXES } from "@/lib/supabase/protected-routes";

describe("isProtectedPath", () => {
  it("protects the dashboard, learn tree, and settings", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/learn")).toBe(true);
    expect(isProtectedPath("/learn/level-0-orientation")).toBe(true);
    expect(isProtectedPath("/learn/level-0-orientation/welcome")).toBe(true);
    expect(isProtectedPath("/settings")).toBe(true);
  });

  it("does not protect public routes", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/curriculum")).toBe(false);
    expect(isProtectedPath("/how-it-works")).toBe(false);
    expect(isProtectedPath("/apply")).toBe(false);
  });

  it("does not treat lookalike prefixes as protected", () => {
    expect(isProtectedPath("/dashboards")).toBe(false);
    expect(isProtectedPath("/learners")).toBe(false);
  });

  it("exposes the canonical prefix list", () => {
    expect(PROTECTED_PREFIXES).toContain("/dashboard");
    expect(PROTECTED_PREFIXES).toContain("/learn");
    expect(PROTECTED_PREFIXES).toContain("/settings");
  });
});
