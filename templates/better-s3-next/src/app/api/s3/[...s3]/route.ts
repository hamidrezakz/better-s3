import { createRouteHandler } from "@better-s3/server/next";
import { s3, defaultBucket } from "@/lib/s3";


const handler = createRouteHandler({
  s3,
  defaultBucket,
  basePath: "/api/s3",
  // Enable only the features your app needs. All are disabled by default.
  features: {
    upload: true,
    download: true,
    delete: true,
    multipart: true,
  },

  // Optional: enforce a server-side file size limit.
  hooks: {
    // ── Global guard ──────────────────────────────────────────────
    // Runs before every request. Throw to reject (403 by default).
    // guard: async ({ request }) => {
    //   const session = await getSession(request);
    //   if (!session) throw new Error("Unauthorized");
    // },

    upload: {
      onPresigned: async ({ key, bucket, contentType }) => {
        console.log(`[upload] presigned: ${key} (${contentType}) in ${bucket}`);
      },

      onUploaded: async ({ key, contentType, contentLength, eTag }) => {
        console.log(
          `[upload] confirmed: ${key} — ${contentType}, ${contentLength} bytes, eTag: ${eTag}`,
        );
        // Example: save to your database
        // await db.file.upsert({ where: { key }, create: { ... }, update: { ... } });
      },
    },

    delete: {
      onDeleted: async ({ key, bucket }) => {
        console.log(`[delete] ${key} from ${bucket}`);
        // Example: remove from your database
        // await db.file.delete({ where: { key } });
      },
    },

    multipart: {
      onInit: async ({ key, uploadId }) => {
        console.log(`[multipart] init: ${key} (uploadId: ${uploadId})`);
      },
      onComplete: async ({
        key,
        uploadId,
        contentLength,
        contentType,
        eTag,
      }) => {
        console.log(
          `[multipart] complete: ${key} (uploadId: ${uploadId}) — ${contentType}, ${contentLength} bytes, eTag: ${eTag}`,
        );
        // Example: save to your database (same as upload.onComplete)
        // await db.file.upsert({ where: { key }, create: { ... }, update: { ... } });
      },
      onAbort: async ({ key, uploadId }) => {
        console.log(`[multipart] abort: ${key} (uploadId: ${uploadId})`);
      },
    },
  },
});

export { handler as GET, handler as POST, handler as DELETE };
