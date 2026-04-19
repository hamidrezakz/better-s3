export type UploadResult = {
  key: string;
  url?: string;
  eTag?: string;
};

export type UploadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

export type UploadPhase =
  | "idle"
  | "validating"
  | "presigning"
  | "uploading"
  | "finalizing"
  | "success"
  | "error";

export type UploadHooks = {
  beforeUpload?: (file: File) => Promise<boolean> | boolean;
  onUploadStart?: (file: File, key: string) => void;
  onProgress?: (file: File, progress: UploadProgress) => void;
  onSuccess?: (file: File, result: UploadResult) => Promise<void> | void;
  onError?: (file: File | null, error: unknown, phase: UploadPhase) => void;
  onCancel?: (file: File | null) => void;
};

export type UploadConfig = {
  multipart?: boolean;
  accept?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  multipartThreshold?: number;
  concurrentParts?: number;
  concurrentFiles?: number;
};
