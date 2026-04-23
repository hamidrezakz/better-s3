import { createRouteHandler } from "@better-s3/server/next";
import { s3, defaultBucket } from "@/lib/s3.server";

/**
 * Catch-all API route that powers all S3 operations.
 *
 * Handles presigned upload/download, upload confirm, delete, and multipart.
 * Uppy's @uppy/aws-s3 plugin calls these endpoints automatically via lib/uppy-s3.ts.
 *
 * Routes:
 *   POST   /api/s3/presign/upload              → presigned PUT URL (simple upload)
 *   POST   /api/s3/presign/upload/confirm      → confirm + inspect uploaded object
 *   GET    /api/s3/presign/download            → presigned GET URL
 *   DELETE /api/s3/delete                      → delete object
 *   POST   /api/s3/presign/multipart/init      → start multipart upload
 *   POST   /api/s3/presign/multipart/part      → sign a part
 *   POST   /api/s3/presign/multipart/complete  → finalize multipart
 *   POST   /api/s3/presign/multipart/abort     → abort multipart
 */
const handler = createRouteHandler({
  s3,
  defaultBucket,
  basePath: "/api/s3",

  hooks: {
    // ── Global guard ──────────────────────────────────────────────
    // Uncomment to protect all routes (e.g. session check, API key, etc.)
    // guard: async ({ request }) => {
    //   const session = await getSession(request);
    //   if (!session) throw new Error("Unauthorized");
    // },

    upload: {
      onSuccess: async ({ key, bucket, contentType }) => {
        console.log(`[upload] presigned: ${key} (${contentType}) in ${bucket}`);
      },
      onComplete: async ({ key, contentType, contentLength, eTag }) => {
        console.log(
          `[upload] confirmed: ${key} — ${contentType}, ${contentLength} bytes, eTag: ${eTag}`,
        );
        // TODO: save file record to your database here
      },
    },

    delete: {
      onSuccess: async ({ key, bucket }) => {
        console.log(`[delete] ${key} from ${bucket}`);
        // TODO: remove record from your database here
      },
    },

    multipart: {
      onInit: async ({ key, uploadId }) => {
        console.log(`[multipart] init: ${key} (uploadId: ${uploadId})`);
      },
      onComplete: async ({ key, uploadId }) => {
        console.log(`[multipart] complete: ${key} (uploadId: ${uploadId})`);
        // TODO: save file record to your database here
      },
      onAbort: async ({ key, uploadId }) => {
        console.log(`[multipart] abort: ${key} (uploadId: ${uploadId})`);
      },
    },
  },
});

export { handler as GET, handler as POST, handler as DELETE };
