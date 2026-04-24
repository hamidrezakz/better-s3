# @better-s3/server

Framework-agnostic S3 server handlers — presigned uploads, downloads, deletes, and multipart operations. Works with any `Request`/`Response` runtime (Next.js, Hono, Bun, Deno, Cloudflare Workers, etc).

## Install

```bash
pnpm add @better-s3/server @aws-sdk/client-s3
```

## Quick Start

```ts
// app/api/s3/[...s3]/route.ts  (Next.js App Router)
import { S3Client } from "@aws-sdk/client-s3";
import { createRouteHandler } from "@better-s3/server/next";

const handler = createRouteHandler({
  s3: new S3Client({ region: "us-east-1" }),
  defaultBucket: "my-bucket",
  basePath: "/api/s3",

  // Enable only the features your app needs. All are disabled by default.
  features: {
    upload: true,
    download: true,
    delete: true,
    // multipart: true, // enable only if you explicitly need multipart support
  },
});

export { handler as GET, handler as POST, handler as DELETE };
```

Other frameworks via `createRouter` from `@better-s3/server`:

```ts
const router = createRouter({
  s3,
  defaultBucket: "my-bucket",
  basePath: "/api/s3",
  features: { upload: true, download: true, delete: true, multipart: true },
  hooks: {
    guard: async ({ request }) => {
      console.log("[guard]", request.method, request.url);
    },

    upload: {
      guard: async ({ key, bucket, contentType, fileSize }) => {
        console.log("[upload.guard]", { key, bucket, contentType, fileSize });
      },
      onPresigned: async ({ key, url, expiresIn }) => {
        console.log("[upload.onPresigned]", { key, url, expiresIn });
      },
      onUploaded: async ({ key, contentType, contentLength, eTag }) => {
        console.log("[upload.onUploaded]", {
          key,
          contentType,
          contentLength,
          eTag,
        });
      },
    },

    download: {
      guard: async ({ key, bucket, fileName }) => {
        console.log("[download.guard]", { key, bucket, fileName });
      },
      onPresigned: async ({ key, url, expiresIn }) => {
        console.log("[download.onPresigned]", { key, url, expiresIn });
      },
    },

    delete: {
      guard: async ({ key, bucket }) => {
        console.log("[delete.guard]", { key, bucket });
      },
      onDeleted: async ({ key, bucket }) => {
        console.log("[delete.onDeleted]", { key, bucket });
      },
    },

    multipart: {
      guard: async ({ key, bucket, fileSize }) => {
        console.log("[multipart.guard]", { key, bucket, fileSize });
      },
      onInit: async ({ key, uploadId, contentType, fileSize }) => {
        console.log("[multipart.onInit]", {
          key,
          uploadId,
          contentType,
          fileSize,
        });
      },
      onComplete: async ({ key, uploadId, contentLength, eTag }) => {
        console.log("[multipart.onComplete]", {
          key,
          uploadId,
          contentLength,
          eTag,
        });
      },
      onAbort: async ({ key, uploadId }) => {
        console.log("[multipart.onAbort]", { key, uploadId });
      },
    },
  },
});

app.all("/api/s3/*", (c) => router(c.req.raw)); // Hono example
```

## Features

All endpoints are **disabled by default**. You must explicitly opt in via the `features` config — this prevents unintended exposure of expensive or sensitive operations (especially multipart, which is vulnerable to [cost attacks](#multipart-cost-attacks)).

```ts
features: {
  upload: true,     // POST /presign/upload + POST /presign/upload/confirm
  download: true,   // GET  /presign/download
  delete: true,     // DELETE /delete
  multipart: true,  // POST /presign/multipart/{init,part,complete,abort}
}
```

> Disabled endpoints respond with `404 Not Found`.

| Upload mode | Enforcement                                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| Simple      | S3 enforces exact size via `content-length-range` in the signed POST policy — tamperproof                       |
| Multipart   | `HeadObject` after complete verifies the final object size; no per-part enforcement at the S3 level (see below) |

> Simple upload is inherently more secure — enforcement happens at the S3 storage layer. Multipart presigned `UploadPart` URLs cannot enforce per-part size; see [Multipart cost attacks](#multipart-cost-attacks).

## Server Hooks

Run server-side logic at key points. Every hook receives the `Request` object. **Throw to reject** — returned as `{ message }` with status 403, or any status you set on the thrown error.

```
Simple:    upload.guard → upload.onPresigned → [S3] → upload.onUploaded
Multipart: multipart.guard(init) → multipart.onInit
           multipart.guard(part) → [S3]
           multipart.guard(complete) → HeadObject → multipart.onComplete
           multipart.guard(abort) → multipart.onAbort
```

### Authentication

```ts
hooks: {
  guard: async ({ request }) => {
    const session = await getSession(request);
    if (!session) throw Object.assign(new Error("Unauthorized"), { status: 401 });
  },
}
```

### Quota check

`fileSize` in `upload.guard` and `multipart.guard` (init only) is **declared by the client** — use it for pre-checks. `contentLength` in `onUploaded` / `multipart.onComplete` is verified by S3.

```ts
hooks: {
  upload: {
    guard: async ({ request, fileSize }) => {
      const { userId } = await getSession(request);
      const used = await db.storage.getUsed(userId);
      if (fileSize && used + fileSize > QUOTA)
        throw Object.assign(new Error("Quota exceeded"), { status: 403 });
    },
  },
}
```

## Multipart cost attacks

S3 presigned `UploadPart` URLs cannot enforce per-part size. A malicious client can upload oversized parts — the post-complete `HeadObject` check will catch and delete the final object, but temporary part storage still accumulates cost. Without completion, orphaned parts stay on AWS S3 indefinitely (R2 cleans up after 7 days).

**Mitigation: track uploads in a database + cron cleanup**

```ts
hooks: {
  multipart: {
    // Guard runs on init, part, complete, and abort.
    // fileSize is only present during init — use it to limit open sessions.
    guard: async ({ request, fileSize }) => {
      if (!fileSize) return;
      const { userId } = await getSession(request);
      const pending = await db.upload.count({ where: { userId, status: "pending" } });
      if (pending >= 3)
        throw Object.assign(new Error("Too many pending uploads"), { status: 429 });
    },

    onInit: async ({ request, key, uploadId, contentType, fileSize }) => {
      const { userId } = await getSession(request);
      await db.upload.create({
        data: { key, userId, uploadId, contentType, declaredSize: fileSize, status: "pending" },
      });
    },

    onComplete: async ({ key, contentLength, contentType, eTag }) => {
      await db.upload.update({
        where: { key },
        data: { status: "complete", verifiedSize: contentLength, contentType, eTag },
      });
    },

    onAbort: async ({ key }) => {
      await db.upload.update({ where: { key }, data: { status: "aborted" } });
    },
  },
}
```

**Cron job** — abort stale uploads and release S3 part storage:

```ts
// Runs every hour
const stale = await db.upload.findMany({
  where: {
    status: "pending",
    createdAt: { lt: new Date(Date.now() - 3_600_000) },
  },
});
for (const upload of stale) {
  await s3
    .send(
      new AbortMultipartUploadCommand({
        Bucket: defaultBucket,
        Key: upload.key,
        UploadId: upload.uploadId,
      }),
    )
    .catch(() => {});
  await db.upload.update({
    where: { key: upload.key },
    data: { status: "expired" },
  });
}
```

**S3 lifecycle rule** — safety net for anything the cron misses (e.g. crash before `onInit`):

```json
{
  "Rules": [
    {
      "ID": "abort-incomplete-multipart",
      "Status": "Enabled",
      "Filter": { "Prefix": "" },
      "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 1 }
    }
  ]
}
```

> Also rate-limit `/presign/multipart/part` per user/IP at the application layer.

## API Routes

| Method   | Path                          | Description                      |
| -------- | ----------------------------- | -------------------------------- |
| `POST`   | `/presign/upload`             | Presigned POST for direct upload |
| `POST`   | `/presign/upload/confirm`     | Confirm upload via HeadObject    |
| `GET`    | `/presign/download`           | Presigned download URL           |
| `DELETE` | `/delete`                     | Delete object                    |
| `POST`   | `/presign/multipart/init`     | Init multipart upload            |
| `POST`   | `/presign/multipart/part`     | Sign a part URL                  |
| `POST`   | `/presign/multipart/complete` | Complete + verify                |
| `POST`   | `/presign/multipart/abort`    | Abort multipart                  |

## License

MIT
