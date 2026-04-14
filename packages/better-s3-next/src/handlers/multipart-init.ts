import { CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import type { S3HandlerConfig } from "../types";
import { parseBody, requireString, withS3ErrorHandler } from "../helpers";

type Payload = {
  key: string;
  bucket?: string;
  contentType?: string;
  metadata?: Record<string, string>;
};

export function createMultipartInitHandler(config: S3HandlerConfig) {
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

    const { UploadId } = await config.s3.send(
      new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: body.contentType,
        Metadata: body.metadata,
      }),
    );

    return Response.json({ bucket, key, uploadId: UploadId }, { status: 201 });
  });
}
