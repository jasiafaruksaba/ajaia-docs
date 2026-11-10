import { describe, expect, it } from "vitest";
import { sanitizeContent } from "./sanitize";

describe("sanitizeContent", () => {
  it("keeps supported formatting", () => {
    const html = "<h1>Title</h1><p><strong>Bold</strong> <em>it</em> <u>u</u></p><ul><li>One</li></ul>";
    expect(sanitizeContent(html)).toBe(html);
  });

  it("removes script tags", () => {
    expect(sanitizeContent("<p>Hi</p><script>alert(1)</script>")).toBe("<p>Hi</p>");
  });

  it("removes inline event handlers", () => {
    expect(sanitizeContent('<p onclick="alert(1)">Hi</p>')).toBe("<p>Hi</p>");
  });

  it("removes javascript: links", () => {
    const result = sanitizeContent('<a href="javascript:alert(1)">x</a>');
    expect(result).not.toContain("javascript:");
  });
});