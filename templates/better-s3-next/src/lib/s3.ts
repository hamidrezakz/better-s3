import { S3Client } from "@aws-sdk/client-s3";

/**
 * S3-compatible client configuration.
 *
 * This example uses Cloudflare R2, but you can use any S3-compatible provider
 * (AWS S3, MinIO, DigitalOcean Spaces, Supabase Storage, etc).
 *
 * For AWS S3 you only need `region` and credentials — no custom endpoint.
 * See: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/
 */
export const s3 = new S3Client({
  // R2 uses "auto" region. For AWS S3, use your actual region (e.g. "us-east-1").
  region: "auto",

  // Custom endpoint for R2. Remove this line for AWS S3.
  endpoint: process.env.R2_ENDPOINT,

  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/** Default bucket name from environment */
export const defaultBucket = process.env.R2_DEFAULT_BUCKET_NAME!;
