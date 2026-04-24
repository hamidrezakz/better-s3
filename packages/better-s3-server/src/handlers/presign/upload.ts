import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import type { S3HandlerConfig } from "../../types";
import {
  parseBody,
  requireString,
  normalizeExpiresIn,
  runHook,
  withS3ErrorHandler,
} from "../../helpers";

// 5 GiB — S3 single-object size limit
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024 * 1024;

type Payload = {
  key: string;
  contentType?: string;
  /**
   * Exact byte size of the file the client intends to upload.
   * When provided the presigned POST policy locks `content-length-range` to
   * `[fileSize, fileSize]`, so S3 rejects any upload that is not exactly this
   * size — even if the client tampers with the payload.
   * When omitted the range is `[1, maxFileSize ?? 5 GiB]`.
   */
  fileSize?: number;
  metadata?: Record<string, string>;
  bucket?: string;
  expiresIn?: number;
  acl?: "private" | "public-read";
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
    const acl = body.acl === "public-read" ? "public-read" : "private";
    const contentType = body.contentType?.trim() || "application/octet-stream";
    const fileSize =
      typeof body.fileSize === "number" && body.fileSize > 0
        ? Math.floor(body.fileSize)
        : null;

    // Reject immediately if the declared size already exceeds the server limit,
    // before generating any presigned URL.
    if (
      fileSize !== null &&
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

    const guardResult = await runHook(config.hooks?.upload?.guard, {
      request,
      key,
      bucket,
      contentType: body.contentType,
      fileSize: fileSize ?? undefined,
      metadata: body.metadata,
      acl,
    });
    if (guardResult) return guardResult;

    // Build presigned POST fields. Fields are embedded in the signed policy
    // so the client cannot change them without invalidating the signature.
    const fields: Record<string, string> = { acl, "Content-Type": contentType };

    if (body.metadata) {
      for (const [k, v] of Object.entries(body.metadata)) {
        fields[`x-amz-meta-${k}`] = v;
      }
    }

    // `content-length-range` is enforced by S3 at the storage layer —
    // uploads outside this range are rejected before the object is stored.
    //
    // When the client declares fileSize: S3 locks the range to exactly that
    // number of bytes, so uploading a different-sized file is impossible.
    // When fileSize is not declared: falls back to [1, maxFileSize ?? 5 GiB].
    const maxBytes = config.maxFileSize ?? MAX_UPLOAD_SIZE;
    const rangeMin = fileSize ?? 1;
    const rangeMax = fileSize ?? maxBytes;

    const { url, fields: signedFields } = await createPresignedPost(config.s3, {
      Bucket: bucket,
      Key: key,
      Conditions: [["content-length-range", rangeMin, rangeMax]],
      Fields: fields,
      Expires: expiresIn,
    });

    await config.hooks?.upload?.onSuccess?.({
      request,
      key,
      bucket,
      contentType: body.contentType,
      metadata: body.metadata,
      acl,
      url,
      expiresIn,
    });

    return Response.json({ bucket, key, url, fields: signedFields, expiresIn });
  });
}
