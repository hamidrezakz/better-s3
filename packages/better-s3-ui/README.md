# @better-s3/ui

Pre-built React UI components for S3 file upload, download, and delete — built with [shadcn/ui](https://ui.shadcn.com) patterns and Tailwind CSS.

> **Don't need pre-built UI?** Use [`@better-s3/react`](../better-s3-react) for headless hooks and bring your own components.

> **shadcn CLI**: You can also install individual components via `npx shadcn add` (coming soon).

## Install

```bash
pnpm add @better-s3/ui @better-s3/core
```

**Peer dependencies:** `react`, `@base-ui/react`, `sonner`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`

## Setup

Import the stylesheet in your app:

```tsx
import "@better-s3/ui/styles.css";
```

## Components

### `<Upload />` — Single file upload

```tsx
import { Upload } from "@better-s3/ui";
import { createPresignApi } from "@better-s3/core";

const presignApi = createPresignApi({ basePath: "/api/s3" });

<Upload
  presignApi={presignApi}
  objectKey={(file) => `uploads/${file.name}`}
  variant="dropzone" // "button" | "dropzone"
  accept={["image/*"]}
  maxFileSize={10 * 1024 * 1024}
  toast={true} // sonner toast notifications
  showStatus={true} // inline progress display
/>;
```

### `<MultiUpload />` — Batch file upload

```tsx
import { MultiUpload } from "@better-s3/ui";

<MultiUpload
  presignApi={presignApi}
  objectKey={(file) => `uploads/${file.name}`}
  maxFiles={10}
  variant="dropzone"
/>;
```

### `<DownloadButton />` — File download

```tsx
import { DownloadButton } from "@better-s3/ui";

<DownloadButton
  presignApi={presignApi}
  objectKey="uploads/report.pdf"
  fileName="report.pdf"
  mode="native" // "native" | "fetch"
/>;
```

### `<DeleteButton />` — File delete with confirmation

```tsx
import { DeleteButton } from "@better-s3/ui";

<DeleteButton
  presignApi={presignApi}
  objectKey="uploads/report.pdf"
  fileName="report.pdf"
  confirmTitle="Delete file?"
  confirmDescription="This action cannot be undone."
/>;
```

## Features

- **Two upload variants** — compact button or drag-and-drop dropzone
- **Toast notifications** — loading, success, and error toasts via Sonner
- **Inline progress** — progress bar with file name and phase icons
- **Delete confirmation** — AlertDialog before destructive actions
- **Download modes** — native browser download or streaming with progress
- **Tailwind CSS** — fully styled, customizable via className props
- **Accessible** — built on Base UI primitives

## License

MIT
