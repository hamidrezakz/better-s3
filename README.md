<div align="center">

# better-s3

**The missing S3 toolkit for React apps**

Upload, download, and delete files in your React app using S3 presigned URLs.
Headless by default. Pre-built UI with shadcn/ui included. Built on top of the AWS SDK.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## What is better-s3?

**better-s3** is a set of TypeScript packages that handle file uploads, downloads, and deletes against any **S3-compatible storage** (AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces, Supabase Storage, etc.).

It works by generating **presigned URLs** on the server so your client never needs direct access to S3 credentials. The client uploads/downloads directly to S3 using those URLs — fast, secure, and scalable.

### How it's structured

better-s3 is built in layers. Use only what you need:

1. **Core** — the engine. Handles validation, multipart chunking, retry logic, progress tracking. Framework-agnostic.
2. **Server handlers** — drop-in route handlers that create presigned URLs. Currently supports Next.js, more frameworks coming.
3. **React hooks** — headless hooks with full state management for upload/download/delete. You bring your own UI.
4. **UI components** — pre-built components styled with [shadcn/ui](https://ui.shadcn.com). Also installable via `shadcn` CLI.

## Packages

| Package                                          | Description                                                                | Version                                                      |
| ------------------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [`@better-s3/core`](./packages/better-s3-core)   | Upload engine, validation, types, presign API client. Built on AWS SDK v3. | ![npm](https://img.shields.io/npm/v/@better-s3/core?label=)  |
| [`@better-s3/next`](./packages/better-s3-next)   | Next.js App Router handlers for presigned URL generation                   | ![npm](https://img.shields.io/npm/v/@better-s3/next?label=)  |
| [`@better-s3/react`](./packages/better-s3-react) | Headless React hooks — upload, download, delete with full state            | ![npm](https://img.shields.io/npm/v/@better-s3/react?label=) |
| [`@better-s3/ui`](./packages/better-s3-ui)       | Pre-built shadcn/ui components (dropzone, progress, delete dialog)         | ![npm](https://img.shields.io/npm/v/@better-s3/ui?label=)    |

## Quick Start

### 1. Install

```bash
# Server side (Next.js)
pnpm add @better-s3/next

# Client side (headless — bring your own UI)
pnpm add @better-s3/react

# Or use pre-built shadcn/ui components
pnpm add @better-s3/ui
```

> `@aws-sdk/client-s3` is included as a dependency of `@better-s3/core` — you don't need to install it separately. You can import `S3Client` directly from `@better-s3/core`.

### 2. Create API route (Next.js App Router)

```ts
// app/api/s3/[...s3]/route.ts
import { createRouteHandler } from "@better-s3/next";
import { S3Client } from "@better-s3/core";

const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const handler = createRouteHandler({
  s3,
  defaultBucket: "my-bucket",
  basePath: "/api/s3",
});

export { handler as GET, handler as POST, handler as DELETE };
```

### 3. Upload files from React

```tsx
import { useUploadControls } from "@better-s3/react";
import { createPresignApi } from "@better-s3/core";

const presignApi = createPresignApi({ basePath: "/api/s3" });

function UploadButton() {
  const { phase, progress, openFilePicker, inputProps } = useUploadControls({
    presignApi,
    objectKey: (file) => `uploads/${file.name}`,
    accept: ["image/*"],
    maxFileSize: 10 * 1024 * 1024, // 10 MB
  });

  return (
    <div>
      <input {...inputProps} />
      <button onClick={openFilePicker} disabled={phase === "uploading"}>
        {phase === "uploading" ? `Uploading ${progress}%` : "Upload"}
      </button>
    </div>
  );
}
```

### 4. Or use pre-built UI

```tsx
import { Upload, DownloadButton, DeleteButton } from "@better-s3/ui";
import "@better-s3/ui/styles.css";

<Upload
  presignApi={presignApi}
  objectKey={(file) => `uploads/${file.name}`}
  variant="dropzone"
  accept={["image/*"]}
  maxFileSize={10 * 1024 * 1024}
/>

<DownloadButton presignApi={presignApi} objectKey="uploads/photo.jpg" />
<DeleteButton presignApi={presignApi} objectKey="uploads/photo.jpg" />
```

## Features

- **Headless architecture** — hooks give you full control, UI components are optional
- **Pre-built shadcn/ui components** — dropzone, progress bar, delete dialog, download button
- **shadcn CLI support** — install individual UI components via `shadcn` CLI
- **Simple & multipart uploads** — automatic switching based on file size (default: 50 MB threshold)
- **Concurrent part uploads** — configurable parallelism for multipart
- **Retry with exponential backoff** — resilient uploads out of the box
- **Progress tracking** — real-time byte-level progress for uploads and downloads
- **File validation** — extension, MIME type, and file size validation before upload
- **Presigned URLs** — secure server-side URL generation, no S3 credentials on the client
- **Download modes** — native (browser) or fetch (streaming with progress)
- **Delete with confirmation** — two-step delete flow with dialog
- **Cancel support** — abort any in-flight operation
- **Phase-based state** — predictable state machines (`idle → uploading → success | error`)
- **TypeScript-first** — full type safety across all packages
- **Tree-shakeable** — ESM only, minimal bundle impact
- **S3-compatible** — works with AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces, Supabase Storage, and more
- **Built on AWS SDK v3** — uses the official `@aws-sdk/client-s3` under the hood, re-exported for convenience

## Architecture

```
@better-s3/ui ──────► @better-s3/react ──────► @better-s3/core
(shadcn/ui)           (Headless Hooks)          (Engine + AWS SDK)
                                                      ▲
@better-s3/next ──────────────────────────────────────┘
(Server Handlers)
```

## Development

```bash
pnpm install
pnpm build        # Build all packages
pnpm check-types  # Type check all packages
pnpm lint         # Lint all packages
```

Build a specific package:

```bash
pnpm --filter @better-s3/core build
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and PR guidelines.

## Releasing

See [RELEASING.md](./RELEASING.md) for versioning and publish workflow.

## License

MIT © [Hamidreza](https://github.com/hamidrezakz)
