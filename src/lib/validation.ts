export const MAX_TITLE_LENGTH = 120;
export const MAX_CONTENT_LENGTH = 1_000_000; // ~1MB

type ParseResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

export function parseTitle(value: unknown): ParseResult {
  if (typeof value !== "string") {
    return { ok: false, error: "Title must be a string." };
  }

  const title = value.trim();

  if (!title) {
    return { ok: false, error: "Title cannot be empty." };
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return {
      ok: false,
      error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`,
    };
  }

  return { ok: true, value: title };
}

export async function readJson(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();

    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }

    return null;
  } catch {
    return null;
  }
}
export const SHARE_ROLES = ["VIEWER", "EDITOR"] as const;
export type ShareRoleValue = (typeof SHARE_ROLES)[number];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseEmail(value: unknown): ParseResult {
  if (typeof value !== "string") {
    return { ok: false, error: "Email must be a string." };
  }

  const email = value.trim().toLowerCase();

  if (!email) {
    return { ok: false, error: "Email is required." };
  }

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  return { ok: true, value: email };
}

export function parseShareRole(
  value: unknown,
): { ok: true; value: ShareRoleValue } | { ok: false; error: string } {
  if (value === "VIEWER" || value === "EDITOR") {
    return { ok: true, value };
  }

  return { ok: false, error: "Role must be VIEWER or EDITOR." };
}