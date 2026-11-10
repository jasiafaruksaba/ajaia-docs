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