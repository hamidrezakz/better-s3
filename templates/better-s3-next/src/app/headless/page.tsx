"use client";

import { useRef } from "react";
import Link from "next/link";
import { s3Api as api } from "@/lib/s3";
import {
  useUpload,
  useDownload,
  useFetchDownload,
  useDelete,
} from "@better-s3/react";

export default function HeadlessPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 p-8">
      <header>
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600">
          ← Home
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Headless Hooks</h1>
        <p className="text-sm text-zinc-500">
          Build your own UI with hooks from <code>@better-s3/react</code>
        </p>
      </header>

      <UploadDemo />
      <DownloadDemo />
      <FetchDownloadDemo />
      <DeleteDemo />
    </main>
  );
}

// ── useUpload Demo ─────────────────────────────────────────────────
function UploadDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { phase, progress, error, upload, cancel, reset } = useUpload({
    api,
    accept: ["image/*", ".pdf"],
    maxFileSize: 10 * 1024 * 1024,
    onSuccess: (_file, result) => {
      console.log("Uploaded:", result.key, "eTag:", result.eTag);
    },
  });

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await upload(file, `uploads/${Date.now()}-${file.name}`, {
      metadata: { source: "headless-demo" },
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">useUpload</h2>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFile}
        className="hidden"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={phase === "uploading"}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
          {phase === "uploading"
            ? `Uploading ${progress.percent}%`
            : "Choose File"}
        </button>

        {phase === "uploading" && (
          <button onClick={cancel} className="text-sm text-red-500">
            Cancel
          </button>
        )}

        {(phase === "success" || phase === "error") && (
          <button onClick={reset} className="text-sm text-zinc-500">
            Reset
          </button>
        )}
      </div>

      {phase === "uploading" && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      )}

      {phase === "success" && (
        <p className="text-sm text-green-600">Upload complete!</p>
      )}
      {phase === "error" && (
        <p className="text-sm text-red-500">
          Error: {error ? String(error) : "Upload failed"}
        </p>
      )}
    </section>
  );
}

// ── useDownload Demo ───────────────────────────────────────────────
function DownloadDemo() {
  const { phase, error, download, reset } = useDownload({
    api,
    onSuccess: (key) => console.log("Downloaded:", key),
  });

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">useDownload</h2>
      <p className="text-sm text-zinc-500">
        Simple download — fetches the file and triggers a browser save dialog.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => download("uploads/example.jpg", "example.jpg")}
          disabled={phase === "downloading"}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
          {phase === "downloading" ? "Downloading…" : "Download"}
        </button>

        {phase === "error" && (
          <button onClick={reset} className="text-sm text-zinc-500">
            Reset
          </button>
        )}
      </div>

      {phase === "error" && (
        <p className="text-sm text-red-500">
          Error: {error ?? "Download failed"}
        </p>
      )}
    </section>
  );
}

// ── useFetchDownload Demo ──────────────────────────────────────────
function FetchDownloadDemo() {
  const { phase, progress, error, download, cancel, reset } = useFetchDownload({
    api,
    onSuccess: (key) => console.log("Downloaded:", key),
  });

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">useFetchDownload</h2>
      <p className="text-sm text-zinc-500">
        Streams via fetch — shows real-time progress and supports cancellation.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => download("uploads/example.jpg", "example.jpg")}
          disabled={phase === "downloading" || phase === "presigning"}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
          {phase === "downloading"
            ? `Downloading ${progress.percent}%`
            : phase === "presigning"
              ? "Preparing…"
              : "Download (with progress)"}
        </button>

        {phase === "downloading" && (
          <button onClick={cancel} className="text-sm text-red-500">
            Cancel
          </button>
        )}

        {phase === "error" && (
          <button onClick={reset} className="text-sm text-zinc-500">
            Reset
          </button>
        )}
      </div>

      {phase === "downloading" && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      )}

      {phase === "error" && (
        <p className="text-sm text-red-500">
          Error: {error ?? "Download failed"}
        </p>
      )}
    </section>
  );
}

// ── useDelete Demo ─────────────────────────────────────────────────
function DeleteDemo() {
  const { phase, pendingKey, requestDelete, confirmDelete, cancelDelete } =
    useDelete({
      api,
      onSuccess: (key) => console.log("Deleted:", key),
    });

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">useDelete</h2>
      <p className="text-sm text-zinc-500">
        Two-step delete: request → confirm.
      </p>

      {phase === "idle" && (
        <button
          onClick={() => requestDelete("uploads/example.jpg")}
          className="w-fit rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500">
          Delete File
        </button>
      )}

      {phase === "confirming" && (
        <div className="flex items-center gap-3">
          <span className="text-sm">
            Delete <code className="text-red-500">{pendingKey}</code>?
          </span>
          <button
            onClick={confirmDelete}
            className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-500">
            Yes, delete
          </button>
          <button
            onClick={cancelDelete}
            className="text-sm text-zinc-500 hover:text-zinc-700">
            Cancel
          </button>
        </div>
      )}

      {phase === "deleting" && (
        <p className="text-sm text-zinc-500">Deleting…</p>
      )}
      {phase === "success" && (
        <p className="text-sm text-green-600">Deleted!</p>
      )}
      {phase === "error" && (
        <p className="text-sm text-red-500">Delete failed</p>
      )}
    </section>
  );
}
