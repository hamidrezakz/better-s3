# uppy-aws-next

A Next.js 16 template demonstrating S3 file operations using **Uppy v5** for the upload UI and **@better-s3/server** for the server-side presigned URL API.

## What this template shows

| Feature                     | Implementation                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------ |
| Upload (simple + multipart) | Uppy Dashboard / Uppy Dropzone → `@uppy/aws-s3` → `@better-s3/server` presigned URLs |
| Download                    | Custom `DownloadButton` → `@better-s3/server` presigned URL → browser download       |
| Delete                      | Custom `DeleteButton` with inline confirm → `@better-s3/server`                      |

## Key files

```
src/
  app/
    api/s3/[...s3]/route.ts  ← all S3 API routes (from @better-s3/server)
    upload/page.tsx           ← Uppy Dashboard + Dropzone demos
    manage/page.tsx           ← Download + Delete demo
  lib/
    s3.server.ts              ← S3Client (server-only)
    s3.ts                     ← s3Api client (browser-safe)
    uppy-s3.ts                ← createUppyS3() factory
  components/
    uppy-dashboard.tsx        ← Uppy Dashboard wrapper (use client)
    uppy-drag-drop.tsx        ← Uppy Dropzone + StatusBar (use client)
    download-button.tsx       ← Custom download button
    delete-button.tsx         ← Custom delete + confirmation
```

## Setup

1. Copy `.env.example` → `.env.local` and fill in your S3/R2 credentials.
2. Install deps: `pnpm install`
3. Run dev: `pnpm dev`

## Notes

- Files **≥ 50 MB** automatically use multipart upload via `@uppy/aws-s3`.
- Download and delete are custom components — Uppy has no built-in support for these.
- The server layer is `@better-s3/server` (same as the `better-s3-next` template). You can replace it with raw Next.js route handlers if you prefer.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
