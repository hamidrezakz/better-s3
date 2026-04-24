import { CompleteMultipartUploadCommand, HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import type { S3HandlerConfig } from "../../types";
import {
  parseBody,
  requireString,
  runHook,
  withS3ErrorHandler,
} from "../../helpers";

type PartEntry = {
  partNumber: number;
  eTag: string;
};

type Payload = {
  key: string;
  uploadId: string;
  bucket?: string;
  parts: PartEntry[];
};

export function createMultipartCompleteHandler(config: S3HandlerConfig) {
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

    const parts = (Array.isArray(body.parts) ? body.parts : [])
      .map(({ partNumber, eTag }) => ({
        PartNumber: Number(partNumber),
        ETag: String(eTag),
      }))
      .filter((p) => Number.isInteger(p.PartNumber) && p.ETag)
      .sort((a, b) => a.PartNumber - b.PartNumber);

    if (!parts.length) {
      return Response.json(
        { message: "At least one valid part is required" },
        { status: 400 },
      );
    }

    const bucket = body.bucket?.trim() || config.defaultBucket;

    const guardResult = await runHook(config.hooks?.multipart?.guard, {
      request,
      key,
      bucket,
    });
    if (guardResult) return guardResult;

    await config.s3.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      }),
    );

    // Verify the actual uploaded object metadata via HeadObject.
    // This is the server's only opportunity to enforce maxFileSize for
    // multipart uploads, since individual parts bypass size checks.
    const head = await config.s3.send(
      new HeadObjectCommand({ Bucket: bucket, Key: key }),
    );
    const contentLength = head.ContentLength ?? 0;
    const contentType = head.ContentType;
    const eTag = head.ETag?.replace(/"/g, "");

    if (config.maxFileSize && contentLength > config.maxFileSize) {
      // Delete the object and reject the request. The client has uploaded
      // more data than the server policy allows.
      await config.s3
        .send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
        .catch(() => {});
      return Response.json(
        {
          message: `File size (${contentLength} bytes) exceeds the maximum allowed size of ${config.maxFileSize} bytes`,
        },
        { status: 422 },
      );
    }

    await config.hooks?.multipart?.onComplete?.({
      request,
      key,
      bucket,
      uploadId,
      contentLength,
      contentType,
      eTag,
    });

    return Response.json({ bucket, key, uploadId, contentLength, contentType, eTag });
  });
}
