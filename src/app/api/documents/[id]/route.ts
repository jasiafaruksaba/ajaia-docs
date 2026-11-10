import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canEditDocument, canViewDocument } from "@/lib/access";
import { getDocumentForUser } from "@/lib/documents";
import { sanitizeContent } from "@/lib/sanitize";
import {
  MAX_CONTENT_LENGTH,
  parseTitle,
  readJson,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const { id } = await params;
  const result = await getDocumentForUser(id, user.id);

  if (!result || !canViewDocument(result.access)) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const { document, access } = result;

  return NextResponse.json({
    document: {
      id: document.id,
      title: document.title,
      content: document.content,
      updatedAt: document.updatedAt,
      owner: document.owner,
    },
    access,
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const { id } = await params;
  const result = await getDocumentForUser(id, user.id);

  if (!result || !canViewDocument(result.access)) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  if (!canEditDocument(result.access)) {
    return NextResponse.json(
      { error: "You have view-only access to this document." },
      { status: 403 },
    );
  }

  const body = await readJson(request);

  if (!body) {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const data: { title?: string; content?: string } = {};

  if ("title" in body) {
    const parsed = parseTitle(body.title);

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    data.title = parsed.value;
  }

  if ("content" in body) {
    if (typeof body.content !== "string") {
      return NextResponse.json(
        { error: "Content must be a string." },
        { status: 400 },
      );
    }

    if (body.content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: "Document is too large to save." },
        { status: 413 },
      );
    }

    data.content = sanitizeContent(body.content);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Nothing to update. Send a title or content." },
      { status: 400 },
    );
  }

  const document = await db.document.update({
    where: { id },
    data,
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json({ document });
}