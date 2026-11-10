import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listDocumentsForUser } from "@/lib/documents";
import CreateDocumentButton from "@/components/CreateDocumentButton";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function DocumentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { owned, shared } = await listDocumentsForUser(user.id);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ajaia Docs</h1>
            <p className="mt-1 text-sm text-slate-600">
              Signed in as {user.name} ({user.email})
            </p>
          </div>

          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Log out
            </button>
          </form>
        </header>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              My documents
            </h2>
            <CreateDocumentButton />
          </div>

          {owned.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              You have no documents yet. Create your first one.
            </div>
          ) : (
            <ul className="space-y-3">
              {owned.map((doc) => (
                <li key={doc.id}>
                  <Link
                    href={`/documents/${doc.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-400"
                  >
                    <span className="font-medium text-slate-900">
                      {doc.title}
                    </span>
                    <span className="text-sm text-slate-500">
                      Edited {dateFormatter.format(doc.updatedAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Shared with me
          </h2>

          {shared.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              Nothing has been shared with you yet.
            </div>
          ) : (
            <ul className="space-y-3">
              {shared.map((doc) => (
                <li key={doc.id}>
                  <Link
                    href={`/documents/${doc.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-400"
                  >
                    <div>
                      <span className="font-medium text-slate-900">
                        {doc.title}
                      </span>
                      <p className="text-sm text-slate-500">
                        Shared by {doc.owner.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          doc.role === "EDITOR"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {doc.role === "EDITOR" ? "Can edit" : "View only"}
                      </span>
                      <span className="text-sm text-slate-500">
                        {dateFormatter.format(doc.updatedAt)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}