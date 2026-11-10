"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

type Role = "VIEWER" | "EDITOR";

type Share = {
  userId: string;
  role: Role;
  user: { name: string; email: string };
};

const roleLabels: Record<Role, string> = {
  VIEWER: "Can view",
  EDITOR: "Can edit",
};

export default function ShareDialog({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("VIEWER");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const endpoint = `/api/documents/${documentId}/share`;

  const loadShares = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load sharing settings.");
      }

      setShares(data.shares);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  function openDialog() {
    setOpen(true);
    setMessage("");
    void loadShares();
  }

  // Close with the Escape key.
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  async function handleShare(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not share the document.");
      }

      setShares((current) => [...current, data.share]);
      setMessage(`Shared with ${data.share.user.name}.`);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function changeRole(userId: string, newRole: Role) {
    setError("");
    setMessage("");

    const previous = shares;
    setShares((current) =>
      current.map((s) => (s.userId === userId ? { ...s, role: newRole } : s)),
    );

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not change the role.");
      }
    } catch (err) {
      setShares(previous);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function removeAccess(userId: string) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${endpoint}?userId=${encodeURIComponent(userId)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not remove access.");
      }

      setShares((current) => current.filter((s) => s.userId !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Share
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Share document"
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Share document
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleShare} className="mt-4 flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                aria-label="Email address"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />

              <select
                value={role}
                onChange={(event) => setRole(event.target.value as Role)}
                aria-label="Role"
                className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900"
              >
                <option value="VIEWER">{roleLabels.VIEWER}</option>
                <option value="EDITOR">{roleLabels.EDITOR}</option>
              </select>

              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? "Sharing..." : "Share"}
              </button>
            </form>

            <p className="mt-2 text-xs text-slate-500">
              Demo users: alice@test.com, bob@test.com, carol@test.com
            </p>

            {error ? (
              <p
                role="alert"
                className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            ) : null}

            {message ? (
              <p
                role="status"
                className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
              >
                {message}
              </p>
            ) : null}

            <h3 className="mt-5 text-sm font-semibold text-slate-700">
              People with access
            </h3>

            {loading ? (
              <p className="mt-2 text-sm text-slate-500">Loading...</p>
            ) : shares.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Only you can access this document.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100">
                {shares.map((share) => (
                  <li
                    key={share.userId}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {share.user.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {share.user.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={share.role}
                        onChange={(event) =>
                          void changeRole(
                            share.userId,
                            event.target.value as Role,
                          )
                        }
                        aria-label={`Role for ${share.user.name}`}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
                      >
                        <option value="VIEWER">{roleLabels.VIEWER}</option>
                        <option value="EDITOR">{roleLabels.EDITOR}</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => void removeAccess(share.userId)}
                        className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}