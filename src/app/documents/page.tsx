import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function DocumentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">
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

        <section className="mt-6 rounded-xl bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Login successful
          </h2>

          <p className="mt-2 text-slate-600">
            The document dashboard will be added in the next step.
          </p>
        </section>
      </div>
    </main>
  );
}