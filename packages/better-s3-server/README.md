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
  maxFileSize: 100 * 1024 * 1024, // (100 MB) global server limit for all uploads
});

export { handler as GET, handler as POST, handler as DELETE };
```

Other frameworks via `createRouter` from `@better-s3/server`:

```ts
const router = createRouter({
  s3,
  defaultBucket: "my-bucket",
  basePath: "/api/s3",
});

app.all("/api/s3/*", (c) => router(c.req.raw)); // Hono example
```


| Upload mode | Enforcement                                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Simple      | S3 enforces exact size via `content-length-range` in the signed POST policy — tamperproof                                                                         |
| Multipart   | 1. Init rejected if `fileSize` exceeds limit · 2. Part requests capped at `ceil(maxFileSize / 5 MiB)` · 3. `HeadObject` after complete → delete + 422 if exceeded |

> Simple upload is inherently more secure — enforcement happens at the S3 storage layer. Multipart presigned `UploadPart` URLs cannot enforce per-part size; see [Multipart cost attacks](#multipart-cost-attacks).

## Server Hooks

Run server-side logic at key points. Every hook receives the `Request` object. **Throw to reject** — returned as `{ message }` with status 403, or any status you set on the thrown error.

```
Simple:    upload.guard → upload.onSuccess → [S3] → upload.onComplete
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

`fileSize` in `upload.guard` and `multipart.guard` (init only) is **declared by the client** — use it for pre-checks. `contentLength` in `onComplete` is verified by S3.

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
