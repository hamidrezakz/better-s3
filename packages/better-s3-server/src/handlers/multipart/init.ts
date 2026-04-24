import { CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import type { S3HandlerConfig } from "../../types";
import {
  parseBody,
  requireString,
  runHook,
  withS3ErrorHandler,
} from "../../helpers";

type Payload = {
  key: string;
  bucket?: string;
  contentType?: string;
  /** Declared total byte size of the file being uploaded. */
  fileSize?: number;
  metadata?: Record<string, string>;
  acl?: "private" | "public-read";
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
    const acl = body.acl === "public-read" ? "public-read" : "private";
    const fileSize =
      typeof body.fileSize === "number" && body.fileSize > 0
        ? Math.floor(body.fileSize)
        : undefined;

    // When maxFileSize is configured, fileSize must be declared so the server can
    // enforce the limit at init time (before the multipart upload is created).
    if (config.maxFileSize && fileSize === undefined) {
      return Response.json(
        { message: "fileSize is required when maxFileSize is configured" },
        { status: 400 },
      );
    }

    // Reject immediately if the declared size already exceeds the server limit.
    if (
      fileSize !== undefined &&
      config.maxFileSize &&
      fileSize > config.maxFileSize
    ) {
      return Response.json(
        {
          message: `File size (${fileSize} bytes) exceeds the maximum allowed size of ${config.maxFileSize} bytes`,
        },
        { status: 413 },
      );
    }

    const guardResult = await runHook(config.hooks?.multipart?.guard, {
      request,
      key,
      bucket,
      fileSize,
    });
    if (guardResult) return guardResult;

    const { UploadId } = await config.s3.send(
      new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: body.contentType,
        Metadata: body.metadata,
        ACL: acl,
      }),
    );

    await config.hooks?.multipart?.onInit?.({
      request,
      key,
      bucket,
      uploadId: UploadId!,
      contentType: body.contentType,
      fileSize,
      metadata: body.metadata,
      acl,
    });

    return Response.json({ bucket, key, uploadId: UploadId }, { status: 201 });
  });
}
