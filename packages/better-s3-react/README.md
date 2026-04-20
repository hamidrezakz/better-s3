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
  accept: ["image/*"],
  maxFileSize: 10 * 1024 * 1024,
  onSuccess: (_file, result) => console.log("Uploaded:", result.key),
});

await upload(file, `uploads/${file.name}`, { metadata: { source: "web" } });
```

**Phases:** `idle → validating → presigning → uploading → finalizing → success | error`

### `useUploadControls` — Upload with file picker & drag-drop

```tsx
const { phase, progress, openFilePicker, inputProps, dropHandlers } =
  useUploadControls({
    api,
    objectKey: (file) => `uploads/${file.name}`,
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

### `useMultiUploadControls` — Batch upload with file picker

Same as `useUploadControls` but for multiple files.

### `useDownload` — File download

```tsx
const { phase, error, download, reset } = useDownload({
  api,
});

download("uploads/photo.jpg", "photo.jpg");
```

### `useDelete` — File deletion with confirmation

```tsx
const { phase, pendingKey, requestDelete, confirmDelete, cancelDelete } =
  useDelete({ api });

requestDelete("uploads/photo.jpg"); // phase → "confirming"
confirmDelete(); // phase → "deleting" → "success"
```

## License

MIT
