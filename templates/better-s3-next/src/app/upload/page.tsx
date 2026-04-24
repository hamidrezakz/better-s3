"use client";

import Link from "next/link";
import { s3Api as api } from "@/lib/s3";
import {
  UploadButton,
  UploadDropzone,
  DownloadButton,
  ProgressDownloadButton,
  DeleteButton,
} from "@better-s3/ui";

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
        <UploadDropzone
          api={api}
          objectKey={(file: File) => `uploads/${Date.now()}-${file.name}`}
          accept={["image/*", ".pdf"]}
          maxFileSize={10 * 1024 * 1024} // 10 MB
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Single Upload (button)</h2>
        <UploadButton
          api={api}
          objectKey={(file: File) => `uploads/${Date.now()}-${file.name}`}
          accept={["image/*"]}
        />
      </section>

      {/* ── Multi Upload ───────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Multi Upload</h2>
        <UploadDropzone
          api={api}
          objectKey={(file: File) => `uploads/${Date.now()}-${file.name}`}
          maxFiles={5}
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
            api={api}
            objectKey="multi/1775874047348-askarzadeh.logo-27.jpg"
          />
          <ProgressDownloadButton
            api={api}
            objectKey="multi/1775874047348-askarzadeh.logo-27.jpg"
            label="Download (with progress)"
          />
          <DeleteButton api={api} objectKey="multi/1775874047348-askarzadeh.logo-27.jpg" />
        </div>
      </section>
    </main>
  );
}
