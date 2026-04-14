import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { S3HandlerConfig } from "../types";
import {
  parseBody,
  requireString,
  normalizeExpiresIn,
  withS3ErrorHandler,
} from "../helpers";

type Payload = {
  key: string;
  contentType?: string;
  metadata?: Record<string, string>;
  bucket?: string;
  expiresIn?: number;
};

export function createUploadHandler(config: S3HandlerConfig) {
  return withS3ErrorHandler(async (request: Request) => {
    const body = await parseBody<Payload>(request);
    if (!body) {
      return Response.json(
        { message: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    const key = requireString(body.key, "key");
    if (key instanceof Response) return key;

    const bucket = body.bucket?.trim() || config.defaultBucket;
    const expiresIn = normalizeExpiresIn(body.expiresIn);

    const url = await getSignedUrl(
      config.s3,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: body.contentType,
        Metadata: body.metadata,
      }),
      { expiresIn },
    );

    return Response.json({ bucket, key, url, expiresIn });
  });
}
