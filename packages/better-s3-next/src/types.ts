import type { S3Client } from "@better-s3/core";

export type S3HandlerConfig = {
  s3: S3Client;
  defaultBucket: string;
};
