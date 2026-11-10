"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const demoUsers = [
  {
    name: "Alice",
    email: "alice@test.com",
    description: "Owns the seeded Welcome Doc",
  },
  {
    name: "Bob",
    email: "bob@test.com",
    description: "Use this account to test shared access",
  },
  {
    name: "Carol",
    email: "carol@test.com",
    description: "Additional demo user",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function login(email: string) {
    setLoadingEmail(email);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed.");
      }

      router.push("/documents");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setLoadingEmail(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl">📄</div>

          <h1 className="text-3xl font-bold text-slate-900">Ajaia Docs</h1>

          <p className="mt-2 text-slate-600">
            Choose a demo account to continue
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="space-y-4">
          {demoUsers.map((user) => {
            const isLoading = loadingEmail === user.email;

            return (
              <button
                key={user.email}
                type="button"
                disabled={loadingEmail !== null}
                onClick={() => login(user.email)}
                className="w-full rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {user.name}
                    </h2>

                    <p className="text-sm text-slate-500">{user.email}</p>

                    <p className="mt-2 text-sm text-slate-600">
                      {user.description}
                    </p>
                  </div>

                  <span className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
                    {isLoading ? "Signing in..." : "Continue"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Demo authentication is intentionally used for this take-home
          assignment.
        </p>
      </div>
    </main>
  );
}