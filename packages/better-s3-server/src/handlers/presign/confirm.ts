import { HeadObjectCommand } from "@aws-sdk/client-s3";
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
};

export function createConfirmHandler(config: S3HandlerConfig) {
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

    const guardResult = await runHook(config.hooks?.upload?.guard, {
      request,
      key,
      bucket,
    });
    if (guardResult) return guardResult;

    const head = await config.s3.send(
      new HeadObjectCommand({ Bucket: bucket, Key: key }),
    );

    const context = {
      request,
      key,
      bucket,
      contentType: head.ContentType,
      contentLength: head.ContentLength ?? 0,
      eTag: head.ETag?.replace(/"/g, ""),
      metadata: head.Metadata,
    };

    await config.hooks?.upload?.onComplete?.(context);

    return Response.json({
      key,
      bucket,
      contentType: context.contentType,
      contentLength: context.contentLength,
      eTag: context.eTag,
    });
  });
}
