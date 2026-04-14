# @better-s3/core

Core upload engine, file validation, types, and presign API client for S3-compatible storage.

## Install

```bash
pnpm add @better-s3/core
```

## What's inside

- **Upload engine** — simple and multipart uploads with progress, retry, and cancellation
- **File validation** — extension, MIME type, and file size checks
- **Presign API client** — typed HTTP client for presigned URL endpoints
- **Types** — shared TypeScript types for all better-s3 packages
- **Helpers** — `formatFileSize()` and other utilities

## Usage

### Presign API client

```ts
import { createPresignApi } from "@better-s3/core";

const presignApi = createPresignApi({ basePath: "/api/s3" });
```

### File validation

```ts
import { validateFile } from "@better-s3/core";

const error = validateFile(file, {
  accept: ["image/*", ".pdf"],
  maxFileSize: 10 * 1024 * 1024, // 10 MB
});

if (error) console.error(error);
```

### Upload a single file

```ts
import { uploadFile } from "@better-s3/core";

await uploadFile(file, presignApi, {
  objectKey: `uploads/${file.name}`,
  onProgress: ({ percent }) => console.log(`${percent}%`),
  onSuccess: (result) => console.log("Done:", result.url),
  onError: (error) => console.error(error),
});
```

### Upload multiple files

```ts
import { uploadFiles } from "@better-s3/core";

await uploadFiles(files, presignApi, {
  objectKey: (file) => `uploads/${file.name}`,
  concurrentFiles: 3,
  onFileProgress: (id, progress) => console.log(id, progress.percent),
  onAllComplete: (results) => console.log("All done"),
});
```

## Upload behavior

- Files under 50 MB (configurable) use a single PUT request
- Larger files automatically switch to multipart upload
- Multipart uploads split into 5 MB parts with 3 concurrent uploads (configurable)
- Failed parts retry up to 3 times with exponential backoff

## Exports

```ts
// Types
export type { PresignResponse, UploadConfig, UploadResult, UploadProgress };
export type { UploadPhase, DownloadPhase, DeletePhase };
export type { UploadHooks, DownloadHooks, DeleteHooks };
export type { MultiUploadPhase, FileItem, FileItemStatus };

// Functions
export { createPresignApi };
export { validateFile };
export { formatFileSize };
export { uploadFile, uploadFiles };

// Re-exports (no need to install @aws-sdk/client-s3 separately)
export { S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";
```

## License

MIT
