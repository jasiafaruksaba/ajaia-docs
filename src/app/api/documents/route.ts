import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { listDocumentsForUser } from "@/lib/documents";
import { parseTitle, readJson } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const documents = await listDocumentsForUser(user.id);

  return NextResponse.json(documents);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const body = (await readJson(request)) ?? {};
  let title = "Untitled document";

  if ("title" in body) {
    const parsed = parseTitle(body.title);

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    title = parsed.value;
  }

  const document = await db.document.create({
    data: { title, ownerId: user.id },
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json({ document }, { status: 201 });
}