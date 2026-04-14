# @better-s3/next

Next.js App Router handler factories for S3 presigned URL generation, multipart management, and file deletion.

## Install

```bash
pnpm add @better-s3/next
```

> `@aws-sdk/client-s3` is included transitively via `@better-s3/core`. Import `S3Client` from `@better-s3/core`.

## Quick start

### Single catch-all route (recommended)

```ts
// app/api/s3/[...s3]/route.ts
import { createRouteHandler } from "@better-s3/next";
import { S3Client } from "@better-s3/core";

const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const handler = createRouteHandler({
  s3,
  defaultBucket: "my-bucket",
  basePath: "/api/s3",
});

export { handler as GET, handler as POST, handler as DELETE };
```

This single handler routes requests to the correct operation based on method and path:

| Method   | Path                                 | Operation                       |
| -------- | ------------------------------------ | ------------------------------- |
| `POST`   | `/api/s3/presign/upload`             | Generate upload presigned URL   |
| `GET`    | `/api/s3/presign/download?key=...`   | Generate download presigned URL |
| `DELETE` | `/api/s3/delete?key=...`             | Delete object                   |
| `POST`   | `/api/s3/presign/multipart/init`     | Initialize multipart upload     |
| `POST`   | `/api/s3/presign/multipart/part`     | Get presigned URL for a part    |
| `POST`   | `/api/s3/presign/multipart/complete` | Complete multipart upload       |
| `POST`   | `/api/s3/presign/multipart/abort`    | Abort multipart upload          |

### Individual handlers

If you prefer separate route files, use the individual handler factories:

```ts
import {
  createUploadHandler,
  createDownloadHandler,
  createDeleteHandler,
  createMultipartInitHandler,
  createMultipartPartHandler,
  createMultipartCompleteHandler,
  createMultipartAbortHandler,
} from "@better-s3/next";
```

## Configuration

```ts
type S3HandlerConfig = {
  s3: S3Client; // AWS SDK v3 S3 client
  defaultBucket: string; // Fallback bucket name
};

type RouteHandlerConfig = S3HandlerConfig & {
  basePath: string; // Base path for route matching (e.g. "/api/s3")
};
```

## S3-compatible providers

Works with any S3-compatible storage:

```ts
// Cloudflare R2
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_KEY, secretAccessKey: R2_SECRET },
});

// MinIO
const s3 = new S3Client({
  region: "us-east-1",
  endpoint: "http://localhost:9000",
  forcePathStyle: true,
  credentials: { accessKeyId: MINIO_KEY, secretAccessKey: MINIO_SECRET },
});
```

## License

MIT
