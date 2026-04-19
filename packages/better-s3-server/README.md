# @better-s3/server

Framework-agnostic S3 server handlers — presigned uploads, downloads, deletes, and multipart operations. Works with any runtime that supports the standard `Request`/`Response` API (Next.js, Hono, Bun, Deno, Cloudflare Workers, etc).

## Installation

```bash
pnpm add @better-s3/server @aws-sdk/client-s3
```

## Quick Start

### Next.js App Router

Create a catch-all route at `app/api/s3/[...s3]/route.ts`:

```ts
import { S3Client } from "@aws-sdk/client-s3";
import { createRouteHandler } from "@better-s3/server/next";

const s3 = new S3Client({ region: "us-east-1" });

const handler = createRouteHandler({
  s3,
  defaultBucket: "my-bucket",
  basePath: "/api/s3",
});

export { handler as GET, handler as POST, handler as DELETE };
```

### Custom / Other Frameworks

Use `createRouter` for any framework with standard `Request`/`Response`:

```ts
import { S3Client } from "@aws-sdk/client-s3";
import { createRouter } from "@better-s3/server";

const s3 = new S3Client({ region: "us-east-1" });

const router = createRouter({
  s3,
  defaultBucket: "my-bucket",
  basePath: "/api/s3",
});

// Hono example
app.all("/api/s3/*", (c) => router(c.req.raw));

// Bun example
Bun.serve({ fetch: router });
```

### Individual Handlers

For granular control, use individual handler factories:

```ts
import { S3Client } from "@aws-sdk/client-s3";
import { createHandlers } from "@better-s3/server";

const s3 = new S3Client({ region: "us-east-1" });

const handlers = createHandlers({ s3, defaultBucket: "my-bucket" });

// Use handlers individually:
// handlers.presign.upload(request)
// handlers.presign.download(request)
// handlers.delete(request)
// handlers.multipart.init(request)
// handlers.multipart.part(request)
// handlers.multipart.complete(request)
// handlers.multipart.abort(request)
```

## Presign API Client

The package also exports a client-side helper for calling the server endpoints:

```ts
import { createPresignApi } from "@better-s3/server";

const api = createPresignApi("/api/s3");

// Upload
const { url } = await api.upload({
  key: "photos/pic.jpg",
  contentType: "image/jpeg",
});
await fetch(url, { method: "PUT", body: file });

// Download
const { url: downloadUrl } = await api.download("photos/pic.jpg");

// Delete
await api.delete("photos/pic.jpg");

// Multipart
const { uploadId } = await api.multipart.init({ key: "videos/big.mp4" });
const { presignedUrl } = await api.multipart.signPart({
  key,
  uploadId,
  partNumber: 1,
});
// ... upload parts ...
await api.multipart.complete({ key, uploadId, parts });
```

## File Validation

Validate files before upload (file type and size checks):

```ts
import { validateFile } from "@better-s3/server";

const error = validateFile(file, {
  accept: [".jpg", ".png", "image/*"],
  maxFileSize: 10 * 1024 * 1024, // 10 MB
});

if (error) {
  console.error(error); // e.g. 'File type ".pdf" is not allowed'
}
```

## API Routes

The router handles these endpoints (relative to `basePath`):

| Method   | Path                          | Description                     |
| -------- | ----------------------------- | ------------------------------- |
| `POST`   | `/presign/upload`             | Generate presigned upload URL   |
| `GET`    | `/presign/download`           | Generate presigned download URL |
| `DELETE` | `/delete`                     | Delete an object                |
| `POST`   | `/presign/multipart/init`     | Initialize multipart upload     |
| `POST`   | `/presign/multipart/part`     | Sign a multipart part           |
| `POST`   | `/presign/multipart/complete` | Complete multipart upload       |
| `POST`   | `/presign/multipart/abort`    | Abort multipart upload          |

## Exports

```ts
// Router & Handlers
export { createRouter } from "./router";
export { createHandlers } from "./create-handlers";
export { createUploadHandler } from "./handlers/presign/upload";
export { createDownloadHandler } from "./handlers/presign/download";
export { createDeleteHandler } from "./handlers/delete";
export { createMultipartInitHandler } from "./handlers/multipart/init";
export { createMultipartPartHandler } from "./handlers/multipart/part";
export { createMultipartCompleteHandler } from "./handlers/multipart/complete";
export { createMultipartAbortHandler } from "./handlers/multipart/abort";

// Presign API Client
export { createPresignApi, type PresignApi } from "./presign-api";
export type {
  PresignResponse,
  MultipartInitResponse,
  MultipartPartResponse,
} from "./presign-api";

// Validation
export { validateFile } from "./validate";

// Types
export type {
  S3HandlerConfig,
  S3RouteHandlerConfig,
  S3Handler,
  S3Handlers,
} from "./types";

// Helpers
export {
  parseBody,
  requireString,
  normalizeExpiresIn,
  withS3ErrorHandler,
} from "./helpers";
```

## License

MIT
