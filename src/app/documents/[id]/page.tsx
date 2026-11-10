import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  canEditDocument,
  canShareDocument,
  canViewDocument,
} from "@/lib/access";
import { getDocumentForUser } from "@/lib/documents";
import Editor from "@/components/Editor";
import ShareDialog from "@/components/ShareDialog";

type PageProps = { params: Promise<{ id: string }> };

const accessLabels = {
  OWNER: "Owner",
  EDITOR: "Can edit",
  VIEWER: "View only",
  NONE: "No access",
} as const;

export default async function DocumentPage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const result = await getDocumentForUser(id, user.id);

  if (!result || !canViewDocument(result.access)) {
    notFound();
  }

  const { document, access } = result;
  const canEdit = canEditDocument(access);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/documents"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to documents
          </Link>

         <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>Owner: {document.owner.name}</span>
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
              {accessLabels[access]}
            </span>
            {canShareDocument(access) ? (
              <ShareDialog documentId={document.id} />
            ) : null}
          </div>
        </div>

        {!canEdit ? (
          <div
            role="status"
            className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            You have view-only access to this document. Ask {document.owner.name}{" "}
            for edit access if you need to make changes.
          </div>
        ) : null}

        <Editor
          documentId={document.id}
          initialTitle={document.title}
          initialContent={document.content}
          canEdit={canEdit}
        />
      </div>
    </main>
  );
}