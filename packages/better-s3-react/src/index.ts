// Types
export * from "./types";

// Helpers
export { formatFileSize } from "./helpers";

// Upload engine
export {
  uploadFile,
  uploadFiles,
  type UploadEngineCallbacks,
  type FileItem,
  type FileItemStatus,
  type MultiUploadCallbacks,
} from "./upload";

// Re-exports from @better-s3/server
export {
  createS3Api,
  createS3Api as createPresignApi,
  validateFile,
  type S3Api,
  type S3Api as PresignApi,
  type PresignResponse,
  type PresignedPostResponse,
  type MultipartInitResponse,
  type MultipartPartResponse,
  type UploadConfirmResponse,
} from "@better-s3/server";

// Hooks
export {
  useUpload,
  type UseUploadOptions,
  type UseUploadState,
  type UseUploadReturn,
} from "./use-upload";
export {
  useMultiUpload,
  type UseMultiUploadOptions,
  type UseMultiUploadState,
  type UseMultiUploadReturn,
} from "./use-multi-upload";
export {
  useUploadControls,
  type UseUploadControlsOptions,
  type UseUploadControlsReturn,
} from "./use-upload-controls";
export {
  useDownload,
  type DownloadPhase,
  type DownloadHooks,
  type UseDownloadOptions,
  type UseDownloadState,
  type UseDownloadReturn,
} from "./use-download";
export {
  useFetchDownload,
  type FetchDownloadPhase,
  type FetchDownloadProgress,
  type FetchDownloadHooks,
  type UseFetchDownloadOptions,
  type UseFetchDownloadState,
  type UseFetchDownloadReturn,
} from "./use-fetch-download";
export {
  useDelete,
  type UseDeleteOptions,
  type UseDeleteState,
  type UseDeleteReturn,
} from "./use-delete";
