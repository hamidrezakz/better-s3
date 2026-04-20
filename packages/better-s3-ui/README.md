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
import { createS3Api } from "@better-s3/server";
import { Upload, MultiUpload, DownloadButton, DeleteButton } from "@better-s3/ui";

const api = createS3Api("/api/s3");

// Single upload (button or dropzone)
<Upload
  api={api}
  objectKey={(file) => `uploads/${file.name}`}
  variant="dropzone"
  accept={["image/*"]}
  maxFileSize={10 * 1024 * 1024}
/>

// Batch upload
<MultiUpload
  api={api}
  objectKey={(file) => `uploads/${file.name}`}
  maxFiles={10}
/>

// Download
<DownloadButton api={api} objectKey="report.pdf" fileName="report.pdf" />

// Delete with confirmation dialog
<DeleteButton api={api} objectKey="report.pdf" />
```

## License

MIT
