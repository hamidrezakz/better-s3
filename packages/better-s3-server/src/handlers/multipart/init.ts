import { CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import type { S3HandlerConfig } from "../../types";
import {
  parseBody,
  requireString,
  buildContentDisposition,
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
  /** Original file name. Stored as `Content-Disposition: attachment; filename="..."` on the S3 object. */
  fileName?: string;
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
        ContentDisposition: body.fileName
          ? buildContentDisposition(body.fileName)
          : undefined,
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
