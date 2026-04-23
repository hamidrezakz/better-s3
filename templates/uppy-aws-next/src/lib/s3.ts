import { createS3Api } from "@better-s3/server";

/**
 * Client-safe S3 API.
 *
 * This calls the Next.js API route at /api/s3 which in turn uses the AWS SDK.
 * Safe to import from "use client" components — no credentials here.
 */
export const s3Api = createS3Api("/api/s3");
