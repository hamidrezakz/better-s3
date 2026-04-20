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

    const guardResult = await runHook(config.hooks?.multipart?.guard, {
      request,
      key,
      bucket,
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
      metadata: body.metadata,
      acl,
    });

    return Response.json({ bucket, key, uploadId: UploadId }, { status: 201 });
  });
}
