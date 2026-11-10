"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import type { Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

type SaveStatus = "saved" | "saving" | "unsaved" | "error";

type PendingChanges = {
  title?: string;
  content?: string;
};

type EditorProps = {
  documentId: string;
  initialTitle: string;
  initialContent: string;
  canEdit: boolean;
};

const AUTOSAVE_DELAY_MS = 1000;
const MAX_TITLE_LENGTH = 120;

export default function Editor({
  documentId,
  initialTitle,
  initialContent,
  canEdit,
}: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [errorMessage, setErrorMessage] = useState("");

  const pendingRef = useRef<PendingChanges>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const lastValidTitleRef = useRef(initialTitle);

  // Sends everything that is waiting to be saved. If the user keeps typing
  // while a request is running, the loop sends the newer changes afterwards.
  const flush = useCallback(async () => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    let payload: PendingChanges = {};

    try {
      while (Object.keys(pendingRef.current).length > 0) {
        payload = pendingRef.current;
        pendingRef.current = {};
        setStatus("saving");

        const response = await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Could not save your changes.");
        }
      }

      setErrorMessage("");
      setStatus("saved");
    } catch (error) {
      // Put the failed changes back so "Retry" can send them again,
      // without overwriting anything newer.
      pendingRef.current = { ...payload, ...pendingRef.current };
      setErrorMessage(
        error instanceof Error ? error.message : "Could not save.",
      );
      setStatus("error");
    } finally {
      inFlightRef.current = false;
    }
  }, [documentId]);

  const queueSave = useCallback(
    (changes: PendingChanges) => {
      pendingRef.current = { ...pendingRef.current, ...changes };
      setStatus("unsaved");

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        void flush();
      }, AUTOSAVE_DELAY_MS);
    },
    [flush],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
      }),
    ],
    content: initialContent,
    editable: canEdit,
    // Required for Next.js: avoids a server/client HTML mismatch.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-editor",
        "aria-label": "Document content",
      },
    },
    onUpdate: ({ editor }) => {
      if (canEdit) {
        queueSave({ content: editor.getHTML() });
      }
    },
  });

  // Save pending changes when leaving the page inside the app.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      void flush();
    };
  }, [flush]);

  // Warn before closing the tab if something has not been saved yet.
  useEffect(() => {
    if (status === "saved") return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [status]);

  function handleTitleChange(value: string) {
    setTitle(value);

    // The API rejects empty titles, so only save non-empty ones.
    if (value.trim()) {
      lastValidTitleRef.current = value.trim();
      queueSave({ title: value.trim() });
    }
  }

  function handleTitleBlur() {
    if (!title.trim()) {
      setTitle(lastValidTitleRef.current);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
          onBlur={handleTitleBlur}
          readOnly={!canEdit}
          maxLength={MAX_TITLE_LENGTH}
          aria-label="Document title"
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-2xl font-bold text-slate-900 outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white read-only:hover:border-transparent"
        />

        <SaveIndicator
          status={status}
          canEdit={canEdit}
          errorMessage={errorMessage}
          onRetry={() => void flush()}
        />
      </div>

      {canEdit && editor ? <Toolbar editor={editor} /> : null}

      <div className="mt-3 rounded-xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function SaveIndicator({
  status,
  canEdit,
  errorMessage,
  onRetry,
}: {
  status: SaveStatus;
  canEdit: boolean;
  errorMessage: string;
  onRetry: () => void;
}) {
  if (!canEdit) {
    return <span className="text-sm text-slate-500">Read only</span>;
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <span>{errorMessage || "Save failed."}</span>
        <button
          type="button"
          onClick={onRetry}
          className="rounded border border-red-300 px-2 py-0.5 font-medium hover:bg-red-50"
        >
          Retry
        </button>
      </div>
    );
  }

  const labels = {
    saved: "Saved",
    saving: "Saving…",
    unsaved: "Unsaved changes",
  } as const;

  return (
    <span aria-live="polite" className="text-sm text-slate-500">
      {labels[status]}
    </span>
  );
}

function Toolbar({ editor }: { editor: TiptapEditor }) {
  // TipTap v3 does not re-render React on every transaction,
  // so we subscribe to just the values the toolbar needs.
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      underline: current.isActive("underline"),
      paragraph: current.isActive("paragraph"),
      h1: current.isActive("heading", { level: 1 }),
      h2: current.isActive("heading", { level: 2 }),
      h3: current.isActive("heading", { level: 3 }),
      bulletList: current.isActive("bulletList"),
      orderedList: current.isActive("orderedList"),
      canUndo: current.can().undo(),
      canRedo: current.can().redo(),
    }),
  });

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="mt-4 flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
    >
      <ToolbarButton
        title="Bold (Ctrl+B)"
        active={state.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <span className="font-bold">B</span>
      </ToolbarButton>

      <ToolbarButton
        title="Italic (Ctrl+I)"
        active={state.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </ToolbarButton>

      <ToolbarButton
        title="Underline (Ctrl+U)"
        active={state.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Normal text"
        active={state.paragraph}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        Normal
      </ToolbarButton>

      <ToolbarButton
        title="Heading 1"
        active={state.h1}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      >
        H1
      </ToolbarButton>

      <ToolbarButton
        title="Heading 2"
        active={state.h2}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        H2
      </ToolbarButton>

      <ToolbarButton
        title="Heading 3"
        active={state.h3}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      >
        H3
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Bulleted list"
        active={state.bulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </ToolbarButton>

      <ToolbarButton
        title="Numbered list"
        active={state.orderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Undo (Ctrl+Z)"
        disabled={!state.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      >
        ↶
      </ToolbarButton>

      <ToolbarButton
        title="Redo (Ctrl+Y)"
        disabled={!state.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      >
        ↷
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  children,
  title,
  active = false,
  disabled = false,
  onClick,
}: {
  children: ReactNode;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`min-w-9 rounded-md px-2.5 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "bg-blue-100 text-blue-700"
          : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-6 w-px bg-slate-200" />;
}