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

| Method   | Path                          | Description                         |
| -------- | ----------------------------- | ----------------------------------- |
| `POST`   | `/presign/upload`             | Generate presigned upload URL       |
| `POST`   | `/presign/upload/confirm`     | Confirm upload & get S3 object info |
| `GET`    | `/presign/download`           | Generate presigned download URL     |
| `DELETE` | `/delete`                     | Delete an object                    |
| `POST`   | `/presign/multipart/init`     | Initialize multipart upload         |
| `POST`   | `/presign/multipart/part`     | Sign a multipart part               |
| `POST`   | `/presign/multipart/complete` | Complete multipart upload           |
| `POST`   | `/presign/multipart/abort`    | Abort multipart upload              |

## Server Hooks

Hooks let you run server-side logic at key points in the request lifecycle — authentication, authorization, logging, database writes, etc. Every hook runs **on the server** and has access to the original `Request` object.

### Hook Types

| Hook                   | When it runs                              | Purpose                    |
| ---------------------- | ----------------------------------------- | -------------------------- |
| `guard`                | Before every request (global)             | Auth check, rate limiting  |
| `upload.guard`         | Before presigning an upload URL           | Per-upload authorization   |
| `upload.onSuccess`     | After presigned upload URL is generated   | Log, track quota           |
| `upload.onComplete`    | After simple upload confirmed via S3      | Save file record to DB     |
| `download.guard`       | Before presigning a download URL          | Per-download authorization |
| `download.onSuccess`   | After presigned download URL is generated | Log access                 |
| `delete.guard`         | Before deleting an object                 | Ownership check            |
| `delete.onSuccess`     | After an object is deleted                | Remove DB record           |
| `multipart.guard`      | Before any multipart operation            | Auth for large uploads     |
| `multipart.onInit`     | After multipart upload is initialized     | Create DB record           |
| `multipart.onComplete` | After multipart upload is completed       | Mark upload complete in DB |
| `multipart.onAbort`    | After multipart upload is aborted         | Clean up DB record         |

### Guard Hooks

Guard hooks run **before** the S3 operation. Throw an error to reject the request — the client receives a `403` response. Throw an error with a `status` property to customize the status code.

```ts
const handler = createRouteHandler({
  s3,
  defaultBucket: "my-bucket",
  basePath: "/api/s3",
  hooks: {
    // Global guard — runs before every request
    guard: async ({ request }) => {
      const session = await getSession(request);
      if (!session) throw new Error("Unauthorized");
    },

    // Operation-specific guard
    delete: {
      guard: async ({ request, key, bucket }) => {
        const session = await getSession(request);
        const file = await db.file.findUnique({ where: { key } });
        if (file?.ownerId !== session.userId) {
          throw new Error("Not your file");
        }
      },
    },
  },
});
```

### Success Hooks

Success hooks run **after** the S3 operation succeeds. They are fire-and-forget — errors in success hooks are not sent to the client.

```ts
const handler = createRouteHandler({
  s3,
  defaultBucket: "my-bucket",
  basePath: "/api/s3",
  hooks: {
    upload: {
      onSuccess: async ({ request, key, bucket, url, contentType }) => {
        const session = await getSession(request);
        await db.file.create({
          data: { key, bucket, contentType, uploadedBy: session.userId },
        });
      },
      // Runs after the client confirms a simple upload — has real S3 metadata
      onComplete: async ({
        request,
        key,
        bucket,
        contentType,
        contentLength,
        eTag,
      }) => {
        const session = await getSession(request);
        await db.file.upsert({
          where: { key },
          create: {
            key,
            bucket,
            contentType,
            size: contentLength,
            eTag,
            uploadedBy: session.userId,
          },
          update: { contentType, size: contentLength, eTag },
        });
      },
    },

    delete: {
      onSuccess: async ({ key, bucket }) => {
        await db.file.delete({ where: { key } });
      },
    },

    multipart: {
      onInit: async ({ key, bucket, uploadId, contentType }) => {
        await db.upload.create({ data: { key, uploadId, status: "pending" } });
      },
      onComplete: async ({ key, uploadId }) => {
        await db.upload.update({
          where: { uploadId },
          data: { status: "complete" },
        });
      },
      onAbort: async ({ key, uploadId }) => {
        await db.upload.delete({ where: { uploadId } });
      },
    },
  },
});
```

### Hook Context Types

Each hook receives a typed context object:

| Type                              | Fields                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------- |
| `HookContext`                     | `request`                                                                         |
| `UploadHookContext`               | `request`, `key`, `bucket`, `contentType?`, `metadata?`                           |
| `UploadSuccessContext`            | ...`UploadHookContext` + `url`, `expiresIn`                                       |
| `UploadCompleteContext`           | `request`, `key`, `bucket`, `contentType?`, `contentLength`, `eTag?`, `metadata?` |
| `DownloadHookContext`             | `request`, `key`, `bucket`, `fileName?`                                           |
| `DownloadSuccessContext`          | ...`DownloadHookContext` + `url`, `expiresIn`                                     |
| `DeleteHookContext`               | `request`, `key`, `bucket`                                                        |
| `MultipartHookContext`            | `request`, `key`, `bucket`                                                        |
| `MultipartInitSuccessContext`     | ...`MultipartHookContext` + `uploadId`, `contentType?`, `metadata?`               |
| `MultipartCompleteSuccessContext` | ...`MultipartHookContext` + `uploadId`                                            |

All context types are exported from `@better-s3/server`.

## Exports

```ts
// Router & Handlers
export { createRouter } from "./router";
export { createHandlers } from "./create-handlers";
export { createUploadHandler } from "./handlers/presign/upload";
export { createConfirmHandler } from "./handlers/presign/confirm";
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
  UploadConfirmResponse,
} from "./presign-api";

// Validation
export { validateFile } from "./validate";

// Types
export type {
  S3HandlerConfig,
  S3RouteHandlerConfig,
  S3Handler,
  S3Handlers,
  S3ServerHooks,
  HookContext,
  UploadHookContext,
  UploadSuccessContext,
  UploadCompleteContext,
  DownloadHookContext,
  DownloadSuccessContext,
  DeleteHookContext,
  MultipartHookContext,
  MultipartInitSuccessContext,
  MultipartCompleteSuccessContext,
} from "./types";

// Helpers
export {
  parseBody,
  requireString,
  normalizeExpiresIn,
  withS3ErrorHandler,
  runHook,
} from "./helpers";
```

## License

MIT
