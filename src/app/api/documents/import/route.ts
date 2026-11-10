import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_IMPORT_BYTES, convertImportedFile } from "@/lib/import";

export const runtime = "nodejs";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("Please log in.", 401);
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Upload a file using multipart form data.", 400);
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return errorResponse("No file was uploaded.", 400);
  }

  // Check the declared size before reading the file into memory.
  if (file.size > MAX_IMPORT_BYTES) {
    return errorResponse("The file is too large. The maximum size is 2MB.", 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await convertImportedFile(file.name, buffer);

  if (!result.ok) {
    return errorResponse(result.error, result.status);
  }

  const document = await db.document.create({
    data: {
      title: result.title,
      content: result.html,
      ownerId: user.id,
    },
    select: { id: true, title: true },
  });

  return NextResponse.json({ document }, { status: 201 });
}