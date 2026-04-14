import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import type { S3HandlerConfig } from "../types";
import { parseBody, requireString, withS3ErrorHandler } from "../helpers";

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

    const { Location, ETag } = await config.s3.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      }),
    );

    return Response.json({
      bucket,
      key,
      uploadId,
      location: Location,
      eTag: ETag,
    });
  });
}
