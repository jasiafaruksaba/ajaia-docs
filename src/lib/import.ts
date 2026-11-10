import { marked } from "marked";
import mammoth from "mammoth";
import { sanitizeContent } from "./sanitize";
import { MAX_CONTENT_LENGTH, MAX_TITLE_LENGTH } from "./validation";

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024; // 2MB
export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".docx"] as const;

export type ImportResult =
  | { ok: true; title: string; html: string }
  | { ok: false; error: string; status: number };

function fail(error: string, status: number): ImportResult {
  return { ok: false, error, status };
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Blank line = new paragraph, single line break = <br>.
export function textToHtml(text: string): string {
  return text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

export function titleFromFilename(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  const title = base.replace(/[_-]+/g, " ").trim().slice(0, MAX_TITLE_LENGTH);

  return title || "Imported document";
}

export async function convertImportedFile(
  fileName: string,
  data: Buffer,
): Promise<ImportResult> {
  const extension = getExtension(fileName);

  if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(extension)) {
    return fail(
      "Unsupported file type. Please upload a .txt, .md or .docx file.",
      415,
    );
  }

  if (data.length === 0) {
    return fail("The file is empty.", 400);
  }

  if (data.length > MAX_IMPORT_BYTES) {
    return fail("The file is too large. The maximum size is 2MB.", 413);
  }

  let rawHtml: string;

  try {
    if (extension === ".txt") {
      rawHtml = textToHtml(data.toString("utf8"));
    } else if (extension === ".md") {
      rawHtml = marked.parse(data.toString("utf8"), { async: false });
    } else {
      const result = await mammoth.convertToHtml({ buffer: data });
      rawHtml = result.value;
    }
  } catch {
    return fail(
      "We could not read that file. It may be corrupted or in an unsupported format.",
      422,
    );
  }

  // Never trust converted HTML: strip anything outside the editor's schema.
  const html = sanitizeContent(rawHtml);
  const visibleText = html.replace(/<[^>]*>/g, "").trim();

  if (!visibleText) {
    return fail("The file does not contain any readable text.", 400);
  }

  if (html.length > MAX_CONTENT_LENGTH) {
    return fail("The converted document is too large.", 413);
  }

  return { ok: true, title: titleFromFilename(fileName), html };
}