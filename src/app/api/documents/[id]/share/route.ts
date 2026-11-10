import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canShareDocument } from "@/lib/access";
import { getDocumentForUser } from "@/lib/documents";
import { parseEmail, parseShareRole, readJson } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// Shared by every handler below: only the owner may manage sharing.
async function requireOwner(documentId: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false as const, response: errorResponse("Please log in.", 401) };
  }

  const result = await getDocumentForUser(documentId, user.id);

  // Hide the document's existence from people who have no access at all.
  if (!result || result.access === "NONE") {
    return {
      ok: false as const,
      response: errorResponse("Document not found.", 404),
    };
  }

  if (!canShareDocument(result.access)) {
    return {
      ok: false as const,
      response: errorResponse("Only the owner can manage sharing.", 403),
    };
  }

  return { ok: true as const, user, document: result.document };
}

const shareSelect = {
  userId: true,
  role: true,
  user: { select: { name: true, email: true } },
} as const;

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireOwner(id);

  if (!auth.ok) return auth.response;

  const shares = await db.documentShare.findMany({
    where: { documentId: id },
    orderBy: { createdAt: "asc" },
    select: shareSelect,
  });

  return NextResponse.json({ shares });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireOwner(id);

  if (!auth.ok) return auth.response;

  const body = await readJson(request);

  if (!body) {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  const email = parseEmail(body.email);
  if (!email.ok) return errorResponse(email.error, 400);

  const role = parseShareRole(body.role);
  if (!role.ok) return errorResponse(role.error, 400);

  const target = await db.user.findUnique({
    where: { email: email.value },
    select: { id: true },
  });

  if (!target) {
    return errorResponse("No user found with that email address.", 404);
  }

  if (target.id === auth.user.id) {
    return errorResponse("You already own this document.", 400);
  }

  const existing = await db.documentShare.findUnique({
    where: { documentId_userId: { documentId: id, userId: target.id } },
    select: { id: true },
  });

  if (existing) {
    return errorResponse(
      "This document is already shared with that user. Change their role in the list instead.",
      409,
    );
  }

  const share = await db.documentShare.create({
    data: { documentId: id, userId: target.id, role: role.value },
    select: shareSelect,
  });

  return NextResponse.json({ share }, { status: 201 });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireOwner(id);

  if (!auth.ok) return auth.response;

  const body = await readJson(request);

  if (!body || typeof body.userId !== "string") {
    return errorResponse("userId is required.", 400);
  }

  const role = parseShareRole(body.role);
  if (!role.ok) return errorResponse(role.error, 400);

  const result = await db.documentShare.updateMany({
    where: { documentId: id, userId: body.userId },
    data: { role: role.value },
  });

  if (result.count === 0) {
    return errorResponse("That user does not have access.", 404);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireOwner(id);

  if (!auth.ok) return auth.response;

  const userId = new URL(request.url).searchParams.get("userId");

  if (!userId) {
    return errorResponse("userId is required.", 400);
  }

  const result = await db.documentShare.deleteMany({
    where: { documentId: id, userId },
  });

  if (result.count === 0) {
    return errorResponse("That user does not have access.", 404);
  }

  return NextResponse.json({ ok: true });
}