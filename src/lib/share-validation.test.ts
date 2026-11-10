import { describe, expect, it } from "vitest";
import { parseEmail, parseShareRole } from "./validation";

describe("parseEmail", () => {
  it("trims and lowercases a valid email", () => {
    expect(parseEmail("  Bob@Test.COM ")).toEqual({
      ok: true,
      value: "bob@test.com",
    });
  });

  it("rejects an empty email", () => {
    expect(parseEmail("   ").ok).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(parseEmail("not-an-email").ok).toBe(false);
    expect(parseEmail("a@b").ok).toBe(false);
  });

  it("rejects a non-string value", () => {
    expect(parseEmail(42).ok).toBe(false);
  });
});

describe("parseShareRole", () => {
  it("accepts VIEWER and EDITOR", () => {
    expect(parseShareRole("VIEWER")).toEqual({ ok: true, value: "VIEWER" });
    expect(parseShareRole("EDITOR")).toEqual({ ok: true, value: "EDITOR" });
  });

  it("rejects OWNER and unknown roles", () => {
    expect(parseShareRole("OWNER").ok).toBe(false);
    expect(parseShareRole("admin").ok).toBe(false);
    expect(parseShareRole(undefined).ok).toBe(false);
  });
});