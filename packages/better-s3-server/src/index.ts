// Handlers
export { createHandlers } from "./create-handlers";
export { createRouter } from "./router";
export { createUploadHandler } from "./handlers/presign/upload";
export { createConfirmHandler } from "./handlers/presign/confirm";
export { createDownloadHandler } from "./handlers/presign/download";
export { createDeleteHandler } from "./handlers/delete";
export { createMultipartInitHandler } from "./handlers/multipart/init";
export { createMultipartPartHandler } from "./handlers/multipart/part";
export { createMultipartCompleteHandler } from "./handlers/multipart/complete";
export { createMultipartAbortHandler } from "./handlers/multipart/abort";

// S3 API client
export {
  createS3Api,
  type S3Api,
  type PresignResponse,
  type PresignedPostResponse,
  type MultipartInitResponse,
  type MultipartPartResponse,
  type UploadConfirmResponse,
} from "./api";

// Backward-compat aliases
export {
  createS3Api as createPresignApi,
  type S3Api as PresignApi,
} from "./api";

// Validation
export { validateFile } from "./validate";

// Types
export type {
  S3HandlerConfig,
  S3RouteHandlerConfig,
  S3Handler,
  S3Handlers,
  S3ServerHooks,
  HookContext,
  UploadHookContext,
  UploadSuccessContext,
  UploadCompleteContext,
  DownloadHookContext,
  DownloadSuccessContext,
  DeleteHookContext,
  MultipartHookContext,
  MultipartInitSuccessContext,
  MultipartCompleteSuccessContext,
} from "./types";

// Helpers
export {
  parseBody,
  requireString,
  normalizeExpiresIn,
  withS3ErrorHandler,
  runHook,
} from "./helpers";
