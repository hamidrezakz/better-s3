"use client";

import Link from "next/link";
import { createPresignApi } from "@better-s3/server";
import {
  Upload,
  MultiUpload,
  DownloadButton,
  ProgressDownloadButton,
  DeleteButton,
} from "@better-s3/ui";

// ── Presign API client — calls your /api/s3 route ──────────────────
const presignApi = createPresignApi("/api/s3");

export default function UploadPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 p-8">
      <header>
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600">
          ← Home
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Pre-built UI Components</h1>
        <p className="text-sm text-zinc-500">
          Drop-in components from <code>@better-s3/ui</code>
        </p>
      </header>

      {/* ── Single Upload ──────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Single Upload (dropzone)</h2>
        <Upload
          presignApi={presignApi}
          objectKey={(file) => `uploads/${Date.now()}-${file.name}`}
          variant="dropzone"
          accept={["image/*", ".pdf"]}
          maxFileSize={10 * 1024 * 1024} // 10 MB
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Single Upload (button)</h2>
        <Upload
          presignApi={presignApi}
          objectKey={(file) => `uploads/${Date.now()}-${file.name}`}
          variant="button"
          accept={["image/*"]}
        />
      </section>

      {/* ── Multi Upload ───────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Multi Upload</h2>
        <MultiUpload
          presignApi={presignApi}
          objectKey={(file) => `uploads/${Date.now()}-${file.name}`}
          maxFiles={5}
          variant="dropzone"
          accept={["image/*"]}
        />
      </section>

      {/* ── Download & Delete ──────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Download &amp; Delete</h2>
        <p className="text-sm text-zinc-500">
          Replace the <code>objectKey</code> below with an actual key from your
          bucket.
        </p>
        <div className="flex flex-wrap gap-3">
          <DownloadButton
            presignApi={presignApi}
            objectKey="uploads/example.jpg"
            fileName="example.jpg"
          />
          <ProgressDownloadButton
            presignApi={presignApi}
            objectKey="uploads/example.jpg"
            fileName="example.jpg"
            label="Download (with progress)"
          />
          <DeleteButton
            presignApi={presignApi}
            objectKey="uploads/example.jpg"
          />
        </div>
      </section>
    </main>
  );
}
