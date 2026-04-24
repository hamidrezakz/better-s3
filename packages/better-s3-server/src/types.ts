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
  /**
   * Runs before every request. Throw to reject (`403` by default).
   */
  guard?: (context: HookContext) => Promise<void> | void;

  upload?: {
    /**
     * Runs before the presigned URL is generated.
     * `fileSize` is client-declared — treat as untrusted.
     * Throw to reject (`403` by default).
     */
    guard?: (context: UploadHookContext) => Promise<void> | void;

    /**
     * Fires after the presigned URL is issued. The file has not been uploaded yet.
     */
    onPresigned?: (context: UploadSuccessContext) => Promise<void> | void;

    /**
     * Fires after `POST /presign/upload/confirm`. The server verifies the object via
     * `HeadObject`, so `contentLength` and `eTag` are the actual S3 values.
     */
    onUploaded?: (context: UploadCompleteContext) => Promise<void> | void;
  };

  download?: {
    /**
     * Runs before the presigned download URL is generated.
     * Throw to reject (`403` by default).
     */
    guard?: (context: DownloadHookContext) => Promise<void> | void;

    /**
     * Fires after the presigned download URL is issued. The file has not been downloaded yet.
     */
    onPresigned?: (context: DownloadSuccessContext) => Promise<void> | void;
  };

  delete?: {
    /**
     * Runs before the object is deleted from S3.
     * Throw to reject (`403` by default).
     */
    guard?: (context: DeleteHookContext) => Promise<void> | void;

    /**
     * Fires after the object is successfully deleted from S3.
     */
    onDeleted?: (context: DeleteHookContext) => Promise<void> | void;
  };

  multipart?: {
    /**
     * Runs before every multipart operation (`init`, `part`, `complete`, `abort`).
     * `fileSize` is only present during `init`.
     * Throw to reject (`403` by default).
     */
    guard?: (context: MultipartHookContext) => Promise<void> | void;

    /**
     * Fires after `CreateMultipartUpload`. Use to record the pending session in your database.
     */
    onInit?: (context: MultipartInitSuccessContext) => Promise<void> | void;

    /**
     * Fires after `CompleteMultipartUpload`. The server runs `HeadObject` first,
     * so `contentLength` and `eTag` are the actual S3 values.
     */
    onComplete?: (
      context: MultipartCompleteSuccessContext,
    ) => Promise<void> | void;

    /**
     * Fires after `AbortMultipartUpload`. S3 releases all stored parts on success.
     */
    onAbort?: (
      context: MultipartHookContext & { uploadId: string },
    ) => Promise<void> | void;
  };
};

// ── Config types ────────────────────────────────────────────────────

export type S3Features = {
  /**
   * Enable presigned upload endpoints (`POST /presign/upload` and
   * `POST /presign/upload/confirm`).
   * @default false
   */
  upload?: boolean;
  /**
   * Enable the presigned download endpoint (`GET /presign/download`).
   * @default false
   */
  download?: boolean;
  /**
   * Enable the delete endpoint (`DELETE /delete`).
   * @default false
   */
  delete?: boolean;
  /**
   * Enable all multipart upload endpoints (`/presign/multipart/*`).
   * Keep disabled unless you explicitly need multipart support — see the
   * multipart cost-attack section in the README.
   * @default false
   */
  multipart?: boolean;
};

export type S3HandlerConfig = {
  /** The S3 client instance used to communicate with your bucket. */
  s3: S3Client;
  /** Default bucket used when no `bucket` is specified in the request payload. */
  defaultBucket: string;
  /**
   * Controls which API endpoints are active.
   * **All features are disabled by default** — you must opt in to each one.
   *
   * ```ts
   * features: { upload: true, download: true, delete: true }
   * // multipart stays off unless you explicitly enable it
   * ```
   */
  features: S3Features;
  /**
   * Maximum file size in bytes. If set and the client declares a `fileSize` that
   * exceeds this value, the request is rejected before any presigned URL is
   * generated. Applies to both simple upload and multipart init.
   */
  maxFileSize?: number;
  /** Optional lifecycle hooks for authentication, logging, and side effects. */
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
