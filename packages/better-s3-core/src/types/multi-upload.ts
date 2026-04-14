import type { UploadProgress, UploadResult } from "./upload";

export type MultiUploadPhase =
  | "idle"
  | "validating"
  | "uploading"
  | "success"
  | "error";

export type MultiUploadFileState = {
  id: string;
  fileName: string;
  fileSize: number;
  status: "pending" | "uploading" | "success" | "error";
  progress: UploadProgress;
  error: string | null;
};

export type MultiUploadHooks = {
  beforeUpload?: (files: File[]) => Promise<boolean> | boolean;
  onUploadStart?: (files: File[]) => void;
  onFileProgress?: (file: File, progress: UploadProgress) => void;
  onFileSuccess?: (file: File, result: UploadResult) => void;
  onFileError?: (file: File, error: string) => void;
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (results: UploadResult[]) => Promise<void> | void;
  onError?: (error: unknown) => void;
  onCancel?: () => void;
};
