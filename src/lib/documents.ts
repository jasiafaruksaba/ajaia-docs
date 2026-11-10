import { db } from "@/lib/db";
import { getDocumentAccess } from "@/lib/access";

export async function getDocumentForUser(documentId: string, userId: string) {
  const document = await db.document.findUnique({
    where: { id: documentId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: { select: { userId: true, role: true } },
    },
  });

  if (!document) {
    return null;
  }

  const access = getDocumentAccess(userId, document);

  return { document, access };
}

export async function listDocumentsForUser(userId: string) {
  const [owned, sharedRows] = await Promise.all([
    db.document.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
    }),
    db.documentShare.findMany({
      where: { userId },
      orderBy: { document: { updatedAt: "desc" } },
      select: {
        role: true,
        document: {
          select: {
            id: true,
            title: true,
            updatedAt: true,
            owner: { select: { name: true, email: true } },
          },
        },
      },
    }),
  ]);

  const shared = sharedRows.map((row) => ({
    id: row.document.id,
    title: row.document.title,
    updatedAt: row.document.updatedAt,
    role: row.role,
    owner: row.document.owner,
  }));

  return { owned, shared };
}