# @better-s3/react

Headless React hooks for S3 file uploads, downloads, and deletes — full state management, progress tracking, and cancellation. Bring your own UI.

> **Want pre-built components?** Use [`@better-s3/ui`](../better-s3-ui) for ready-to-use shadcn/ui components.

## Install

```bash
pnpm add @better-s3/react @better-s3/core
```

## Hooks

### `useUpload` — Single file upload

```tsx
import { useUpload } from "@better-s3/react";
import { createPresignApi } from "@better-s3/core";

const presignApi = createPresignApi({ basePath: "/api/s3" });

function MyComponent() {
  const { phase, progress, error, upload, cancel, reset } = useUpload({
    presignApi,
    objectKey: (file) => `uploads/${file.name}`,
    accept: ["image/*"],
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    onSuccess: (result) => console.log("Uploaded:", result.url),
  });

  return <button onClick={() => upload(file)}>Upload</button>;
}
```

**Phases:** `idle → validating → presigning → uploading → finalizing → success | error`

### `useUploadControls` — Upload with file picker & drag-drop

```tsx
import { useUploadControls } from "@better-s3/react";

function Uploader() {
  const { phase, progress, openFilePicker, inputProps, dropHandlers } =
    useUploadControls({
      presignApi,
      objectKey: (file) => `uploads/${file.name}`,
    });

  return (
    <div {...dropHandlers}>
      <input {...inputProps} />
      <button onClick={openFilePicker}>
        {phase === "uploading" ? `${progress}%` : "Choose file"}
      </button>
    </div>
  );
}
```

### `useMultiUpload` — Batch file upload

```tsx
import { useMultiUpload } from "@better-s3/react";

const { phase, files, totalProgress, upload, cancel } = useMultiUpload({
  presignApi,
  objectKey: (file) => `uploads/${file.name}`,
  maxFiles: 10,
  concurrentFiles: 3,
});

// files: Array<{ id, name, size, status, progress, error }>
```

### `useMultiUploadControls` — Batch upload with file picker

Same convenience layer as `useUploadControls`, but for multiple files.

### `useDownload` — File download

```tsx
import { useDownload } from "@better-s3/react";

const { phase, progress, download, cancel } = useDownload({
  presignApi,
  mode: "fetch", // "native" for browser download, "fetch" for streaming
});

// Trigger download
download({ key: "uploads/photo.jpg", fileName: "photo.jpg" });
```

**Modes:**

- `native` — opens presigned URL in new window (browser handles download)
- `fetch` — streams file with progress tracking

### `useDelete` — File deletion with confirmation

```tsx
import { useDelete } from "@better-s3/react";

const { phase, pendingKey, requestDelete, confirmDelete, cancelDelete } =
  useDelete({ presignApi });

// Two-step flow:
requestDelete("uploads/photo.jpg"); // phase → "confirming"
confirmDelete(); // phase → "deleting" → "success"
```

## All hooks return

- `phase` — current state of the operation
- `error` — error message if failed
- `reset()` — return to idle state
- `cancel()` — abort in-flight operation

## License

MIT
