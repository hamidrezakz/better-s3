"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import Dashboard from "@uppy/react/dashboard";
import StatusBar from "@uppy/react/status-bar";
import { UppyContextProvider, Dropzone, UploadButton } from "@uppy/react";
import { createUppyS3 } from "@/lib/uppy-s3";
import { UppyUploadButton } from "@/components/uppy-upload-button";

// ─── Shared key generator helpers ─────────────────────────────────
const keyForUploads = (file: { name?: string }) =>
  `uploads/${Date.now()}-${file.name ?? "file"}`;

const keyForImages = (file: { name?: string }) =>
  `images/${Date.now()}-${file.name ?? "file"}`;

// ─── useManagedUppy ───────────────────────────────────────────────
// Mini hook: creates an Uppy instance scoped to one component instance
// and tears it down properly when unmounted.
function useManagedUppy(opts: Parameters<typeof createUppyS3>[0] = {}) {
  const uppy = useMemo(() => createUppyS3(opts), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => uppy.destroy(), [uppy]);
  return uppy;
}

export default function UploadPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-14 p-8">
      <header>
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600">
          ← Home
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Upload Variants</h1>
        <p className="text-sm text-zinc-500">
          Different ways to use Uppy with the same{" "}
          <code>@better-s3/server</code> backend. Each section imports{" "}
          <code>Dashboard</code> directly — no wrapper components.
        </p>
      </header>

      <DefaultDashboard />
      <CompactDashboard />
      <ImageOnlyDashboard />
      <DarkDashboard />
      <HeadlessDropzone />
      <CustomButtonSection />
    </main>
  );
}

// ─── 1. Default ───────────────────────────────────────────────────
// Full-featured panel: thumbnail previews, pause/resume, retry, multipart.
function DefaultDashboard() {
  const uppy = useManagedUppy({ generateKey: keyForUploads });
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title="1 — Default Dashboard"
        desc="Full-featured panel. Multipart kicks in automatically for files ≥ 50 MB."
      />
      <Dashboard
        uppy={uppy}
        height={400}
        note="Any file type — up to 5 GB"
        proudlyDisplayPoweredByUppy={false}
      />
    </section>
  );
}

// ─── 2. Compact (fixed width + no status bar) ─────────────────────
// Good for sidebars or tight layouts. Hides the built-in status bar
// so you can render your own progress indicator elsewhere.
function CompactDashboard() {
  const uppy = useManagedUppy({ generateKey: keyForUploads });
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title="2 — Compact (fixed width, no built-in status bar)"
        desc="width/height props constrain the panel. disableStatusBar lets you render your own progress elsewhere."
      />
      <Dashboard
        uppy={uppy}
        width={460}
        height={280}
        proudlyDisplayPoweredByUppy={false}
        disableStatusBar
        hideProgressAfterFinish
        note="Max 3 files"
      />
    </section>
  );
}

// ─── 3. Image-only with meta fields ──────────────────────────────
// Restricts to images, enables singleFileFullScreen (nice for avatar pickers),
// and adds a custom meta field that gets attached to the S3 metadata.
function ImageOnlyDashboard() {
  const uppy = useManagedUppy({
    generateKey: keyForImages,
    onUploadSuccess: (key) => console.log("[image-only] uploaded:", key),
  });

  // Add image restriction after factory so the same factory stays generic
  useMemo(() => {
    uppy.setOptions({
      restrictions: {
        ...uppy.opts.restrictions,
        allowedFileTypes: ["image/*"],
        maxNumberOfFiles: 1,
      },
    });
  }, [uppy]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title="3 — Image-only + custom meta field"
        desc="Restricts to images, adds an alt-text meta field, singleFileFullScreen for a clean avatar-picker feel."
      />
      <Dashboard
        uppy={uppy}
        height={380}
        proudlyDisplayPoweredByUppy={false}
        singleFileFullScreen
        metaFields={[
          {
            id: "alt",
            name: "Alt text",
            placeholder: "Describe the image for screen readers",
          },
          {
            id: "caption",
            name: "Caption",
            placeholder: "Optional caption",
          },
        ]}
        note="One image at a time"
      />
    </section>
  );
}

// ─── 4. Dark theme ───────────────────────────────────────────────
// theme="dark" overrides the Dashboard's internal CSS variables.
// Works independently of the app's light/dark mode.
function DarkDashboard() {
  const uppy = useManagedUppy({ generateKey: keyForUploads });
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title="4 — Dark theme"
        desc='theme="dark" forces the Dashboard into dark mode regardless of the system setting. Use theme="auto" to follow the OS.'
      />
      <Dashboard
        uppy={uppy}
        height={380}
        theme="dark"
        proudlyDisplayPoweredByUppy={false}
        note="theme can be 'light' | 'dark' | 'auto'"
      />
    </section>
  );
}

// ─── 5. Headless Dropzone (no Dashboard at all) ───────────────────
// Uses @uppy/react's new headless primitives: Dropzone + UploadButton.
// The StatusBar class component still works alongside it.
// This is the lightest option — no Dashboard CSS, no thumbnail generator.
function HeadlessDropzone() {
  const uppy = useManagedUppy({
    generateKey: keyForImages,
    onUploadSuccess: (key) => console.log("[headless] uploaded:", key),
  });

  useMemo(() => {
    uppy.setOptions({
      restrictions: {
        ...uppy.opts.restrictions,
        allowedFileTypes: ["image/*", ".pdf"],
      },
    });
  }, [uppy]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title="5 — Headless Dropzone"
        desc="Uses @uppy/react headless primitives (Dropzone + UploadButton). Bring your own styling — no Dashboard CSS loaded."
      />
      <UppyContextProvider uppy={uppy}>
        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border p-4">
          {/* Drop zone — unstyled, you own the CSS */}
          <Dropzone width="100%" note="Images and PDFs only" />

          {/* Built-in status bar still works with the context */}
          <StatusBar uppy={uppy} showProgressDetails hideAfterFinish={false} />

          {/* Upload trigger — renders a plain <button>, style it yourself */}
          <div className="flex justify-end">
            <UploadButton />
          </div>
        </div>
      </UppyContextProvider>
    </section>
  );
}

// ─── 6. Custom Minimal Button ────────────────────────────────────
// Separate component: UppyUploadButton — same styling as @better-s3/ui Upload.
function CustomButtonSection() {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title="6 — Custom Minimal Button"
        desc="UppyUploadButton component — same Button + CircleProgress styling as @better-s3/ui. Zero Dashboard CSS."
      />
      <UppyUploadButton
        generateKey={(f) => `uploads/${Date.now()}-${f.name ?? "file"}`}
        onUploadSuccess={(key) => console.log("[custom-btn] uploaded:", key)}
      />
    </section>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────
function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-zinc-500">{desc}</p>
    </div>
  );
}
