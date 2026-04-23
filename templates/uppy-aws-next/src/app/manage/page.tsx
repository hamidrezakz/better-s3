"use client";

import { useState } from "react";
import Link from "next/link";
import { DownloadButton } from "@/components/download-button";
import { DeleteButton } from "@/components/delete-button";

export default function ManagePage() {
  const [downloadKey, setDownloadKey] = useState("uploads/sample.pdf");
  const [deleteKey, setDeleteKey] = useState("uploads/sample.pdf");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 p-8">
      <header>
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600">
          ← Home
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Manage Files</h1>
        <p className="text-sm text-zinc-500">
          Download and delete via presigned URLs. Uppy has no built-in
          download/delete — these are custom components calling{" "}
          <code>@better-s3/server</code> directly.
        </p>
      </header>

      {/* ── Download ──────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Download</h2>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Object key</span>
          <input
            type="text"
            value={downloadKey}
            onChange={(e) => setDownloadKey(e.target.value)}
            placeholder="uploads/my-file.pdf"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <DownloadButton
          objectKey={downloadKey}
          fileName={downloadKey.split("/").pop()}
        />
      </section>

      {/* ── Delete ────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Delete</h2>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Object key</span>
          <input
            type="text"
            value={deleteKey}
            onChange={(e) => setDeleteKey(e.target.value)}
            placeholder="uploads/my-file.pdf"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <DeleteButton
          objectKey={deleteKey}
          onSuccess={(key) => console.log("[demo] deleted", key)}
        />
      </section>
    </main>
  );
}
