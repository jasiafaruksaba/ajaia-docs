import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canViewDocument } from "@/lib/access";
import { getDocumentForUser } from "@/lib/documents";

type PageProps = { params: Promise<{ id: string }> };

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

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/documents" className="text-sm text-blue-600 hover:underline">
          ← Back to documents
        </Link>

        <div className="mt-4 rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{document.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Owner: {document.owner.name} · Your access: {access}
          </p>

          <p className="mt-6 text-slate-600">
            The editor will be added in the next step.
          </p>
        </div>
      </div>
    </main>
  );
}