import { describe, expect, it } from "vitest";
import { MAX_TITLE_LENGTH, parseTitle } from "./validation";

describe("parseTitle", () => {
  it("trims and accepts a valid title", () => {
    expect(parseTitle("  My doc  ")).toEqual({ ok: true, value: "My doc" });
  });

  it("rejects an empty title", () => {
    expect(parseTitle("   ").ok).toBe(false);
  });

  it("rejects a non-string title", () => {
    expect(parseTitle(123).ok).toBe(false);
  });

  it("rejects a title that is too long", () => {
    expect(parseTitle("a".repeat(MAX_TITLE_LENGTH + 1)).ok).toBe(false);
  });
});