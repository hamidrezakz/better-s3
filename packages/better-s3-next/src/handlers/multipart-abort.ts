import { AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import type { S3HandlerConfig } from "../types";
import { parseBody, requireString, withS3ErrorHandler } from "../helpers";

type Payload = {
  key: string;
  uploadId: string;
  bucket?: string;
};

export function createMultipartAbortHandler(config: S3HandlerConfig) {
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

    const uploadId = requireString(body.uploadId, "uploadId");
    if (uploadId instanceof Response) return uploadId;

    const bucket = body.bucket?.trim() || config.defaultBucket;

    await config.s3.send(
      new AbortMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
      }),
    );

    return Response.json({ bucket, key, uploadId, aborted: true });
  });
}
