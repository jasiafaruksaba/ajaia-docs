export type ShareRole = "VIEWER" | "EDITOR";

export type DocumentAccess = "OWNER" | "EDITOR" | "VIEWER" | "NONE";

type DocumentForAccess = {
  ownerId: string;
  shares: Array<{
    userId: string;
    role: ShareRole;
  }>;
};

export function getDocumentAccess(
  userId: string | null | undefined,
  document: DocumentForAccess,
): DocumentAccess {
  if (!userId) {
    return "NONE";
  }

  if (document.ownerId === userId) {
    return "OWNER";
  }

  const share = document.shares.find((item) => item.userId === userId);

  if (!share) {
    return "NONE";
  }

  return share.role;
}

export function canViewDocument(access: DocumentAccess) {
  return access !== "NONE";
}

export function canEditDocument(access: DocumentAccess) {
  return access === "OWNER" || access === "EDITOR";
}

export function canShareDocument(access: DocumentAccess) {
  return access === "OWNER";
}