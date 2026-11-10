"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";

const ACCEPTED_EXTENSIONS = [".txt", ".md", ".docx"];
const MAX_BYTES = 2 * 1024 * 1024;

export default function ImportDocumentButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    // Reset so choosing the same file again still triggers onChange.
    input.value = "";

    if (!file) return;

    setError("");

    const lowerName = file.name.toLowerCase();

    if (!ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
      setError("Unsupported file type. Please choose a .txt, .md or .docx file.");
      return;
    }

    if (file.size > MAX_BYTES) {
      setError("That file is larger than 2MB.");
      return;
    }

    setUploading(true);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/documents/import", {
        method: "POST",
        body,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      router.push(`/documents/${data.document.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setUploading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,.docx"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload a document file"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {uploading ? "Importing..." : "Upload file"}
      </button>

      <p className="mt-1 text-xs text-slate-500">
        Supported: .txt, .md, .docx (max 2MB)
      </p>

      {error ? (
        <p role="alert" className="mt-2 max-w-xs text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}