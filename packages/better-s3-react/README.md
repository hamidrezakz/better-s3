# @better-s3/react

Headless React hooks for S3 file uploads, downloads, and deletes — state management, progress tracking, and cancellation built in.

> **Want pre-built components?** Use [`@better-s3/ui`](../better-s3-ui) for ready-to-use shadcn/ui components.

## Install

```bash
pnpm add @better-s3/react @better-s3/server
```

## Setup

```ts
import { createS3Api } from "@better-s3/server";

const api = createS3Api("/api/s3");
```

## Hooks

### `useUpload` — Single file upload

```tsx
const { phase, progress, error, upload, cancel, reset } = useUpload({
  api,
  accept: ["image/*", ".pdf"],
  maxFileSize: 10 * 1024 * 1024, // client-side pre-validation (UX)
  onSuccess: (_file, result) => console.log("Uploaded:", result.key),
  onError: (_file, error) => {
    // error.message for size violations:
    //   Simple:    S3 returns 403 — "Upload failed: 403 Forbidden"
    //   Multipart: server returns 422 — "File size (X bytes) exceeds …"
  },
});

await upload(file, `uploads/${file.name}`, { metadata: { source: "web" } });
```

**Phases:** `idle → validating → uploading → success | error`

> `maxFileSize` performs a client-side check before the upload starts (good UX). The real enforcement is server-side:
>
> - **Simple uploads** — S3 enforces exact file size via a signed `content-length-range` policy. The client cannot upload a different-sized file with that URL.
> - **Multipart uploads** — Server verifies via `HeadObject` after `CompleteMultipartUpload` and deletes the object if the limit is exceeded.

### `useUploadControls` — Upload with file picker & drag-drop

```tsx
const { mode, phase, progress, openFilePicker, inputProps, dropHandlers } =
  useUploadControls({
    api,
    objectKey: (file) => `uploads/${file.name}`,
    maxFiles: 5, // > 1 → switches to multi-upload mode automatically
  });
```

### `useMultiUpload` — Batch upload

```tsx
const { phase, files, totalProgress, upload, cancel } = useMultiUpload({
  api,
  maxFiles: 10,
  concurrentFiles: 3,
});

await upload(selectedFiles, (file) => `uploads/${file.name}`);
```

### `useDownload` — File download

```tsx
const { phase, error, download, reset } = useDownload({ api });
download("uploads/photo.jpg", "photo.jpg");
```

### `useDelete` — File deletion with confirmation

```tsx
const { phase, pendingKey, requestDelete, confirmDelete, cancelDelete } =
  useDelete({ api });

requestDelete("uploads/photo.jpg"); // phase → "confirming"
confirmDelete(); // phase → "deleting" → "success"
```

## Upload modes

| Mode      | When used                                        | Size enforcement                                          |
| --------- | ------------------------------------------------ | --------------------------------------------------------- |
| Simple    | `file.size < multipartThreshold` (default 50 MB) | S3 presigned POST policy — exact `content-length-range`   |
| Multipart | `multipart: true` or file ≥ threshold            | Server `HeadObject` check after `CompleteMultipartUpload` |

## License

MIT
