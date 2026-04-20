<div align="center">

# better-s3

**The missing S3 toolkit for React apps**

Upload, download, and delete files with S3 presigned URLs — headless hooks, server handlers, and pre-built UI.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## Packages

| Package | Description |
| --- | --- |
| [`@better-s3/server`](./packages/better-s3-server) | Presigned URL handlers, server hooks, file validation. Works with any `Request`/`Response` runtime. |
| [`@better-s3/react`](./packages/better-s3-react) | Headless React hooks — upload, download, delete with state management & progress. |
| [`@better-s3/ui`](./packages/better-s3-ui) | Pre-built shadcn/ui components — dropzone, progress, delete dialog, download button. |

## Quick Start

### 1. Server — create an API route

```ts
// app/api/s3/[...s3]/route.ts
import { S3Client } from "@aws-sdk/client-s3";
import { createRouteHandler } from "@better-s3/server/next";

const handler = createRouteHandler({
  s3: new S3Client({ region: "us-east-1" }),
  defaultBucket: "my-bucket",
  basePath: "/api/s3",
});

export { handler as GET, handler as POST, handler as DELETE };
```

### 2. Client — upload a file

```tsx
import { createPresignApi } from "@better-s3/server";
import { useUpload } from "@better-s3/react";

const presignApi = createPresignApi("/api/s3");

function UploadButton() {
  const { phase, progress, upload } = useUpload({ presignApi });

  return (
    <button
      onClick={async () => {
        const [file] = await showFilePicker();
        await upload(file, `uploads/${file.name}`);
      }}
      disabled={phase === "uploading"}
    >
      {phase === "uploading" ? `${progress.percent}%` : "Upload"}
    </button>
  );
}
```

### 3. Or use pre-built UI

```tsx
import { Upload, DownloadButton, DeleteButton } from "@better-s3/ui";
import "@better-s3/ui/styles.css";

<Upload presignApi={presignApi} objectKey={(f) => `uploads/${f.name}`} />
<DownloadButton presignApi={presignApi} objectKey="photo.jpg" />
<DeleteButton presignApi={presignApi} objectKey="photo.jpg" />
```

## Highlights

- Simple & multipart uploads with automatic switching
- Progress tracking, retry, cancellation
- Server-side hooks (guard, onSuccess, onComplete)
- File validation (type, size)
- Works with AWS S3, R2, MinIO, DigitalOcean Spaces, etc.
- TypeScript-first, ESM only, tree-shakeable

## Architecture

```
@better-s3/ui ──► @better-s3/react ──► @better-s3/server
(Pre-built UI)    (Headless Hooks)     (Handlers + Presign API)
                                              │
                                         AWS SDK v3
```

## Development

```bash
pnpm install
pnpm build
```

## License

MIT © [Hamidreza](https://github.com/hamidrezakz)
