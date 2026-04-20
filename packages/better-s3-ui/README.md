# @better-s3/ui

Pre-built React components for S3 file operations — upload (button & dropzone), download, and delete with confirmation. Built with [shadcn/ui](https://ui.shadcn.com) and Tailwind CSS.

> **Need full control?** Use [`@better-s3/react`](../better-s3-react) for headless hooks.

## Install

```bash
pnpm add @better-s3/ui @better-s3/server
```

**Peer deps:** `react`, `sonner`, `lucide-react`, `clsx`, `tailwind-merge`

## Setup

```tsx
import "@better-s3/ui/styles.css";
```

## Components

```tsx
import { createPresignApi } from "@better-s3/server";
import { Upload, MultiUpload, DownloadButton, DeleteButton } from "@better-s3/ui";

const presignApi = createPresignApi("/api/s3");

// Single upload (button or dropzone)
<Upload
  presignApi={presignApi}
  objectKey={(file) => `uploads/${file.name}`}
  variant="dropzone"
  accept={["image/*"]}
  maxFileSize={10 * 1024 * 1024}
/>

// Batch upload
<MultiUpload
  presignApi={presignApi}
  objectKey={(file) => `uploads/${file.name}`}
  maxFiles={10}
/>

// Download
<DownloadButton presignApi={presignApi} objectKey="report.pdf" fileName="report.pdf" />

// Delete with confirmation dialog
<DeleteButton presignApi={presignApi} objectKey="report.pdf" />
```

## License

MIT
