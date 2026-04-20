import { createRouteHandler } from "@better-s3/server/next";
import { s3, defaultBucket } from "@/lib/s3";

/**
 * Catch-all API route for better-s3.
 *
 * Handles: presigned upload/download, upload confirm, delete, and multipart.
 * See: https://github.com/hamidrezakz/better-s3
 */
const handler = createRouteHandler({
  s3,
  defaultBucket,
  basePath: "/api/s3",

  hooks: {
    // ── Global guard ──────────────────────────────────────────────
    // Runs before every request. Throw to reject (403 by default).
    // guard: async ({ request }) => {
    //   const session = await getSession(request);
    //   if (!session) throw new Error("Unauthorized");
    // },

    upload: {
      // Runs after presigned URL is generated
      onSuccess: async ({ key, bucket, contentType }) => {
        console.log(`[upload] presigned: ${key} (${contentType}) in ${bucket}`);
      },

      // Runs after client confirms a simple upload — has real S3 metadata
      onComplete: async ({ key, contentType, contentLength, eTag }) => {
        console.log(
          `[upload] confirmed: ${key} — ${contentType}, ${contentLength} bytes, eTag: ${eTag}`,
        );
        // Example: save to your database
        // await db.file.upsert({ where: { key }, create: { ... }, update: { ... } });
      },
    },

    delete: {
      onSuccess: async ({ key, bucket }) => {
        console.log(`[delete] ${key} from ${bucket}`);
        // Example: remove from your database
        // await db.file.delete({ where: { key } });
      },
    },

    multipart: {
      onInit: async ({ key, uploadId }) => {
        console.log(`[multipart] init: ${key} (uploadId: ${uploadId})`);
      },
      onComplete: async ({ key, uploadId }) => {
        console.log(`[multipart] complete: ${key} (uploadId: ${uploadId})`);
      },
      onAbort: async ({ key, uploadId }) => {
        console.log(`[multipart] abort: ${key} (uploadId: ${uploadId})`);
      },
    },
  },
});

export { handler as GET, handler as POST, handler as DELETE };
