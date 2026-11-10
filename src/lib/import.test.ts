import { describe, expect, it } from "vitest";
import {
  MAX_IMPORT_BYTES,
  convertImportedFile,
  getExtension,
  textToHtml,
  titleFromFilename,
} from "./import";

function bytes(text: string) {
  return Buffer.from(text, "utf8");
}

describe("textToHtml", () => {
  it("turns blank lines into paragraphs and single newlines into line breaks", () => {
    expect(textToHtml("One\nTwo\n\nThree")).toBe("<p>One<br>Two</p><p>Three</p>");
  });

  it("escapes HTML in plain text", () => {
    expect(textToHtml("<b>hi</b>")).toBe("<p>&lt;b&gt;hi&lt;/b&gt;</p>");
  });
});

describe("filename helpers", () => {
  it("reads the extension in lowercase", () => {
    expect(getExtension("Notes.MD")).toBe(".md");
    expect(getExtension("noextension")).toBe("");
  });

  it("builds a readable title from the filename", () => {
    expect(titleFromFilename("project_plan-v2.docx")).toBe("project plan v2");
    expect(titleFromFilename(".md")).toBe(".md");
  });
});

describe("convertImportedFile", () => {
  it("converts a .txt file", async () => {
    const result = await convertImportedFile("notes.txt", bytes("Hello\n\nWorld"));

    expect(result).toEqual({
      ok: true,
      title: "notes",
      html: "<p>Hello</p><p>World</p>",
    });
  });

  it("converts markdown to formatted HTML", async () => {
    const result = await convertImportedFile(
      "readme.md",
      bytes("# Title\n\nSome **bold** text\n\n- one\n- two"),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.html).toContain("<h1>Title</h1>");
      expect(result.html).toContain("<strong>bold</strong>");
      expect(result.html).toContain("<li>one</li>");
    }
  });

  it("strips scripts from imported markdown", async () => {
    const result = await convertImportedFile(
      "evil.md",
      bytes("Hi\n\n<script>alert(1)</script>\n\n<p onclick=\"x()\">there</p>"),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.html).not.toContain("<script");
      expect(result.html).not.toContain("onclick");
    }
  });

  it("rejects unsupported file types", async () => {
    const result = await convertImportedFile("photo.png", bytes("data"));

    expect(result).toMatchObject({ ok: false, status: 415 });
  });

  it("rejects empty files", async () => {
    const result = await convertImportedFile("empty.txt", Buffer.alloc(0));

    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects files with no readable text", async () => {
    const result = await convertImportedFile("blank.txt", bytes("   \n\n  "));

    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects files over the size limit", async () => {
    const result = await convertImportedFile(
      "big.txt",
      Buffer.alloc(MAX_IMPORT_BYTES + 1, "a"),
    );

    expect(result).toMatchObject({ ok: false, status: 413 });
  });

  it("returns a friendly error for a corrupted .docx", async () => {
    const result = await convertImportedFile("broken.docx", bytes("not a real docx"));

    expect(result).toMatchObject({ ok: false, status: 422 });
  });
});