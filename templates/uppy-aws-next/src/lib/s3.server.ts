import { S3Client } from "@aws-sdk/client-s3";

/**
 * S3-compatible client — server-side only.
 *
 * This example is configured for Cloudflare R2.
 * For AWS S3 just remove `endpoint` and set the correct `region`.
 */
export const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const defaultBucket = process.env.R2_DEFAULT_BUCKET_NAME!;
