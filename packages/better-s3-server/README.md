# @better-s3/server

Framework-agnostic S3 server handlers — presigned uploads, downloads, deletes, and multipart operations. Works with any `Request`/`Response` runtime (Next.js, Hono, Bun, Deno, Cloudflare Workers, etc).

## Install

```bash
pnpm add @better-s3/server @aws-sdk/client-s3
```

## Quick Start

### Next.js App Router

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

### Other Frameworks

```ts
import { S3Client } from "@aws-sdk/client-s3";
import { createRouter } from "@better-s3/server";

const router = createRouter({
  s3: new S3Client({ region: "us-east-1" }),
  defaultBucket: "my-bucket",
  basePath: "/api/s3",
});

// Hono
app.all("/api/s3/*", (c) => router(c.req.raw));
```

## Server Hooks

Run server-side logic at key points — auth, logging, database writes. Every hook has access to the `Request` object.

```ts
createRouteHandler({
  s3,
  defaultBucket: "my-bucket",
  basePath: "/api/s3",
  hooks: {
    guard: async ({ request }) => {
      const session = await getSession(request);
      if (!session) throw new Error("Unauthorized");
    },
    upload: {
      onSuccess: async ({ request, key, contentType }) => { /* ... */ },
      onComplete: async ({ key, contentType, contentLength, eTag }) => { /* ... */ },
    },
    delete: {
      guard: async ({ request, key }) => { /* ownership check */ },
      onSuccess: async ({ key }) => { /* remove DB record */ },
    },
    multipart: {
      onInit: async ({ key, uploadId }) => { /* ... */ },
      onComplete: async ({ key, uploadId }) => { /* ... */ },
      onAbort: async ({ key, uploadId }) => { /* ... */ },
    },
  },
});
```

**Available hooks:** `guard`, `upload.guard`, `upload.onSuccess`, `upload.onComplete`, `download.guard`, `download.onSuccess`, `delete.guard`, `delete.onSuccess`, `multipart.guard`, `multipart.onInit`, `multipart.onComplete`, `multipart.onAbort`

## API Routes

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/presign/upload` | Presigned upload URL |
| `POST` | `/presign/upload/confirm` | Confirm upload |
| `GET` | `/presign/download` | Presigned download URL |
| `DELETE` | `/delete` | Delete object |
| `POST` | `/presign/multipart/init` | Init multipart |
| `POST` | `/presign/multipart/part` | Sign part |
| `POST` | `/presign/multipart/complete` | Complete multipart |
| `POST` | `/presign/multipart/abort` | Abort multipart |

## Presign API Client

Client-side helper for calling the server endpoints (used internally by `@better-s3/react`):

```ts
import { createPresignApi } from "@better-s3/server";

const api = createPresignApi("/api/s3");

const { url } = await api.upload({ key: "photo.jpg", contentType: "image/jpeg" });
const { url: downloadUrl } = await api.download("photo.jpg");
await api.delete("photo.jpg");
```

## License

MIT
