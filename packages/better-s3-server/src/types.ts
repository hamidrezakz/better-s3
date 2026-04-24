import type { S3Client } from "@aws-sdk/client-s3";

// ── Hook context types ──────────────────────────────────────────────

export type HookContext = {
  request: Request;
};

export type UploadHookContext = HookContext & {
  key: string;
  bucket: string;
  contentType?: string;
  /** Declared byte size of the file the client intends to upload. */
  fileSize?: number;
  metadata?: Record<string, string>;
  acl?: "private" | "public-read";
};

export type UploadSuccessContext = UploadHookContext & {
  url: string;
  expiresIn: number;
};

export type UploadCompleteContext = HookContext & {
  key: string;
  bucket: string;
  contentType?: string;
  contentLength: number;
  eTag?: string;
  metadata?: Record<string, string>;
};

export type DownloadHookContext = HookContext & {
  key: string;
  bucket: string;
  fileName?: string;
};

export type DownloadSuccessContext = DownloadHookContext & {
  url: string;
  expiresIn: number;
};

export type DeleteHookContext = HookContext & {
  key: string;
  bucket: string;
};

export type MultipartHookContext = HookContext & {
  key: string;
  bucket: string;
  /**
   * Declared byte size of the file — available during `init` only.
   * Undefined during `part`, `complete`, and `abort` operations.
   */
  fileSize?: number;
};

export type MultipartInitSuccessContext = MultipartHookContext & {
  uploadId: string;
  contentType?: string;
  /** Declared byte size of the file (as provided by the client). */
  fileSize?: number;
  metadata?: Record<string, string>;
  acl?: "private" | "public-read";
};

export type MultipartCompleteSuccessContext = MultipartHookContext & {
  uploadId: string;
  contentLength: number;
  contentType?: string;
  eTag?: string;
};

// ── Server hooks ────────────────────────────────────────────────────

export type S3ServerHooks = {
  /** Runs before every request. Throw to reject. */
  guard?: (context: HookContext) => Promise<void> | void;

  upload?: {
    /** Runs before presigning an upload URL. Throw to reject. */
    guard?: (context: UploadHookContext) => Promise<void> | void;
    /** Runs after a presigned upload URL is generated. */
    onSuccess?: (context: UploadSuccessContext) => Promise<void> | void;
    /** Runs after a simple upload is confirmed via HeadObject. */
    onComplete?: (context: UploadCompleteContext) => Promise<void> | void;
  };

  download?: {
    /** Runs before presigning a download URL. Throw to reject. */
    guard?: (context: DownloadHookContext) => Promise<void> | void;
    /** Runs after a presigned download URL is generated. */
    onSuccess?: (context: DownloadSuccessContext) => Promise<void> | void;
  };

  delete?: {
    /** Runs before deleting an object. Throw to reject. */
    guard?: (context: DeleteHookContext) => Promise<void> | void;
    /** Runs after an object is deleted. */
    onSuccess?: (context: DeleteHookContext) => Promise<void> | void;
  };

  multipart?: {
    /** Runs before any multipart operation. Throw to reject. */
    guard?: (context: MultipartHookContext) => Promise<void> | void;
    /** Runs after a multipart upload is initialized. */
    onInit?: (context: MultipartInitSuccessContext) => Promise<void> | void;
    /** Runs after a multipart upload is completed (file fully uploaded). */
    onComplete?: (
      context: MultipartCompleteSuccessContext,
    ) => Promise<void> | void;
    /** Runs after a multipart upload is aborted. */
    onAbort?: (
      context: MultipartHookContext & { uploadId: string },
    ) => Promise<void> | void;
  };
};

// ── Config types ────────────────────────────────────────────────────

export type S3HandlerConfig = {
  s3: S3Client;
  defaultBucket: string;
  /**
   * Maximum file size in bytes enforced server-side.
   * - Simple uploads: enforced via `content-length-range` in the presigned POST policy (S3 rejects oversized files).
   * - Multipart uploads: enforced at three points:
   *   1. Init-time rejection if the client declares a `fileSize` that exceeds this limit.
   *   2. Part-request rejection if the requested `partNumber` exceeds the maximum number of
   *      parts derivable from this limit (caps potential over-upload to `maxFileSize + ~5 MB`).
   *   3. HeadObject verification after CompleteMultipartUpload; the object is deleted and a 422
   *      is returned if the actual size still exceeds this limit.
   *
   * Note: S3 presigned UploadPart URLs do not enforce per-part size at the S3 level.
   * For strict enforcement, combine this setting with `requireFileSizeForMultipart`,
   * infrastructure-level S3 lifecycle rules for incomplete multipart uploads, and
   * rate limiting on your API endpoints.
   */
  maxFileSize?: number;
  hooks?: S3ServerHooks;
};

export type S3RouteHandlerConfig = S3HandlerConfig & {
  basePath: string;
};

export type S3Handler = (request: Request) => Promise<Response>;

export type S3Handlers = {
  presign: {
    upload: S3Handler;
    confirm: S3Handler;
    download: S3Handler;
  };
  multipart: {
    init: S3Handler;
    part: S3Handler;
    complete: S3Handler;
    abort: S3Handler;
  };
  delete: S3Handler;
};
